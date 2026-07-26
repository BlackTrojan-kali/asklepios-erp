<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Financier - {{ $reportType }}</title>
    <style>
        @page { margin: 120px 30px 50px 30px; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1f2937; font-size: 10px; }
        
        .watermark { position: fixed; top: 15%; left: 25%; width: 50%; opacity: 0.08; z-index: -1000; text-align: center; }
        .watermark img { width: 100%; max-width: 400px; }

        header { position: fixed; top: -100px; left: 0; right: 0; height: 80px; border-bottom: 2px solid #003366; padding-bottom: 10px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .hospital-name { font-size: 16px; font-weight: bold; color: #003366; text-transform: uppercase; }
        .doc-title { text-align: right; }
        .doc-title h1 { margin: 0; font-size: 20px; color: #003366; }
        .doc-subtitle { margin: 2px 0; font-size: 11px; color: #00a896; font-weight: bold; }

        footer { position: fixed; bottom: -30px; left: 0; right: 0; height: 20px; border-top: 1px solid #00a896; text-align: center; font-size: 9px; color: #64748b; padding-top: 5px; }
        .page-number:after { content: counter(page); }

        .summary-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 15px; border-left: 4px solid #00a896; }
        .summary-box p { margin: 3px 0; font-size: 11px; }

        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px; }
        .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 6px; }
        .data-table th { background-color: #003366; color: white; text-align: left; text-transform: uppercase; }
        .data-table tr:nth-child(even) { background-color: #f8fafc; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .amount { font-weight: bold; font-family: monospace; font-size: 10px; }
        .total-row { background-color: #e2e8f0 !important; font-weight: bold; font-size: 11px; }
        .badge { padding: 2px 4px; border-radius: 2px; color: white; font-size: 8px; }
        .bg-red { background-color: #ef4444; }
        .bg-green { background-color: #10b981; }
    </style>
</head>
<body>

    @if($asklepiosLogoBase64)
        <div class="watermark">
            <img src="{{ $asklepiosLogoBase64 }}" alt="Filigrane Asclépios">
        </div>
    @endif

    <header>
        <table class="header-table">
            <tr>
                <td style="width: 50%;">
                    @if($hospitalLogoBase64)
                        <img src="{{ $hospitalLogoBase64 }}" style="max-height: 50px;" alt="Logo">
                    @else
                        <div class="hospital-name">{{ $hospital->name }}</div>
                    @endif
                </td>
                <td class="doc-title" style="width: 50%;">
                    <h1>
                        @if($reportType === 'INVOICES') RAPPORT DES FACTURATIONS
                        @elseif($reportType === 'PAYMENTS') RAPPORT DES ENCAISSEMENTS
                        @elseif($reportType === 'DEBTS') ÉTAT DES CRÉANCES CLIENTS
                        @endif
                    </h1>
                    <p class="doc-subtitle">Période du {{ $startDate }} au {{ $endDate }}</p>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        Généré par {{ $generated_by }} le {{ $generated_at }} via Asclépios ERP - Page <span class="page-number"></span>
    </footer>

    <div class="summary-box">
        <table style="width: 100%;">
            <tr>
                <td style="width: 50%;">
                    <p><strong>Établissement :</strong> {{ $hospital->name }}</p>
                    <p><strong>Centre concerné :</strong> {{ $centerName }}</p>
                    <p><strong>Nombre d'enregistrements :</strong> {{ count($records) }}</p>
                </td>
                <td style="width: 50%; text-align: right;">
                    @if($reportType === 'INVOICES')
                        <p style="font-size: 14px;"><strong>Chiffre d'Affaires Facturé :</strong> <span style="color: #003366;">{{ number_format($totals['amount'], 0, ',', ' ') }} FCFA</span></p>
                    @elseif($reportType === 'PAYMENTS')
                        <p style="font-size: 14px;"><strong>Total Encaissé (Trésorerie) :</strong> <span style="color: #10b981;">{{ number_format($totals['paid'], 0, ',', ' ') }} FCFA</span></p>
                    @elseif($reportType === 'DEBTS')
                        <p><strong>Total Facturé (Dettes) :</strong> {{ number_format($totals['amount'], 0, ',', ' ') }} FCFA</p>
                        <p><strong>Total Avancé :</strong> {{ number_format($totals['paid'], 0, ',', ' ') }} FCFA</p>
                        <p style="font-size: 14px;"><strong>Total Reste à Recouvrer :</strong> <span style="color: #ef4444;">{{ number_format($totals['debt'], 0, ',', ' ') }} FCFA</span></p>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        
        @if($reportType === 'INVOICES')
            <thead>
                <tr>
                    <th>Date</th>
                    <th>N° Facture</th>
                    <th>Patient</th>
                    <th>Code Patient</th>
                    <th>Centre</th>
                    <th class="text-center">Statut</th>
                    <th class="text-right">Montant (FCFA)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($records as $inv)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($inv->created_at)->format('d/m/Y H:i') }}</td>
                        <td>INV-{{ str_pad($inv->id, 5, '0', STR_PAD_LEFT) }}</td>
                        <td>{{ $inv->patient->first_name }} {{ $inv->patient->last_name }}</td>
                        <td>{{ $inv->patient->patient_code }}</td>
                        <td>{{ $inv->center->name ?? 'N/A' }}</td>
                        <td class="text-center">
                            @if($inv->status === 'PAID') <span class="badge bg-green">SOLDE</span>
                            @else <span class="badge bg-red">NON SOLDE</span> @endif
                        </td>
                        <td class="text-right amount">{{ number_format($inv->total_amount, 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
                @if(count($records) > 0)
                    <tr class="total-row">
                        <td colspan="6" class="text-right">TOTAL GÉNÉRAL FACTURÉ</td>
                        <td class="text-right amount">{{ number_format($totals['amount'], 0, ',', ' ') }}</td>
                    </tr>
                @endif
            </tbody>

        @elseif($reportType === 'PAYMENTS')
            <thead>
                <tr>
                    <th>Date d'encaissement</th>
                    <th>N° Reçu</th>
                    <th>Patient</th>
                    <th>Lié à la Facture</th>
                    <th>Méthode</th>
                    <th>Caissier(ère)</th>
                    <th class="text-right">Montant (FCFA)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($records as $pay)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($pay->created_at)->format('d/m/Y H:i') }}</td>
                        <td>REC-{{ str_pad($pay->id, 5, '0', STR_PAD_LEFT) }}</td>
                        <td>{{ $pay->invoice->patient->first_name }} {{ $pay->invoice->patient->last_name }}</td>
                        <td>INV-{{ str_pad($pay->invoice_id, 5, '0', STR_PAD_LEFT) }}</td>
                        <td>{{ $pay->payment_method }}</td>
                        <td>{{ $pay->reception->user->first_name ?? 'Admin' }}</td>
                        <td class="text-right amount">{{ number_format($pay->amount, 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
                @if(count($records) > 0)
                    <tr class="total-row">
                        <td colspan="6" class="text-right">TOTAL ENCAISSÉ</td>
                        <td class="text-right amount">{{ number_format($totals['paid'], 0, ',', ' ') }}</td>
                    </tr>
                @endif
            </tbody>

        @elseif($reportType === 'DEBTS')
            <thead>
                <tr>
                    <th>Date d'émission</th>
                    <th>N° Facture</th>
                    <th>Patient (Contact)</th>
                    <th>Centre</th>
                    <th class="text-right">Montant Facture</th>
                    <th class="text-right">Déjà Versé</th>
                    <th class="text-right" style="color:#ef4444;">Reste à Payer</th>
                </tr>
            </thead>
            <tbody>
                @foreach($records as $debt)
                    <tr>
                        <td>{{ \Carbon\Carbon::parse($debt->created_at)->format('d/m/Y') }}</td>
                        <td>INV-{{ str_pad($debt->id, 5, '0', STR_PAD_LEFT) }}</td>
                        <td>
                            {{ $debt->patient->first_name }} {{ $debt->patient->last_name }}<br>
                            <span style="font-size: 8px; color: #64748b;">Tél: {{ $debt->patient->contact_phone }}</span>
                        </td>
                        <td>{{ $debt->center->name ?? 'N/A' }}</td>
                        <td class="text-right amount">{{ number_format($debt->total_amount, 0, ',', ' ') }}</td>
                        <td class="text-right amount" style="color: #10b981;">{{ number_format($debt->paid_amount, 0, ',', ' ') }}</td>
                        <td class="text-right amount" style="color: #ef4444;">{{ number_format($debt->remaining_amount, 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
                @if(count($records) > 0)
                    <tr class="total-row">
                        <td colspan="4" class="text-right">TOTAUX DES CRÉANCES EN SOUFFRANCE</td>
                        <td class="text-right amount">{{ number_format($totals['amount'], 0, ',', ' ') }}</td>
                        <td class="text-right amount" style="color: #10b981;">{{ number_format($totals['paid'], 0, ',', ' ') }}</td>
                        <td class="text-right amount" style="color: #ef4444;">{{ number_format($totals['debt'], 0, ',', ' ') }}</td>
                    </tr>
                @endif
            </tbody>
        @endif

    </table>

    @if(count($records) === 0)
        <p class="text-center text-muted" style="margin-top: 30px;">Aucune donnée trouvée pour cette période et ce centre.</p>
    @endif

</body>
</html>