import React, { useEffect, useState } from 'react';
import { 
    FileText, Plus, RefreshCw, Filter, Trash2, Printer, 
    CheckCircle, Send, Eye, Loader2, ChevronLeft, ChevronRight, AlertCircle, Download 
} from 'lucide-react';
import Swal from 'sweetalert2';

import useGuarantorClaimStore from '../../../../functions/base_hospital/useGuarantorClaimStore';
import useInsuranceStore from '../../../../functions/insurance/useInsuranceStore';

import { CreateGuarantorClaimModal } from '../../../../components/modals/guarantor_claim/CreateGuarantorClaimModal';
import { ViewGuarantorClaimModal } from '../../../../components/modals/guarantor_claim/ViewGuarantorClaimModal';
import { ExportGuarantorClaimsModal } from '../../../../components/modals/guarantor_claim/ExportGuarantorClaimsModal'; // 🟢 NOUVEL IMPORT
import type { GuarantorClaimStatus } from '../../../../types/GuarantorClaimTypes';

const GuarantorClaims = () => {
    const { 
        claims, loading, actionLoading, pagination, 
        getClaims, updateClaim, deleteClaim, downloadClaimPdf 
    } = useGuarantorClaimStore();
    
    const { insurances, getInsurances } = useInsuranceStore();

    // États
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [insuranceFilter, setInsuranceFilter] = useState<string>('');
    const [monthFilter, setMonthFilter] = useState<string>('');

    // Modales
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false); // 🟢 NOUVEL ÉTAT
    const [viewClaimId, setViewClaimId] = useState<number | null>(null);

    // Filtres actuels (pour la modale d'export)
    const currentFilters = {
        status: statusFilter || undefined,
        insurance_company_id: insuranceFilter || undefined,
        claim_month: monthFilter || undefined
    };

    // Initialisation
    useEffect(() => {
        getInsurances(1, {}, 100);
    }, [getInsurances]);

    // Chargement des données
    const fetchClaims = () => {
        getClaims(page, currentFilters);
    };

    useEffect(() => {
        fetchClaims();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, insuranceFilter, monthFilter]);

    // --- ACTIONS SUR LES BORDEREAUX ---

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce brouillon ?',
            text: "Les factures incluses seront remises en attente de réclamation.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        if (result.isConfirmed) {
            await deleteClaim(id);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: GuarantorClaimStatus, text: string) => {
        const result = await Swal.fire({
            title: 'Changer le statut ?',
            text: text,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#003366',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Confirmer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        if (result.isConfirmed) {
            await updateClaim(id, { status: newStatus });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount).replace('XAF', 'FCFA');
    };

    const renderStatusBadge = (status: GuarantorClaimStatus) => {
        switch (status) {
            case 'DRAFT': return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">Brouillon</span>;
            case 'SUBMITTED': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400">Soumis</span>;
            case 'PAID': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400">Payé</span>;
            case 'DISPUTED': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border border-orange-200 dark:bg-orange-900/30 dark:border-orange-800/50 dark:text-orange-400">Litige</span>;
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
                        <FileText size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white font-brand">Bordereaux de Transmission</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gestion des réclamations financières auprès des assurances (Tiers Payant).</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={fetchClaims}
                        disabled={loading}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
                    </button>

                    {/* 🟢 NOUVEAU BOUTON : Exporter Liste */}
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium"
                        title="Exporter la liste"
                    >
                        <Download size={20} /> <span className="hidden sm:inline">Exporter</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-colors"
                    >
                        <Plus size={20} /> <span className="hidden sm:inline">Nouveau Bordereau</span>
                    </button>
                </div>
            </div>

            {/* --- FILTRES --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-gray-500 font-bold uppercase text-xs w-full md:w-auto">
                    <Filter size={16} /> Filtres
                </div>
                
                <select 
                    value={insuranceFilter}
                    onChange={(e) => { setInsuranceFilter(e.target.value); setPage(1); }}
                    className="w-full md:w-1/4 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-sm dark:text-white"
                >
                    <option value="">Toutes les assurances</option>
                    {insurances.map(ins => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                </select>

                <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="w-full md:w-1/4 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-sm dark:text-white"
                >
                    <option value="">Tous les statuts</option>
                    <option value="DRAFT">Brouillons</option>
                    <option value="SUBMITTED">Soumis à l'assurance</option>
                    <option value="PAID">Payés</option>
                    <option value="DISPUTED">En litige</option>
                </select>

                <input 
                    type="month"
                    value={monthFilter}
                    onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
                    className="w-full md:w-1/4 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none text-sm dark:text-white"
                />
            </div>

            {/* --- TABLEAU --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mois/Réf</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assurance</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Factures</th>
                                <th className="p-4 text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-right">Montant Réclamé</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-2" />
                                        Chargement des bordereaux...
                                    </td>
                                </tr>
                            ) : claims.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        <FileText size={48} className="mx-auto mb-3 opacity-20" />
                                        Aucun bordereau trouvé.
                                    </td>
                                </tr>
                            ) : (
                                claims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200 capitalize">
                                                {new Date(claim.claim_month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                Réf: {claim.claim_refence || `BDR-${String(claim.id).padStart(4, '0')}`}
                                            </div>
                                        </td>

                                        <td className="p-4 font-bold text-gray-700 dark:text-gray-300">
                                            {claim.insuranceCompany?.name || 'N/A'}
                                        </td>

                                        <td className="p-4 text-center">
                                            <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold px-3 py-1 rounded-full text-xs border border-indigo-100 dark:border-indigo-800/50">
                                                {claim.invoice_splits_count || 0} lignes
                                            </span>
                                        </td>

                                        <td className="p-4 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {formatCurrency(claim.total_claim_amount)}
                                        </td>

                                        <td className="p-4 text-center">
                                            {renderStatusBadge(claim.status)}
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                
                                                <button 
                                                    onClick={() => setViewClaimId(claim.id)} 
                                                    title="Voir le détail des factures" 
                                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                <button 
                                                    onClick={() => downloadClaimPdf(claim.id, 'stream')} 
                                                    disabled={actionLoading}
                                                    title="Imprimer le PDF" 
                                                    className="p-1.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Printer size={18} />
                                                </button>

                                                {/* ACTIONS DE STATUT RAPIDES */}
                                                {claim.status === 'DRAFT' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(claim.id, 'SUBMITTED', 'Marquer ce bordereau comme officiellement envoyé à l\'assurance.')} 
                                                            title="Soumettre à l'assurance" 
                                                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(claim.id)} 
                                                            title="Supprimer le brouillon" 
                                                            className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}

                                                {claim.status === 'SUBMITTED' && (
                                                    <button 
                                                        onClick={() => handleUpdateStatus(claim.id, 'PAID', 'Confirmer que l\'assurance a viré l\'argent. Cela soldera toutes les factures incluses.')} 
                                                        title="Marquer comme Payé par l'assurance" 
                                                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                
                                                {claim.status === 'DISPUTED' && (
                                                    <button title="Litige en cours" className="p-1.5 text-orange-500 dark:text-orange-400 cursor-not-allowed">
                                                        <AlertCircle size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PAGINATION --- */}
                {pagination && pagination.lastPage > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Page {pagination.currentPage} / {pagination.lastPage}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 dark:text-white"><ChevronLeft size={18}/></button>
                            <button onClick={() => setPage(p => Math.min(pagination.lastPage, p + 1))} disabled={page === pagination.lastPage} className="p-2 border dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 dark:text-white"><ChevronRight size={18}/></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES */}
            <CreateGuarantorClaimModal 
                isOpen={isCreateModalOpen} 
                onClose={() => { setIsCreateModalOpen(false); fetchClaims(); }} 
            />

            <ViewGuarantorClaimModal
                isOpen={!!viewClaimId}
                onClose={() => setViewClaimId(null)}
                claimId={viewClaimId}
            />

            {/* 🟢 NOUVELLE MODALE : EXPORT PDF & EXCEL */}
            <ExportGuarantorClaimsModal 
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                baseFilters={currentFilters}
                insurances={insurances}
            />
        </div>
    );
};

export default GuarantorClaims;