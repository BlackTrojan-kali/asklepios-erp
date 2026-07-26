<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des Factures et Créances</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        
        .header-table { width: 100%; border-bottom: 2px solid #003366; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #003366; font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
        .subtitle { color: #64748b; font-size: 11px; margin: 0; }
        
        /* TABLEAU PRINCIPAL */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px; }
        .data-table th { background-color: #003366; color: white; padding: 8px 5px; text-align: left; text-transform: uppercase; }
        .data-table td { padding: 8px 5px; border-bottom: 1px solid #e2e8f0; }
        
        /* ALIGNEMENTS ET COULEURS */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: monospace; font-size: 11px; }
        .text-green { color: #10b981; font-weight: bold; }
        .text-red { color: #ef4444; font-weight: bold; }
        
        /* BADGE STATUT */
        .badge { display: inline-block; padding: 3px 6px; font-weight: bold; font-size: 9px; color: white; border-radius: 3px; }
        .bg-paid { background-color: #10b981; }
        .bg-unpaid { background-color: #ef4444; }

        /* TABLEAU DES TOTAUX */
        .totals-wrapper { width: 100%; page-break-inside: avoid; }
        .totals-table { width: 45%; float: right; border-collapse: collapse; font-size: 12px; }
        .totals-table td { padding: 8px 10px; border: 1px solid #cbd5e1; }
        .totals-table th { background-color: #f1f5f9; padding: 8px 10px; border: 1px solid #cbd5e1; text-align: left; color: #334155; }
        .total-final-row th, .total-final-row td { background-color: #003366; color: white; font-weight: bold; font-size: 14px; border-color: #003366; }

        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" style="max-height: 40px; margin-bottom: 10px;" alt="Logo">
                @endif
                <h1 class="title">Rapport des Factures & Créances</h1>
                <p class="subtitle">
                    Généré par : {{ $user->first_name }} {{ $user->last_name }} 
                    ({{ $user->profile_admin ? 'Administrateur' : 'Caisse / Réception' }})
                </p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
                <p style="margin: 0 0 5px 0;"><strong>Critères de recherche :</strong></p>
                <p style="margin: 0; color: #64748b; font-size: 10px;">
                    Période : 
                    @if(!empty($filters['start_date']) || !empty($filters['end_date']))
                        Du {{ !empty($filters['start_date']) ? \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') : 'Début' }} 
                        au {{ !empty($filters['end_date']) ? \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') : 'Aujourd\'hui' }}
                    @else
                        Toutes les dates
                    @endif
                    <br>
                    Centre : {{ !empty($filters['center_id']) ? 'Centre #'.$filters['center_id'] : 'Tous les centres accessibles' }}
                    <br>
                    Patient : {{ !empty($filters['patient_id']) ? 'Patient #'.$filters['patient_id'] : 'Tous les patients' }}
                </p>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 10%;">Date</th>
                <th style="width: 10%;">N° Facture</th>
                <th style="width: 25%;">Patient (Code)</th>
                <th style="width: 15%;">Centre</th>
                <th style="width: 10%;" class="text-right">Total (FCFA)</th>
                <th style="width: 10%;" class="text-right">Payé (FCFA)</th>
                <th style="width: 10%;" class="text-right">Dette (FCFA)</th>
                <th style="width: 10%;" class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($invoices as $invoice)
            <tr>
                <td>{{ \Carbon\Carbon::parse($invoice->created_at)->format('d/m/Y') }}</td>
                <td class="font-mono">INV-{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</td>
                <td>
                    <strong>{{ $invoice->patient->first_name ?? '' }} {{ $invoice->patient->last_name ?? '' }}</strong><br>
                    <span style="color: #64748b; font-size: 9px;">{{ $invoice->patient->patient_code ?? '' }}</span>
                </td>
                <td>{{ $invoice->center->name ?? 'N/A' }}</td>
                
                <td class="text-right font-mono">{{ number_format($invoice->total_amount, 0, ',', ' ') }}</td>
                <td class="text-right font-mono text-green">{{ number_format($invoice->total_paid, 0, ',', ' ') }}</td>
                
                <td class="text-right font-mono {{ $invoice->remaining_debt > 0 ? 'text-red' : '' }}">
                    {{ number_format($invoice->remaining_debt, 0, ',', ' ') }}
                </td>
                
                <td class="text-center">
                    <span class="badge {{ $invoice->status === 'PAID' ? 'bg-paid' : 'bg-unpaid' }}">
                        {{ $invoice->status === 'PAID' ? 'SOLDÉE' : 'NON SOLDÉE' }}
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

    {{-- RÉSUMÉ FINANCIER GLOBAL (S'il y a des données) --}}
    @if(count($invoices) > 0)
    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <th>Montant Total Facturé</th>
                <td class="text-right font-mono">{{ number_format($grandTotalAmount, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr>
                <th>Total Encaissé (Payé)</th>
                <td class="text-right font-mono text-green">{{ number_format($grandTotalPaid, 0, ',', ' ') }} FCFA</td>
            </tr>
            <tr class="total-final-row">
                <th>TOTAL DES CRÉANCES (DETTES CLIENTS)</th>
                <td class="text-right font-mono">{{ number_format($grandTotalDebt, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>
    @endif

    <div class="footer">
        Système de gestion hospitalière Asclépios ERP - Document strictement confidentiel.<br>
        Généré le {{ $generated_at }}
    </div>

</body>
</html>