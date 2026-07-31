import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    ArrowLeft, 
    UsersRound, 
    Loader2, 
    Clock, 
    AlertTriangle,
    CalendarCheck,
    Stethoscope,
    RefreshCw
} from 'lucide-react';
import useFacilityRoomStore from '../../../functions/base_hospital/useFacilityRoomStore';

const WaitingRoomPatients = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    // On récupère les infos passées via le state du router pour le fil d'Ariane
    const { room, departmentName, departmentId } = location.state || {};
    const roomName = room?.name || "Salle d'attente";

    const { 
        waitingPatients, 
        loading, 
        getPatientsInWaitingRoom 
    } = useFacilityRoomStore();

    useEffect(() => {
        if (roomId) {
            getPatientsInWaitingRoom(Number(roomId));
        }
    }, [roomId, getPatientsInWaitingRoom]);

    const handleRefresh = () => {
        if (roomId) getPatientsInWaitingRoom(Number(roomId));
    };

    // Helper : Formater l'heure d'arrivée
    const formatTime = (dateString?: string) => {
        if (!dateString) return "Heure inconnue";
        return new Date(dateString).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    // Helper : Rendu du badge de type de visite
    const renderVisitTypeBadge = (type: string) => {
        switch (type) {
            case 'EMERGENCY':
                return (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded border border-red-200 dark:border-red-800">
                        <AlertTriangle size={12} /> Urgence
                    </span>
                );
            case 'FOLLOW_UP':
                return (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold rounded border border-blue-200 dark:border-blue-800">
                        <CalendarCheck size={12} /> Suivi
                    </span>
                );
            case 'ROUTINE':
            default:
                return (
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold rounded border border-emerald-200 dark:border-emerald-800">
                        <Stethoscope size={12} /> Routine
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE ET BREADCRUMBS */}
            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white w-fit transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Retour aux salles
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg">
                            <UsersRound size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                {roomName}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                File d'attente actuelle • Département <span className="font-semibold text-slate-700 dark:text-gray-300">{departmentName || 'Inconnu'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? "animate-spin text-amber-500" : ""} />
                        Rafraîchir la file
                    </button>
                </div>
            </div>

            {/* LISTE DES PATIENTS */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[400px]">
                        <Loader2 size={48} className="animate-spin text-amber-500 mb-4" />
                        <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Chargement des patients...</p>
                    </div>
                ) : waitingPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <UsersRound size={40} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-lg text-slate-600 dark:text-gray-400 font-medium">La salle d'attente est vide.</p>
                        <p className="text-sm text-gray-500 mt-1">Aucun patient ne patiente actuellement ici.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    <th className="p-4 font-bold">Ordre</th>
                                    <th className="p-4 font-bold">Patient</th>
                                    <th className="p-4 font-bold">Heure d'arrivée</th>
                                    <th className="p-4 font-bold">Type de visite</th>
                                    <th className="p-4 font-bold">Motif / RDV</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {waitingPatients.map((visit, index) => (
                                    <tr key={visit.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4">
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 font-bold text-sm">
                                                {visit.queue_number || (index + 1)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800 dark:text-gray-200">
                                                {visit.patient?.first_name} {visit.patient?.last_name}
                                            </div>
                                            <div className="text-xs text-gray-500">ID: {visit.patient?.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-gray-300">
                                                <Clock size={16} className="text-gray-400" />
                                                {formatTime(visit.arrival_time)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {renderVisitTypeBadge(visit.visit_type)}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px] block">
                                                {visit.appointment?.reason || "Non spécifié"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaitingRoomPatients;