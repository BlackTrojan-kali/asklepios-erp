import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { centerService } from "../../services/admin/centerService";
import type { CenterPayload } from "../../types/types";

export const centerKeys = {
  all: ["centers"] as const,
  list: (params?: { search?: string, address?: string, country_id?: number | string, page?: number, per_page?: number }) => [...centerKeys.all, { params }] as const,
  detail: (id: number) => [...centerKeys.all, id] as const,
};

export const useCenters = (params?: { search?: string, address?: string, country_id?: number | string, page?: number, per_page?: number }) => {
  return useQuery({
    queryKey: centerKeys.list(params),
    queryFn: () => centerService.getCenters(params),
  });
};

export const useCenter = (id: number) => {
  return useQuery({
    queryKey: centerKeys.detail(id),
    queryFn: () => centerService.getCenter(id),
    enabled: !!id,
  });
};

export const useCreateCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CenterPayload) => centerService.createCenter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
};

export const useUpdateCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CenterPayload> }) =>
      centerService.updateCenter(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
      queryClient.invalidateQueries({ queryKey: centerKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCenter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => centerService.deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: centerKeys.all });
    },
  });
};
