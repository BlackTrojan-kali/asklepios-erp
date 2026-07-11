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
    mutationFn: ({ id, payload }: { id: number; payload: LabTestPayload }) =>
      labTestService.updateLabTest(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["labTests"] });
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
