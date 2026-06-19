<?php

namespace App\Imports;

use App\Models\Vehicule;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class VehiculeImport implements ToCollection, WithHeadingRow
{
    protected int $hospitalId;

    public function __construct(int $hospitalId)
    {
        $this->hospitalId = $hospitalId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Ignorer les lignes vides
            if (!isset($row['plaque']) && !isset($row['modele'])) {
                continue;
            }

            // On vérifie si la plaque existe déjà
            $existing = Vehicule::where('hospital_id', $this->hospitalId)
                                ->where('licence_plate', trim($row['plaque']))
                                ->first();

            if (!$existing) {
                Vehicule::create([
                    'hospital_id'   => $this->hospitalId,
                    'licence_plate' => trim($row['plaque']),
                    'model'         => trim($row['modele'] ?? 'Inconnu'),
                    'is_active'     => isset($row['actif']) ? filter_var($row['actif'], FILTER_VALIDATE_BOOLEAN) : true,
                ]);
            }
        }
    }
}