import React, { useEffect, useState } from 'react';
import { 
    Wallet, Search, Edit3, Trash2, 
    Loader2, RefreshCw, ChevronLeft, ChevronRight, Building2, CreditCard, FileDown
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import Select from 'react-select';

// --- STORES & CONTEXT ---
import usePaymentStore from '../../functions/base_hospital/usePaymentStore';
import useCenterStore from '../../functions/center/useCenterStore';
import { useAuth } from '../../contexts/AuthContext';

// --- MODALES & TYPES ---
import { UpdatePaymentModal } from '../../components/modals/Base_hopital/Finance/UpdatePaymentModal';
// 👉 Import de la modale d'exportation
import { ExportPaymentsModal } from '../../components/modals/Base_hopital/Finance/ExportPaymentsModal';
import type { PaymentInvoiceDto } from '../../types/PaymentTypes';

interface SelectOption {
    value: string;
    label: string;
}

const Payments = () => {
    // --- STORES & AUTH ---
    const { profile } = useAuth();
    const { getCenters, centers } = useCenterStore();
    const { 
        payments, loading, pagination, 
        getPayments, deletePayment, actionLoading 
    } = usePaymentStore();

    // 👉 DÉFINITION DES DROITS D'ACCÈS
    const canManagePayments = ['admin', 'super_admin', 'doctor'].includes(profile?.role || '');

    // --- ÉTATS ---
    const [page, setPage] = useState(1);
    const [searchInvoiceId, setSearchInvoiceId] = useState<string>('');
    const [selectedCenter, setSelectedCenter] = useState<SelectOption | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PaymentInvoiceDto | null>(null);
    const [autoRefreshPage,setAutoRefreshPage] = useState<boolean>(false);
    // 👉 NOUVEL ÉTAT pour la modale d'export
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // --- CHARGEMENT DES CENTRES ---
    useEffect(() => {
        if (canManagePayments) {
            getCenters(1, {}, 100); 
        }
    }, [canManagePayments, getCenters,autoRefreshPage]);

    // --- CHARGEMENT DES PAIEMENTS ---
    useEffect(() => {
        fetchPayments();
    }, [page, selectedCenter,autoRefreshPage]); 

    const fetchPayments = () => {
        getPayments(page, { 
            center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined,
            invoice_id: searchInvoiceId ? Number(searchInvoiceId.replace(/\D/g, '')) : undefined 
        });
    };
    const handleAutoRefresh = ()=>{
        setAutoRefreshPage(!autoRefreshPage)
    }
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPayments();
    };

    const handleResetSearch = () => {
        setSearchInvoiceId('');
        setPage(1);
        getPayments(1, { center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Annuler cet encaissement ?',
            text: `Le montant sera déduit de la facture associée et son statut sera recalculé. Cette action est irréversible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Non, fermer',
            confirmButtonText: 'Oui, annuler le paiement',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            await deletePayment(id);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount).replace('XAF', 'FCFA');
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            CASH: 'Espèces',
            MOBILE_MONEY: 'Mobile Money',
            CARD: 'Carte Bancaire',
            INSURANCE: 'Assurance',
            BANK_TRANSFER: 'Virement'
        };
        return labels[method] || method;
    };

    const centerOptions: SelectOption[] = centers.map(center => ({
        value: center.id.toString(),
        label: center.name
    }));

    return (
        <div className="space-y-6">
            
            {/* --- EN-TÊTE --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Registre de Caisse</h1>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Historique des paiements et encaissements des factures.
                        </p>
                    </div>
                </div>
                
                {/* 👉 CONTENEUR DES BOUTONS D'ACTION */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={fetchPayments}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-blue-600" : ""} />
                        Rafraîchir
                    </button>

                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7f] text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <FileDown size={18} />
                        Point de Caisse (PDF)
                    </button>
                </div>
            </div>

            {/* --- BARRE DE RECHERCHE ET FILTRES --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row items-center gap-4">
                
                <form onSubmit={handleSearchSubmit} className="flex flex-1 w-full gap-2">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher par N° Facture (ex: 5 ou INV-00005)..."
                            value={searchInvoiceId}
                            onChange={(e) => setSearchInvoiceId(e.target.value)}
                            className="w-full pl-10 p-2 min-h-[42px] bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <button type="submit" className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 rounded-lg font-medium text-sm transition-colors">
                        Chercher
                    </button>
                    {searchInvoiceId && (
                        <button type="button" onClick={handleResetSearch} className="bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border dark:border-gray-600 dark:hover:bg-gray-700 px-4 rounded-lg font-medium text-sm transition-colors">
                            Effacer
                        </button>
                    )}
                </form>

                {/* Filtre par Centre autorisé pour ceux qui gèrent les paiements */}
                {canManagePayments && (
                    <>
                        <div className="hidden lg:block w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="w-full lg:w-1/3 flex items-center gap-2">
                            <Building2 size={18} className="text-gray-400 shrink-0" />
                            <div className="flex-1">
                                <Select
                                    options={centerOptions}
                                    value={selectedCenter}
                                    onChange={(option) => {
                                        setSelectedCenter(option);
                                        setPage(1);
                                    }}
                                    isClearable 
                                    placeholder="Tous les centres..."
                                    className="react-select-container text-sm"
                                    classNamePrefix="react-select"
                                    noOptionsMessage={() => "Aucun centre trouvé"}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            minHeight: '42px',
                                            borderRadius: '0.5rem',
                                            borderColor: 'inherit',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                borderColor: '#3b82f6',
                                            }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            zIndex: 50
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* --- TABLEAU DES PAIEMENTS --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Heure</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reçu N° / Facture</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Moyen de paiement</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Caissier(ère)</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Montant</th>
                                
                                {canManagePayments && (
                                    <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={canManagePayments ? 7 : 6} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">Chargement du registre de caisse...</p>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={canManagePayments ? 7 : 6} className="p-12 text-center">
                                        <Wallet size={48} className="mx-auto mb-3 opacity-20 text-gray-500" />
                                        <p className="font-medium text-gray-500 dark:text-gray-400">Aucun encaissement trouvé.</p>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {new Date(payment.created_at).toLocaleDateString('fr-FR')} <br/>
                                            <span className="text-xs text-gray-400">{new Date(payment.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-mono font-bold text-slate-800 dark:text-gray-200">
                                                REC-{String(payment.id).padStart(5, '0')}
                                            </div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                                Lié à: INV-{String(payment.invoice_id).padStart(5, '0')}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                {payment.invoice?.patient?.first_name} {payment.invoice?.patient?.last_name}
                                            </div>
                                            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                                                Code: {payment.invoice?.patient?.patient_code}
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold border border-gray-200 dark:border-gray-700">
                                                <CreditCard size={14} />
                                                {getPaymentMethodLabel(payment.payment_method)}
                                            </div>
                                        </td>

                                        <td className="p-4 text-gray-700 dark:text-gray-300">
                                            {payment.reception?.user?.first_name 
                                                ? `${payment.reception.user.first_name} ${payment.reception.user.last_name || ''}` 
                                                : <span className="text-emerald-600 font-medium">Administrateur</span>
                                            }
                                        </td>

                                        <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                            + {formatCurrency(payment.amount)}
                                        </td>

                                        {canManagePayments && (
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    
                                                    <button 
                                                        onClick={() => setSelectedPayment(payment)} 
                                                        title="Corriger l'encaissement" 
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleDelete(payment.id)} 
                                                        title="Annuler l'encaissement" 
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
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
                {!loading && payments.length > 0 && pagination && pagination.lastPage > 1 && (
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

            {/* MODALES */}
            
            <UpdatePaymentModal
                isOpen={!!selectedPayment}
                onClose={() => {
                    setSelectedPayment(null);
                    fetchPayments(); 
                }}
                payment={selectedPayment}
            />

            {/* 👉 MODALE D'EXPORTATION DU POINT DE CAISSE */}
            <ExportPaymentsModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />

        </div>
    );
};

export default Payments;