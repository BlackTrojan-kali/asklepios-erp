import React, { useState, useEffect } from 'react';
import { 
    X, 
    Stethoscope, 
    Save, 
    Loader2, 
    Settings,
    Calendar,
    PenTool
} from 'lucide-react';

// --- STORES & TYPES ---
import useEquipmentStore from '../../../../functions/base_hospital/useEquipmentStore';
import type { EquipmentDto, EquipmentPayload } from '../../../../types/EquipmentTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    departmentId: number; // L'ID du département (récupéré depuis la page parent)
    equipmentToEdit?: EquipmentDto | null; // Null = Création, Objet = Modification
    facilityRooms?: { id: number; name: string }[]; // Optionnel : Liste des salles pour l'assignation physique
}

const defaultFormState: EquipmentPayload = {
    name: '',
    manufacturer: '',
    model_number: '',
    serial_number: '',
    status: 'ACTIVE',
    facility_room_id: '',
    last_maintenance_date: '',
    next_maintenance_date: '',
    purchase_date: '',
    warranty_expiry_date: '',
    notes: ''
};

export const EquipmentModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    departmentId, 
    equipmentToEdit,
    facilityRooms = []
}) => {
    const { createEquipment, updateEquipment, actionLoading } = useEquipmentStore();
    const [formData, setFormData] = useState<EquipmentPayload>(defaultFormState);

    // --- INITIALISATION DU FORMULAIRE ---
    useEffect(() => {
        if (isOpen) {
            if (equipmentToEdit) {
                // Mode Édition : On pré-remplit les champs
                setFormData({
                    name: equipmentToEdit.name || '',
                    manufacturer: equipmentToEdit.manufacturer || '',
                    model_number: equipmentToEdit.model_number || '',
                    serial_number: equipmentToEdit.serial_number || '',
                    status: equipmentToEdit.status || 'ACTIVE',
                    facility_room_id: equipmentToEdit.facility_room_id || '',
                    last_maintenance_date: equipmentToEdit.last_maintenance_date || '',
                    next_maintenance_date: equipmentToEdit.next_maintenance_date || '',
                    purchase_date: equipmentToEdit.purchase_date || '',
                    warranty_expiry_date: equipmentToEdit.warranty_expiry_date || '',
                    notes: equipmentToEdit.notes || ''
                });
            } else {
                // Mode Création : On remet à zéro
                setFormData(defaultFormState);
            }
        }
    }, [isOpen, equipmentToEdit]);

    // --- GESTION DES CHANGEMENTS ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- SOUMISSION ---
    const handleSubmit = async () => {
        if (!departmentId || !formData.name || !formData.status) return;

        // Nettoyage des chaînes vides pour ne pas envoyer d'erreurs SQL
        const payload: EquipmentPayload = {
            ...formData,
            facility_room_id: formData.facility_room_id ? Number(formData.facility_room_id) : null,
            last_maintenance_date: formData.last_maintenance_date || null,
            next_maintenance_date: formData.next_maintenance_date || null,
            purchase_date: formData.purchase_date || null,
            warranty_expiry_date: formData.warranty_expiry_date || null,
        };

        let success = false;

        if (equipmentToEdit) {
            success = await updateEquipment(departmentId, equipmentToEdit.id, payload);
        } else {
            success = await createEquipment(departmentId, payload);
        }

        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!equipmentToEdit;

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl border border-transparent dark:border-gray-800 my-auto">
                
                {/* --- HEADER --- */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {isEditMode ? 'Modifier l\'équipement' : 'Ajouter un équipement'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode ? `Mise à jour de la fiche #${equipmentToEdit.id}` : 'Renseignez les informations du nouvel appareil.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* --- BODY (FORMULAIRE) --- */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
                    
                    {/* Section 1 : Informations Générales */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <Settings size={16} className="text-blue-500" /> Informations générales
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Nom de l'appareil <span className="text-red-500">*</span></label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Échographe Portable CX50" className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Fabricant</label>
                                <input type="text" name="manufacturer" value={formData.manufacturer || ''} onChange={handleChange} placeholder="Ex: Philips" className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Modèle</label>
                                <input type="text" name="model_number" value={formData.model_number || ''} onChange={handleChange} placeholder="Ex: V-2000" className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Numéro de série</label>
                                <input type="text" name="serial_number" value={formData.serial_number || ''} onChange={handleChange} placeholder="S/N" className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white font-mono text-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Statut Actuel <span className="text-red-500">*</span></label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white font-semibold">
                                    <option value="ACTIVE">Actif (Prêt à l'emploi)</option>
                                    <option value="IN_USE">En cours d'utilisation</option>
                                    <option value="IN_MAINTENANCE">En maintenance</option>
                                    <option value="OUT_OF_SERVICE">Hors service (Panne)</option>
                                    <option value="RETIRED">Réformé / Retiré</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Localisation (Salle)</label>
                                <select name="facility_room_id" value={formData.facility_room_id || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white">
                                    <option value="">-- Non assigné (Département général) --</option>
                                    {facilityRooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Section 2 : Maintenance & Logistique */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                            <PenTool size={16} className="text-amber-500" /> Suivi & Maintenance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Dernière maintenance</label>
                                <input type="date" name="last_maintenance_date" value={formData.last_maintenance_date || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Prochaine maintenance</label>
                                <input type="date" name="next_maintenance_date" value={formData.next_maintenance_date || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-amber-500 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Date d'achat</label>
                                <input type="date" name="purchase_date" value={formData.purchase_date || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Fin de garantie</label>
                                <input type="date" name="warranty_expiry_date" value={formData.warranty_expiry_date || ''} onChange={handleChange} className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Section 3 : Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Notes et remarques</label>
                        <textarea 
                            name="notes" 
                            rows={3} 
                            value={formData.notes || ''} 
                            onChange={handleChange} 
                            placeholder="Informations supplémentaires, accessoires inclus, etc." 
                            className="w-full p-2.5 bg-slate-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 text-slate-800 dark:text-white resize-none" 
                        />
                    </div>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 shrink-0 bg-slate-50 dark:bg-gray-800/50 rounded-b-2xl">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !formData.name || !formData.status}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Enregistrement...</>
                        ) : (
                            <><Save size={18} /> {isEditMode ? 'Enregistrer les modifications' : 'Ajouter l\'équipement'}</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};