import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labParameterService } from "../../services/laboratory/labParameterService";
import type { LabParameterPayload } from "../../types/types";

export const useLabParameters = (testId?: number) => {
  return useQuery({
    queryKey: ["labParameters", testId],
    queryFn: () => labParameterService.getLabParameters(testId),
  });
};

export const useCreateLabParameter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labParameterService.createLabParameter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labParameters"] });
    },
  });
};

export const useUpdateLabParameter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LabParameterPayload> }) =>
      labParameterService.updateLabParameter(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["labTests"] });
      await queryClient.cancelQueries({ queryKey: ["labParameters"] });
      const previousTests = queryClient.getQueriesData({ queryKey: ["labTests"] });
      const previousParams = queryClient.getQueriesData({ queryKey: ["labParameters"] });

      queryClient.setQueriesData({ queryKey: ["labTests"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((test: any) => ({
          ...test,
          parameters: test.parameters?.map((p: any) =>
            p.id === id ? { ...p, ...payload } : p
          ),
        }));
      });

      return { previousTests, previousParams };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTests) {
        context.previousTests.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousParams) {
        context.previousParams.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["labTests"] });
      queryClient.invalidateQueries({ queryKey: ["labParameters"] });
    },
  });
};

export const useDeleteLabParameter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: labParameterService.deleteLabParameter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labParameters"] });
    },
  });
};
