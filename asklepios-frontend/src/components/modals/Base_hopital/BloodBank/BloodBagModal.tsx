import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Droplet, Calendar, Activity, Building, ThermometerSnowflake, 
    Barcode, Beaker, Truck, User, RefreshCw, Search, History, 
    ChevronDown, ChevronUp
} from 'lucide-react';
import useBloodBagStore from '../../../../functions/bloodBank/useBloodBagStore';
import type { BloodBagDto, BloodBagPayload } from '../../../../types/BloodManageType';

interface CenterOption { id: number; name: string; }
interface RefrigeratorOption { id: number; name: string; center_id: number; }
// 👉 1. On met à jour l'interface pour inclure l'historique (blood_bags) venant du backend
interface DonorOption { 
    id: number; 
    first_name: string; 
    last_name: string | null; 
    blood_type: string; 
    blood_bags?: BloodBagDto[]; // Laravel renvoie souvent en snake_case
    bloodBags?: BloodBagDto[];  // Au cas où votre formateur JSON utilise du camelCase
}

interface BloodBagModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    bagToEdit?: BloodBagDto | null;
    centers: CenterOption[];
    refrigerators: RefrigeratorOption[];
    donors: DonorOption[]; 
}

const BloodBagModal: React.FC<BloodBagModalProps> = ({ 
    isOpen, onClose, onSuccess, bagToEdit, centers, refrigerators, donors 
}) => {
    const { createBloodBag, updateBloodBag, actionLoading } = useBloodBagStore();

    // ==============================================================
    // ÉTATS DE NAVIGATION ET SÉLECTION
    // ==============================================================
    const [searchDonor, setSearchDonor] = useState('');
    const [selectedDonorId, setSelectedDonorId] = useState<number | null>(null);
    const [isExternal, setIsExternal] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);

    // ==============================================================
    // ÉTAT DU FORMULAIRE
    // ==============================================================
    const [formData, setFormData] = useState<BloodBagPayload>({
        center_id: centers.length > 0 ? centers[0].id : 0,
        blood_refrigerator_id: 0,
        blood_donor_id: null,
        blood_type: 'O+',
        volume_ml: 450,
        collection_date: '',
        expiry_date: '',
        external_supplier: '',
        type: 'WHOLE_BLOOD',
        barcode: '',
        status: 'QUARANTINE'
    });

    useEffect(() => {
        if (!isOpen) return;

        if (bagToEdit) {
            if (bagToEdit.blood_donor_id) {
                setSelectedDonorId(bagToEdit.blood_donor_id);
                setIsExternal(false);
            } else {
                setSelectedDonorId(null);
                setIsExternal(true);
            }
            setFormData({
                center_id: bagToEdit.center_id,
                blood_refrigerator_id: bagToEdit.blood_refrigerator_id,
                blood_donor_id: bagToEdit.blood_donor_id,
                blood_type: bagToEdit.blood_type,
                volume_ml: bagToEdit.volume_ml,
                collection_date: bagToEdit.collection_date,
                expiry_date: bagToEdit.expiry_date,
                external_supplier: bagToEdit.external_supplier || '',
                type: bagToEdit.type,
                barcode: bagToEdit.barcode || '',
                status: bagToEdit.status,
            });
        } else {
            setSelectedDonorId(null);
            setIsExternal(false);
            setSearchDonor('');
            setShowHistory(false);
            setFormData(prev => ({
                ...prev,
                blood_refrigerator_id: 0,
                blood_donor_id: null,
                blood_type: 'O+',
                volume_ml: 450,
                collection_date: new Date().toISOString().split('T')[0],
                expiry_date: '',
                external_supplier: '',
                barcode: '',
                status: 'QUARANTINE'
            }));
        }
    }, [bagToEdit, isOpen]);

    // ==============================================================
    // FILTRES ET DÉRIVATIONS
    // ==============================================================
    const filteredDonors = useMemo(() => {
        if (!searchDonor) return donors;
        const lowerSearch = searchDonor.toLowerCase();
        return donors.filter(d => 
            d.first_name.toLowerCase().includes(lowerSearch) || 
            (d.last_name && d.last_name.toLowerCase().includes(lowerSearch)) ||
            d.blood_type.toLowerCase().includes(lowerSearch)
        );
    }, [donors, searchDonor]);

    const activeDonor = useMemo(() => {
        return donors.find(d => d.id === selectedDonorId);
    }, [selectedDonorId, donors]);

    // 👉 2. L'historique est calculé INSTANTANÉMENT depuis les données du donneur
    const donorHistory = useMemo(() => {
        if (!activeDonor) return [];
        // On vérifie les deux formats de clés possibles renvoyés par Laravel
        return activeDonor.blood_bags || activeDonor.bloodBags || [];
    }, [activeDonor]);

    const filteredRefrigerators = useMemo(() => {
        return refrigerators.filter(r => r.center_id === formData.center_id);
    }, [refrigerators, formData.center_id]);

    // ==============================================================
    // HANDLERS
    // ==============================================================
    const handleSelectDonor = (donor: DonorOption) => {
        setSelectedDonorId(donor.id);
        setIsExternal(false);
        setShowHistory(false);
        
        // On met simplement à jour le formulaire
        setFormData(prev => ({
            ...prev,
            blood_donor_id: donor.id,
            blood_type: donor.blood_type,
            external_supplier: ''
        }));
    };

    const handleSelectExternal = () => {
        setSelectedDonorId(null);
        setIsExternal(true);
        setShowHistory(false);
        setFormData(prev => ({
            ...prev,
            blood_donor_id: null,
            external_supplier: ''
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDonorId && !isExternal) {
            alert("Veuillez sélectionner un donneur ou un fournisseur externe.");
            return;
        }

        const payload: BloodBagPayload = {
            ...formData,
            center_id: Number(formData.center_id),
            blood_refrigerator_id: Number(formData.blood_refrigerator_id),
            volume_ml: Number(formData.volume_ml),
            blood_donor_id: selectedDonorId,
            external_supplier: isExternal ? formData.external_supplier : null,
            barcode: formData.barcode || null,
        };

        let success = false;
        if (bagToEdit) {
            success = await updateBloodBag(bagToEdit.id, payload);
        } else {
            success = await createBloodBag(payload);
        }

        if (success) onSuccess();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col h-[90vh]">
                
                {/* EN-TÊTE GLOBAL */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 shrink-0">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Droplet className="text-red-500" size={20} />
                        {bagToEdit ? "Modifier la Poche de Sang" : "Enregistrer une Poche"}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    
                    {/* ========================================================= */}
                    {/* COMPARTIMENT GAUCHE : SÉLECTION DE LA SOURCE */}
                    {/* ========================================================= */}
                    <div className="w-full md:w-1/3 border-r border-gray-100 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 shrink-0">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Source de la poche</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un donneur..." 
                                    value={searchDonor}
                                    onChange={(e) => setSearchDonor(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Liste des donneurs */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredDonors.map(donor => (
                                <button
                                    key={donor.id}
                                    type="button"
                                    onClick={() => handleSelectDonor(donor)}
                                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                                        selectedDonorId === donor.id 
                                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                    }`}
                                >
                                    <div>
                                        <div className={`text-sm font-bold ${selectedDonorId === donor.id ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-gray-200'}`}>
                                            {donor.first_name} {donor.last_name || ''}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <Droplet size={10} className="text-red-400"/> Groupe {donor.blood_type}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Option Fournisseur Externe */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                            <button
                                type="button"
                                onClick={handleSelectExternal}
                                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                                    isExternal 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <Truck size={18} className={isExternal ? "text-blue-600 dark:text-blue-400" : "text-gray-400"} />
                                <div>
                                    <div className={`text-sm font-bold ${isExternal ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-gray-200'}`}>
                                        Fournisseur Externe
                                    </div>
                                    <div className="text-[10px] text-gray-500">Croix-Rouge, autre hôpital...</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* COMPARTIMENT DROIT : FORMULAIRE & HISTORIQUE */}
                    {/* ========================================================= */}
                    <div className="w-full md:w-2/3 flex flex-col bg-gray-50 dark:bg-gray-900">
                        
                        {!selectedDonorId && !isExternal ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                                <Activity size={48} className="mb-4 opacity-20" />
                                <p className="text-lg font-bold text-gray-500 dark:text-gray-300">Aucune source sélectionnée</p>
                                <p className="text-sm mt-2">Veuillez sélectionner un donneur dans la liste de gauche ou choisir un fournisseur externe.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                        Informations de la Poche
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Building size={16} /> Centre <span className="text-red-500">*</span></label>
                                            <select required value={formData.center_id} onChange={(e) => setFormData({ ...formData, center_id: Number(e.target.value), blood_refrigerator_id: 0 })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white">
                                                <option value={0} disabled>Sélectionner...</option>
                                                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><ThermometerSnowflake size={16} /> Réfrigérateur <span className="text-red-500">*</span></label>
                                            <select required value={formData.blood_refrigerator_id} onChange={(e) => setFormData({ ...formData, blood_refrigerator_id: Number(e.target.value) })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white disabled:opacity-50">
                                                <option value={0} disabled>Sélectionner un frigo...</option>
                                                {filteredRefrigerators.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Droplet size={16} /> Groupe Sanguin <span className="text-red-500">*</span></label>
                                            <select required disabled={!!selectedDonorId} value={formData.blood_type} onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-red-600 disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-gray-900 outline-none">
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Beaker size={16} /> Composant & Vol. <span className="text-red-500">*</span></label>
                                            <div className="flex gap-2">
                                                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'WHOLE_BLOOD'|'RED_CELLS'|'PLASMA' })} className="flex-1 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white">
                                                    <option value="WHOLE_BLOOD">Sang Total</option>
                                                    <option value="RED_CELLS">Glob. Rouges</option>
                                                    <option value="PLASMA">Plasma</option>
                                                </select>
                                                <input type="number" required min="1" value={formData.volume_ml} onChange={(e) => setFormData({ ...formData, volume_ml: Number(e.target.value) })} className="w-24 p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white text-center" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar size={16} /> Date de Prélèvement <span className="text-red-500">*</span></label>
                                            <input type="date" required value={formData.collection_date} onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Calendar size={16} /> Date d'Expiration <span className="text-red-500">*</span></label>
                                            <input type="date" required value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Barcode size={16} /> Code-barre <span className="text-gray-400 font-normal">(Optionnel)</span></label>
                                            <input type="text" placeholder="Ex: B1234..." value={formData.barcode || ''} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono outline-none text-slate-700 dark:text-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Activity size={16} /> Statut initial <span className="text-red-500">*</span></label>
                                            <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'QUARANTINE'|'AVAILABLE'|'USED'|'EXPIRED' })} className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white">
                                                <option value="QUARANTINE">Quarantaine</option>
                                                <option value="AVAILABLE">Disponible</option>
                                                <option value="USED">Utilisée</option>
                                                <option value="EXPIRED">Expirée</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* 👉 3. ACCORDÉON HISTORIQUE (EN BAS) */}
                                    {selectedDonorId && activeDonor && (
                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={() => setShowHistory(!showHistory)}
                                                className="flex items-center justify-between w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    <History size={16} className="text-gray-500" />
                                                    Voir l'historique des poches du donneur ({donorHistory.length})
                                                </div>
                                                {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {showHistory && (
                                                <div className="mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                                                    {donorHistory.length === 0 ? (
                                                        <p className="text-sm text-gray-400 italic text-center py-2">
                                                            Aucun don précédent trouvé pour ce patient.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {donorHistory.map(hist => (
                                                                <div key={hist.id} className="flex justify-between items-center p-2 rounded border border-gray-100 dark:border-gray-700 text-sm">
                                                                    <span className="font-mono text-xs font-bold">{hist.barcode || `ID-${hist.id}`}</span>
                                                                    <span className="text-gray-500">{new Date(hist.collection_date).toLocaleDateString()}</span>
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                                        hist.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 
                                                                        hist.status === 'USED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                                                                    }`}>
                                                                        {hist.status}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                                    <button type="button" onClick={onClose} disabled={actionLoading} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Annuler</button>
                                    <button type="submit" disabled={actionLoading} className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
                                        {actionLoading && <RefreshCw size={16} className="animate-spin" />}
                                        {bagToEdit ? "Enregistrer les modifications" : "Ajouter la poche au stock"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BloodBagModal;