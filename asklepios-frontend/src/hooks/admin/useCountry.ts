import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { countryService } from "../../services/admin/countryService";

export const countryKeys = {
  all: ["countries"] as const,
  paginated: (params?: any) => [...countryKeys.all, "paginated", { params }] as const,
  listAll: () => [...countryKeys.all, "all"] as const,
  detail: (id: number) => [...countryKeys.all, id] as const,
};

export const useCountriesPaginated = (params?: any) => {
  return useQuery({
    queryKey: countryKeys.paginated(params),
    queryFn: () => countryService.getCountriesPaginated(params),
  });
};

export const useAllCountries = () => {
  return useQuery({
    queryKey: countryKeys.listAll(),
    queryFn: () => countryService.getAllCountries(),
  });
};

export const useCountry = (id: number) => {
  return useQuery({
    queryKey: countryKeys.detail(id),
    queryFn: () => countryService.getCountry(id),
    enabled: !!id,
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => countryService.createCountry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
    },
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      countryService.updateCountry(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
      queryClient.invalidateQueries({ queryKey: countryKeys.detail(variables.id) });
    },
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => countryService.deleteCountry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countryKeys.all });
    },
  });
};
