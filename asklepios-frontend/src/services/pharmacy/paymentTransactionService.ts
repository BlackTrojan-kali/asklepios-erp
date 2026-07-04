import api from "../../api/api";
import { type PaginatedResponse } from "./posSaleService";

export interface PaymentTransactionDto {
  id: number;
  pharmacy_branch_id: number;
  cash_register_session_id: number | null;
  source_account_id: number | null;
  destination_account_id: number | null;
  amount: number;
  type: "cash_in" | "cash_out" | "transfer";
  payment_method: "CASH" | "MOBILE_MONEY" | "CARD";
  status: "pending" | "completed" | "cancelled";
  reference: string | null;
  description: string | null;
  receipt_path: string | null;
  user_id: number;
  confirmed_by_id: number | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    name: string;
  };
  source_account?: {
    id: number;
    name: string;
    type: string;
  };
  destination_account?: {
    id: number;
    name: string;
    type: string;
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  confirmed_by?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
  session?: {
    id: number;
    register?: {
      id: number;
      name: string;
    };
  } | null;
}

export interface PaymentTransactionPayload {
  pharmacy_branch_id: number;
  type: "cash_in" | "cash_out" | "transfer";
  payment_method: "CASH" | "MOBILE_MONEY" | "CARD";
  amount: number;
  source_account_id?: number | null;
  destination_account_id?: number | null;
  reference?: string | null;
  description?: string | null;
  status?: "pending" | "completed";
}

export interface PaymentTransactionFilterParams {
  pharmacy_branch_id?: number;
  type?: string;
  status?: string;
  payment_method?: string;
  paginated?: boolean;
  page?: number;
  per_page?: number;
}

const getPaymentTransactions = async (
  params?: PaymentTransactionFilterParams,
  isAdmin = true
): Promise<PaginatedResponse<PaymentTransactionDto> | PaymentTransactionDto[]> => {
  const prefix = isAdmin ? "/admin" : "/pharmacy";
  const response = await api.get<PaginatedResponse<PaymentTransactionDto> | PaymentTransactionDto[]>(
    `${prefix}/payment-transactions`,
    {
      params: {
        ...params,
        paginated: params?.paginated ? "true" : undefined,
      },
    }
  );
  return response.data;
};

const getPaymentTransactionDetails = async (id: number): Promise<PaymentTransactionDto> => {
  const response = await api.get<PaymentTransactionDto>(`/admin/payment-transactions/${id}`);
  return response.data;
};

const createPaymentTransaction = async (
  payload: PaymentTransactionPayload,
  receiptFile?: File,
  isAdmin = true
): Promise<PaymentTransactionDto> => {
  const prefix = isAdmin ? "/admin" : "/pharmacy";
  
  if (receiptFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== null && val !== undefined) {
        formData.append(key, val.toString());
      }
    });
    formData.append("receipt", receiptFile);
    
    const response = await api.post<PaymentTransactionDto>(
      `${prefix}/payment-transactions`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }
  
  const response = await api.post<PaymentTransactionDto>(`${prefix}/payment-transactions`, payload);
  return response.data;
};

const confirmPaymentTransaction = async (
  id: number,
  reference: string,
  receipt?: File
): Promise<PaymentTransactionDto> => {
  const formData = new FormData();
  formData.append("reference", reference);
  if (receipt) {
    formData.append("receipt", receipt);
  }
  const response = await api.post<PaymentTransactionDto>(
    `/admin/payment-transactions/${id}/confirm`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

const cancelPaymentTransaction = async (id: number): Promise<PaymentTransactionDto> => {
  const response = await api.post<PaymentTransactionDto>(`/admin/payment-transactions/${id}/cancel`);
  return response.data;
};

export const paymentTransactionService = {
  getPaymentTransactions,
  getPaymentTransactionDetails,
  createPaymentTransaction,
  confirmPaymentTransaction,
  cancelPaymentTransaction,
};
