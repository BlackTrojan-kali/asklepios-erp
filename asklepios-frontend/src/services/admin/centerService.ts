import api from "../../api/api";
import type { CenterDto, CenterPayload, PaginatedResponse } from "../../types/types";

export const centerService = {
  getCenters: async (params?: { search?: string, address?: string, country_id?: number | string, page?: number, per_page?: number }) => {
    const response = await api.get<PaginatedResponse<CenterDto>>("/admin/centers", { params });
    // Returns data array instead of full paginated response for simpler use if pagination isn't needed,
    // but typically we return the whole data or just the data.data.
    // In this project, getLaboratories returns array directly? Let's check how laboratoryService works.
    // For now, let's return the PaginatedResponse, or extract data if needed.
    return response.data;
  },

  getCenter: async (id: number) => {
    const response = await api.get<CenterDto>(`/admin/centers/${id}`);
    return response.data;
  },

  createCenter: async (payload: CenterPayload) => {
    const response = await api.post<{ message: string; data: CenterDto }>("/admin/centers", payload);
    return response.data;
  },

  updateCenter: async (id: number, payload: Partial<CenterPayload>) => {
    const response = await api.put<{ message: string; data: CenterDto }>(`/admin/centers/${id}`, payload);
    return response.data;
  },

  deleteCenter: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/admin/centers/${id}`);
    return response.data;
  },
};
