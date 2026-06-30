<?php

namespace App\Notifications;

use App\Models\Hospital\Admission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PatientAdmittedNotification extends Notification
{
    use Queueable;

    public $admission;

    public function __construct(Admission $admission)
    {
        // On passe l'objet Admission complet (qui contiendra le patient et le lit)
        $this->admission = $admission;
    }

    public function via($notifiable)
    {
        // Enregistre en base de données pour affichage frontend (menu cloche)
        return ['database']; 
    }

    public function toArray($notifiable)
    {
        $patient = $this->admission->patient;
        $bed = $this->admission->bed;
        $room = $bed->facilityRoom;

        $patientName = "{$patient->first_name} " . ($patient->last_name ?? '');
        $roomName = $room ? $room->name : 'Inconnue';

        return [
            'type'         => 'ADMISSION',
            'admission_id' => $this->admission->id,
            'patient_id'   => $patient->id,
            'patient_name' => trim($patientName),
            'bed_number'   => $bed->bed_number,
            'room_name'    => $roomName,
            'message'      => "Le patient {$patientName} a été admis dans le lit {$bed->bed_number} (Chambre : {$roomName}).",
        ];
    }
}