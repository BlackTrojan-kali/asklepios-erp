<?php

namespace App\Http\Exports;

use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BloodDonorsExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    protected $query;

    public function __construct($query)
    {
        $this->query = $query;
    }

    public function query()
    {
        return $this->query;
    }

    public function headings(): array
    {
        return [
            'ID', 'Centre ID', 'Nom', 'Prénom', 'Sexe', 'Date de Naissance', 
            'Groupe Sanguin', 'Téléphone', 'Dernier Don', 'Statut Sérologique'
        ];
    }

    public function map($donor): array
    {
        return [
            $donor->id,
            $donor->center_id,
            $donor->last_name,
            $donor->first_name,
            $donor->gender,
            $donor->birth_date,
            $donor->blood_type,
            $donor->phone_contact,
            $donor->last_donation_date,
            $donor->serology_status,
        ];
    }
}