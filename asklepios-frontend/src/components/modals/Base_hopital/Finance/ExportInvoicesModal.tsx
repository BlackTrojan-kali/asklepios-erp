import React, { useState, useEffect } from 'react';
import { X, FileDown, Calendar, User, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';

// --- STORES & CONTEXT ---
import useInvoiceStore from '../../../../functions/base_hospital/useInvoiceStore';
import usePatientStore from '../../../../functions/base_hospital/usePatientStore';
import useCenterStore from '../../../../functions/center/useCenterStore';
import { useAuth } from '../../../../contexts/AuthContext'; 

interface ExportInvoicesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SelectOption {
    value: string;
    label: string;
}

export const ExportInvoicesModal: React.FC<ExportInvoicesModalProps> = ({ isOpen, onClose }) => {
    const { profile } = useAuth();
    const { downloadInvoicesReportPdf, actionLoading } = useInvoiceStore();
    
    // Stores pour alimenter les listes déroulantes
    const { patients, getPatients } = usePatientStore();
    const { centers, getCenters } = useCenterStore();

    // --- ÉTATS DU FORMULAIRE ---
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedPatient, setSelectedPatient] = useState<SelectOption | null>(null);
    const [selectedCenter, setSelectedCenter] = useState<SelectOption | null>(null);

    // Initialisation & Chargement des données à l'ouverture de la modale
    useEffect(() => {
        if (isOpen) {
            // On charge une grande liste de patients pour le sélecteur
            getPatients(1, {}, 200); 
            
            // On charge les centres uniquement si l'utilisateur est admin
            if (profile?.role === 'admin' || profile?.role === 'super_admin') {
                getCenters(1, {}, 50);
            }

            // Réinitialiser les champs
            setStartDate('');
            setEndDate('');
            setSelectedPatient(null);
            setSelectedCenter(null);
        }
    }, [isOpen, getPatients, getCenters, profile]);

    if (!isOpen) return null;

    // Préparation des options pour React-Select
    const patientOptions: SelectOption[] = patients.map(p => ({
        value: p.id.toString(),
        label: `${p.first_name} ${p.last_name || ''} (${p.patient_code})`
    }));

    const centerOptions: SelectOption[] = centers.map(c => ({
        value: c.id.toString(),
        label: c.name
    }));

    // Soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation basique des dates
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return toast.error("La date de début ne peut pas être supérieure à la date de fin.");
        }

        const filters = {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            patient_id: selectedPatient?.value,
            center_id: selectedCenter?.value
        };

        const success = await downloadInvoicesReportPdf(filters);
        
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* --- HEADER --- */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-[#003366] text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FileDown size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Exporter le Rapport</h2>
                            <p className="text-xs text-blue-200">Générez un PDF des factures et créances</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- CORPS DU FORMULAIRE --- */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Filtre : Période (Dates) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date de début</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#00a896] outline-none text-sm dark:text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Date de fin</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#00a896] outline-none text-sm dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtre : Patient */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                            <User size={16} className="text-[#00a896]"/>
                            Patient spécifique (Optionnel)
                        </label>
                        <Select
                            options={patientOptions}
                            value={selectedPatient}
                            onChange={(option) => setSelectedPatient(option)}
                            isClearable 
                            placeholder="Rechercher un patient..."
                            noOptionsMessage={() => "Aucun patient trouvé"}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '44px',
                                    borderRadius: '0.75rem',
                                    borderColor: '#d1d5db',
                                    boxShadow: 'none',
                                    '&:hover': { borderColor: '#00a896' }
                                }),
                                menu: (base) => ({ ...base, zIndex: 100 })
                            }}
                        />
                    </div>

                    {/* Filtre : Centre (Uniquement si l'utilisateur est Admin) */}
                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                <Building2 size={16} className="text-[#003366] dark:text-blue-400"/>
                                Restreindre à un centre (Optionnel)
                            </label>
                            <Select
                                options={centerOptions}
                                value={selectedCenter}
                                onChange={(option) => setSelectedCenter(option)}
                                isClearable 
                                placeholder="Tous les centres de l'hôpital..."
                                noOptionsMessage={() => "Aucun centre trouvé"}
                                className="react-select-container text-sm"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: '44px',
                                        borderRadius: '0.75rem',
                                        borderColor: '#d1d5db',
                                        boxShadow: 'none',
                                        '&:hover': { borderColor: '#003366' }
                                    }),
                                    menu: (base) => ({ ...base, zIndex: 100 })
                                }}
                            />
                            <p className="text-[11px] text-gray-500 mt-1">Laissez vide pour avoir un rapport global de tous les centres.</p>
                        </div>
                    )}

                    {/* --- ACTIONS --- */}
                    <div className="flex justify-end gap-3 pt-5 border-t border-gray-100 dark:border-gray-800 mt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            disabled={actionLoading}
                            className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md"
                        >
                            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                            {actionLoading ? "Génération en cours..." : "Télécharger le PDF"}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};