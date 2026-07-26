import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { LogIn, X, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import useAppointmentStore from '../../../../functions/base_hospital/useAppointmentStore';
import useFacilityRoomStore from '../../../../functions/base_hospital/useFacilityRoomStore';
import type { AppointmentDto } from '../../../../types/AppointmentTypes';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    appointment: AppointmentDto | null;
    currentDepartmentId: number; // L'ID du département du médecin
    AutoRefreshPage: () => void;
}

export const AdmitToConsultationModal: React.FC<Props> = ({ isOpen, onClose, appointment, currentDepartmentId,AutoRefreshPage }) => {
    const { admitToConsultation, actionLoading } = useAppointmentStore();
    const { sharedFacilityRooms, getSharedFacilityRooms, loading: roomsLoading } = useFacilityRoomStore();
    
    const [roomId, setRoomId] = useState<number | ''>('');

    useEffect(() => {
        if (isOpen && currentDepartmentId) {
            // On récupère uniquement les bureaux de consultation
            getSharedFacilityRooms(currentDepartmentId, { type: 'CONSULTATION' });
        }
    }, [isOpen, currentDepartmentId, getSharedFacilityRooms]);

    const handleSubmit = async () => {
        // VÉRIFICATION CRUCIALE ICI : On s'assure que la visite existe bien
        if (!appointment || !roomId) return;
        
        // Si l'appointment n'a pas de visite liée (ce qui ne devrait pas arriver à ce stade)
        // on bloque avec une erreur claire au lieu de faire planter le backend.
        if (!appointment.visit || !appointment.visit.id) {
            toast.error("Impossible de trouver le dossier de visite pour ce patient.");
            return;
        }

        // CORRECTION MAJEURE : On passe l'ID de la VISITE (appointment.visit.id) et non l'ID du RDV !
        const success = await admitToConsultation(appointment.visit.id, {
            consulting_room_id: Number(roomId)
        });

        if (success) {
            setRoomId('');
            AutoRefreshPage();
            onClose();
        }
    };

    if (!isOpen || !appointment) return null;

    const roomOptions = sharedFacilityRooms.map(room => ({ value: room.id, label: room.name }));

    // --- STYLES FORCÉS (BLANC & NOIR) POUR REACT-SELECT ---
    // Adapté avec la couleur principale "emerald" (#10b981 / #059669) de cette modale
    const selectStyles = { 
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        control: (base: any, state: any) => ({
            ...base,
            backgroundColor: '#ffffff', // Fond toujours blanc
            borderColor: state.isFocused ? '#10b981' : '#d1d5db', // Bordure émeraude au focus
            boxShadow: state.isFocused ? '0 0 0 1px #10b981' : 'none',
            borderRadius: '0.5rem',
            minHeight: '42px',
        }),
        menu: (base: any) => ({
            ...base,
            backgroundColor: '#ffffff', // Fond du menu déroulant toujours blanc
            borderRadius: '0.5rem',
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected 
                ? '#d1fae5' // Fond vert émeraude clair si sélectionné
                : state.isFocused 
                    ? '#f3f4f6' // Fond gris clair au survol
                    : '#ffffff', // Fond blanc par défaut
            color: state.isSelected ? '#059669' : '#000000', // Texte émeraude foncé ou noir
            cursor: 'pointer',
        }),
        singleValue: (base: any) => ({ ...base, color: '#000000' }), // Texte de l'option choisie en noir
        input: (base: any) => ({ ...base, color: '#000000' }), // Texte tapé au clavier en noir
        placeholder: (base: any) => ({ ...base, color: '#6b7280' }), // Placeholder en gris moyen
        indicatorSeparator: (base: any) => ({ ...base, backgroundColor: '#e5e7eb' }),
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-transparent dark:border-gray-800">
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Démarrer la consultation</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {appointment.patient?.first_name} {appointment.patient?.last_name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm mb-5 border border-emerald-100 dark:border-emerald-800">
                    Motif renseigné à l'accueil : <strong>{appointment.reason || 'Aucun motif spécifié'}</strong>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
                            Bureau de consultation <span className="text-red-500">*</span>
                        </label>
                        <Select
                            options={roomOptions}
                            isLoading={roomsLoading}
                            onChange={(opt) => setRoomId(opt ? opt.value : '')}
                            placeholder="Choisir votre bureau..."
                            menuPortalTarget={document.body}
                            styles={selectStyles}
                            className="text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Le statut du patient passera à "En consultation".</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading || !roomId}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? "En cours..." : "Faire entrer le patient"}
                        {!actionLoading && <LogIn size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};