import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../../api/api";
import type { DepartmentDto, DepartmentPayload } from "../../types/types";

const useDepartmentStore = () => {
    const [departments, setDepartments] = useState<DepartmentDto[]>([]);
    const [loading, setLoading] = useState(false);

    const getDepartments = useCallback(async (centerId: number, search: string = "") => {
        if (!centerId) return;
        setLoading(true);
        try {
            const res = await api.get<DepartmentDto[]>("/admin/departments", {
                params: { center_id: centerId, search }
            });
            setDepartments(res.data);
        } catch (error) {
            toast.error("Erreur de chargement des départements");
        } finally {
            setLoading(false);
        }
    }, []);

    const createDepartment = async (payload: DepartmentPayload) => {
        try {
            await api.post("/admin/departments", payload);
            toast.success("Département ajouté");
            getDepartments(payload.center_id);
            return true;
        } catch (error) {
            toast.error("Erreur de création");
            return false;
        }
    };

    const updateDepartment = async (id: number, centerId: number, payload: Partial<DepartmentPayload>) => {
        try {
            await api.put(`/admin/departments/${id}`, payload);
            toast.success("Département mis à jour");
            getDepartments(centerId);
            return true;
        } catch (error) {
            toast.error("Erreur de modification");
            return false;
        }
    };

    const deleteDepartment = async (id: number, centerId: number) => {
        try {
            await api.delete(`/admin/departments/${id}`);
            toast.success("Département supprimé");
            getDepartments(centerId);
            return true;
        } catch (error) {
            toast.error("Erreur de suppression");
            return false;
        }
    };

    return { departments, loading, getDepartments, createDepartment, updateDepartment, deleteDepartment };
};

export default useDepartmentStore;