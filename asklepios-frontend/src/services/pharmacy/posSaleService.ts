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

const getSales = async (): Promise<PosSaleDto[]> => {
  const response = await api.get<PosSaleDto[]>("/pharmacy/pos-sales");
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

export const posSaleService = {
  getSales,
  getSaleDetails,
  createSale,
  getSalePdfUrl,
};
