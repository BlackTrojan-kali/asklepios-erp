<?php

namespace App\Notifications;

use App\Models\Pharmacy\PharmacyBranch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewPharmacyNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public $pharmacy;
    public function __construct(PharmacyBranch $pharmacy)
    {
        //
        $this->pharmacy = $pharmacy;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    
    
    public function toArray(object $notifiable): array
    {
        $hospital_name = $this->pharmacy->hospital->name;
        $pharmacy_name = $this->pharmacy->name;
        return [
            "type"=>"Creation",
            "pharmacy_branch_id"=>$this->pharmacy->id,
            "pharmacy_name" => $pharmacy_name,
            "hospital_name" => $hospital_name,
            "message" =>"la pharmacie {$pharmacy_name} a ete cree dans l'hopital {$hospital_name}"
            //
        ];
    }
}
