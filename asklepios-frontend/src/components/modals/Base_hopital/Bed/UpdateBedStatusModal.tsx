import React from 'react';
import { X, CheckCircle, Info } from 'lucide-react';
import useBedStore from '../../../../functions/base_hospital/useBedStore';
import type { BedDto } from '../../../../types/AdmissionTypes';

interface UpdateBedStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    bed: BedDto | null;
    roomId: number;
}

export const UpdateBedStatusModal: React.FC<UpdateBedStatusModalProps> = ({
    isOpen,
    onClose,
    bed,
    roomId
}) => {
    const { updateBed, actionLoading } = useBedStore();

    if (!isOpen || !bed) return null;

    const handleSubmit = async () => {
        // On envoie le payload complet attendu par updateBed
        const success = await updateBed(bed.id, {
            facility_room_id: roomId,
            bed_number: bed.bed_number,
            state: 'AVAILABLE'
        });

        if (success) {
            onClose();
            // L'actualisation de la liste des lits est gérée automatiquement par updateBed() dans le store !
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col border border-gray-100 dark:border-gray-800">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-500">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-brand">Rendre disponible</h2>
                            <p className="text-sm text-gray-500 font-medium">Lit {bed.bed_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-400 flex gap-3 items-start">
                        <Info size={18} className="shrink-0 mt-0.5" />
                        <p>
                            Ce lit est actuellement en statut <strong>{bed.state === 'CLEANING' ? 'NETTOYAGE' : 'MAINTENANCE'}</strong>.
                            <br/><br/>
                            Confirmez-vous que l'entretien est terminé et qu'il est prêt à recevoir un nouveau patient ?
                        </p>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {actionLoading ? "Mise à jour..." : "Oui, marquer Libre"}
                    </button>
                </div>
            </div>
        </div>
    );
};