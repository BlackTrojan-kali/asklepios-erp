<?php

namespace App\Notifications;

use App\Models\Hospital\PatientVisit;
use App\Models\Patient;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PatientArrivedNotification extends Notification
{
    use Queueable;

    public $visit;
    public $patient;

    public function __construct(PatientVisit $visit, Patient $patient)
    {
        $this->visit = $visit;
        $this->patient = $patient;
    }

    public function via($notifiable)
    {
        // Enregistre en base de données pour affichage frontend (tu pourras rajouter 'mail' ou 'broadcast' via websockets plus tard)
        return ['database']; 
    }

    public function toArray($notifiable)
    {
        return [
            'visit_id'     => $this->visit->id,
            'patient_id'   => $this->patient->id,
            'patient_name' => "{$this->patient->first_name} {$this->patient->last_name}",
            'queue_number' => $this->visit->queue_number,
            'message'      => "Le patient est arrivé en salle d'attente (Position : {$this->visit->queue_number}).",
        ];
    }
}