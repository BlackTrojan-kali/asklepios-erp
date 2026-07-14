import api from "../../api/api";
import type { LabCategoryDto, LabCategoryPayload } from "../../types/types";

const getLabCategories = async (params?: { hospital_id?: number | string }): Promise<LabCategoryDto[]> => {
  const response = await api.get<LabCategoryDto[]>("/laboratory/categories", { params });
  return response.data;
};

const createLabCategory = async (payload: LabCategoryPayload): Promise<LabCategoryDto> => {
  const response = await api.post<LabCategoryDto>("/laboratory/categories", payload);
  return response.data;
};

const updateLabCategory = async (
  id: number,
  payload: LabCategoryPayload
): Promise<LabCategoryDto> => {
  const response = await api.put<LabCategoryDto>(`/laboratory/categories/${id}`, payload);
  return response.data;
};

const deleteLabCategory = async (id: number): Promise<void> => {
  await api.delete(`/laboratory/categories/${id}`);
};

export const labCategoryService = {
  getLabCategories,
  createLabCategory,
  updateLabCategory,
  deleteLabCategory,
};
