import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labCategoryService } from "../../services/laboratory/labCategoryService";
import type { LabCategoryPayload } from "../../types/types";

export const useLabCategories = () => {
  return useQuery({
    queryKey: ["labCategories"],
    queryFn: () => labCategoryService.getLabCategories(),
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
    mutationFn: ({ id, payload }: { id: number; payload: LabCategoryPayload }) =>
      labCategoryService.updateLabCategory(id, payload),
    onSuccess: () => {
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
