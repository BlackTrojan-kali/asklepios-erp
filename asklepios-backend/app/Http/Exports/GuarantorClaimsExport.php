<?php

namespace App\Http\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GuarantorClaimsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $query;

    public function __construct($query)
    {
        $this->query = $query;
    }

    public function collection()
    {
        return $this->query->get();
    }

    public function headings(): array
    {
        return [
            'ID / Réf Interne',
            'Référence Assurance',
            'Centre',
            'Assurance',
            'Mois de Facturation',
            'Nombre de Factures',
            'Montant Total (XAF)',
            'Statut',
            'Date de Création'
        ];
    }

    public function map($claim): array
    {
        return [
            $claim->id,
            $claim->claim_refence ?? 'Non définie',
            $claim->center->name ?? 'N/A',
            $claim->insuranceCompany->name ?? 'N/A',
            $claim->claim_month ? $claim->claim_month->format('m/Y') : 'N/A',
            $claim->invoice_splits_count ?? 0,
            $claim->total_claim_amount,
            $this->translateStatus($claim->status),
            $claim->created_at->format('d/m/Y H:i')
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']], 'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF003366']]],
        ];
    }

    private function translateStatus($status)
    {
        return match($status) {
            'DRAFT' => 'Brouillon',
            'SUBMITTED' => 'Soumis',
            'PAID' => 'Payé',
            'DISPUTED' => 'En litige',
            default => $status
        };
    }
}