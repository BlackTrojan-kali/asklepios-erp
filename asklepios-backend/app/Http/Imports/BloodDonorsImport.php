<?php

namespace App\Http\Imports;

use App\Models\Hospital\BloodDonor;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Carbon\Carbon;

class BloodDonorsImport implements ToCollection, WithHeadingRow
{
    protected $centerId;

    public function __construct($centerId)
    {
        $this->centerId = $centerId; // On force l'affectation à un centre précis
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Mapping flexible : on cherche différentes clés possibles pour chaque donnée
            $firstName = $row['first_name'] ?? $row['prenom'] ?? $row['prénom'] ?? null;
            $lastName = $row['last_name'] ?? $row['nom'] ?? null;
            $gender = $row['gender'] ?? $row['sexe'] ?? 'M'; // Défaut ou extraction
            $bloodType = $row['blood_type'] ?? $row['groupe_sanguin'] ?? $row['groupe'] ?? 'UNKNOWN';
            $phone = $row['phone_contact'] ?? $row['telephone'] ?? $row['phone'] ?? null;
            $status = $row['serology_status'] ?? $row['statut'] ?? 'PENDING';

            // Gestion flexible des dates (Format Excel Serialized ou String classique)
            $birthDate = $this->parseDate($row['birth_date'] ?? $row['date_naissance'] ?? null);
            $lastDonation = $this->parseDate($row['last_donation_date'] ?? $row['dernier_don'] ?? null);

            // On ne crée le donneur que si on a au moins le prénom et le contact
            if ($firstName && $phone) {
                BloodDonor::updateOrCreate(
                    [
                        'phone_contact' => $phone, // Utiliser le tel comme identifiant unique évite les doublons
                    ],
                    [
                        'center_id' => $this->centerId,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'gender' => strtoupper(substr($gender, 0, 1)) === 'F' ? 'F' : 'M',
                        'birth_date' => $birthDate ?? '2000-01-01', // Fallback
                        'blood_type' => strtoupper($bloodType),
                        'last_donation_date' => $lastDonation,
                        'serology_status' => strtoupper($status),
                    ]
                );
            }
        }
    }

    private function parseDate($value)
    {
        if (!$value) return null;
        if (is_numeric($value)) {
            return Carbon::instance(Date::excelToDateTimeObject($value))->format('Y-m-d');
        }
        return Carbon::parse($value)->format('Y-m-d');
    }
}