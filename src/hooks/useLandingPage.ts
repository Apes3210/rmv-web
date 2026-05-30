import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LandingHeroContent {
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryLabel: string;
  secondaryUrl: string;
  imageUrl?: string;
}

export interface LandingServiceCard {
  id: string;
  label: string;
  description: string;
}

export interface LandingProject {
  title: string;
  location: string;
  image: string;
  description: string;
  serviceId?: string;
  serviceLabel?: string;
}

export interface LandingStat {
  label: string;
  value: string;
}

export interface LandingTestimonial {
  author: string;
  role: string;
  quote: string;
}

export interface LandingPageContent {
  hero?: LandingHeroContent;
  services?: LandingServiceCard[];
  projects?: LandingProject[];
  stats?: LandingStat[];
  testimonials?: LandingTestimonial[];
}

export function useLandingPageContent() {
  return useQuery<LandingPageContent | null>({
    queryKey: ['landingPageContent'],
    queryFn: async () => {
      const { data } = await api.get('/landing');
      return data.data as LandingPageContent | null;
    },
    staleTime: 1000 * 60 * 5,
  });
}
