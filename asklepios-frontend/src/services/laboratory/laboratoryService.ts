import api from "../../api/api";
import type { LaboratoryDto, LaboratoryPayload } from "../../types/types";

const getLaboratories = async (params?: { hospital_id?: number | string }): Promise<LaboratoryDto[]> => {
  const response = await api.get<LaboratoryDto[]>("/laboratories", { params });
  return response.data;
};

const getLaboratory = async (id: number): Promise<LaboratoryDto> => {
  const response = await api.get<LaboratoryDto>(`/laboratories/${id}`);
  return response.data;
};

const createLaboratory = async (payload: LaboratoryPayload): Promise<{ message: string; data: LaboratoryDto }> => {
  const response = await api.post<{ message: string; data: LaboratoryDto }>("/laboratories", payload);
  return response.data;
};

const updateLaboratory = async (
  id: number,
  payload: Partial<LaboratoryPayload>
): Promise<{ message: string; data: LaboratoryDto }> => {
  const response = await api.put<{ message: string; data: LaboratoryDto }>(`/laboratories/${id}`, payload);
  return response.data;
};

const deleteLaboratory = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/laboratories/${id}`);
  return response.data;
};

export const laboratoryService = {
  getLaboratories,
  getLaboratory,
  createLaboratory,
  updateLaboratory,
  deleteLaboratory,
};
