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
    mutationFn: ({ id, payload }: { id: number; payload: LabParameterPayload }) =>
      labParameterService.updateLabParameter(id, payload),
    onSuccess: () => {
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
