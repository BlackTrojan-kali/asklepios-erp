import api from "../../api/api";
import type { CountryDto, PaginatedResponse } from "../../types/types";

export const countryService = {
  getCountriesPaginated: async (params?: { page?: number, per_page?: number, search?: string }) => {
    const response = await api.get<PaginatedResponse<CountryDto>>("/countries", { params });
    return response.data;
  },

  getAllCountries: async () => {
    const response = await api.get<CountryDto[]>("/countries/all");
    return response.data;
  },

  getCountry: async (id: number) => {
    const response = await api.get<CountryDto>(`/countries/${id}`);
    return response.data;
  },

  createCountry: async (payload: any) => {
    const response = await api.post<{ message: string; data: CountryDto }>("/supa/countries", payload);
    return response.data;
  },

  updateCountry: async (id: number, payload: any) => {
    const response = await api.put<{ message: string; data: CountryDto }>(`/supa/countries/${id}`, payload);
    return response.data;
  },

  deleteCountry: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/supa/countries/${id}`);
    return response.data;
  },
};
