import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { laboratoryService } from "../../services/laboratory/laboratoryService";
import type { LaboratoryDto, LaboratoryPayload } from "../../types/types";

// Clés pour React Query
export const laboratoryKeys = {
  all: ["laboratories"] as const,
  list: (params?: { hospital_id?: number | string }) => [...laboratoryKeys.all, { params }] as const,
  detail: (id: number) => [...laboratoryKeys.all, id] as const,
};

// 1. Hook pour lister les laboratoires (peut être filtré par hospital_id)
export const useLaboratories = (params?: { hospital_id?: number | string }) => {
  return useQuery<LaboratoryDto[]>({
    queryKey: laboratoryKeys.list(params),
    queryFn: () => laboratoryService.getLaboratories(params),
  });
};

// 2. Hook pour récupérer un seul laboratoire
export const useLaboratory = (id: number) => {
  return useQuery<LaboratoryDto>({
    queryKey: laboratoryKeys.detail(id),
    queryFn: () => laboratoryService.getLaboratory(id),
    enabled: !!id,
  });
};

// 3. Hook pour créer un laboratoire
export const useCreateLaboratory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LaboratoryPayload) => laboratoryService.createLaboratory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laboratoryKeys.all });
    },
  });
};

// 4. Hook pour mettre à jour un laboratoire
export const useUpdateLaboratory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LaboratoryPayload> }) =>
      laboratoryService.updateLaboratory(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: laboratoryKeys.all });
      queryClient.invalidateQueries({ queryKey: laboratoryKeys.detail(variables.id) });
    },
  });
};

// 5. Hook pour supprimer un laboratoire
export const useDeleteLaboratory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => laboratoryService.deleteLaboratory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: laboratoryKeys.all });
    },
  });
};
