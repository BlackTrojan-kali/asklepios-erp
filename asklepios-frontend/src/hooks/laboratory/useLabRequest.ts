import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLabRequests, getLabRequestById, markAsSampled, saveLabResults, validateLabResults, downloadLabResultsPdf, createLabRequest, type CreateLabRequestDto } from '../../services/laboratory/labRequestService';
import type { LabResultDto } from '../../types/types';

export const useCreateLabRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateLabRequestDto) => createLabRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labRequests'] });
        }
    });
};

export const useLabRequests = (status?: string) => {
    return useQuery({
        queryKey: ['labRequests', status],
        queryFn: () => getLabRequests(status)
    });
};

export const useLabRequestDetails = (id: number) => {
    return useQuery({
        queryKey: ['labRequest', id],
        queryFn: () => getLabRequestById(id),
        enabled: !!id
    });
};

export const useMarkAsSampled = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id: number) => markAsSampled(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labRequests'] });
            queryClient.invalidateQueries({ queryKey: ['labRequest'] });
        }
    });
};

export const useSaveLabResults = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number, data: { results: LabResultDto[] } }) => saveLabResults(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labRequests'] });
            queryClient.invalidateQueries({ queryKey: ['labRequest'] });
        }
    });
};

export const useValidateLabResults = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => validateLabResults(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['labRequests'] });
            queryClient.invalidateQueries({ queryKey: ['labRequest'] });
        }
    });
};

export const useDownloadLabResultsPdf = () => {
    return useMutation({
        mutationFn: (id: number) => downloadLabResultsPdf(id)
    });
};
