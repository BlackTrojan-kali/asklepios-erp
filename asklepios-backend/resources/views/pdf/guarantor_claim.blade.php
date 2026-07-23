<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bordereau de Transmission - {{ $claim->insuranceCompany->name }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        
        /* --- EN-TÊTE --- */
        .header-table { width: 100%; margin-bottom: 25px; border-bottom: 2px solid #003366; padding-bottom: 10px; }
        .hospital-name { font-size: 18px; font-weight: bold; color: #003366; text-transform: uppercase; margin-bottom: 5px; }
        .hospital-info { color: #555; line-height: 1.4; font-size: 10px; }
        
        .insurance-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; text-align: left; }
        .insurance-box h3 { margin: 0 0 5px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; }
        
        .doc-title { text-align: center; color: #003366; font-size: 18px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; }
        .doc-subtitle { text-align: center; color: #64748b; font-size: 12px; margin-bottom: 20px; font-weight: bold; }

        /* --- TABLEAU DES IMPAYÉS --- */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        .items-table th { background-color: #003366; color: #ffffff; padding: 8px; text-align: left; text-transform: uppercase; border: 1px solid #002244; }
        .items-table td { padding: 6px 8px; border: 1px solid #cbd5e1; }
        
        /* Zébrage pour faciliter la lecture */
        .items-table tbody tr:nth-child(even) { background-color: #f8fafc; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: monospace; font-size: 11px; }
        .font-bold { font-weight: bold; }

        /* --- TOTAUX ET SIGNATURES --- */
        .summary-section { width: 100%; margin-top: 20px; }
        .total-box { float: right; width: 35%; background-color: #003366; color: white; padding: 10px; border-radius: 4px; text-align: right; }
        .total-box p { margin: 0; font-size: 12px; text-transform: uppercase; }
        .total-box h2 { margin: 5px 0 0 0; font-size: 20px; font-family: monospace; }
        
        .signatures { clear: both; margin-top: 50px; width: 100%; }
        .signatures td { width: 50%; text-align: center; font-weight: bold; color: #475569; padding-top: 50px; border-top: 1px dashed #cbd5e1; }

        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                @if($hospitalLogoBase64)
                    <img src="{{ $hospitalLogoBase64 }}" style="max-height: 50px; margin-bottom: 5px;" alt="Logo Hôpital">
                @else
                    <div class="hospital-name">{{ $claim->center->hospital->name ?? 'HÔPITAL' }}</div>
                @endif
                <div class="hospital-info">
                    Centre : {{ $claim->center->name ?? 'N/A' }}<br>
                    Édité par Asclépios ERP
                </div>
            </td>
            <td style="width: 50%; vertical-align: top;">
                <div class="insurance-box">
                    <p style="font-size: 10px; color: #64748b; margin: 0 0 2px 0;">GARANT / ASSURANCE :</p>
                    <h3>{{ $claim->insuranceCompany->name }}</h3>
                    <p style="margin: 0; font-size: 11px;">
                        @if($claim->insuranceCompany->address) Adresse : {{ $claim->insuranceCompany->address }} <br> @endif
                        @if($claim->insuranceCompany->contact_email) Email : {{ $claim->insuranceCompany->contact_email }} @endif
                    </p>
                </div>
            </td>
        </tr>
    </table>

    <div class="doc-title">BORDEREAU DE TRANSMISSION DE FACTURES</div>
    <div class="doc-subtitle">
        Période de facturation : {{ \Carbon\Carbon::parse($claim->claim_month)->translatedFormat('F Y') }} <br>
        <span style="color: #ef4444;">Statut : {{ $claim->status }}</span> | Réf : {{ $claim->claim_refence ?? 'N/A' }}
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">N°</th>
                <th style="width: 12%;">Date de Soins</th>
                <th style="width: 15%;">N° Facture</th>
                <th style="width: 15%;">Code Patient</th>
                <th style="width: 38%;">Nom du Patient</th>
                <th style="width: 15%; text-align: right;">Montant Réclamé</th>
            </tr>
        </thead>
        <tbody>
            @forelse($splits as $index => $split)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ \Carbon\Carbon::parse($split->invoice->created_at)->format('d/m/Y') }}</td>
                    <td class="font-mono font-bold">INV-{{ str_pad($split->invoice->id, 5, '0', STR_PAD_LEFT) }}</td>
                    <td class="font-mono">{{ $split->invoice->patient->patient_code ?? 'N/A' }}</td>
                    <td class="font-bold">{{ $split->invoice->patient->first_name }} {{ $split->invoice->patient->last_name }}</td>
                    <td class="text-right font-mono font-bold">{{ number_format($split->amount_to_pay, 0, ',', ' ') }} FCFA</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 20px; color: #ef4444;">Aucune ligne de facture associée à ce bordereau.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="summary-section">
        <div class="total-box">
            <p>Net À Payer par l'Assurance</p>
            <h2>{{ number_format($claim->total_claim_amount, 0, ',', ' ') }} FCFA</h2>
        </div>
        <div style="clear: both;"></div>
    </div>

    <!-- Convertisseur du montant en lettres (facultatif mais pro) -->
    <div style="margin-top: 15px; padding: 10px; border-left: 3px solid #003366; background-color: #f1f5f9; font-size: 11px;">
        Arrêté le présent bordereau à la somme totale de : <strong>{{ number_format($claim->total_claim_amount, 0, ',', ' ') }} Francs CFA</strong>.
    </div>

    <table class="signatures">
        <tr>
            <td style="padding-right: 20px;">
                <div style="border-top: 1px solid #000; width: 60%; margin: 0 auto; padding-top: 5px;">
                    Le Service Facturation / Comptabilité<br>
                    <span style="font-size: 9px; font-weight: normal;">Cachet et Signature</span>
                </div>
            </td>
            <td style="padding-left: 20px;">
                <div style="border-top: 1px solid #000; width: 60%; margin: 0 auto; padding-top: 5px;">
                    L'Assurance / Le Garant<br>
                    <span style="font-size: 9px; font-weight: normal;">Pour validation et accord de paiement</span>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        {{ $claim->center->hospital->name ?? 'Établissement' }} - Généré par Asclépios ERP le {{ $generated_at }}
    </div>

</body>
</html>