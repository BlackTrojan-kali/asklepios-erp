import React, { useState } from 'react';
import { Search, Beaker, CheckCircle, Clock, Printer } from 'lucide-react';
import { useLabRequests, useMarkAsSampled } from '../../../hooks/laboratory/useLabRequest';
import type { LabRequestDto } from '../../../types/types';
import toast from 'react-hot-toast';

const LabSampling = () => {
    const [searchTerm, setSearchTerm] = useState('');
    // On charge les requêtes payées qui attendent d'être prélevées (PAID) et celles déjà prélevées (SAMPLED)
    const [statusFilter, setStatusFilter] = useState<'PAID' | 'SAMPLED'>('PAID');
    const { data: labRequests, isLoading } = useLabRequests(statusFilter);
    const sampleMutation = useMarkAsSampled();

    const handleSample = async (id: number) => {
        try {
            await sampleMutation.mutateAsync(id);
            toast.success("Prélèvements générés avec succès");
        } catch (error: any) {
            toast.error("Erreur lors de la génération des prélèvements");
        }
    };

    const filteredRequests = labRequests?.filter(req => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            req.patient?.first_name.toLowerCase().includes(searchLower) ||
            req.patient?.last_name.toLowerCase().includes(searchLower) ||
            req.patient?.patient_code.toLowerCase().includes(searchLower) ||
            `REQ-${req.id}`.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Salle de Prélèvement</h1>
                    <p className="text-slate-600 dark:text-slate-400">Gérez les prélèvements des patients</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('PAID')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                                statusFilter === 'PAID' 
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            À Prélever
                        </button>
                        <button
                            onClick={() => setStatusFilter('SAMPLED')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                                statusFilter === 'SAMPLED' 
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' 
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Beaker className="w-4 h-4" />
                            Déjà Prélevé
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Rechercher (Nom, Code, REQ-XXX)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Demande</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priorité</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Examens à faire</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chargement...</td></tr>
                            ) : filteredRequests?.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Aucune demande trouvée.</td></tr>
                            ) : (
                                filteredRequests?.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                                                REQ-{req.id}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {req.patient?.first_name} {req.patient?.last_name}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {req.patient?.patient_code} - {req.patient?.gender}
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
                                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                                                {req.lines?.map(line => (
                                                    <span key={line.id} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400">
                                                        {line.test?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            {statusFilter === 'PAID' ? (
                                                <button
                                                    onClick={() => handleSample(req.id)}
                                                    disabled={sampleMutation.isPending}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                                                >
                                                    <Beaker className="w-4 h-4" />
                                                    Prélever
                                                </button>
                                            ) : (
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Échantillons générés
                                                    </span>
                                                    <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                                        <Printer className="w-3 h-3" />
                                                        Imprimer Codes-barres
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LabSampling;
