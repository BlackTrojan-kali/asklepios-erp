import React, { useState, useEffect } from 'react';
import { X, Droplet, Building, Coins, RefreshCw } from 'lucide-react';
import useBagPricingStore from '../../../../functions/bloodBank/useBagPricingStore';
import type { BagPricingDto, BagPricingPayload } from '../../../../types/BloodManageType';

interface CenterOption {
    id: number;
    name: string;
}

interface BagPricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    centers: CenterOption[];
    pricingToEdit?: BagPricingDto | null;
}

const BagPricingModal: React.FC<BagPricingModalProps> = ({ 
    isOpen, onClose, onSuccess, centers, pricingToEdit 
}) => {
    const { savePricing, actionLoading } = useBagPricingStore();

    const [formData, setFormData] = useState<BagPricingPayload>({
        center_id: centers.length > 0 ? centers[0].id : 0,
        blood_type: 'O+',
        price: 0,
    });

    useEffect(() => {
        if (isOpen) {
            if (pricingToEdit) {
                setFormData({
                    center_id: pricingToEdit.center_id,
                    blood_type: pricingToEdit.blood_type,
                    price: pricingToEdit.price,
                });
            } else {
                setFormData({
                    center_id: centers.length > 0 ? centers[0].id : 0,
                    blood_type: 'O+',
                    price: 0,
                });
            }
        }
    }, [isOpen, pricingToEdit, centers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const success = await savePricing({
            center_id: Number(formData.center_id),
            blood_type: formData.blood_type,
            price: Number(formData.price),
        });

        if (success) {
            onSuccess();
        }
    };

    if (!isOpen) return null;

    const isEditing = !!pricingToEdit;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Coins className="text-amber-500" size={20} />
                        {isEditing ? "Modifier le Tarif" : "Configurer un Tarif"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-6 space-y-5">
                        
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Building size={16} /> Centre Médical <span className="text-red-500">*</span></label>
                            <select 
                                required 
                                disabled={isEditing} // On empêche la modif du centre en mode édition
                                value={formData.center_id} 
                                onChange={(e) => setFormData({ ...formData, center_id: Number(e.target.value) })} 
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <option value={0} disabled>Sélectionner un centre...</option>
                                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Droplet size={16} /> Groupe Sanguin <span className="text-red-500">*</span></label>
                            <select 
                                required 
                                disabled={isEditing} // On empêche la modif du groupe en mode édition
                                value={formData.blood_type} 
                                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })} 
                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-red-600 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                            </select>
                            {isEditing && <p className="text-[10px] text-amber-600 font-medium mt-1">Le centre et le groupe sanguin ne sont pas modifiables en édition.</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Coins size={16} /> Prix unitaire de la poche <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    required 
                                    min="0"
                                    step="100"
                                    value={formData.price} 
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} 
                                    className="w-full p-2.5 pr-16 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                                <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center bg-amber-50 dark:bg-amber-900/30 border-l border-amber-200 dark:border-amber-700 rounded-r-lg text-amber-700 dark:text-amber-400 font-bold text-sm">
                                    FCFA
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Annuler</button>
                        <button type="submit" disabled={actionLoading} className="px-6 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                            {actionLoading ? <RefreshCw size={16} className="animate-spin" /> : <Coins size={16} />}
                            {isEditing ? "Mettre à jour le prix" : "Enregistrer le tarif"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BagPricingModal;