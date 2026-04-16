// This hook is deprecated as the refund system has been removed.
export const useSubmitRefundRequest = () => ({ mutateAsync: async () => {}, isPending: false });
export const useMyRefundRequests = (_enabled?: boolean) => ({ data: [], isLoading: false });
export const usePendingRefundRequests = () => ({ data: [], isLoading: false });
export const useApproveRefund = () => ({ mutateAsync: async () => {}, isPending: false });
export const useDenyRefund = () => ({ mutateAsync: async () => {}, isPending: false });
export const useUpdateRefundStatus = () => ({ mutateAsync: async () => {}, isPending: false });
export const useCancelRefundRequest = () => ({ mutateAsync: async () => {}, isPending: false });
