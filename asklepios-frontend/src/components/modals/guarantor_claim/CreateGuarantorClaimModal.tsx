import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Search, ShieldCheck, Calendar, FileText, 
    CheckSquare, Square, Loader2, ArrowRightCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select'; // Import de react-select
import api from '../../../api/api'; 
import useGuarantorClaimStore from '../../../functions/base_hospital/useGuarantorClaimStore';
import useInsuranceStore from '../../../functions/insurance/useInsuranceStore'; 

interface CreateGuarantorClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UnclaimedSplit {
    id: number;
    amount_to_pay: number;
    invoice: {
        id: number;
        created_at: string;
        patient: {
            first_name: string;
            last_name: string;
            patient_code: string;
        }
    }
}

export const CreateGuarantorClaimModal: React.FC<CreateGuarantorClaimModalProps> = ({ isOpen, onClose }) => {
    // --- STORES ---
    const { createClaim, actionLoading } = useGuarantorClaimStore();
    const { getInsurances, insurances, loading: insurancesLoading } = useInsuranceStore();

    // --- ÉTATS DU FORMULAIRE ---
    const [insuranceId, setInsuranceId] = useState<number | ''>('');
    const [claimMonth, setClaimMonth] = useState<string>('');
    
    // --- ÉTATS DES RÉSULTATS ---
    const [unclaimedSplits, setUnclaimedSplits] = useState<UnclaimedSplit[]>([]);
    const [selectedSplitIds, setSelectedSplitIds] = useState<number[]>([]);
    const [loadingSplits, setLoadingSplits] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Initialisation
    useEffect(() => {
        if (isOpen) {
            getInsurances(1, {}, 100); 
            
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            setClaimMonth(lastMonth.toISOString().slice(0, 7));
        }
    }, [isOpen, getInsurances]);

    // Reset à la fermeture
    useEffect(() => {
        if (!isOpen) {
            setInsuranceId('');
            setUnclaimedSplits([]);
            setSelectedSplitIds([]);
            setHasSearched(false);
        }
    }, [isOpen]);

    // Formatage des options pour react-select
    const insuranceOptions = useMemo(() => {
        return insurances.map(ins => ({
            value: ins.id,
            label: ins.name
        }));
    }, [insurances]);

    // Gestion du changement de react-select
    const handleInsuranceChange = (selectedOption: any) => {
        setInsuranceId(selectedOption ? selectedOption.value : '');
        setHasSearched(false);
    };

    // --- RECHERCHE DES FACTURES IMPAYÉES ---
    const fetchUnclaimedSplits = async () => {
        if (!insuranceId || !claimMonth) {
            return toast.error("Veuillez sélectionner une assurance et un mois.");
        }

        try {
            setLoadingSplits(true);
            setHasSearched(true);
            
            const res = await api.get(`/shared/invoice-splits/unclaimed`, {
                params: { 
                    insurance_company_id: insuranceId,
                    claim_month: claimMonth
                }
            });

            setUnclaimedSplits(res.data || []);
            setSelectedSplitIds((res.data || []).map((s: UnclaimedSplit) => s.id));

        } catch (error) {
            toast.error("Impossible de récupérer les factures impayées.");
            setUnclaimedSplits([]);
            setSelectedSplitIds([]);
        } finally {
            setLoadingSplits(false);
        }
    };

    // --- GESTION DES SÉLECTIONS ---
    const toggleSelectAll = () => {
        if (selectedSplitIds.length === unclaimedSplits.length) {
            setSelectedSplitIds([]);
        } else {
            setSelectedSplitIds(unclaimedSplits.map(s => s.id));
        }
    };

    const toggleSplit = (id: number) => {
        setSelectedSplitIds(prev => 
            prev.includes(id) ? prev.filter(splitId => splitId !== id) : [...prev, id]
        );
    };

    const totalSelectedAmount = useMemo(() => {
        return unclaimedSplits
            .filter(s => selectedSplitIds.includes(s.id))
            .reduce((sum, split) => sum + split.amount_to_pay, 0);
    }, [unclaimedSplits, selectedSplitIds]);

    // --- SOUMISSION ---
    const handleSubmit = async () => {
        if (!insuranceId || !claimMonth) return toast.error("Informations incomplètes.");
        if (selectedSplitIds.length === 0) return toast.error("Vous devez sélectionner au moins une facture.");

        const formattedDate = `${claimMonth}-01`; 

        const claim = await createClaim({
            insurance_company_id: Number(insuranceId),
            claim_month: formattedDate,
            split_ids: selectedSplitIds
        });

        if (claim) {
            onClose();
        }
    };

    // 🟢 Styles personnalisés pour React-Select (Dark Mode compatible)
    const selectStyles = {
        control: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#f9fafb', // bg-gray-900 / bg-gray-50
            borderColor: document.documentElement.classList.contains('dark') ? '#4b5563' : '#d1d5db', // border-gray-600 / border-gray-300
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
            padding: '2px',
            borderRadius: '0.5rem',
            boxShadow: 'none',
            '&:hover': { borderColor: '#6366f1' } // hover:border-indigo-500
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : 'white', // bg-gray-800
            zIndex: 9999
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isFocused 
                ? (document.documentElement.classList.contains('dark') ? '#374151' : '#f1f5f9') // hover bg
                : 'transparent',
            color: document.documentElement.classList.contains('dark') ? 'white' : 'black',
            cursor: 'pointer'
        }),
        singleValue: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? 'white' : '#374151',
        }),
        input: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? 'white' : '#374151',
        }),
        placeholder: (base: any) => ({
            ...base,
            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
        })
    };

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount).replace('XAF', 'FCFA');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-[#003366] text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <FileText size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Générer un Bordereau de Transmission</h2>
                            <p className="text-xs text-blue-200">Regrouper les parts assurances impayées pour réclamation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- CORPS --- */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-gray-900/50 custom-scrollbar space-y-6">
                    
                    {/* ZONE 1 : FILTRES */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                        
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-500"/>
                                Sélectionner l'Assurance
                            </label>
                            
                            {/* 🟢 React-Select corrigé avec selectStyles */}
                            <Select
                                options={insuranceOptions}
                                value={insuranceOptions.find(opt => opt.value === insuranceId) || null}
                                onChange={handleInsuranceChange}
                                placeholder="-- Choisir une assurance --"
                                isClearable
                                isDisabled={insurancesLoading}
                                noOptionsMessage={() => "Aucune assurance trouvée"}
                                styles={selectStyles}
                            />
                        </div>

                        <div className="w-full md:w-1/3">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Calendar size={16} className="text-indigo-500"/>
                                Mois de réclamation
                            </label>
                            {/* 🟢 Ajout de color-scheme pour forcer le calendrier en mode sombre */}
                            <input 
                                type="month" 
                                value={claimMonth}
                                onChange={(e) => {
                                    setClaimMonth(e.target.value);
                                    setHasSearched(false);
                                }}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 text-slate-800 dark:text-white transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>

                        <button 
                            onClick={fetchUnclaimedSplits}
                            disabled={!insuranceId || !claimMonth || loadingSplits}
                            className="w-full md:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {loadingSplits ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                            Rechercher les impayés
                        </button>
                    </div>

                    {/* ZONE 2 : RÉSULTATS (TABLEAU DES FACTURES) */}
                    {hasSearched && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">Factures à inclure dans le bordereau</h3>
                                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                    {selectedSplitIds.length} sélectionnée(s)
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="p-3 w-12 text-center">
                                                <button onClick={toggleSelectAll} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                                    {selectedSplitIds.length === unclaimedSplits.length && unclaimedSplits.length > 0 
                                                        ? <CheckSquare size={20} className="text-indigo-600 dark:text-indigo-400" /> 
                                                        : <Square size={20} />
                                                    }
                                                </button>
                                            </th>
                                            <th className="p-3 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-xs">Date</th>
                                            <th className="p-3 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-xs">N° Facture</th>
                                            <th className="p-3 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-xs">Patient</th>
                                            <th className="p-3 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-xs text-right">Montant Assurance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {unclaimedSplits.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    Aucune facture impayée trouvée pour cette assurance à cette période.
                                                </td>
                                            </tr>
                                        ) : (
                                            unclaimedSplits.map((split) => {
                                                const isSelected = selectedSplitIds.includes(split.id);
                                                return (
                                                    <tr 
                                                        key={split.id} 
                                                        onClick={() => toggleSplit(split.id)}
                                                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-gray-700/50'}`}
                                                    >
                                                        <td className="p-3 text-center">
                                                            {isSelected 
                                                                ? <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400 mx-auto" /> 
                                                                : <Square size={18} className="text-gray-400 dark:text-gray-500 mx-auto" />
                                                            }
                                                        </td>
                                                        <td className="p-3 text-gray-600 dark:text-gray-300">
                                                            {new Date(split.invoice.created_at).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-gray-200">
                                                            INV-{String(split.invoice.id).padStart(5, '0')}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-bold text-slate-800 dark:text-gray-200">
                                                                {split.invoice.patient.first_name} {split.invoice.patient.last_name}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                                                {split.invoice.patient.patient_code}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right font-mono font-bold text-[#003366] dark:text-indigo-300">
                                                            {formatCurrency(split.amount_to_pay)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Résumé des montants */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                                <span className="font-bold text-gray-600 dark:text-gray-300">TOTAL BORDEREAU (Estimation) :</span>
                                <span className="font-bold text-xl font-mono text-[#00a896] dark:text-teal-400">
                                    {formatCurrency(totalSelectedAmount)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FOOTER ACTION --- */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-900 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={actionLoading || selectedSplitIds.length === 0}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                    >
                        {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRightCircle size={18} />}
                        Générer le Bordereau
                    </button>
                </div>
            </div>
        </div>
    );
};