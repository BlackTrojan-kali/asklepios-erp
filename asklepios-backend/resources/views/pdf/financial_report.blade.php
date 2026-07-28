<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des Factures et Créances</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 10px; margin: 0; padding: 0; }
        
        .header-table { width: 100%; border-bottom: 2px solid #00a896; padding-bottom: 10px; margin-bottom: 15px; }
        .title { color: #003366; font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
        .subtitle { color: #64748b; font-size: 10px; margin: 0; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9px; }
        .data-table th { background-color: #003366; color: white; padding: 6px 4px; text-align: left; text-transform: uppercase; }
        .data-table td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: monospace; font-size: 10px; }
        .text-green { color: #10b981; font-weight: bold; }
        .text-red { color: #ef4444; font-weight: bold; }
        .text-blue { color: #3b82f6; font-weight: bold; }
        
        .badge { display: inline-block; padding: 2px 4px; font-weight: bold; font-size: 8px; color: white; border-radius: 3px; }
        .bg-paid { background-color: #10b981; }
        .bg-unpaid { background-color: #ef4444; }

        .totals-wrapper { width: 100%; page-break-inside: avoid; margin-top: 20px;}
        .totals-table { width: 45%; float: right; border-collapse: collapse; font-size: 11px; }
        .totals-table td { padding: 6px 8px; border: 1px solid #cbd5e1; }
        .totals-table th { background-color: #f1f5f9; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left; color: #334155; }
        .total-final-row th, .total-final-row td { background-color: #003366; color: white; font-weight: bold; font-size: 12px; border-color: #003366; }

        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 8px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                @if(isset($logoBase64) && $logoBase64)
                    <img src="{{ $logoBase64 }}" style="max-height: 40px; margin-bottom: 10px;" alt="Logo">
                @endif
                <h1 class="title">Rapport des Factures & Créances</h1>
                <p class="subtitle">
                    Généré par : {{ $user->first_name }} {{ $user->last_name }} 
                </p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
                <p style="margin: 0 0 5px 0;"><strong>Critères du rapport :</strong></p>
                <p style="margin: 0; color: #64748b; font-size: 9px; line-height: 1.4;">
                    Période : 
                    @if(!empty($filters['start_date']) || !empty($filters['end_date']))
                        Du {{ !empty($filters['start_date']) ? \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') : 'Début' }} 
                        au {{ !empty($filters['end_date']) ? \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') : 'Aujourd\'hui' }}
                    @else
                        Toutes les dates
                    @endif
                    <br>
                    Statut : {{ !empty($filters['status']) ? ($filters['status'] == 'PAID' ? 'Soldées uniquement' : 'Impayés uniquement') : 'Tous statuts' }}
                </p>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 8%;">Date</th>
                <th style="width: 10%;">N° Facture</th>
                <th style="width: 18%;">Patient</th>
                <th style="width: 12%;" class="text-right">Total Brut</th>
                <th style="width: 12%;" class="text-right">Assurance</th>
                <th style="width: 12%;" class="text-right">Part Patient</th>
                <th style="width: 10%;" class="text-right">Reste à recouvrer</th>
                <th style="width: 8%;" class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @php
                $globalTotalBrut = 0;
                $globalTotalInsurance = 0;
                $globalTotalPatient = 0;
                $globalTotalPatientPaid = 0;
                $globalTotalDebt = 0;
            @endphp

            @forelse($invoices as $invoice)
                @php
                    $insurancePart = $invoice->splits->where('type', 'INSURANCE')->sum('amount_to_pay');
                    $patientSplit = $invoice->splits->where('type', 'PATIENT')->first();
                    $patientPart = $patientSplit ? $patientSplit->amount_to_pay : $invoice->total_amount;
                    
                    // Calcul de ce que le patient a réellement versé de sa poche
                    $patientPaid = $invoice->payments->filter(function($p) use ($patientSplit) {
                        return !$p->invoice_split_id || ($patientSplit && $p->invoice_split_id == $patientSplit->id);
                    })->sum('amount');
                    
                    $remainingPatientDebt = max(0, $patientPart - $patientPaid);

                    // Incrémentations globales
                    $globalTotalBrut += $invoice->total_amount;
                    $globalTotalInsurance += $insurancePart;
                    $globalTotalPatient += $patientPart;
                    $globalTotalPatientPaid += $patientPaid;
                    $globalTotalDebt += $remainingPatientDebt;
                @endphp
            <tr>
                <td>{{ \Carbon\Carbon::parse($invoice->created_at)->format('d/m/Y') }}</td>
                <td class="font-mono">INV-{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</td>
                <td>
                    <strong>{{ $invoice->patient->first_name ?? '' }} {{ $invoice->patient->last_name ?? '' }}</strong><br>
                    <span style="color: #64748b; font-size: 8px;">{{ $invoice->patient->patient_code ?? '' }}</span>
                </td>
                
                <td class="text-right font-mono">{{ number_format($invoice->total_amount, 0, ',', ' ') }}</td>
                <td class="text-right font-mono text-blue">{{ number_format($insurancePart, 0, ',', ' ') }}</td>
                <td class="text-right font-mono">{{ number_format($patientPart, 0, ',', ' ') }}</td>
                
                <td class="text-right font-mono {{ $remainingPatientDebt > 0 ? 'text-red' : 'text-green' }}">
                    {{ number_format($remainingPatientDebt, 0, ',', ' ') }}
                </td>
                
                <td class="text-center">
                    <span class="badge {{ ($invoice->status === 'PAID' || $remainingPatientDebt == 0) ? 'bg-paid' : 'bg-unpaid' }}">
                        {{ ($invoice->status === 'PAID' || $remainingPatientDebt == 0) ? 'SOLDÉE' : 'NON SOLDÉE' }}
                    </span>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="text-center" style="padding: 20px; color: #64748b;">
                    Aucune facture trouvée pour ces critères de recherche.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    @if(count($invoices) > 0)
    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <th>Montant Global Brut</th>
                <td class="text-right font-mono">{{ number_format($globalTotalBrut, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <th>Prise en charge Assurance</th>
                <td class="text-right font-mono text-blue">- {{ number_format($globalTotalInsurance, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <th>Total Dû par les Patients</th>
                <td class="text-right font-mono">{{ number_format($globalTotalPatient, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <th>Total Encaissé (Caisses)</th>
                <td class="text-right font-mono text-green">{{ number_format($globalTotalPatientPaid, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr class="total-final-row">
                <th>RESTE À RECOUVRER (PATIENTS)</th>
                <td class="text-right font-mono">{{ number_format($globalTotalDebt, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>
    @endif

    <div class="footer">
        Système de gestion hospitalière Asclépios ERP - Document généré le {{ isset($generated_at) ? $generated_at : now()->format('d/m/Y H:i') }}
    </div>

</body>
</html>