import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labPersonnelService, type LabPersonnelFilters } from "../../services/laboratory/labPersonnelService";
import type { LabPersonnelDto, LabPersonnelPayload } from "../../types/LabPersonnelTypes";

// Clés pour React Query
export const labPersonnelKeys = {
  all: ["lab-personnel"] as const,
  list: (filters?: LabPersonnelFilters) => [...labPersonnelKeys.all, "list", { filters }] as const,
  allList: (filters?: Omit<LabPersonnelFilters, 'page' | 'per_page' | 'paginated'>) => [...labPersonnelKeys.all, "all", { filters }] as const,
  detail: (id: number) => [...labPersonnelKeys.all, "detail", id] as const,
};

// 1. Hook pour lister le personnel (paginé avec filtres)
export const useLabPersonnelList = (filters?: LabPersonnelFilters) => {
  return useQuery({
    queryKey: labPersonnelKeys.list(filters),
    queryFn: () => labPersonnelService.getLabPersonnel(filters),
  });
};

// 2. Hook pour lister tout le personnel (non paginé)
export const useAllLabPersonnel = (filters?: Omit<LabPersonnelFilters, 'page' | 'per_page' | 'paginated'>) => {
  return useQuery<LabPersonnelDto[]>({
    queryKey: labPersonnelKeys.allList(filters),
    queryFn: () => labPersonnelService.getAllLabPersonnel(filters),
  });
};

// 3. Hook pour récupérer un seul membre du personnel
export const useLabPersonnel = (id: number) => {
  return useQuery<LabPersonnelDto>({
    queryKey: labPersonnelKeys.detail(id),
    queryFn: () => labPersonnelService.getLabPersonnelById(id),
    enabled: !!id,
  });
};

// 4. Hook pour créer un membre du personnel
export const useCreateLabPersonnel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LabPersonnelPayload) => labPersonnelService.createLabPersonnel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labPersonnelKeys.all });
    },
  });
};

// 5. Hook pour mettre à jour un membre du personnel
export const useUpdateLabPersonnel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LabPersonnelPayload> }) =>
      labPersonnelService.updateLabPersonnel(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: labPersonnelKeys.all });
      queryClient.invalidateQueries({ queryKey: labPersonnelKeys.detail(variables.id) });
    },
  });
};

// 6. Hook pour supprimer un membre du personnel
export const useDeleteLabPersonnel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => labPersonnelService.deleteLabPersonnel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labPersonnelKeys.all });
    },
  });
};
