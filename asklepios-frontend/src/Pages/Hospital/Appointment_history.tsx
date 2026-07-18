import React, { useEffect, useState, useCallback } from 'react';
import { 
    Calendar, Clock, Building2, Filter, FileDown, Search,
    RefreshCw, XCircle, CheckCircle, ChevronLeft, ChevronRight, Loader2, Printer
} from 'lucide-react';
import Swal from 'sweetalert2';
import Select from 'react-select';

// --- STORES & CONTEXT ---
import useAppointmentStore from '../../functions/base_hospital/useAppointmentStore';
import useCenterStore from '../../functions/center/useCenterStore';
import { useAuth } from '../../contexts/AuthContext';

// --- TYPES ---
import type { AppointmentDto } from '../../types/AppointmentTypes';

// --- MODALES ---
import { ExportAppointmentsModal } from '../../components/modals/Base_hopital/Appointment/ExportAppointmentsModal';

interface SelectOption {
    value: string;
    label: string;
}

const Appointment_history = () => {
    // --- STORES & AUTH ---
    const { profile } = useAuth();
    const { getCenters, centers } = useCenterStore();
    const { 
        appointments, loading, pagination, 
        getAppointments, cancelAppointment, exportPdf, actionLoading 
    } = useAppointmentStore();
 
    // Rôles
    const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');
    const isDoctor = profile?.role === 'doctor';

    // --- ÉTATS (Filtres & Pagination) ---
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'SCHEDULED', 'ARRIVED', 'CANCELLED'
    const [startDate, setStartDate] = useState<string>(''); // Période: Du
    const [endDate, setEndDate] = useState<string>('');     // Période: Au
    const [selectedCenter, setSelectedCenter] = useState<SelectOption | null>(null);
    const [searchQuery, setSearchQuery] = useState(''); // 👉 NOUVEAU : Recherche par code

    // --- ÉTATS DES MODALES ---
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    // Pour les actions spécifiques sur un RDV particulier
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
    const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);

    // --- CHARGEMENT DES COMPOSANTES ---
    useEffect(() => {
        if (isAdmin) {
            getCenters(1, {}, 100);
        }
    }, [isAdmin, getCenters]);

    // Fonction centralisée pour récupérer les données avec les filtres actuels
    const fetchAppointments = () => {
        getAppointments(page, {
            status: statusFilter || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined,
            patient_code: searchQuery || undefined // 👉 NOUVEAU
        });
    };

    // Déclencheur automatique quand un filtre standard (autre que la recherche) ou la page change
    useEffect(() => {
        fetchAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, startDate, endDate, selectedCenter]);

    const handleRefresh = () => {
        fetchAppointments();
    };

    // 👉 SOUMISSION DE LA RECHERCHE
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); 
        getAppointments(1, { 
            status: statusFilter || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined,
            patient_code: searchQuery || undefined 
        });
    };

    // 👉 RÉINITIALISATION DE LA RECHERCHE
    const handleResetSearch = () => {
        setSearchQuery('');
        setPage(1);
        getAppointments(1, { 
            status: statusFilter || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined,
            patient_code: undefined 
        });
    };

    // Gérer le changement de filtre (et remettre la page à 1)
    const handleFilterChange = (type: 'status' | 'start' | 'end' | 'center', value: any) => {
        if (type === 'status') setStatusFilter(value);
        if (type === 'start') setStartDate(value);
        if (type === 'end') setEndDate(value);
        if (type === 'center') setSelectedCenter(value);
        setPage(1); // Retour à la première page
    };

    // Annuler un rendez-vous
    const handleCancel = async (id: number) => {
        const result = await Swal.fire({
            title: 'Annuler ce rendez-vous ?',
            text: "Le patient sera marqué comme annulé. Cette action ne supprime pas le dossier pour maintenir l'historique.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Garder',
            confirmButtonText: 'Oui, annuler',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });

        if (result.isConfirmed) {
            const success = await cancelAppointment(id);
            if (success) fetchAppointments();
        }
    };

    // Couleurs des badges de statut
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'ARRIVED':
                return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'CANCELLED':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'SCHEDULED') return 'Planifié';
        if (status === 'ARRIVED') return 'En salle / Arrivé';
        if (status === 'CANCELLED') return 'Annulé';
        return status;
    };

    const centerOptions: SelectOption[] = centers.map(c => ({
        value: c.id.toString(),
        label: c.name
    }));

    return (
        <div className="space-y-6">
            
            {/* --- EN-TÊTE --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Registre des Rendez-vous</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isDoctor ? "Consultez l'historique et le planning de vos consultations." : "Supervisez et gérez la file active et l'historique des rendez-vous."}
                        </p>
                    </div>
                </div>

                {/* Boutons d'actions globales */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-700 dark:text-gray-200 transition-colors"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-[#00a896]" : ""} />
                    </button>

                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#003366] hover:bg-blue-900 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors text-sm"
                    >
                        <FileDown size={18} />
                        Exporter Bilan (PDF)
                    </button>
                </div>
            </div>

            {/* --- RECHERCHE PAR CODE PATIENT --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Rechercher par Code Patient (ex: H1-0001)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button 
                            type="submit" 
                            className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 py-2 min-h-[42px] rounded-lg font-medium transition-colors text-sm shadow-sm"
                        >
                            Rechercher
                        </button>
                        {searchQuery && (
                            <button 
                                type="button"
                                onClick={handleResetSearch}
                                className="px-4 py-2 min-h-[42px] bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                            >
                                Effacer
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* --- BARRE DE FILTRES DYNAMIQUES --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row items-center justify-between gap-4">
                
                {/* Sélecteurs d'onglets (Statut) */}
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {[
                        { label: 'Tous', value: '' },
                        { label: 'Planifiés', value: 'SCHEDULED' },
                        { label: 'En salle / Arrivés', value: 'ARRIVED' },
                        { label: 'Annulés', value: 'CANCELLED' }
                    ].map(tab => (
                        <button
                            key={tab.label}
                            onClick={() => handleFilterChange('status', tab.value)}
                            className={`flex-1 xl:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                statusFilter === tab.value 
                                    ? 'bg-white dark:bg-gray-800 text-[#003366] dark:text-[#00a896] shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filtres de recherche avancés (Période & Centre) */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    
                    {/* Filtre Période */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Filter size={16}/> Du
                        </div>
                        <input 
                            type="date"
                            value={startDate}
                            onChange={(e) => handleFilterChange('start', e.target.value)}
                            className="w-full sm:w-36 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a896] text-xs dark:text-white"
                        />
                        <div className="text-sm text-gray-500">Au</div>
                        <input 
                            type="date"
                            value={endDate}
                            onChange={(e) => handleFilterChange('end', e.target.value)}
                            className="w-full sm:w-36 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a896] text-xs dark:text-white"
                        />
                    </div>

                    {/* Filtre par Centre (Admin uniquement) */}
                    {isAdmin && (
                        <div className="w-full sm:w-56">
                            <Select
                                options={centerOptions}
                                value={selectedCenter}
                                onChange={(option) => handleFilterChange('center', option)}
                                isClearable 
                                placeholder="Filtrer par centre..."
                                className="react-select-container text-xs"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base) => ({
                                        ...base, minHeight: '42px', borderRadius: '0.75rem', borderColor: '#e2e8f0', boxShadow: 'none'
                                    }),
                                    menu: (base) => ({ ...base, zIndex: 50 })
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- LISTE DES RENDEZ-VOUS --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Heure</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Médecin Traitant</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Centre</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Motif</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                {!isDoctor && (
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={isDoctor ? 6 : 7} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-gray-500 text-xs">Chargement du calendrier...</p>
                                    </td>
                                </tr>
                            ) : appointments.length === 0 ? (
                                <tr>
                                    <td colSpan={isDoctor ? 6 : 7} className="p-12 text-center">
                                        <Calendar size={48} className="mx-auto mb-3 opacity-20 text-gray-500" />
                                        <p className="font-medium text-gray-500 dark:text-gray-400 text-xs">Aucun rendez-vous trouvé.</p>
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                {new Date(apt.scheduled_datetime).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Clock size={12} />
                                                {new Date(apt.scheduled_datetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                {apt.patient?.first_name} {apt.patient?.last_name}
                                            </div>
                                            <div className="text-[11px] text-[#00a896] font-mono mt-0.5">
                                                {apt.patient?.patient_code}
                                            </div>
                                        </td>

                                        <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                                            Dr. {apt.doctor?.user?.first_name || ''} {apt.doctor?.user?.last_name || ''}
                                        </td>

                                        <td className="p-4 text-gray-600 dark:text-gray-400 text-xs">
                                            {apt.center?.name || 'N/A'}
                                        </td>

                                        <td className="p-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                            {apt.reason || <span className="italic text-gray-300">Aucun motif renseigné</span>}
                                        </td>

                                        <td className="p-4 text-center whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${getStatusBadgeClass(apt.status)}`}>
                                                {getStatusLabel(apt.status)}
                                            </span>
                                        </td>

                                        {!isDoctor && (
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <div className="flex justify-end items-center gap-2">
                                                    
                                                    {/* Action : Admettre (Caisse / Réception) */}
                                                    {apt.status === 'SCHEDULED' && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedAppointment(apt);
                                                                setIsAdmitModalOpen(true);
                                                            }}
                                                            title="Admettre en salle d'attente"
                                                            className="px-2.5 py-1 text-xs font-bold text-white bg-[#00a896] hover:bg-[#008f7f] rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                                        >
                                                            <CheckCircle size={14} /> Admettre
                                                        </button>
                                                    )}

                                                    {/* Action : Annuler (Admin / Réception) */}
                                                    {apt.status === 'SCHEDULED' && (
                                                        <button 
                                                            onClick={() => handleCancel(apt.id)}
                                                            title="Annuler le rendez-vous"
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}

                                                    {/* Si le patient est déjà pris en charge */}
                                                    {apt.status === 'ARRIVED' && (
                                                        <span className="text-xs text-slate-400 italic">Pris en charge</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                {!loading && appointments.length > 0 && pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(page - 1)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => setPage(page + 1)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- INTEGRATION DES MODALES --- */}

            <ExportAppointmentsModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />

        </div>
    );
};

export default Appointment_history;