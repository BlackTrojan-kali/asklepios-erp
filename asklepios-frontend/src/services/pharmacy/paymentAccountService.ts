import api from "../../api/api";

export interface PaymentAccountDto {
  id: number;
  pharmacy_branch_id: number;
  name: string;
  type: "bank" | "mobile_money" | "safe" | "cash_register" | "owner";
  account_number: string | null;
  balance: number;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
  branch?: {
    id: number;
    name: string;
  };
}

export interface PaymentAccountPayload {
  name: string;
  type: "bank" | "mobile_money" | "safe" | "cash_register" | "owner";
  pharmacy_branch_id: number;
  account_number?: string | null;
  balance?: number;
  status?: "active" | "inactive";
}

export interface PaymentAccountFilterParams {
  pharmacy_branch_id?: number;
  type?: string;
}

const getPaymentAccounts = async (
  params?: PaymentAccountFilterParams,
  isAdmin = true
): Promise<PaymentAccountDto[]> => {
  const prefix = isAdmin ? "/admin" : "/pharmacy";
  const response = await api.get<PaymentAccountDto[]>(`${prefix}/payment-accounts`, { params });
  return response.data;
};

const getPaymentAccountDetails = async (id: number): Promise<PaymentAccountDto> => {
  const response = await api.get<PaymentAccountDto>(`/admin/payment-accounts/${id}`);
  return response.data;
};

const createPaymentAccount = async (
  payload: PaymentAccountPayload
): Promise<PaymentAccountDto> => {
  const response = await api.post<PaymentAccountDto>("/admin/payment-accounts", payload);
  return response.data;
};

const updatePaymentAccount = async (
  id: number,
  payload: Partial<PaymentAccountPayload>
): Promise<PaymentAccountDto> => {
  const response = await api.put<PaymentAccountDto>(`/admin/payment-accounts/${id}`, payload);
  return response.data;
};

const deletePaymentAccount = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin/payment-accounts/${id}`);
  return response.data;
};

export const paymentAccountService = {
  getPaymentAccounts,
  getPaymentAccountDetails,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
};
