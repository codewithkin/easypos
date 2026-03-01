import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, type ApiError } from "@/lib/api";

// ── Typed query hook ───────────────────────────────────────────────

export function useApiQuery<T>(options: {
  queryKey: QueryKey;
  path: string;
  enabled?: boolean;
}) {
  return useQuery<T, ApiError>({
    queryKey: options.queryKey,
    queryFn: () => api.get<T>(options.path),
    enabled: options.enabled,
  });
}

// ── Typed mutation hooks ───────────────────────────────────────────

export function useApiPost<TData = unknown, TBody = unknown>(options: {
  path: string;
  invalidateKeys?: QueryKey[];
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TBody>({
    mutationFn: (body) => api.post<TData>(options.path, body),
    onSuccess: (data) => {
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
}

export function useApiPut<TData = unknown, TBody = unknown>(options: {
  path: string;
  invalidateKeys?: QueryKey[];
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TBody>({
    mutationFn: (body) => api.put<TData>(options.path, body),
    onSuccess: (data) => {
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
}

export function useApiDelete<TData = unknown>(options: {
  path: string;
  invalidateKeys?: QueryKey[];
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, void>({
    mutationFn: () => api.delete<TData>(options.path),
    onSuccess: (data) => {
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options.onSuccess?.(data);
    },
    onError: options.onError,
  });
}
