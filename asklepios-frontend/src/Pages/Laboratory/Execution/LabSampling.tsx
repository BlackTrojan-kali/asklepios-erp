import React, { useState } from 'react';
import { Search, Beaker, CheckCircle, Clock, Printer, Wallet } from 'lucide-react';
import { useLabRequests, useMarkAsSampled } from '../../../hooks/laboratory/useLabRequest';
import type { LabRequestDto } from '../../../types/types';
import toast from 'react-hot-toast';
import { Pagination } from '../../../components/common/Pagination';
import { Button } from '../../../components/common/Button';
import { LabExamInvoiceModal } from '../../../components/modals/Base_hopital/facturation/LabExamInvoiceModal';

const LabSampling = () => {
    const [searchTerm, setSearchTerm] = useState('');
    // On charge les requêtes payées qui attendent d'être prélevées (PAID) et celles déjà prélevées (SAMPLED)
    const [statusFilter, setStatusFilter] = useState<'PAID' | 'SAMPLED'>('PAID');
    const { data: labRequests, isLoading, refetch } = useLabRequests(statusFilter);
    const sampleMutation = useMarkAsSampled();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    const handleSample = async (id: number) => {
        try {
            await sampleMutation.mutateAsync(id);
            toast.success("Prélèvements générés avec succès");
        } catch (error: any) {
            toast.error("Erreur lors de la génération des prélèvements");
        }
    };

    const filteredRequests = (labRequests || []).filter(req => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            req.patient?.first_name.toLowerCase().includes(searchLower) ||
            req.patient?.last_name.toLowerCase().includes(searchLower) ||
            req.patient?.patient_code.toLowerCase().includes(searchLower) ||
            `REQ-${req.id}`.toLowerCase().includes(searchLower)
        );
    });

    const paginatedRequests = filteredRequests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Salle de Prélèvement</h1>
                    <p className="text-slate-600 dark:text-slate-400">Gérez les prélèvements des patients et la caisse du laboratoire</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setIsBillingModalOpen(true)}
                    icon={<Wallet size={18} />}
                    title="Encaisser des examens au guichet du laboratoire pour désengorger la caisse centrale"
                >
                    Caisse & Facturation Labo
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher par patient, code ou N° demande..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                    <button
                        onClick={() => { setStatusFilter('PAID'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            statusFilter === 'PAID'
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        À prélever
                    </button>
                    <button
                        onClick={() => { setStatusFilter('SAMPLED'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            statusFilter === 'SAMPLED'
                                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        Prélevés
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 font-medium border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-4">Demande</th>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Priorité</th>
                                <th className="p-4">Examens</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Chargement des prélèvements...</td>
                                </tr>
                            ) : paginatedRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Aucune demande trouvée</td>
                                </tr>
                            ) : (
                                paginatedRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                                            REQ-{req.id}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800 dark:text-white">
                                                {req.patient?.first_name} {req.patient?.last_name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Code: {req.patient?.patient_code}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                req.priority === 'URGENT' 
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                {req.lines?.map(line => (
                                                    <span key={line.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 font-medium">
                                                        {line.test?.name} {line.test?.price ? `(${Number(line.test.price).toLocaleString('fr-FR')} FCFA)` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            {statusFilter === 'PAID' ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleSample(req.id)}
                                                    isLoading={sampleMutation.isPending}
                                                    tooltip="Valider le prélèvement et générer les étiquettes tubes"
                                                    tooltipPosition="left"
                                                    className="bg-indigo-600 hover:bg-indigo-700"
                                                    icon={<Beaker className="w-4 h-4" />}
                                                >
                                                    Prélever
                                                </Button>
                                            ) : (
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Échantillons générés
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        tooltip="Re-imprimer les étiquettes codes-barres pour les tubes"
                                                        tooltipPosition="left"
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 p-0 hover:bg-transparent"
                                                        icon={<Printer className="w-3 h-3" />}
                                                    >
                                                        Imprimer Codes-barres
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredRequests.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(page) => setCurrentPage(page)}
                    onItemsPerPageChange={(limit) => setItemsPerPage(limit)}
                />
            </div>

            <LabExamInvoiceModal
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
};

export default LabSampling;
