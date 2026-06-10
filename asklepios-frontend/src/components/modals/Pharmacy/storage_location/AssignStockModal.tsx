import React, { useState } from 'react';
import Select from 'react-select';
import useStorageLocationStore from '../../../../functions/pharmacy/useStorageLocationStore';
import type { StorageLocationDto } from '../../../../types/PharmMagTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    stockId: number | null;
    articleName: string; // Pour afficher le nom de l'article à ranger dans le titre
    currentLocationId?: number | null; // L'emplacement actuel du stock (s'il en a déjà un)
    locations: StorageLocationDto[];
    onSuccess?: () => void; // Un callback pour rafraîchir la liste des stocks côté parent
}

export const AssignStockModal: React.FC<Props> = ({ 
    isOpen, onClose, stockId, articleName, currentLocationId, locations, onSuccess 
}) => {
    const { assignStockToLocation, actionLoading } = useStorageLocationStore();
    
    // On initialise le state avec l'emplacement actuel (ou null)
    const [selectedLocation, setSelectedLocation] = useState<number | null>(currentLocationId || null);

    // Formatage des emplacements pour react-select
    const locationOptions = locations.map(loc => {
        // On construit un label lisible : "Allée A - Étagère 3 (Code: A3)"
        const parts = [];
        if (loc.aisle) parts.push(loc.aisle);
        if (loc.shelf) parts.push(loc.shelf);
        if (loc.code) parts.push(`[${loc.code}]`);
        
        return { 
            value: loc.id, 
            label: parts.join(' - ') || `Emplacement #${loc.id}` 
        };
    });

    const handleSubmit = async () => {
        if (!stockId) return;

        const success = await assignStockToLocation({
            stock_id: stockId,
            storage_location_id: selectedLocation
        });

        if (success) {
            if (onSuccess) onSuccess();
            onClose();
        }
    };

    const selectStyles = {
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 })
    };

    if (!isOpen || !stockId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">
                    Ranger un article
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Article sélectionné : <span className="font-semibold text-slate-700 dark:text-gray-300">{articleName}</span>
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                            Choisir l'emplacement cible
                        </label>
                        <Select 
                            options={locationOptions}
                            value={locationOptions.find(opt => opt.value === selectedLocation) || null}
                            onChange={(selected) => setSelectedLocation(selected ? selected.value : null)}
                            placeholder="Rechercher une allée, une étagère..."
                            isClearable
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="react-select-container text-sm"
                            classNamePrefix="react-select"
                            noOptionsMessage={() => "Aucun emplacement trouvé"}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Laissez vide (ou effacez) pour retirer l'article de son emplacement actuel.
                        </p>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-[#00a896] text-white rounded-md hover:bg-[#008f7e] disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Affectation..." : "Valider le rangement"}
                    </button>
                </div>
            </div>
        </div>
    );
};