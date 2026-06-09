<?php

namespace App\Http\Imports;

use App\Models\Pharmacy\Provider;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProviderImport implements ToCollection, WithHeadingRow
{
    protected int $hospitalId;

    public function __construct(int $hospitalId)
    {
        $this->hospitalId = $hospitalId;
    }

    /**
     * @param Collection $rows
     */
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // On ignore les lignes sans nom (qui est obligatoire)
            if (!isset($row['nom']) || empty(trim($row['nom']))) {
                continue;
            }

            $name = trim($row['nom']);
            $phone = isset($row['telephone']) ? trim($row['telephone']) : null;
            $address = isset($row['adresse']) ? trim($row['adresse']) : null;
            $niu = isset($row['niu']) ? trim($row['niu']) : null;

            // Recherche du fournisseur pour cet hôpital
            $provider = Provider::where('hospital_id', $this->hospitalId)
                                ->where('name', $name)
                                ->first();

            if ($provider) {
                // Si le fournisseur existe, on vérifie si les champs ont changé
                if ($provider->phone != $phone || $provider->address != $address || $provider->niu != $niu) {
                    $provider->update([
                        'phone'   => $phone,
                        'address' => $address,
                        'niu'     => $niu,
                    ]);
                }
                // S'il existe et que tout est identique, on ne fait rien (on ignore)
            } else {
                // S'il n'existe pas, on le crée
                Provider::create([
                    'hospital_id' => $this->hospitalId,
                    'name'        => $name,
                    'phone'       => $phone,
                    'address'     => $address,
                    'niu'         => $niu,
                ]);
            }
        }
    }
}