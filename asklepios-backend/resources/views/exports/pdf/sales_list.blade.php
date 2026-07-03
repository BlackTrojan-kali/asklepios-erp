<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des Ventes POS</title>
    <style>
        @page {
            margin: 25px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #334155;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        
        .header-container {
            border-bottom: 3px solid #059669;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .hospital-title {
            font-size: 16px;
            font-weight: 800;
            color: #065f46;
            text-transform: uppercase;
        }
        .report-title {
            font-size: 18px;
            font-weight: 900;
            color: #059669;
            text-transform: uppercase;
            margin: 0;
        }
        .report-meta {
            font-size: 9px;
            color: #475569;
            margin-top: 5px;
        }
        
        .sales-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .sales-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 8px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
        }
        .sales-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .sales-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        
        .total-row {
            background-color: #ecfdf5 !important;
            font-weight: bold;
            color: #065f46;
            border-top: 2px solid #a7f3d0;
            border-bottom: 2px solid #a7f3d0;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            color: #94a3b8;
            font-size: 8px;
        }
    </style>
</head>
<body>

    <table width="100%" class="header-container">
        <tr>
            <td width="60%">
                <div class="hospital-title">Asclépios ERP</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
                    Rapport de Supervision des Ventes Point de Vente (POS)
                </div>
            </td>
            <td width="40%" class="text-right">
                <h1 class="report-title">Supervision POS</h1>
                <div class="report-meta">
                    Généré le : {{ date('d/m/Y H:i') }}
                </div>
            </td>
        </tr>
    </table>

    <table class="sales-table">
        <thead>
            <tr>
                <th width="12%">Ticket N°</th>
                <th width="15%">Date / Heure</th>
                <th width="15%">Succursale</th>
                <th width="12%">Caisse</th>
                <th width="15%">Client</th>
                <th width="15%">Vendeur</th>
                <th width="8%" class="text-center">Règlement</th>
                <th width="10%" class="text-right">Montant</th>
            </tr>
        </thead>
        <tbody>
            @php 
                $currency = $sales->first()->session->register->branch->country->currency ?? 'XAF';
            @endphp
            @foreach($sales as $sale)
                <tr>
                    <td class="bold">{{ $sale->receipt_number }}</td>
                    <td>{{ $sale->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $sale->branch->name ?? 'N/A' }}</td>
                    <td>{{ $sale->session->register->name ?? 'N/A' }}</td>
                    <td>{{ $sale->customer_name }}</td>
                    <td>{{ $sale->session->user ? ($sale->session->user->first_name . ' ' . $sale->session->user->last_name) : 'Caissier' }}</td>
                    <td class="text-center">{{ $sale->payment_method }}</td>
                    <td class="text-right bold font-mono">{{ number_format($sale->total_amount, 0, ',', ' ') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="7" class="text-right bold">TOTAL CUMULÉ :</td>
                <td class="text-right bold font-mono">{{ number_format($totalAmountSum, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Asclépios ERP - Logiciel de gestion hospitalière intégré • Supervision Administrative du Point de Vente
    </div>

</body>
</html>
