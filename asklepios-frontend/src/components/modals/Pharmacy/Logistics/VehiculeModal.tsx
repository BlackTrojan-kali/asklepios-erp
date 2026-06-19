import React, { useState, useEffect } from 'react';
import { X, CarFront, Hash, CheckCircle2, Circle } from 'lucide-react';
import useVehiculeStore from '../../../../functions/pharmacy/useVehiculeStore';
import type { VehiculeDto } from '../../../../types/vehiculeTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    existingVehicule: VehiculeDto | null;
    onSuccess: () => void;
}

export const VehiculeModal: React.FC<Props> = ({ 
    isOpen, onClose, existingVehicule, onSuccess 
}) => {
    const { createVehicule, updateVehicule, actionLoading } = useVehiculeStore();

    // --- ÉTATS DU FORMULAIRE ---
    const [licencePlate, setLicencePlate] = useState('');
    const [model, setModel] = useState('');
    const [isActive, setIsActive] = useState(true);

    // --- PRÉ-REMPLISSAGE (MODE MODIFICATION) ---
    useEffect(() => {
        if (isOpen) {
            if (existingVehicule) {
                setLicencePlate(existingVehicule.licence_plate);
                setModel(existingVehicule.model);
                setIsActive(existingVehicule.is_active);
            } else {
                // Mode création : on réinitialise les champs
                setLicencePlate('');
                setModel('');
                setIsActive(true);
            }
        }
    }, [isOpen, existingVehicule]);

    // --- SOUMISSION DU FORMULAIRE ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            licence_plate: licencePlate,
            model: model,
            is_active: isActive
        };

        let success = false;
        
        if (existingVehicule) {
            success = await updateVehicule(existingVehicule.id, payload);
        } else {
            success = await createVehicule(payload);
        }

        if (success) {
            onSuccess();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md flex flex-col shadow-2xl border border-transparent dark:border-gray-800 animate-in fade-in zoom-in-95 duration-150">
                
                {/* EN-TÊTE DE LA MODALE */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50 rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                            <CarFront size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                {existingVehicule ? 'Modifier le Véhicule' : 'Ajouter un Véhicule'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {existingVehicule ? 'Mettez à jour les informations du parc.' : 'Enregistrez un nouveau véhicule dans le parc.'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* CORPS DU FORMULAIRE */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                    
                    {/* Champ : Plaque d'immatriculation */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Plaque d'immatriculation <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={licencePlate}
                                // Forcer la majuscule pour l'esthétique des plaques
                                onChange={(e) => setLicencePlate(e.target.value.toUpperCase())} 
                                placeholder="Ex: CE 1234 AB"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white font-mono font-bold uppercase transition-colors"
                            />
                        </div>
                    </div>

                    {/* Champ : Modèle / Marque */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Modèle / Marque <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <CarFront className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                required
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="Ex: Toyota Hilux"
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Séparateur visuel */}
                    <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>

                    {/* Bouton Toggle : Statut Actif/Inactif */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Statut du véhicule
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isActive 
                                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-slate-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {isActive ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                <div className="text-left">
                                    <p className="text-sm font-bold">{isActive ? 'En Service' : 'Hors Service'}</p>
                                    <p className="text-xs opacity-80">{isActive ? 'Le véhicule est opérationnel.' : 'Le véhicule est en panne ou au garage.'}</p>
                                </div>
                            </div>
                            
                            {/* Petit toggle visuel style iOS */}
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'left-5' : 'left-1'}`}></div>
                            </div>
                        </button>
                    </div>

                </form>

                {/* PIED DE MODALE (Boutons d'action) */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900/80 rounded-b-2xl shrink-0 flex justify-end items-center gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit"
                        onClick={handleSubmit}
                        disabled={actionLoading || !licencePlate.trim() || !model.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md disabled:opacity-50"
                    >
                        {actionLoading ? 'Enregistrement...' : existingVehicule ? 'Mettre à jour' : 'Ajouter le véhicule'}
                    </button>
                </div>
                
            </div>
        </div>
    );
};