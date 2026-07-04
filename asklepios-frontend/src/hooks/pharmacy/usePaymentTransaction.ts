import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  paymentTransactionService,
  type PaymentTransactionPayload,
  type PaymentTransactionFilterParams,
} from "../../services/pharmacy/paymentTransactionService";

export const usePaymentTransactions = (params?: PaymentTransactionFilterParams, isAdmin = true) => {
  return useQuery({
    queryKey: ["paymentTransactions", params, isAdmin],
    queryFn: () => paymentTransactionService.getPaymentTransactions(params, isAdmin),
  });
};

export const useCreatePaymentTransaction = (isAdmin = true) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, receipt }: { payload: PaymentTransactionPayload; receipt?: File }) =>
      paymentTransactionService.createPaymentTransaction(payload, receipt, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["paymentAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["myActiveSession"] }); // also refresh cashier active session info
    },
  });
};

export const useConfirmPaymentTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reference, receipt }: { id: number; reference: string; receipt?: File }) =>
      paymentTransactionService.confirmPaymentTransaction(id, reference, receipt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["paymentAccounts"] });
    },
  });
};

export const useCancelPaymentTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentTransactionService.cancelPaymentTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["paymentAccounts"] });
    },
  });
};
