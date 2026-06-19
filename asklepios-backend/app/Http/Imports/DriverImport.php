<?php

namespace App\Http\Imports;

use App\Models\Pharmacy\Driver;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class DriverImport implements ToCollection, WithHeadingRow
{
    protected int $hospitalId;

    public function __construct(int $hospitalId)
    {
        $this->hospitalId = $hospitalId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            if (!isset($row['nom_complet'])) {
                continue;
            }

            $phone = isset($row['telephone']) ? preg_replace('/[^0-9]/', '', $row['telephone']) : null;

            $existing = Driver::where('hospital_id', $this->hospitalId)
                              ->where('fullname', trim($row['nom_complet']))
                              ->where('phone', $phone)
                              ->first();

            if (!$existing) {
                Driver::create([
                    'hospital_id' => $this->hospitalId,
                    'fullname'    => trim($row['nom_complet']),
                    'phone'       => $phone,
                    'is_active'   => isset($row['actif']) ? filter_var($row['actif'], FILTER_VALIDATE_BOOLEAN) : true,
                ]);
            }
        }
    }
}