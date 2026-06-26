import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cashRegisterService,
  type CreateCashRegisterPayload,
  type UpdateCashRegisterPayload,
  type OpenSessionPayload,
  type CloseSessionPayload,
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

export const useOpenCashRegisterSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ registerId, payload }: { registerId: number; payload: OpenSessionPayload }) =>
      cashRegisterService.openSession(registerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
      queryClient.invalidateQueries({ queryKey: ["myActiveSession"] });
    },
  });
};

export const useCloseCashRegisterSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: number; payload: CloseSessionPayload }) =>
      cashRegisterService.closeSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
      queryClient.invalidateQueries({ queryKey: ["myActiveSession"] });
    },
  });
};

export const useMyActiveSession = () => {
  return useQuery({
    queryKey: ["myActiveSession"],
    queryFn: cashRegisterService.getMyActiveSession,
  });
};
