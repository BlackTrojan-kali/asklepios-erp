<?php

namespace App\Http\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class ArticlePricingExport implements FromCollection, WithHeadings, ShouldAutoSize
{
    protected Collection $data;
    protected bool $hasMultipleBranches;

    public function __construct(Collection $data, bool $hasMultipleBranches = false)
    {
        $this->data = $data;
        $this->hasMultipleBranches = $hasMultipleBranches;
    }

    /**
     * @return Collection
     */
    public function collection()
    {
        return $this->data;
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        if ($this->hasMultipleBranches) {
            return [
                'Pharmacie',
                'Article',
                'Prix de Vente'
            ];
        }

        return [
            'Article',
            'Prix de Vente'
        ];
    }
}
