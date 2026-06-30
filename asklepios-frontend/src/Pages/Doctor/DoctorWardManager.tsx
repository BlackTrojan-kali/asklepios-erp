import React, { useEffect, useState } from 'react';
import { 
    Folder, BedDouble, Building2, ChevronRight, 
    ArrowLeft, Search, Loader2, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import useFacilityRoomStore from '../../functions/base_hospital/useFacilityRoomStore';
import type { FacilityRoomDto } from '../../types/FacilityRoomTypes';
import type { BedDto } from '../../types/AdmissionTypes';

// --- IMPORT DE L'EXPLORATEUR DE LITS ---
import { BedExplorer } from './BedExplorer'; 

// --- IMPORT DES MODALES ---
import { DischargePatientModal } from '../../components/modals/Base_hopital/Admission/DischargePatientModal';
import { ConsultationModal } from '../../components/modals/Base_hopital/Consultation/ConsultationModal';
import { AdmitToBedModal } from '../../components/modals/Base_hopital/Admission/AdmitToBedModal';
import { MedicalBackgroundModal } from '../../components/modals/Base_hopital/Consultation/MedicalBackgroundModal';
import { UpdateBedStatusModal } from '../../components/modals/Base_hopital/Bed/UpdateBedStatusModal'; // <-- NOUVEL IMPORT

const DoctorWardManager = () => {
    const { profile } = useAuth();
    const departmentId = profile?.profile_doctor?.department_id || 1;
    const departmentName = profile?.profile_doctor?.department?.name || "Hospitalisation";

    // --- STORES ---
    const { facilityRooms, getFacilityRooms, loading } = useFacilityRoomStore();

    // --- ÉTATS DE NAVIGATION ---
    const [selectedRoom, setSelectedRoom] = useState<FacilityRoomDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- ÉTATS DES ACTIONS (MODALES) ---
    const [bedToAdmit, setBedToAdmit] = useState<BedDto | null>(null);
    const [admissionToDischarge, setAdmissionToDischarge] = useState<any | null>(null);
    const [admissionToConsult, setAdmissionToConsult] = useState<any | null>(null);
    const [patientToView, setPatientToView] = useState<any | null>(null);
    const [bedToUpdateStatus, setBedToUpdateStatus] = useState<BedDto | null>(null); // <-- NOUVEL ÉTAT

    // --- CHARGEMENT ---
    useEffect(() => {
        if (departmentId && !selectedRoom) {
            getFacilityRooms(departmentId, 1, { search: searchTerm, type: 'WARD' }, 50);
        }
    }, [departmentId, selectedRoom, searchTerm, getFacilityRooms]);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 relative">
            
            {/* --- BREADCRUMB & HEADER --- */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 font-mono">
                    <Building2 size={18} className="text-[#003366] dark:text-blue-400" />
                    <span>{departmentName}</span>
                    
                    {selectedRoom && (
                        <>
                            <ChevronRight size={16} className="text-gray-400" />
                            <Folder size={16} className="text-orange-400" />
                            <span className="text-slate-900 dark:text-white font-bold">{selectedRoom.name}</span>
                        </>
                    )}
                </div>

                {!selectedRoom ? (
                    <div className="relative w-full sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Chercher une chambre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-[#00a896] dark:text-white transition-colors"
                        />
                    </div>
                ) : (
                    <button 
                        onClick={() => setSelectedRoom(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold transition-colors"
                    >
                        <ArrowLeft size={16} /> Retour aux chambres
                    </button>
                )}
            </div>

            {/* --- CONTENEUR PRINCIPAL --- */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col relative">
                
                {!selectedRoom ? (
                    // VUE 1 : EXPLORATEUR DE CHAMBRES
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Loader2 size={40} className="animate-spin text-[#00a896] mb-4" />
                                <p className="text-sm font-mono tracking-widest uppercase">Chargement des chambres...</p>
                            </div>
                        ) : facilityRooms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <AlertCircle size={48} className="mb-3 opacity-50" />
                                <p className="text-lg font-bold font-brand text-slate-600 dark:text-gray-300">Aucune chambre d'hospitalisation trouvée</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {facilityRooms.map((room) => (
                                    <div 
                                        key={room.id} 
                                        onClick={() => setSelectedRoom(room)}
                                        className="group flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="relative mb-3">
                                            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-orange-300 dark:text-orange-400 group-hover:text-orange-400 dark:group-hover:text-orange-300 transition-colors">
                                                <path d="M4 20C3.45 20 3.04167 19.8042 2.70833 19.4125C2.375 19.0208 2.20833 18.55 2.20833 18V6C2.20833 5.45 2.375 4.97917 2.70833 4.5875C3.04167 4.19583 3.45 4 4 4H10L12 6H20C20.55 6 20.9583 6.19583 21.2917 6.5875C21.625 6.97917 21.7917 7.45 21.7917 8V18C21.7917 18.55 21.625 19.0208 21.2917 19.4125C20.9583 19.8042 20.55 20 20 20H4Z" fill="currentColor"/>
                                            </svg>
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
                                                <BedDouble size={14} className="text-[#003366] dark:text-blue-400" />
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-gray-200 text-center font-brand truncate w-full px-2">
                                            {room.name}
                                        </h3>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-1 uppercase tracking-wider">
                                            {room.category?.name || "Chambre"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // VUE 2 : LITS DE LA CHAMBRE
                    <div className="flex-1 flex flex-col overflow-hidden">
                         <BedExplorer 
                             room={selectedRoom} 
                             onAdmitPatient={(bed) => setBedToAdmit(bed)}
                             onDischargePatient={(admission) => setAdmissionToDischarge(admission)}
                             onStartConsultation={(admission) => setAdmissionToConsult(admission)}
                             onViewPatient={(patient) => setPatientToView(patient)}
                             onUpdateBedStatus={(bed) => setBedToUpdateStatus(bed)} // <--- LE PROP MANQUANT EST LÀ !
                         />
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* ZONES DES MODALES PROTOCOLAIRES                           */}
            {/* ========================================================= */}

            {/* 1. Sortie du patient (Discharge) */}
            <DischargePatientModal
                isOpen={!!admissionToDischarge}
                onClose={() => setAdmissionToDischarge(null)}
                admission={admissionToDischarge}
            />

            {/* 2. Visite de contrôle (Consultation) */}
            {admissionToConsult && (
                <ConsultationModal 
                    isOpen={!!admissionToConsult}
                    onClose={() => setAdmissionToConsult(null)}
                    isHospitalization={true}
                    visit={{ 
                        ...(admissionToConsult.patientVisit || {}),
                        patient: admissionToConsult.patient,
                        id: admissionToConsult.patient_visit_id || admissionToConsult.id 
                    }} 
                />
            )}

            {/* 3. Admission directe sur un lit vide */}
            {bedToAdmit && (
                <AdmitToBedModal
                    isOpen={!!bedToAdmit}
                    onClose={() => setBedToAdmit(null)}
                    patientId={0} 
                    patientName="Nouveau Patient" 
                    availableBeds={[bedToAdmit]} 
                    profileDoctorId={profile?.profile_doctor?.id}
                />
            )}

            {/* 4. Consultation du Dossier Médical (Antécédents) */}
            {patientToView && (
                <MedicalBackgroundModal
                    isOpen={!!patientToView}
                    onClose={() => setPatientToView(null)}
                    patientId={patientToView.id}
                    existingData={patientToView.medical_background}
                />
            )}

            {/* 5. NOUVEAU : Modale pour déverrouiller un lit (Marquer disponible) */}
            {bedToUpdateStatus && selectedRoom && (
                <UpdateBedStatusModal
                    isOpen={!!bedToUpdateStatus}
                    onClose={() => setBedToUpdateStatus(null)}
                    bed={bedToUpdateStatus}
                    roomId={selectedRoom.id}
                />
            )}

        </div>
    );
};

export default DoctorWardManager;