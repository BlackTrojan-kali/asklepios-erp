import api from "../../api/api";

export interface PosSaleItemPayload {
  article_id: number;
  batch_id?: number | null;
  qty: number;
  unit_price: number;
  discount?: number;
}

export interface PosSalePayload {
  customer_name?: string;
  has_prescription?: boolean;
  prescription_ref?: string;
  payment_method: "CASH" | "MOBILE_MONEY" | "CARD";
  amount_received?: number;
  items: PosSaleItemPayload[];
}

export interface PosSaleItemDto {
  id: number;
  pos_sale_id: number;
  article_id: number;
  batch_id: number | null;
  qty: number;
  unit_price: number;
  discount: number;
  sub_total: number;
  article?: {
    id: number;
    name: string;
  };
  batch?: {
    id: number;
    batch_number: string;
    expire_date?: string;
  };
}

export interface PosSaleDto {
  id: number;
  pharmacy_branch_id: number;
  cash_register_session_id: number;
  customer_name: string;
  has_prescription: boolean;
  prescription_ref?: string;
  total_amount: number;
  payment_method: "CASH" | "MOBILE_MONEY" | "CARD";
  amount_received?: number;
  change_due?: number;
  created_at?: string;
  items?: PosSaleItemDto[];
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface AdminSalesFilterParams {
  pharmacy_branch_id?: number;
  cash_register_id?: number;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface SellerDto {
  id: number;
  first_name: string;
  last_name: string;
}

export interface SalesFilterParams {
  scope?: "my-active-session" | "me" | "branch";
  start_date?: string;
  end_date?: string;
  payment_method?: string;
}

const getSales = async (params?: SalesFilterParams): Promise<PosSaleDto[]> => {
  const response = await api.get<PosSaleDto[]>("/pharmacy/pos-sales", { params });
  return response.data;
};

const getSaleDetails = async (id: number): Promise<PosSaleDto> => {
  const response = await api.get<PosSaleDto>(`/pharmacy/pos-sales/${id}`);
  return response.data;
};

const createSale = async (payload: PosSalePayload): Promise<PosSaleDto> => {
  const response = await api.post<PosSaleDto>("/pharmacy/pos-sales", payload);
  return response.data;
};

const getSalePdfUrl = (id: number): string => {
  return `${api.defaults.baseURL}/pharmacy/pos-sales/${id}/pdf`;
};

export interface AdminSalesResponse {
  sales: PaginatedResponse<PosSaleDto>;
  total_amount_sum: number;
}

const getAdminSales = async (
  params?: AdminSalesFilterParams
): Promise<AdminSalesResponse> => {
  const response = await api.get<AdminSalesResponse>(
    "/admin/pharmacy/pos-sales",
    { params }
  );
  return response.data;
};

const getAdminSellers = async (): Promise<SellerDto[]> => {
  const response = await api.get<SellerDto[]>("/admin/pharmacy/pos-sales/sellers");
  return response.data;
};

export const posSaleService = {
  getSales,
  getSaleDetails,
  createSale,
  getSalePdfUrl,
  getAdminSales,
  getAdminSellers,
};
