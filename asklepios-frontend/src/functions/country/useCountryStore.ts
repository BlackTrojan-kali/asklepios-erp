import { useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../../api/api"; // Ton instance Axios configurée (avec le token Sanctum)
import type { CountryDto, PaginatedResponse } from "../../types/types";

const useCountryStore = () => {
    // --- ÉTATS ---
    const [countries, setCountries] = useState<CountryDto[]>([]);
    const [allCountries, setAllCountries] = useState<CountryDto[]>([]); // NOUVEAU : Liste brute sans pagination
    const [currentCountry, setCurrentCountry] = useState<CountryDto | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    
    // État pour gérer la pagination Laravel
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0
    });

    // --- 1. LISTER & RECHERCHER AVEC PAGINATION (GET /countries) ---
    const getCountries = useCallback(async (page: number = 1, search: string = '', perPage: number = 10) => {
        try {
            setLoading(true);
            const res = await api.get<PaginatedResponse<CountryDto>>("/countries", {
                params: { page, search, per_page: perPage }
            });
            
            setCountries(res.data.data);
            setPagination({
                currentPage: res.data.current_page,
                lastPage: res.data.last_page,
                total: res.data.total
            });
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération des pays");
                console.error(error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 2. RÉCUPÉRER LA LISTE COMPLÈTE SANS PAGINATION (GET /countries/all) ---
    const getAllCountries = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get<CountryDto[]>("/countries/all");
            setAllCountries(res.data);
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error) && !axios.isCancel(error)) {
                toast.error("Erreur lors de la récupération de la liste complète des pays");
            }
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 3. RÉCUPÉRER UN SEUL PAYS (GET /countries/{id}) ---
    const getCountry = useCallback(async (id: number) => {
        try {
            setLoading(true);
            const res = await api.get<CountryDto>(`/countries/${id}`);
            setCurrentCountry(res.data);
            return res.data;
        } catch (error) {
            toast.error("Impossible de trouver ce pays");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // --- 4. CRÉER UN PAYS (POST /countries) ---
    const createCountry = async (payload: CountryDto) => {
        try {
            setLoading(true);
            const res = await api.post("/countries", payload);
            toast.success("Pays ajouté avec succès !");
            
            // Rafraîchir les listes après un ajout réussi
            await getCountries(1); 
            await getAllCountries(); 
            
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la création");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    // --- 5. MODIFIER UN PAYS (PUT /countries/{id}) ---
    const updateCountry = async (id: number, payload: CountryDto) => {
        try {
            setLoading(true);
            const res = await api.put(`/countries/${id}`, payload);
            toast.success("Pays mis à jour avec succès !");
            
            // Rafraîchir la liste courante pour voir les modifications
            await getCountries(pagination.currentPage); 
            await getAllCountries(); 
            
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Erreur lors de la modification");
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        countries,
        allCountries,
        currentCountry,
        loading,
        pagination,
        getCountries,
        getAllCountries,
        getCountry,
        createCountry,
        updateCountry
    };
};

export default useCountryStore;