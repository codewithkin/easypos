import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, type ApiError } from "@/lib/api";

// ── Paginated response shape from the server ───────────────────────
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

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

// ── Paginated infinite scroll hook ─────────────────────────────────

export function useApiPaginatedQuery<T>(options: {
  queryKey: QueryKey;
  path: string;
  pageSize?: number;
  enabled?: boolean;
}) {
  const size = options.pageSize ?? 10;

  const query = useInfiniteQuery<PaginatedResponse<T>, ApiError>({
    queryKey: options.queryKey,
    queryFn: ({ pageParam }) => {
      const separator = options.path.includes("?") ? "&" : "?";
      return api.get<PaginatedResponse<T>>(
        `${options.path}${separator}page=${pageParam}&pageSize=${size}`,
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: options.enabled,
  });

  // Flatten all pages into a single items array
  const items = query.data?.pages?.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages?.[0]?.total ?? 0;

  return {
    ...query,
    items,
    total,
  };
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

export function useApiPatch<TData = unknown, TBody = unknown>(options: {
  path: string;
  invalidateKeys?: QueryKey[];
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TBody>({
    mutationFn: (body) => api.patch<TData>(options.path, body),
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
