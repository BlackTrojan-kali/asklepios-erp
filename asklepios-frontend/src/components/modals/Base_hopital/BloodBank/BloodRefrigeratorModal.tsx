import React, { useState, useEffect } from 'react';
import { X, ThermometerSnowflake, Activity, Building, Type, RefreshCw } from 'lucide-react';
import useBloodRefrigeratorStore from '../../../../functions/bloodBank/useBloodRefrigeratorStore';
import type { BloodRefrigeratorDto, BloodRefrigeratorPayload } from '../../../../types/BloodManageType';

// Si vous avez un type Center global, vous pouvez l'importer. 
// Sinon, on utilise une interface locale pour les besoins de la modale.
interface CenterOption {
    id: number;
    name: string;
}

interface BloodRefrigeratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    refrigeratorToEdit?: BloodRefrigeratorDto | null;
    centers: CenterOption[]; // Nécessaire pour lier le frigo à un centre
}

const BloodRefrigeratorModal: React.FC<BloodRefrigeratorModalProps> = ({ 
    isOpen, 
    onClose, 
    refrigeratorToEdit,
    centers 
}) => {
    // Store pour les actions (Créer / Modifier)
    const { createBloodRefrigerator, updateBloodRefrigerator, actionLoading } = useBloodRefrigeratorStore();

    // État du formulaire
    const [formData, setFormData] = useState<BloodRefrigeratorPayload>({
        center_id: 0,
        name: '',
        target_temperature: 4.0, // 4°C est standard pour le sang
        status: 'ACTIVE'
    });

    // Remplir le formulaire si on est en mode "Modification"
    useEffect(() => {
        if (refrigeratorToEdit) {
            setFormData({
                center_id: refrigeratorToEdit.center_id,
                name: refrigeratorToEdit.name,
                target_temperature: refrigeratorToEdit.target_temperature,
                status: refrigeratorToEdit.status,
            });
        } else {
            // Réinitialiser si on est en mode "Création"
            setFormData({
                center_id: centers.length > 0 ? centers[0].id : 0,
                name: '',
                target_temperature: 4.0,
                status: 'ACTIVE'
            });
        }
    }, [refrigeratorToEdit, isOpen, centers]);

    // Gestion de la soumission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Formatage sécurisé avant l'envoi
        const payload: BloodRefrigeratorPayload = {
            ...formData,
            center_id: Number(formData.center_id),
            target_temperature: Number(formData.target_temperature)
        };

        let success = false;

        if (refrigeratorToEdit) {
            success = await updateBloodRefrigerator(refrigeratorToEdit.id, payload);
        } else {
            success = await createBloodRefrigerator(payload);
        }

        // Si l'action a réussi (gérée par le store), on ferme la modale
        if (success) {
            onClose();
        }
    };

    // Si la modale est fermée, ne rien rendre dans le DOM
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ThermometerSnowflake className="text-blue-500" size={20} />
                        {refrigeratorToEdit ? "Modifier le Réfrigérateur" : "Nouveau Réfrigérateur"}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY (Formulaire) */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                        
                        {/* Champ : Centre */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Building size={16} className="text-gray-400" /> Centre Médical <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.center_id}
                                onChange={(e) => setFormData({ ...formData, center_id: Number(e.target.value) })}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white transition-all"
                            >
                                <option value={0} disabled>Sélectionner un centre...</option>
                                {centers.map((center) => (
                                    <option key={center.id} value={center.id}>
                                        {center.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Champ : Nom */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Type size={16} className="text-gray-400" /> Nom du Réfrigérateur <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Frigo Principal - Urgences"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white transition-all"
                            />
                        </div>

                        {/* Champ : Température */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ThermometerSnowflake size={16} className="text-gray-400" /> Température Cible (°C) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                step="0.1"
                                placeholder="Ex: 4.0"
                                value={formData.target_temperature}
                                onChange={(e) => setFormData({ ...formData, target_temperature: Number(e.target.value) })}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white transition-all"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                La température standard de conservation du sang est généralement de 4°C.
                            </p>
                        </div>

                        {/* Champ : Statut */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Activity size={16} className="text-gray-400" /> Statut de l'équipement <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white transition-all"
                            >
                                <option value="ACTIVE">Actif (Prêt à l'emploi)</option>
                                <option value="MAINTENANCE">En Maintenance</option>
                                <option value="OUT_OF_SERVICE">Hors Service / En panne</option>
                            </select>
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading && <RefreshCw size={16} className="animate-spin" />}
                            {refrigeratorToEdit ? "Enregistrer" : "Créer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BloodRefrigeratorModal;