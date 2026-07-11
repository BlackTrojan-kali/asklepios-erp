import api from "../../api/api";
import type { LabRequestDto, LabSampleDto, LabResultDto } from '../../types/types';

export const getLabRequests = async (status?: string): Promise<LabRequestDto[]> => {
    const response = await api.get('/laboratory/requests', {
        params: { status }
    });
    return response.data;
};

export const getLabRequestById = async (id: number): Promise<LabRequestDto> => {
    const response = await api.get(`/laboratory/requests/${id}`);    
    return response.data;
};

export const markAsSampled = async (id: number): Promise<{ message: string, request_status: string, samples: LabSampleDto[] }> => {
    const response = await api.post(`/laboratory/requests/${id}/sample`);
    return response.data;
};

export const saveLabResults = async (id: number, data: { results: LabResultDto[] }): Promise<any> => {
    const response = await api.post(`/laboratory/requests/${id}/results`, data);
    return response.data;
};

export const validateLabResults = async (id: number): Promise<any> => {
    const response = await api.post(`/laboratory/requests/${id}/validate`);
    return response.data;
};

export const downloadLabResultsPdf = async (id: number): Promise<void> => {
    const response = await api.get(`/laboratory/requests/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `resultats_labo_REQ-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
