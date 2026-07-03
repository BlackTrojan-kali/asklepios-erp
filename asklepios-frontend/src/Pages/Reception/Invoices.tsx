import React, { useEffect, useState } from 'react';
import { 
    Receipt, Printer, Eye, Trash2, 
    Loader2, RefreshCw, ChevronLeft, ChevronRight, Filter, Plus, Wallet, Building2, FileDown
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import Select from 'react-select'; 

// --- STORES & CONTEXT ---
import useInvoiceStore from '../../functions/base_hospital/useInvoiceStore';
import useCenterStore from '../../functions/center/useCenterStore';
import { useAuth } from '../../contexts/AuthContext'; 

// --- TYPES ---
import type { InvoiceDto } from '../../types/InvoiceTypes';

// --- MODALES ---
import { InvoicePreviewModal } from '../../components/modals/Base_hopital/hospital/InvoicePreviewModal'; 
import { GenerateInvoiceModal } from '../../components/modals/Base_hopital/facturation/GenerateInvoiceModal'; 
import { CreatePaymentModal } from '../../components/modals/Base_hopital/Finance/CreatePaymentModal';
// 👉 Import de la nouvelle modale d'exportation
import { ExportInvoicesModal } from '../../components/modals/Base_hopital/Finance/ExportInvoicesModal'; 

interface SelectOption {
    value: string;
    label: string;
}

const Invoices = () => {
    // --- STORES & AUTH ---
    const { profile } = useAuth();
    const { getCenters, centers } = useCenterStore();
    const { 
        invoices, loading, pagination, 
        getInvoices, cancelInvoice, downloadInvoicePdf, actionLoading 
    } = useInvoiceStore();

    // --- ÉTATS (Filtres & Pagination) ---
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'PAID', 'UNPAID'
    const [selectedCenter, setSelectedCenter] = useState<SelectOption | null>(null);
    
    // --- ÉTATS DES MODALES ---
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false); 
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceDto | null>(null);
    
    // 👉 NOUVEL ÉTAT pour la modale d'export
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // --- CHARGEMENT DES CENTRES (Si Admin) ---
    useEffect(() => {
        if (profile?.role === 'admin' || profile?.role === 'super_admin') {
            getCenters(1, {}, 100); 
        }
    }, [profile, getCenters]);

    // --- CHARGEMENT DES FACTURES ---
    useEffect(() => {
        fetchInvoices();
    }, [page, statusFilter, selectedCenter]);

    const fetchInvoices = () => {
        getInvoices(page, { 
            status: statusFilter || undefined,
            center_id: selectedCenter?.value ? Number(selectedCenter.value) : undefined
        });
    };

    const handleRefresh = () => {
        fetchInvoices();
    };

    const handleFilterChange = (newStatus: string) => {
        setStatusFilter(newStatus);
        setPage(1); 
    };

    const handleOpenPayment = (invoice: InvoiceDto) => {
        setSelectedInvoiceForPayment(invoice);
        setIsPaymentOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Annuler cette facture ?',
            text: `Cette facture sera supprimée et les soins médicaux associés seront remis en attente de facturation. Cette action est irréversible.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Non, fermer',
            confirmButtonText: 'Oui, annuler la facture',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            await cancelInvoice(id);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount).replace('XAF', 'FCFA');
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
                    <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Historique des Factures</h1>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Consultez, imprimez ou encaissez les factures du système.
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-[#00a896]" : ""} />
                        Rafraîchir
                    </button>
                    
                    {/* 👉 BOUTON EXPORTER LE RAPPORT PDF */}
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#003366] hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <FileDown size={18} />
                        Exporter PDF
                    </button>

                    <button 
                        onClick={() => setIsGenerateModalOpen(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00a896] hover:bg-[#008f7f] text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <Plus size={18} />
                        Nouvelle Facture
                    </button>
                </div>
            </div>

            {/* --- BARRE DE FILTRES --- */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-4">
                
                {/* Filtre Statut */}
                <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 uppercase whitespace-nowrap">
                        <Filter size={16} /> Statut :
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                        {[
                            { label: 'Toutes', value: '' },
                            { label: 'Payées', value: 'PAID' },
                            { label: 'Non Payées', value: 'UNPAID' }
                        ].map(tab => (
                            <button
                                key={tab.label}
                                onClick={() => handleFilterChange(tab.value)}
                                className={`px-4 sm:px-6 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                                    statusFilter === tab.value 
                                        ? 'bg-white dark:bg-gray-800 text-[#003366] dark:text-[#00a896] shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtre Centre (Admin uniquement) */}
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
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
                                            '&:hover': { borderColor: '#00a896' }
                                        }),
                                        menu: (base) => ({ ...base, zIndex: 50 })
                                    }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* --- TABLEAU DES FACTURES --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Facture</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date d'émission</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Montant Total</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Reste à Payer</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                        <p className="text-gray-500">Chargement des données financières...</p>
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center">
                                        <Receipt size={48} className="mx-auto mb-3 opacity-20 text-gray-500" />
                                        <p className="font-medium text-gray-500">Aucune facture trouvée.</p>
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        <td className="p-4 font-mono font-bold text-[#003366] dark:text-blue-400">
                                            INV-{String(inv.id).padStart(5, '0')}
                                        </td>

                                        <td className="p-4 text-gray-600 dark:text-gray-300">
                                            {new Date(inv.created_at).toLocaleDateString('fr-FR')} <br/>
                                            <span className="text-xs text-gray-400">{new Date(inv.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>

                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                {inv.patient?.first_name} {inv.patient?.last_name}
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                                                Code: {inv.patient?.patient_code}
                                            </div>
                                        </td>

                                        <td className="p-4 text-right font-mono font-bold text-slate-800 dark:text-gray-200">
                                            {formatCurrency(inv.total_amount)}
                                        </td>

                                        <td className="p-4 text-right font-mono font-bold text-red-500">
                                            {formatCurrency((inv as any).remaining_debt || 0)}
                                        </td>

                                        <td className="p-4 text-center">
                                            {inv.status === 'PAID' ? (
                                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase">
                                                    Soldée
                                                </span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-black px-2.5 py-1 rounded tracking-widest uppercase">
                                                    Non Payée
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                
                                                {inv.status === 'UNPAID' && (
                                                    <button 
                                                        onClick={() => handleOpenPayment(inv)} 
                                                        title="Encaisser un paiement" 
                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Wallet size={18} />
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => setSelectedInvoiceId(inv.id)} 
                                                    title="Voir les détails" 
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                <button 
                                                    onClick={() => downloadInvoicePdf(inv.id, 'stream')} 
                                                    disabled={actionLoading}
                                                    title="Imprimer le PDF" 
                                                    className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                
                                                {inv.status === 'UNPAID' && (
                                                    <button 
                                                        onClick={() => handleDelete(inv.id)} 
                                                        title="Annuler la facture" 
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
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
                {!loading && invoices.length > 0 && pagination && pagination.lastPage > 1 && (
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
            <InvoicePreviewModal
                isOpen={!!selectedInvoiceId}
                onClose={() => setSelectedInvoiceId(null)}
                invoiceId={selectedInvoiceId}
            />

            <GenerateInvoiceModal
                isOpen={isGenerateModalOpen}
                onClose={() => {
                    setIsGenerateModalOpen(false);
                    handleRefresh();
                }}
            />

            <CreatePaymentModal
                isOpen={isPaymentOpen}
                onClose={() => {
                    setIsPaymentOpen(false);
                    setSelectedInvoiceForPayment(null);
                    handleRefresh(); 
                }}
                invoice={selectedInvoiceForPayment}
            />

            {/* 👉 MODALE D'EXPORTATION DU RAPPORT */}
            <ExportInvoicesModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
            />

        </div>
    );
};

export default Invoices;