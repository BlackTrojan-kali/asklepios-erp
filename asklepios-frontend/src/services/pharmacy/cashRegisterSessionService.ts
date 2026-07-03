import api from "../../api/api";
import type { CashRegisterSessionDto } from "./cashRegisterService";
import type { PaginatedResponse } from "./posSaleService";

export interface OpenSessionPayload {
  opening_balance: number;
  opening_notes?: string;
}

export interface CloseSessionPayload {
  closing_balance: number;
  password?: string;
  closing_notes?: string;
}

export interface AdminSessionsFilterParams {
  pharmacy_branch_id?: number;
  cash_register_id?: number;
  user_id?: number;
  status?: "open" | "closed";
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

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

const getMySessionsHistory = async (): Promise<CashRegisterSessionDto[]> => {
  const response = await api.get<CashRegisterSessionDto[]>(
    "/pharmacy/cash-registers/sessions/history"
  );
  return response.data;
};

const getAdminSessionsHistory = async (
  params?: AdminSessionsFilterParams
): Promise<PaginatedResponse<CashRegisterSessionDto>> => {
  const response = await api.get<PaginatedResponse<CashRegisterSessionDto>>(
    "/admin/cash-registers/sessions/history",
    { params }
  );
  return response.data;
};

export const cashRegisterSessionService = {
  openSession,
  closeSession,
  getMyActiveSession,
  getMySessionsHistory,
  getAdminSessionsHistory,
};
