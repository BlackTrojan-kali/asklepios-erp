<?php

namespace App\Http\Services;

use App\Models\Pharmacy\Provider;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\ProviderExport; // Optionnel : on peut le faire en dynamique sans classe d'export
use App\Http\Imports\ProviderImport;

class ProviderService
{
    /**
     * Générer et télécharger la liste en PDF
     */
    public function exportPdf(int $hospitalId)
    {
        $providers = Provider::where('hospital_id', $hospitalId)->orderBy('name')->get();

        // On crée une vue HTML simple à la volée (tu pourras remplacer par un view() plus tard si besoin)
        $html = '<h2 style="text-align:center; font-family: sans-serif;">Liste des Fournisseurs</h2>';
        $html .= '<table border="1" width="100%" cellspacing="0" cellpadding="8" style="font-family: sans-serif; font-size: 12px; border-collapse: collapse;">';
        $html .= '<tr style="background-color: #f2f2f2;"><th>Nom</th><th>Téléphone</th><th>Adresse</th><th>NIU</th></tr>';
        
        foreach ($providers as $provider) {
            $html .= "<tr>";
            $html .= "<td>{$provider->name}</td>";
            $html .= "<td>{$provider->phone}</td>";
            $html .= "<td>{$provider->address}</td>";
            $html .= "<td>{$provider->niu}</td>";
            $html .= "</tr>";
        }
        $html .= '</table>';

        $pdf = Pdf::loadHTML($html);
        
        return $pdf->download("fournisseurs_" . date('Ymd_His') . ".pdf");
    }

    /**
     * Générer et télécharger la liste en Excel
     */
    public function exportExcel(int $hospitalId)
    {
        $providers = Provider::where('hospital_id', $hospitalId)
            ->select('name as Nom', 'phone as Téléphone', 'address as Adresse', 'niu as NIU')
            ->orderBy('name')
            ->get();

        // On utilise la fonctionnalité rapide "export" sans classe dédiée pour faire simple
        return \Maatwebsite\Excel\Facades\Excel::download(new class($providers) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $providers;
            public function __construct($providers) { $this->providers = $providers; }
            public function collection() { return $this->providers; }
            public function headings(): array { return ['Nom', 'Téléphone', 'Adresse', 'NIU']; }
        }, "fournisseurs_" . date('Ymd_His') . ".xlsx");
    }

    /**
     * Importer les fournisseurs depuis un fichier Excel
     */
    public function importExcel($file, int $hospitalId)
    {
        Excel::import(new ProviderImport($hospitalId), $file);
    }
}