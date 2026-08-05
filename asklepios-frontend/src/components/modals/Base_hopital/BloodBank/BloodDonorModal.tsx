import React, { useState, useEffect } from 'react';
import { X, User, Droplet, Calendar, Phone, Activity, Building, RefreshCw } from 'lucide-react';
import useBloodDonorStore from '../../../../functions/bloodBank/useBloodDonorStore';
import type { BloodDonorDto, BloodDonorPayload } from '../../../../types/BloodManageType';

interface CenterOption {
    id: number;
    name: string;
}

interface BloodDonorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // 👉 LOGIQUE D'AUTOREFRESH / FERMETURE
    donorToEdit?: BloodDonorDto | null;
    centers: CenterOption[];
}

const BloodDonorModal: React.FC<BloodDonorModalProps> = ({ 
    isOpen, 
    onClose, 
    onSuccess,
    donorToEdit,
    centers 
}) => {
    const { createBloodDonor, updateBloodDonor, actionLoading } = useBloodDonorStore();

    const [formData, setFormData] = useState<BloodDonorPayload>({
        center_id: 0,
        first_name: '',
        last_name: '',
        gender: 'M',
        birth_date: '',
        blood_type: 'O+',
        phone_contact: '',
        last_donation_date: '',
        serology_status: 'PENDING'
    });

    useEffect(() => {
        if (donorToEdit) {
            setFormData({
                center_id: donorToEdit.center_id,
                first_name: donorToEdit.first_name,
                last_name: donorToEdit.last_name || '',
                gender: donorToEdit.gender,
                birth_date: donorToEdit.birth_date,
                blood_type: donorToEdit.blood_type,
                phone_contact: donorToEdit.phone_contact,
                last_donation_date: donorToEdit.last_donation_date || '',
                serology_status: donorToEdit.serology_status,
            });
        } else {
            setFormData({
                center_id: centers.length > 0 ? centers[0].id : 0,
                first_name: '',
                last_name: '',
                gender: 'M',
                birth_date: '',
                blood_type: 'O+',
                phone_contact: '',
                last_donation_date: '',
                serology_status: 'PENDING'
            });
        }
    }, [donorToEdit, isOpen, centers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Nettoyage des chaînes vides pour les dates optionnelles
        const payload: BloodDonorPayload = {
            ...formData,
            center_id: Number(formData.center_id),
            last_donation_date: formData.last_donation_date || null,
        };

        let success = false;
        if (donorToEdit) {
            success = await updateBloodDonor(donorToEdit.id, payload);
        } else {
            success = await createBloodDonor(payload);
        }

        if (success) {
            onSuccess(); // Déclenche la fermeture + le rafraîchissement côté parent
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Droplet className="text-red-500" size={20} />
                        {donorToEdit ? "Modifier le Donneur" : "Nouveau Donneur"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Building size={16} /> Centre Médical <span className="text-red-500">*</span></label>
                            <select required value={formData.center_id} onChange={(e) => setFormData({ ...formData, center_id: Number(e.target.value) })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white">
                                <option value={0} disabled>Sélectionner un centre...</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><User size={16} /> Prénom <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nom</label>
                            <input type="text" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Sexe <span className="text-red-500">*</span></label>
                            <select required value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M'|'F' })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white">
                                <option value="M">Masculin</option>
                                <option value="F">Féminin</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar size={16} /> Date de naissance <span className="text-red-500">*</span></label>
                            <input type="date" required value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Droplet size={16} /> Groupe Sanguin <span className="text-red-500">*</span></label>
                            <select required value={formData.blood_type} onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white font-bold text-red-600">
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Phone size={16} /> Téléphone <span className="text-red-500">*</span></label>
                            <input type="text" required placeholder="+237 6XX XX XX XX" value={formData.phone_contact} onChange={(e) => setFormData({ ...formData, phone_contact: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar size={16} /> Dernier don</label>
                            <input type="date" value={formData.last_donation_date || ''} onChange={(e) => setFormData({ ...formData, last_donation_date: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Activity size={16} /> Sérologie <span className="text-red-500">*</span></label>
                            <select required value={formData.serology_status} onChange={(e) => setFormData({ ...formData, serology_status: e.target.value as 'PENDING'|'CLEARED'|'REJECTED' })} className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white">
                                <option value="PENDING">En attente (Test requis)</option>
                                <option value="CLEARED">Conforme (Apte au don)</option>
                                <option value="REJECTED">Rejeté (Non conforme)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Annuler</button>
                        <button type="submit" disabled={actionLoading} className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                            {actionLoading && <RefreshCw size={16} className="animate-spin" />}
                            {donorToEdit ? "Enregistrer" : "Créer le donneur"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BloodDonorModal;