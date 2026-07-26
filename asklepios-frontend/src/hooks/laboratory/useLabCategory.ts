import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labCategoryService } from "../../services/laboratory/labCategoryService";
import type { LabCategoryPayload } from "../../types/types";

export const useLabCategories = (params?: { hospital_id?: number | string }) => {
  return useQuery({
    queryKey: ["labCategories", params],
    queryFn: () => labCategoryService.getLabCategories(params),
  });
};

export const useCreateLabCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labCategoryService.createLabCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labCategories"] });
    },
  });
};

export const useUpdateLabCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LabCategoryPayload> }) =>
      labCategoryService.updateLabCategory(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["labCategories"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["labCategories"] });

      queryClient.setQueriesData({ queryKey: ["labCategories"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((cat: any) =>
          cat.id === id ? { ...cat, ...payload } : cat
        );
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["labCategories"] });
    },
  });
};

export const useDeleteLabCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labCategoryService.deleteLabCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labCategories"] });
    },
  });
};
