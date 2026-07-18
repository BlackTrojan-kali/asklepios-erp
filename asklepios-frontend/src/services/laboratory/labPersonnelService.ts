import api from "../../api/api";
import type { LabPersonnelDto, LabPersonnelPayload } from "../../types/LabPersonnelTypes";
import type { PaginatedResponse } from "../../types/types";

export interface LabPersonnelFilters {
    search?: string;
    laboratory_id?: number | string;
    page?: number;
    per_page?: number;
    paginated?: 'true' | 'false';
}

const getLabPersonnel = async (filters: LabPersonnelFilters = {}): Promise<PaginatedResponse<LabPersonnelDto>> => {
    const response = await api.get<PaginatedResponse<LabPersonnelDto>>("/admin/lab-personnel", { params: filters });
    return response.data;
};

const getAllLabPersonnel = async (filters: Omit<LabPersonnelFilters, 'page' | 'per_page' | 'paginated'> = {}): Promise<LabPersonnelDto[]> => {
    const response = await api.get<LabPersonnelDto[]>("/admin/lab-personnel", { 
        params: { ...filters, paginated: 'false' } 
    });
    return response.data;
};

const getLabPersonnelById = async (id: number): Promise<LabPersonnelDto> => {
    const response = await api.get<LabPersonnelDto>(`/admin/lab-personnel/${id}`);
    return response.data;
};

const createLabPersonnel = async (payload: LabPersonnelPayload): Promise<{ message: string; data: LabPersonnelDto }> => {
    const response = await api.post<{ message: string; data: LabPersonnelDto }>("/admin/lab-personnel", payload);
    return response.data;
};

const updateLabPersonnel = async (
    id: number,
    payload: Partial<LabPersonnelPayload>
): Promise<{ message: string; data: LabPersonnelDto }> => {
    const response = await api.put<{ message: string; data: LabPersonnelDto }>(`/admin/lab-personnel/${id}`, payload);
    return response.data;
};

const deleteLabPersonnel = async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/admin/lab-personnel/${id}`);
    return response.data;
};

export const labPersonnelService = {
    getLabPersonnel,
    getAllLabPersonnel,
    getLabPersonnelById,
    createLabPersonnel,
    updateLabPersonnel,
    deleteLabPersonnel,
};
