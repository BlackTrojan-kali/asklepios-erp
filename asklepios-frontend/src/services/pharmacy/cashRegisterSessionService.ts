import api from "../../api/api";
import type { CashRegisterSessionDto } from "./cashRegisterService";

export interface OpenSessionPayload {
  opening_balance: number;
}

export interface CloseSessionPayload {
  closing_balance: number;
  password?: string;
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

export const cashRegisterSessionService = {
  openSession,
  closeSession,
  getMyActiveSession,
  getMySessionsHistory,
};
