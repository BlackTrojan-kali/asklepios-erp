import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, ThermometerSnowflake, Droplet, Activity, Package, 
    CheckCircle, Clock, AlertTriangle, Info, RefreshCw
} from 'lucide-react';
import api from '../../../../api/api'; // Ajustez le chemin de votre instance axios
import type { BloodRefrigeratorDto, BloodBagDto } from '../../../../types/BloodManageType';

interface BloodRefrigeratorDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    refrigerator: BloodRefrigeratorDto | null;
}

const BloodRefrigeratorDetailsModal: React.FC<BloodRefrigeratorDetailsModalProps> = ({ 
    isOpen, onClose, refrigerator 
}) => {
    const [bags, setBags] = useState<BloodBagDto[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Charger les poches dès que la modale s'ouvre pour ce frigo
    useEffect(() => {
        if (isOpen && refrigerator) {
            fetchBags();
        } else {
            setBags([]);
        }
    }, [isOpen, refrigerator]);

    const fetchBags = async () => {
        try {
            setLoading(true);
            setError(null);
            // On demande 500 poches max pour avoir des stats fiables sur le frigo
            const res = await api.get('/admin/blood-bags', {
                params: { blood_refrigerator_id: refrigerator?.id, per_page: 500 }
            });
            
            const fetchedBags = res.data.data !== undefined ? res.data.data : res.data;
            setBags(Array.isArray(fetchedBags) ? fetchedBags : []);
        } catch (err) {
            console.error("Erreur de chargement", err);
            setError("Impossible de charger le contenu de ce réfrigérateur.");
        } finally {
            setLoading(false);
        }
    };

    // Calcul des statistiques à la volée
    const stats = useMemo(() => {
        const result = {
            total: bags.length,
            available: 0,
            quarantine: 0,
            expired: 0,
            byType: {} as Record<string, number>
        };

        bags.forEach(bag => {
            // Statut
            if (bag.status === 'AVAILABLE') result.available++;
            if (bag.status === 'QUARANTINE') result.quarantine++;
            if (bag.status === 'EXPIRED') result.expired++;
            
            // Groupe sanguin
            result.byType[bag.blood_type] = (result.byType[bag.blood_type] || 0) + 1;
        });

        return result;
    }, [bags]);

    // Utilitaires d'affichage
    const getStatusBadge = (status: string, isExpiredDate: boolean) => {
        if (isExpiredDate && status !== 'USED') {
            return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-[10px] font-bold">Expirée</span>;
        }
        switch (status) {
            case 'AVAILABLE': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded text-[10px] font-bold">Disponible</span>;
            case 'QUARANTINE': return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold">Quarantaine</span>;
            case 'USED': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-[10px] font-bold">Utilisée</span>;
            case 'EXPIRED': return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-[10px] font-bold">Expirée</span>;
            default: return null;
        }
    };

    if (!isOpen || !refrigerator) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* EN-TÊTE */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <ThermometerSnowflake className="text-blue-500" size={24} />
                            {refrigerator.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Activity size={12} className={refrigerator.status === 'ACTIVE' ? "text-emerald-500" : "text-amber-500"} />
                                Statut: {refrigerator.status === 'ACTIVE' ? 'Actif' : 'Maintenance'}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded flex items-center gap-1">
                                Cible: {refrigerator.target_temperature}°C
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50 dark:bg-gray-900">
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <RefreshCw size={32} className="animate-spin mb-4 text-blue-500" />
                            <p>Analyse du contenu du réfrigérateur...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                            <AlertTriangle size={20} /> {error}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* --- STATISTIQUES GLOBAL --- */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 mb-2">
                                        <Package size={18} /> <span className="text-xs font-bold uppercase">Total Poches</span>
                                    </div>
                                    <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.total}</span>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
                                        <CheckCircle size={18} /> <span className="text-xs font-bold uppercase">Disponibles</span>
                                    </div>
                                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.available}</span>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl shadow-sm border border-amber-100 dark:border-amber-800/30">
                                    <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-2">
                                        <Clock size={18} /> <span className="text-xs font-bold uppercase">Quarantaine</span>
                                    </div>
                                    <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.quarantine}</span>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-800/30">
                                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-2">
                                        <AlertTriangle size={18} /> <span className="text-xs font-bold uppercase">Expirées</span>
                                    </div>
                                    <span className="text-2xl font-black text-red-700 dark:text-red-300">{stats.expired}</span>
                                </div>
                            </div>

                            {/* --- RÉPARTITION PAR GROUPE SANGUIN --- */}
                            {stats.total > 0 && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                                        <Droplet size={14} className="text-red-500" /> Stock par Groupe Sanguin
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {Object.entries(stats.byType).map(([type, count]) => (
                                            <div key={type} className="flex items-center bg-red-50 dark:bg-gray-900 border border-red-100 dark:border-red-900/50 rounded-lg overflow-hidden">
                                                <span className="bg-red-500 text-white font-black text-sm px-3 py-1.5">{type}</span>
                                                <span className="px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-gray-300">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- LISTE DÉTAILLÉE DES POCHES --- */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    <Info size={16} className="text-blue-500" />
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Détail des poches ({stats.total})</h3>
                                </div>
                                <div className="overflow-x-auto max-h-64 custom-scrollbar">
                                    <table className="w-full text-left text-sm border-collapse">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="p-3 font-bold text-gray-500 dark:text-gray-400 text-xs">Code/ID</th>
                                                <th className="p-3 font-bold text-gray-500 dark:text-gray-400 text-xs">Groupe</th>
                                                <th className="p-3 font-bold text-gray-500 dark:text-gray-400 text-xs">Composant</th>
                                                <th className="p-3 font-bold text-gray-500 dark:text-gray-400 text-xs">Expiration</th>
                                                <th className="p-3 font-bold text-gray-500 dark:text-gray-400 text-xs">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {bags.length === 0 ? (
                                                <tr><td colSpan={5} className="p-6 text-center text-gray-400">Ce réfrigérateur est vide.</td></tr>
                                            ) : (
                                                bags.map(bag => {
                                                    const isExpired = new Date(bag.expiry_date) < new Date();
                                                    return (
                                                        <tr key={bag.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
                                                            <td className="p-3 font-mono text-xs">{bag.barcode || `ID-${bag.id}`}</td>
                                                            <td className="p-3 font-black text-red-600 dark:text-red-400">{bag.blood_type}</td>
                                                            <td className="p-3 text-xs text-gray-600 dark:text-gray-300">
                                                                {bag.type === 'WHOLE_BLOOD' ? 'Sang Total' : bag.type === 'RED_CELLS' ? 'Glob. Rouges' : 'Plasma'}
                                                                <span className="text-gray-400 ml-1">({bag.volume_ml}ml)</span>
                                                            </td>
                                                            <td className={`p-3 text-xs ${isExpired ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                                {new Date(bag.expiry_date).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-3">
                                                                {getStatusBadge(bag.status, isExpired)}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BloodRefrigeratorDetailsModal;