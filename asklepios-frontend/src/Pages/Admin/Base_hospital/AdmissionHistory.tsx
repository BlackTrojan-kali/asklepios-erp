import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, 
    BedDouble, 
    Loader2, 
    FileText, 
    Calendar,
    RefreshCw
} from 'lucide-react';
import useAdmissionStore from '../../../functions/base_hospital/useAdmissionStore';
import { ExportAdmissionPdfModal } from '../../../components/modals/Base_hopital/Admission/ExportAdmissionPdfModal';
import type { AdmissionStatus } from '../../../types/AdmissionTypes';

const AdmissionHistory = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // Infos passées par le router
    const { room, departmentName, departmentId } = location.state || {};
    const roomName = room?.name || "Chambre d'hospitalisation";

    // Store
    const { 
        admissions, 
        loading, 
        pagination, 
        getAdmissionHistory 
    } = useAdmissionStore();

    // États locaux
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<AdmissionStatus | ''>('');
    const [isBilledFilter, setIsBilledFilter] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // On force le filtrage sur la chambre courante (via facility_room_id)
    const baseFilters = {
        facility_room_id: Number(roomId)
    };

    useEffect(() => {
        if (roomId) {
            fetchData(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, page]);

    const fetchData = (targetPage: number = 1) => {
        getAdmissionHistory(targetPage, { 
            ...baseFilters, 
            status: statusFilter,
            is_billed: isBilledFilter 
        });
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchData(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (pagination?.lastPage || 1)) {
            setPage(newPage);
        }
    };

    return (
        <div className="space-y-6">
            {/* EN-TÊTE */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white w-fit transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour aux salles
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <BedDouble size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                {roomName} - Hospitalisations
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Historique des admissions • Département <span className="font-semibold text-slate-700 dark:text-gray-300">{departmentName || 'Inconnu'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => fetchData(page)}
                            disabled={loading}
                            className="flex items-center justify-center p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-200"} />
                        </button>
                        <button 
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                        >
                            <FileText size={18} />
                            Rapport PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* FILTRES RAPIDES */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value as AdmissionStatus | '')} 
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                        >
                            <option value="">Tous les statuts d'admission</option>
                            <option value="ADMITTED">En cours (Admis)</option>
                            <option value="DISCHARGED">Libéré</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <select 
                            value={isBilledFilter} 
                            onChange={(e) => setIsBilledFilter(e.target.value)} 
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                        >
                            <option value="">Tous les statuts de facturation</option>
                            <option value="true">Dossiers Facturés</option>
                            <option value="false">En attente de facturation</option>
                        </select>
                    </div>
                    <button type="submit" className="bg-slate-800 dark:bg-gray-700 hover:bg-slate-900 dark:hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
                        Appliquer
                    </button>
                </form>
            </div>

            {/* TABLEAU */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center flex-1">
                        <Loader2 size={48} className="animate-spin text-indigo-500 dark:text-indigo-400 mb-4" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">Chargement des hospitalisations...</p>
                    </div>
                ) : admissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                        <BedDouble size={64} className="text-gray-300 dark:text-gray-700 mb-4" />
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">Aucune hospitalisation trouvée.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    <th className="p-4 font-bold">Période</th>
                                    <th className="p-4 font-bold">Patient</th>
                                    <th className="p-4 font-bold">Lit</th>
                                    <th className="p-4 font-bold">Médecin Resp.</th>
                                    <th className="p-4 font-bold">Statut Méd.</th>
                                    <th className="p-4 font-bold">Statut Facturation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {admissions.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-gray-200">
                                                <Calendar size={14} className="text-indigo-500" />
                                                Entrée: {new Date(a.admission_date).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Sortie: {a.actual_discharge_date ? new Date(a.actual_discharge_date).toLocaleDateString('fr-FR') : 'En cours'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800 dark:text-gray-200">
                                                {a.patient?.first_name} {a.patient?.last_name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {a.patient?.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="inline-flex items-center justify-center px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-md border border-indigo-100 dark:border-indigo-800/50">
                                                Lit {a.bed?.bed_number}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-700 dark:text-gray-300">
                                            {a.doctor ? `Dr. ${a.doctor.user?.first_name} ${a.doctor.user?.last_name}` : 'Non assigné'}
                                        </td>
                                        <td className="p-4">
                                            {a.status === 'ADMITTED' ? (
                                                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800/50">En cours</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-bold rounded-full border border-slate-300 dark:border-gray-600">Libéré</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {a.is_billed ? (
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800/50">Facturé</span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800/50">En attente</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION */}
                {pagination && pagination.lastPage > 1 && (
                    <div className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center justify-between rounded-b-xl">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page {pagination.currentPage} sur {pagination.lastPage} ({pagination.total} résultats)
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Précédent
                            </button>
                            <button 
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE EXPORT PDF */}
            <ExportAdmissionPdfModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                baseFilters={baseFilters}
            />

        </div>
    );
};

export default AdmissionHistory;