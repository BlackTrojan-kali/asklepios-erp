<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture de Vente #{{ str_pad($sale->id, 6, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            margin: 20px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #334155;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .mb-5 { margin-bottom: 5px; }
        .mb-10 { margin-bottom: 10px; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
        
        /* En-tête professionnel */
        .header-container {
            border-bottom: 2px solid #059669; /* Emerald color for pharmacy theme */
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .hospital-title {
            font-size: 18px;
            font-weight: 800;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .branch-info {
            color: #64748b;
            font-size: 10px;
            margin-top: 3px;
        }
        .invoice-title {
            font-size: 20px;
            font-weight: 900;
            color: #059669;
            text-transform: uppercase;
            margin: 0;
        }
        .invoice-meta {
            font-size: 10px;
            color: #475569;
            margin-top: 5px;
        }

        /* Section Infos Client & Session */
        .details-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .details-box {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
            background-color: #f8fafc;
            min-height: 70px;
        }
        .details-title {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
        }
        .details-content {
            font-size: 10.5px;
            color: #1e293b;
        }

        /* Table des articles */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 8px 10px;
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
        }
        .items-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10.5px;
            vertical-align: middle;
        }
        .items-table tr:nth-child(even) td {
            background-color: #fafafa;
        }
        .items-table th.text-right, .items-table td.text-right {
            text-align: right;
        }
        .items-table th.text-center, .items-table td.text-center {
            text-align: center;
        }

        /* Totaux */
        .summary-container {
            width: 100%;
            margin-top: 10px;
        }
        .totals-table {
            width: 45%;
            float: right;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .totals-table td {
            padding: 6px 8px;
            font-size: 10.5px;
            border-bottom: 1px solid #e2e8f0;
        }
        .totals-table .net-to-pay {
            background-color: #ecfdf5;
            font-weight: bold;
            font-size: 12px;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .totals-table .received-row {
            font-size: 10.5px;
            color: #475569;
        }
        .totals-table .change-row {
            font-weight: bold;
            font-size: 11px;
            color: #b45309;
        }

        /* Pied de page */
        .footer {
            clear: both;
            margin-top: 50px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            color: #64748b;
        }
        .footer-message {
            font-size: 11px;
            font-weight: bold;
            color: #065f46;
            margin-bottom: 5px;
        }
        .footer-small {
            font-size: 9px;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    <!-- En-tête -->
    <table class="header-container" width="100%">
        <tr>
            <td width="60%" valign="middle">
                <div class="hospital-title">{{ $sale->branch->hospital->name ?? 'Asclépios ERP' }}</div>
                <div class="branch-info">
                    {{ $sale->branch->name }}<br>
                    @if($sale->branch->adress) Adresse : {{ $sale->branch->adress }}<br> @endif
                    Tél : {{ $sale->branch->phone ?? 'N/A' }}
                </div>
            </td>
            <td width="40%" class="text-right" valign="middle">
                <h1 class="invoice-title">Facture de Vente</h1>
                <div class="invoice-meta">
                    <span class="bold">N° :</span> FA-{{ str_pad($sale->id, 6, '0', STR_PAD_LEFT) }}<br>
                    <span class="bold">Date :</span> {{ $sale->created_at->format('d/m/Y H:i') }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Informations complémentaires -->
    <table class="details-table" width="100%">
        <tr>
            <td width="48%" valign="top">
                <div class="details-box">
                    <div class="details-title">Informations Patient / Client</div>
                    <div class="details-content">
                        <span class="bold">Nom :</span> {{ $sale->customer_name }}<br>
                        @if($sale->has_prescription)
                            <span class="bold" style="color: #ef4444;">Prescription obligatoire</span><br>
                            @if($sale->prescription_ref)
                                <span class="bold">Réf Ordonnance :</span> {{ $sale->prescription_ref }}
                            @endif
                        @else
                            <span class="italic text-slate-500">Sans ordonnance</span>
                        @endif
                    </div>
                </div>
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top">
                <div class="details-box">
                    <div class="details-title">Détails de Caisse</div>
                    <div class="details-content">
                        <span class="bold">Caisse :</span> {{ $sale->session->register->name ?? 'N/A' }}<br>
                        <span class="bold">Opérateur :</span> {{ $sale->session->user ? ($sale->session->user->first_name . ' ' . $sale->session->user->last_name) : 'Caissier' }}<br>
                        <span class="bold">Mode Règlement :</span> 
                        @if($sale->payment_method === 'CASH')
                            Espèces
                        @elseif($sale->payment_method === 'MOBILE_MONEY')
                            Mobile Money (Orange/MTN)
                        @elseif($sale->payment_method === 'CARD')
                            Carte Bancaire
                        @else
                            {{ $sale->payment_method }}
                        @endif
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- Tableau des articles vendus -->
    <table class="items-table">
        <thead>
            <tr>
                <th width="5%">#</th>
                <th width="45%">Désignation</th>
                <th width="12%" class="text-center">Qté</th>
                <th width="15%" class="text-right">Prix Unit.</th>
                <th width="10%" class="text-center">Rem. %</th>
                <th width="13%" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @php 
                $subtotal_raw = 0;
                $total_discount = 0;
                $currency = $sale->branch->country->currency ?? 'FCFA';
            @endphp
            @foreach($sale->items as $index => $item)
                @php
                    $item_raw = $item->qty * $item->unit_price;
                    $item_discount = $item_raw * ($item->discount / 100);
                    $subtotal_raw += $item_raw;
                    $total_discount += $item_discount;
                @endphp
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>
                        <span class="bold">{{ $item->article->name ?? 'Article inconnu' }}</span>
                        @if($item->batch)
                            <div style="font-size: 8.5px; color: #64748b; margin-top: 1px;">
                                Lot : {{ $item->batch->batch_number }} | Périm : {{ $item->batch->expire_date ? $item->batch->expire_date->format('d/m/Y') : 'N/A' }}
                            </div>
                        @endif
                    </td>
                    <td class="text-center">{{ $item->qty }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 0, ',', ' ') }}</td>
                    <td class="text-center">{{ $item->discount > 0 ? $item->discount . '%' : '-' }}</td>
                    <td class="text-right">{{ number_format($item->sub_total, 0, ',', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Bloc des totaux à droite -->
    <div class="summary-container">
        <table class="totals-table">
            <tr>
                <td width="50%">Total Brut :</td>
                <td width="50%" class="text-right">{{ number_format($subtotal_raw, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            @if($total_discount > 0)
            <tr>
                <td>Remise cumulée :</td>
                <td class="text-right text-amber-700">- {{ number_format($total_discount, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            @endif
            <tr class="net-to-pay">
                <td>Net à Payer :</td>
                <td class="text-right">{{ number_format($sale->total_amount, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            @if($sale->payment_method === 'CASH')
                <tr class="received-row">
                    <td>Montant perçu :</td>
                    <td class="text-right">{{ number_format($sale->amount_received ?? $sale->total_amount, 0, ',', ' ') }} {{ $currency }}</td>
                </tr>
                <tr class="change-row">
                    <td>Monnaie rendue :</td>
                    <td class="text-right">{{ number_format($sale->change_due ?? 0, 0, ',', ' ') }} {{ $currency }}</td>
                </tr>
            @endif
        </table>
    </div>

    <!-- Pied de page -->
    <div class="footer">
        <div class="footer-message">Merci de votre confiance. Bonne guérison !</div>
        <div class="footer-small">
            Asclépios ERP - Solution de Gestion de Santé Intégrée<br>
            Facture émise électroniquement par le point de vente et faisant foi.
        </div>
    </div>

</body>
</html>
