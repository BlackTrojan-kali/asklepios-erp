<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des Encaissements</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        
        .header-table { width: 100%; border-bottom: 2px solid #00a896; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #003366; font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
        .subtitle { color: #64748b; font-size: 11px; margin: 0; }
        
        /* TABLEAU PRINCIPAL */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px; }
        .data-table th { background-color: #00a896; color: white; padding: 8px 5px; text-align: left; text-transform: uppercase; }
        .data-table td { padding: 8px 5px; border-bottom: 1px solid #e2e8f0; }
        
        /* ALIGNEMENTS ET COULEURS */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: monospace; font-size: 11px; }
        .text-green { color: #10b981; font-weight: bold; }
        
        /* TABLEAU DES TOTAUX */
        .summary-container { width: 100%; page-break-inside: avoid; margin-top: 20px; }
        .totals-table { width: 50%; float: left; border-collapse: collapse; font-size: 11px; }
        .totals-table th { background-color: #f8fafc; padding: 6px; border: 1px solid #cbd5e1; text-align: left; }
        .totals-table td { padding: 6px; border: 1px solid #cbd5e1; }
        
        .grand-total-table { width: 40%; float: right; border-collapse: collapse; font-size: 12px; }
        .grand-total-table th, .grand-total-table td { padding: 10px; border: 1px solid #cbd5e1; }
        .grand-total-table th { background-color: #003366; color: white; text-align: left; }
        .grand-total-table td { font-weight: bold; font-size: 16px; color: #003366; }

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
                <h1 class="title">Journal des Encaissements</h1>
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
                    Patient : {{ !empty($filters['patient_id']) ? 'Patient #'.$filters['patient_id'] : 'Tous' }}
                    <br>
                    Moyen de pmt : {{ !empty($filters['payment_method']) ? $filters['payment_method'] : 'Tous' }}
                </p>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 15%;">Date & Heure</th>
                <th style="width: 12%;">Reçu N°</th>
                <th style="width: 12%;">Facture N°</th>
                <th style="width: 25%;">Patient</th>
                <th style="width: 13%;">Moyen Pmt</th>
                <th style="width: 13%;">Caissier(ère)</th>
                <th style="width: 10%;" class="text-right">Montant</th>
            </tr>
        </thead>
        <tbody>
            @forelse($payments as $payment)
            <tr>
                <td>{{ \Carbon\Carbon::parse($payment->created_at)->format('d/m/Y H:i') }}</td>
                <td class="font-mono">REC-{{ str_pad($payment->id, 5, '0', STR_PAD_LEFT) }}</td>
                <td class="font-mono">INV-{{ str_pad($payment->invoice_id, 5, '0', STR_PAD_LEFT) }}</td>
                <td>
                    <strong>{{ $payment->invoice->patient->first_name ?? '' }} {{ $payment->invoice->patient->last_name ?? '' }}</strong><br>
                </td>
                <td>{{ $payment->payment_method }}</td>
                <td>
                    @if($payment->reception)
                        {{ $payment->reception->user->first_name ?? '' }}
                    @else
                        <em>Admin</em>
                    @endif
                </td>
                <td class="text-right font-mono text-green">{{ number_format($payment->amount, 0, ',', ' ') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="text-center" style="padding: 20px; color: #64748b;">
                    Aucun encaissement trouvé pour cette période et ces critères.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- RÉSUMÉ FINANCIER (Si des données existent) --}}
    @if(count($payments) > 0)
    <div class="summary-container">
        
        {{-- Tableau des sous-totaux par méthode --}}
        <table class="totals-table">
            <thead>
                <tr>
                    <th colspan="2" style="background-color: #00a896; color: white;">Récapitulatif par moyen de paiement</th>
                </tr>
            </thead>
            <tbody>
                @foreach($totalsByMethod as $method => $amount)
                <tr>
                    <td><strong>{{ $method }}</strong></td>
                    <td class="text-right font-mono">{{ number_format($amount, 0, ',', ' ') }} FCFA</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- Tableau du Grand Total --}}
        <table class="grand-total-table">
            <tr>
                <th>TOTAL ENCAISSÉ</th>
                <td class="text-right font-mono">{{ number_format($grandTotal, 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
        
        <div style="clear: both;"></div>
    </div>
    @endif

    <div class="footer">
        Système de gestion hospitalière Asclépios ERP - Document de contrôle de caisse.<br>
        Généré le {{ $generated_at }}
    </div>

</body>
</html>