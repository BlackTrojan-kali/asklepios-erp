import api from "../../api/api";
import type { LabTestDto, LabTestPayload } from "../../types/types";

const getLabTests = async (categoryId?: number): Promise<LabTestDto[]> => {
  const response = await api.get<LabTestDto[]>("/laboratory/tests", {
    params: categoryId ? { lab_category_id: categoryId } : {},
  });
  return response.data;
};

const createLabTest = async (payload: LabTestPayload): Promise<LabTestDto> => {
  const response = await api.post<LabTestDto>("/laboratory/tests", payload);
  return response.data;
};

const updateLabTest = async (
  id: number,
  payload: LabTestPayload
): Promise<LabTestDto> => {
  const response = await api.put<LabTestDto>(`/laboratory/tests/${id}`, payload);
  return response.data;
};

const deleteLabTest = async (id: number): Promise<void> => {
  await api.delete(`/laboratory/tests/${id}`);
};

export const labTestService = {
  getLabTests,
  createLabTest,
  updateLabTest,
  deleteLabTest,
};
