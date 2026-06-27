import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  posSaleService,
  type PosSalePayload,
  type SalesFilterParams,
  type AdminSalesFilterParams,
} from "../../services/pharmacy/posSaleService";

export const useAdminPosSales = (params?: AdminSalesFilterParams) => {
  return useQuery({
    queryKey: ["adminPosSales", params],
    queryFn: () => posSaleService.getAdminSales(params),
  });
};

export const useAdminSellers = () => {
  return useQuery({
    queryKey: ["adminSellers"],
    queryFn: () => posSaleService.getAdminSellers(),
  });
};

export const usePosSales = (params?: SalesFilterParams) => {
  return useQuery({
    queryKey: ["posSales", params],
    queryFn: () => posSaleService.getSales(params),
  });
};

export const usePosSaleDetails = (id: number) => {
  return useQuery({
    queryKey: ["posSaleDetails", id],
    queryFn: () => posSaleService.getSaleDetails(id),
    enabled: !!id,
  });
};

export const useCreatePosSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PosSalePayload) => posSaleService.createSale(payload),
    onSuccess: () => {
      // Invalider les ventes, mais aussi les caisses et la session active pour synchroniser les soldes et totaux
      queryClient.invalidateQueries({ queryKey: ["posSales"] });
      queryClient.invalidateQueries({ queryKey: ["myActiveSession"] });
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
      queryClient.invalidateQueries({ queryKey: ["branchArticles"] });
    },
  });
};
