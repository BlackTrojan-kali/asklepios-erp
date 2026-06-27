import api from "../../api/api";
import type { PharmacyBranchDto } from "../../types/PharmTypes";

export interface CashRegisterSessionDto {
  id: number;
  cash_register_id: number;
  user_id: number;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  sales_totals?: {
    cash: number;
    mobile_money: number;
    card: number;
  };
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
}

export interface CashRegisterDto {
  id: number;
  pharmacy_branch_id: number;
  name: string;
  status: "active" | "inactive";
  balance: number;
  created_at?: string;
  updated_at?: string;
  active_session: CashRegisterSessionDto | null;
  branch?: PharmacyBranchDto;
}

export interface CreateCashRegisterPayload {
  name: string;
  pharmacy_branch_id: number;
  status?: "active" | "inactive";
}

export interface UpdateCashRegisterPayload {
  name?: string;
  status?: "active" | "inactive";
}

export interface OpenSessionPayload {
  opening_balance: number;
}

export interface CloseSessionPayload {
  closing_balance: number;
  password?: string;
}

const getCashRegisters = async (branchId?: number): Promise<CashRegisterDto[]> => {
  const response = await api.get<CashRegisterDto[]>("/admin/cash-registers", {
    params: branchId ? { pharmacy_branch_id: branchId } : {},
  });
  return response.data;
};

const getCashRegister = async (id: number): Promise<CashRegisterDto> => {
  const response = await api.get<CashRegisterDto>(`/admin/cash-registers/${id}`);
  return response.data;
};

const createCashRegister = async (payload: CreateCashRegisterPayload): Promise<CashRegisterDto> => {
  const response = await api.post<CashRegisterDto>("/admin/cash-registers", payload);
  return response.data;
};

const updateCashRegister = async (
  id: number,
  payload: UpdateCashRegisterPayload
): Promise<CashRegisterDto> => {
  const response = await api.put<CashRegisterDto>(`/admin/cash-registers/${id}`, payload);
  return response.data;
};

const deleteCashRegister = async (id: number): Promise<void> => {
  await api.delete(`/admin/cash-registers/${id}`);
};

const openSession = async (
  registerId: number,
  payload: OpenSessionPayload
): Promise<CashRegisterSessionDto> => {
  const response = await api.post<CashRegisterSessionDto>(
    `/pharmacy/cash-registers/${registerId}/sessions/open`,
    payload
  );
  return response.data;
};

const closeSession = async (
  sessionId: number,
  payload: CloseSessionPayload
): Promise<CashRegisterSessionDto> => {
  const response = await api.post<CashRegisterSessionDto>(
    `/pharmacy/cash-registers/sessions/${sessionId}/close`,
    payload
  );
  return response.data;
};

const getMyActiveSession = async (): Promise<CashRegisterSessionDto | null> => {
  const response = await api.get<CashRegisterSessionDto | null>(
    "/pharmacy/cash-registers/active-session/me"
  );
  return response.data;
};

export const cashRegisterService = {
  getCashRegisters,
  getCashRegister,
  createCashRegister,
  updateCashRegister,
  deleteCashRegister,
  openSession,
  closeSession,
  getMyActiveSession,
};
