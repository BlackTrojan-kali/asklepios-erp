import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  paymentAccountService,
  type PaymentAccountPayload,
  type PaymentAccountFilterParams,
} from "../../services/pharmacy/paymentAccountService";

export const usePaymentAccounts = (params?: PaymentAccountFilterParams, isAdmin = true) => {
  return useQuery({
    queryKey: ["paymentAccounts", params, isAdmin],
    queryFn: () => paymentAccountService.getPaymentAccounts(params, isAdmin),
  });
};

export const usePaymentAccountDetails = (id: number) => {
  return useQuery({
    queryKey: ["paymentAccountDetails", id],
    queryFn: () => paymentAccountService.getPaymentAccountDetails(id),
    enabled: !!id,
  });
};

export const useCreatePaymentAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentAccountPayload) =>
      paymentAccountService.createPaymentAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentAccounts"] });
    },
  });
};

export const useUpdatePaymentAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PaymentAccountPayload> }) =>
      paymentAccountService.updatePaymentAccount(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paymentAccounts"] });
      queryClient.invalidateQueries({ queryKey: ["paymentAccountDetails", data.id] });
    },
  });
};

export const useDeletePaymentAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentAccountService.deletePaymentAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentAccounts"] });
    },
  });
};
