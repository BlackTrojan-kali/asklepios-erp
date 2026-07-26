import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labTestService } from "../../services/laboratory/labTestService";
import type { LabTestPayload } from "../../types/types";

export const useLabTests = (categoryId?: number) => {
  return useQuery({
    queryKey: ["labTests", categoryId],
    queryFn: () => labTestService.getLabTests(categoryId),
  });
};

export const useCreateLabTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labTestService.createLabTest,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["labTests"] });
    },
  });
};

export const useUpdateLabTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LabTestPayload> }) =>
      labTestService.updateLabTest(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["labTests"] });
      const previousData = queryClient.getQueriesData({ queryKey: ["labTests"] });

      queryClient.setQueriesData({ queryKey: ["labTests"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((test: any) =>
          test.id === id ? { ...test, ...payload } : test
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
      queryClient.invalidateQueries({ queryKey: ["labTests"] });
      queryClient.invalidateQueries({ queryKey: ["labCategories"] });
    },
  });
};

export const useDeleteLabTest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labTestService.deleteLabTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labTests"] });
    },
  });
};
