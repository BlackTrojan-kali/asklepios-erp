import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cashRegisterSessionService,
  type OpenSessionPayload,
  type CloseSessionPayload,
} from "../../services/pharmacy/cashRegisterSessionService";

export const useOpenCashRegisterSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ registerId, payload }: { registerId: number; payload: OpenSessionPayload }) =>
      cashRegisterSessionService.openSession(registerId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
      queryClient.setQueryData(["myActiveSession"], data);
    },
  });
};

export const useCloseCashRegisterSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, payload }: { sessionId: number; payload: CloseSessionPayload }) =>
      cashRegisterSessionService.closeSession(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashRegisters"] });
      queryClient.setQueryData(["myActiveSession"], null);
    },
  });
};

export const useMyActiveSession = () => {
  return useQuery({
    queryKey: ["myActiveSession"],
    queryFn: cashRegisterSessionService.getMyActiveSession,
  });
};

export const useMySessionsHistory = () => {
  return useQuery({
    queryKey: ["mySessionsHistory"],
    queryFn: cashRegisterSessionService.getMySessionsHistory,
  });
};
