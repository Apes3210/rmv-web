import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/types';

interface SignedUrlResponse {
  uploadUrl: string;
  key: string;
}

interface DownloadUrlResponse {
  downloadUrl: string;
}

const SIGNED_URL_TTL_MS = 1000 * 60 * 4;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const pendingSignedUrlRequests = new Map<string, Promise<string>>();

function getCachedSignedUrl(fileKey: string): string | null {
  const cached = signedUrlCache.get(fileKey);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    signedUrlCache.delete(fileKey);
    return null;
  }
  return cached.url;
}

async function fetchSignedUrl(fileKey: string): Promise<string> {
  const cached = getCachedSignedUrl(fileKey);
  if (cached) return cached;

  const pending = pendingSignedUrlRequests.get(fileKey);
  if (pending) return pending;

  const request = api
    .post<ApiResponse<DownloadUrlResponse>>('/uploads/signed-download-url', { key: fileKey })
    .then((res) => {
      const url = res.data.data.downloadUrl;
      signedUrlCache.set(fileKey, { url, expiresAt: Date.now() + SIGNED_URL_TTL_MS });
      pendingSignedUrlRequests.delete(fileKey);
      return url;
    })
    .catch((error) => {
      pendingSignedUrlRequests.delete(fileKey);
      throw error;
    });

  pendingSignedUrlRequests.set(fileKey, request);
  return request;
}

export function useGetUploadUrl() {
  return useMutation({
    mutationFn: async (body: {
      folder: string;
      fileName: string;
      contentType: string;
    }) => {
      const { data } = await api.post<ApiResponse<SignedUrlResponse>>(
        '/uploads/signed-upload-url',
        {
          folder: body.folder,
          filename: body.fileName,
          contentType: body.contentType,
        },
      );
      return {
        uploadUrl: data.data.uploadUrl,
        fileKey: data.data.key,
      };
    },
  });
}

export function useGetDownloadUrl() {
  return useMutation({
    mutationFn: async (fileKey: string) => {
      const { data } = await api.post<ApiResponse<DownloadUrlResponse>>(
        '/uploads/signed-download-url',
        { key: fileKey },
      );
      return data.data;
    },
  });
}

/**
 * Upload a file to R2 using a pre-signed URL
 */
export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }
}

/**
 * Hook that gets a signed download URL for a file through the authenticated API.
 * Returns the R2 signed URL directly — safe for `<img src>` (no CORS redirect issue).
 */
export function useAuthenticatedUrl(fileKey: string | null | undefined): {
  url: string | null;
  isLoading: boolean;
  error: boolean;
} {
  const [url, setUrl] = useState<string | null>(() => (fileKey ? getCachedSignedUrl(fileKey) : null));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileKey) {
      setUrl(null);
      setError(false);
      return;
    }

    let cancelled = false;
    const cached = getCachedSignedUrl(fileKey);
    if (cached) {
      setUrl(cached);
      setIsLoading(false);
      setError(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    fetchSignedUrl(fileKey)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fileKey]);

  return { url, isLoading, error };
}

/**
 * Open a file in a new tab via authenticated signed URL.
 */
export async function openAuthenticatedFile(fileKey: string): Promise<void> {
  const url = await fetchSignedUrl(fileKey);
  window.open(url, '_blank');
}
