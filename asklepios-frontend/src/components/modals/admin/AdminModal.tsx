import React, { useEffect, useState, useMemo } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import Select from 'react-select';
import FormInput from '../../ui/form/FormInput';
import FormButton from '../../ui/form/FormButton';
import toast from 'react-hot-toast';

// --- Types ---
import type { AdminDto, AdminPayload } from '../../../types/types';

// --- Stores & Hooks ---
import useAdminStore from '../../../functions/admin/useAdminStore';
import useHospitalStore from '../../../functions/hospital/useHospitalStore';
import useCenterStore from '../../../functions/center/useCenterStore'; 
import usePharmacyStore from '../../../functions/pharmacy/usePharmacyStore'; // 👈 Ajuste le chemin
import { useLaboratories } from '../../../hooks/laboratory/useLaboratory'; // 👈 Ajuste le chemin selon l'emplacement de tes hooks React Query

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminToEdit?: AdminDto | null;
    AutoRefreshPage: () => void; 
}

const AdminModal = ({ isOpen, onClose, adminToEdit, AutoRefreshPage }: AdminModalProps) => {
    // --- STORES PRINCIPAUX ---
    const { createAdmin, updateAdmin } = useAdminStore();
    const { hospitals, getHospitals } = useHospitalStore();
    
    // --- STORES DES SITES (Centres, Pharmacies, Labos) ---
    const { centers, getCenters } = useCenterStore();
    const { pharmacyBranches, getPharmacyBranches } = usePharmacyStore();

    // --- États des informations de base ---
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [hospitalId, setHospitalId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);

    // Récupération dynamique des labos via React Query (Se déclenche / Se met à jour selon hospitalId)
    const { data: laboratories = [] } = useLaboratories(hospitalId ? { hospital_id: hospitalId } : undefined);

    // --- États des restrictions Multi-Sites ---
    const [selectedLicences, setSelectedLicences] = useState<any[]>([]);
    const [selectedCenters, setSelectedCenters] = useState<any[]>([]);
    const [selectedPharmacies, setSelectedPharmacies] = useState<any[]>([]);
    const [selectedLabs, setSelectedLabs] = useState<any[]>([]);

    // Options fixes pour les licences
    const licenceOptions = [
        { value: 'base_hospital', label: 'Base Hôpital' },
        { value: 'pharmacy', label: 'Pharmacie' },
        { value: 'laboratory', label: 'Laboratoire' },
    ];

    // Initialisation lors de l'ouverture
    useEffect(() => {
        if (isOpen) {
            // Chargement des données de référence (On charge un max pour avoir toutes les options)
            getHospitals(1, '', 100);
            getCenters(1, {}, 100); 
            getPharmacyBranches(1, {});

            if (adminToEdit) {
                setFirstName(adminToEdit.first_name);
                setLastName(adminToEdit.last_name || '');
                setPhone(adminToEdit.phone.toString());
                setEmail(adminToEdit.email);
                setHospitalId(adminToEdit.profile_admin?.hospital_id || '');
                setPassword(''); 

                // Chargement des restrictions existantes
                const profile = adminToEdit.profile_admin;
                setSelectedLicences(
                    profile?.accessible_licences?.map(l => licenceOptions.find(o => o.value === l) || { value: l, label: l }) || []
                );
                
                // Pré-remplissage avec les bons labels s'ils existent dans nos stores, sinon on met "ID"
                setSelectedCenters(
                    profile?.center_ids?.map(id => {
                        const c = centers.find(center => center.id === id);
                        return { value: id, label: c ? c.name : `Centre #${id}` };
                    }) || []
                );
                setSelectedPharmacies(
                    profile?.pharmacy_branch_ids?.map(id => {
                        const p = pharmacyBranches.find(pharm => pharm.id === id);
                        return { value: id, label: p ? p.name : `Pharmacie #${id}` };
                    }) || []
                );
                setSelectedLabs(
                    profile?.laboratory_ids?.map(id => {
                        const l = laboratories.find(lab => lab.id === id);
                        return { value: id, label: l ? l.name : `Laboratoire #${id}` };
                    }) || []
                );
            } else {
                // Mode Création : On vide tout
                setFirstName('');
                setLastName('');
                setPhone('');
                setEmail('');
                setPassword('');
                setHospitalId('');
                setSelectedLicences([]);
                setSelectedCenters([]);
                setSelectedPharmacies([]);
                setSelectedLabs([]);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, adminToEdit]);

    // --- FILTRAGE DYNAMIQUE DES OPTIONS SELON L'HÔPITAL ---
    const centerOptions = useMemo(() => {
        return centers
            .filter(c => !hospitalId || c.hospital_id === Number(hospitalId))
            .map(c => ({ value: c.id, label: c.name }));
    }, [centers, hospitalId]);

    const pharmacyOptions = useMemo(() => {
        return pharmacyBranches
            .filter(p => !hospitalId || p.hospital_id === Number(hospitalId))
            .map(p => ({ value: p.id, label: p.name }));
    }, [pharmacyBranches, hospitalId]);

    const labOptions = useMemo(() => {
        return laboratories
            .filter(l => !hospitalId || l.hospital_id === Number(hospitalId))
            .map(l => ({ value: l.id, label: l.name }));
    }, [laboratories, hospitalId]);

    // --- GESTION DU CHANGEMENT D'HÔPITAL ---
    const handleHospitalChange = (option: any) => {
        const newHospitalId = option ? option.value : '';
        if (newHospitalId !== hospitalId) {
            setHospitalId(newHospitalId);
            // 🔒 Sécurité : Si on change d'hôpital, on vide les sites précédemment sélectionnés
            // pour ne pas affecter par erreur la pharmacie de l'hôpital A à l'hôpital B.
            setSelectedCenters([]);
            setSelectedPharmacies([]);
            setSelectedLabs([]);
        }
    };

    // --- SOUMISSION ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!firstName || !phone || !email || !hospitalId) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        const isEditMode = !!adminToEdit;

        if (!isEditMode && password.length < 8) {
            toast.error("Le mot de passe doit contenir au moins 8 caractères");
            return;
        }

        setLoading(true);
        let success = false;

        // Préparation du Payload (Les tableaux vides deviennent null pour garantir l'accès global)
        const payload: Partial<AdminPayload> = { 
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            hospital_id: Number(hospitalId),
            accessible_licences: selectedLicences.length > 0 ? selectedLicences.map(o => o.value) : null,
            center_ids: selectedCenters.length > 0 ? selectedCenters.map(o => o.value) : null,
            pharmacy_branch_ids: selectedPharmacies.length > 0 ? selectedPharmacies.map(o => o.value) : null,
            laboratory_ids: selectedLabs.length > 0 ? selectedLabs.map(o => o.value) : null,
        };

        if (isEditMode && adminToEdit.id) {
            const res = await updateAdmin(adminToEdit.id, payload as AdminPayload);
            if (res) success = true;
        } else {
            payload.password = password;
            const res = await createAdmin(payload as AdminPayload);
            if (res) success = true;
        }

        setLoading(false);
        if (success) {
            AutoRefreshPage();
            onClose();
        }
    };

    if (!isOpen) return null;

    const isEditMode = !!adminToEdit;
    
    const hospitalOptions = hospitals.map(hospital => ({
        value: hospital.id,
        label: `${hospital.name} ${hospital.niu ? `(${hospital.niu})` : ''}`
    }));
    const selectedHospital = hospitalOptions.find(option => option.value === hospitalId) || null;

    // --- STYLES REACT-SELECT ---
    const customSelectStyles = {
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            borderColor: state.isFocused ? '#00a896' : '#e5e7eb',
            borderWidth: '2px',
            borderRadius: '0.375rem',
            boxShadow: 'none',
            minHeight: '44px',
            '&:hover': { borderColor: state.isFocused ? '#00a896' : '#d1d5db' },
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
        }),
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#00a896' : state.isFocused ? '#f0fdfa' : '#ffffff',
            color: state.isSelected ? '#ffffff' : '#0f172a',
            cursor: 'pointer',
            '&:active': { backgroundColor: '#00a896', color: '#ffffff' }
        }),
        multiValue: (base: any) => ({
            ...base,
            backgroundColor: '#ccfbf1', 
            borderRadius: '4px',
        }),
        multiValueLabel: (base: any) => ({
            ...base,
            color: '#0f766e', 
            fontWeight: 'bold',
        }),
        multiValueRemove: (base: any) => ({
            ...base,
            color: '#0f766e',
            '&:hover': { backgroundColor: '#99f6e4', color: '#115e59' },
        }),
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transform transition-all my-8">
                
                {/* En-tête */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 sticky top-0 z-10">
                    <h3 className="text-lg font-bold text-[#003366] dark:text-white">
                        {isEditMode ? "Modifier l'administrateur" : "Nouvel administrateur"}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Prénom *" type="text" value={firstName} setValue={setFirstName} placeholder="Ex: Jean" error={null} />
                        <FormInput label="Nom" type="text" value={lastName} setValue={setLastName} placeholder="Ex: Dupont" error={null} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Email *" type="email" value={email} setValue={setEmail} placeholder="jean@hopital.com" error={null} />
                        <FormInput label="Téléphone *" type="number" value={phone} setValue={setPhone} placeholder="600000000" error={null} />
                    </div>

                    <div className="p-2 text-start bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <label className="pl-1 text-sm font-bold text-[#003366] dark:text-gray-300 mb-2 block">
                            Hôpital d'affectation *
                        </label>
                        <Select
                            options={hospitalOptions}
                            value={selectedHospital}
                            onChange={handleHospitalChange}
                            placeholder="-- Sélectionner un hôpital --"
                            isClearable isSearchable styles={customSelectStyles} menuPortalTarget={document.body}
                        />
                    </div>

                    {/* --- ZONE DE RESTRICTION MULTI-SITES --- */}
                    <div className={`p-4 rounded-xl border transition-all ${hospitalId ? 'bg-white dark:bg-slate-800/30 border-amber-200 dark:border-amber-800/50' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert size={18} className="text-amber-500" />
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Restrictions & Droits d'Accès</h4>
                        </div>
                        
                        {!hospitalId ? (
                            <p className="text-xs text-amber-600 dark:text-amber-500 ml-6 italic">
                                Veuillez sélectionner un hôpital pour configurer les restrictions de sites.
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 ml-6">
                                Laissez un champ <strong>vide</strong> pour accorder un accès total (Superviseur Global) sur ce module.
                            </p>
                        )}

                        <div className="space-y-4 ml-6">
                            <div>
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Modules / Licences autorisés</label>
                                <Select isMulti options={licenceOptions} value={selectedLicences} onChange={(opts) => setSelectedLicences(opts as any)} placeholder="Tous les modules (Accès total)..." styles={customSelectStyles} menuPortalTarget={document.body} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Centres Médicaux</label>
                                    <Select isMulti options={centerOptions} value={selectedCenters} onChange={(opts) => setSelectedCenters(opts as any)} placeholder="Tous les centres..." styles={customSelectStyles} menuPortalTarget={document.body} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Succursales Pharmacies</label>
                                    <Select isMulti options={pharmacyOptions} value={selectedPharmacies} onChange={(opts) => setSelectedPharmacies(opts as any)} placeholder="Toutes les succursales..." styles={customSelectStyles} menuPortalTarget={document.body} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Laboratoires</label>
                                    <Select isMulti options={labOptions} value={selectedLabs} onChange={(opts) => setSelectedLabs(opts as any)} placeholder="Tous les laboratoires..." styles={customSelectStyles} menuPortalTarget={document.body} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Champ Mot de passe */}
                    {!isEditMode && (
                        <div className="pt-2">
                            <FormInput label="Mot de passe provisoire *" type="password" value={password} setValue={setPassword} placeholder="Minimum 8 caractères" error={null} />
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-gray-100 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
                        <FormButton label="Annuler" type="button" onClick={onClose} classname="bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200" />
                        <FormButton label={isEditMode ? "Mettre à jour" : "Créer l'administrateur"} type="submit" loading={loading} classname="bg-[#00a896] hover:bg-[#008f7e] text-white min-w-[150px]" />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminModal;