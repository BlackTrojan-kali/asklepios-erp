<?php

namespace App\Http\Services;

use App\Models\Hospital\Appointment;
use App\Models\Hospital\PatientVisit;
use App\Notifications\PatientArrivedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PatientAdmissionService
{
    /**
     * Admet un patient en salle d'attente (avec ou sans rendez-vous)
     */
    public function admitToWaitingRoom(
        $patientId, 
        $centerId, 
        $receptionistId, 
        $waitingRoomId, 
        $visitType, 
        $appointmentId = null
    ) {
        return DB::transaction(function () use ($patientId, $centerId, $receptionistId, $waitingRoomId, $visitType, $appointmentId) {
            
            // 1. Calcul pertinent du numéro dans la file d'attente (Pour cette salle, aujourd'hui)
            $today = now()->format('Y-m-d');
            $maxQueueNumber = PatientVisit::where('waiting_room_id', $waitingRoomId)
                ->whereDate('created_at', $today)
                ->max('queue_number');
            
            $nextQueueNumber = $maxQueueNumber ? $maxQueueNumber + 1 : 1;

            // 2. Création de la visite
            $visit = PatientVisit::create([
                'patient_id'           => $patientId,
                'center_id'            => $centerId,
                'profile_reception_id' => $receptionistId,
                'appointment_id'       => $appointmentId,
                'waiting_room_id'      => $waitingRoomId,
                'consulting_room_id'   => null,
                'arrival_time'         => now(),
                'queue_number'         => $nextQueueNumber,
                'status'               => 'IN_WAITING_ROOM',
                'visit_type'           => $visitType,
            ]);

            // 3. Mise à jour du rendez-vous et Notification au docteur
            if ($appointmentId) {
                $appointment = Appointment::with('doctor.user', 'patient')->find($appointmentId);
                if ($appointment) {
                    $appointment->update(['status' => 'ARRIVED']);
                    
                    // Envoi de la notification au médecin concerné
                    if ($appointment->doctor && $appointment->doctor->user) {
                        $appointment->doctor->user->notify(new PatientArrivedNotification($visit, $appointment->patient));
                    }
                }
            }

            return $visit;
        });
    }
}