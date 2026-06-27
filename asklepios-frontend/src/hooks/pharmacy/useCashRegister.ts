import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cashRegisterService,
  type CreateCashRegisterPayload,
  type UpdateCashRegisterPayload,
} from "../../services/pharmacy/cashRegisterService";

export const useCashRegisters = (branchId?: number) => {
  return useQuery({
    queryKey: ["cashRegisters", branchId],
    queryFn: () => cashRegisterService.getCashRegisters(branchId),
  });
};

export const useCreateCashRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cashRegisterService.createCashRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
    },
  });
};

export const useUpdateCashRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCashRegisterPayload }) =>
      cashRegisterService.updateCashRegister(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
    },
  });
};

export const useDeleteCashRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cashRegisterService.deleteCashRegister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
    },
  });
};


