import api from "../../api/api";
import type { LabParameterDto, LabParameterPayload } from "../../types/types";

const getLabParameters = async (testId?: number): Promise<LabParameterDto[]> => {
  const response = await api.get<LabParameterDto[]>("/laboratory/parameters", {
    params: testId ? { lab_test_id: testId } : {},
  });
  return response.data;
};

const createLabParameter = async (payload: LabParameterPayload): Promise<LabParameterDto> => {
  const response = await api.post<LabParameterDto>("/laboratory/parameters", payload);
  return response.data;
};

const updateLabParameter = async (
  id: number,
  payload: LabParameterPayload
): Promise<LabParameterDto> => {
  const response = await api.put<LabParameterDto>(`/laboratory/parameters/${id}`, payload);
  return response.data;
};

const deleteLabParameter = async (id: number): Promise<void> => {
  await api.delete(`/laboratory/parameters/${id}`);
};

export const labParameterService = {
  getLabParameters,
  createLabParameter,
  updateLabParameter,
  deleteLabParameter,
};
