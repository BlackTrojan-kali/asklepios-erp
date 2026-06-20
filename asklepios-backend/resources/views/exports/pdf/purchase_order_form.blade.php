<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bon de Commande #{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .mt-20 { margin-top: 20px; }
        
        /* En-tête */
        .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 30px; }
        .hospital-name { font-size: 20px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
        .doc-title { font-size: 24px; font-weight: bold; color: #4f46e5; text-transform: uppercase; }
        
        /* Adresses */
        .address-table { width: 100%; margin-bottom: 30px; }
        .address-box { border: 1px solid #cbd5e1; border-radius: 5px; padding: 15px; background-color: #f8fafc; }
        .address-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
        
        /* Table des articles */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th { background-color: #e2e8f0; color: #1e293b; padding: 10px; text-align: left; font-size: 11px; border: 1px solid #cbd5e1; }
        .items-table td { padding: 10px; border: 1px solid #cbd5e1; font-size: 11px; vertical-align: middle; }
        .items-table th.text-right, .items-table td.text-right { text-align: right; }
        
        /* Totaux */
        .totals-table { width: 50%; float: right; border-collapse: collapse; }
        .totals-table td { padding: 8px; border: 1px solid #cbd5e1; }
        .totals-table .total-row { background-color: #f1f5f9; font-weight: bold; font-size: 14px; color: #0f172a; }
        
        /* Signatures */
        .signature-table { width: 100%; margin-top: 80px; clear: both; }
        .signature-box { border-top: 1px dashed #94a3b8; width: 80%; margin: 0 auto; padding-top: 5px; text-align: center; color: #64748b; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td width="50%">
                <div class="hospital-name">{{ $order->hospital->name ?? 'Asclépios ERP' }}</div>
                <div style="color: #64748b; margin-top: 5px;">Département de Pharmacie</div>
                <div>Imprimé le : {{ date('d/m/Y') }}</div>
            </td>
            <td width="50%" class="text-right">
                <div class="doc-title">Bon de Commande</div>
                <div class="bold" style="font-size: 16px; margin-top: 5px;">N° BC-{{ str_pad($order->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div>Date : {{ $order->created_at->format('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <table class="address-table">
        <tr>
            <td width="48%" valign="top">
                <div class="address-box">
                    <div class="address-title">EXPÉDIÉ PAR (HÔPITAL)</div>
                    <div class="bold">{{ $order->hospital->name ?? 'N/A' }}</div>
                    <div>Destination : {{ $order->destinationPharmacy->name ?? 'Pharmacie Centrale' }}</div>
                    @if($order->destinationPharmacy && $order->destinationPharmacy->adress)
                        <div>Adresse : {{ $order->destinationPharmacy->adress }}</div>
                    @endif
                    <div class="mt-20 text-xs" style="color: #64748b;">Demandé par : {{ $order->user->name ?? 'Service Achats' }}</div>
                </div>
            </td>
            <td width="4%"></td> <td width="48%" valign="top">
                <div class="address-box">
                    <div class="address-title">À L'ATTENTION DE (FOURNISSEUR)</div>
                    <div class="bold" style="font-size: 14px;">{{ $order->provider->name ?? 'Fournisseur Inconnu' }}</div>
                    @if($order->provider)
                        @if($order->provider->contact_name) <div>Contact : {{ $order->provider->contact_name }}</div> @endif
                        @if($order->provider->email) <div>Email : {{ $order->provider->email }}</div> @endif
                        @if($order->provider->phone) <div>Tél : {{ $order->provider->phone }}</div> @endif
                        @if($order->provider->adress) <div>Adresse : {{ $order->provider->adress }}</div> @endif
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th width="5%">#</th>
                <th width="45%">Désignation de l'Article</th>
                <th width="15%" class="text-center">Qté</th>
                <th width="15%" class="text-right">Prix Unitaire</th>
                <th width="20%" class="text-right">Montant Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->lines as $index => $line)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>
                    <span class="bold">{{ $line->article->name ?? 'Article inconnu' }}</span>
                </td>
                <td class="text-center">{{ $line->qty_ordered }}</td>
                <td class="text-right">{{ number_format($line->unit_cost, 0, ',', ' ') }} FCFA</td>
                <td class="text-right">{{ number_format($line->qty_ordered * $line->unit_cost, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td width="50%" class="text-right">Sous-total :</td>
            <td width="50%" class="text-right">{{ number_format($order->total_amount, 0, ',', ' ') }} FCFA</td>
        </tr>
        <tr class="total-row">
            <td class="text-right">TOTAL NET :</td>
            <td class="text-right">{{ number_format($order->total_amount, 0, ',', ' ') }} FCFA</td>
        </tr>
    </table>

    <table class="signature-table">
        <tr>
            <td width="50%" valign="top">
                <div class="signature-box">
                    Signature & Cachet du Fournisseur<br>
                    <span style="font-size: 9px;">(Pour acceptation de la commande)</span>
                </div>
            </td>
            <td width="50%" valign="top">
                <div class="signature-box">
                    Visa de la Direction / Pharmacien en chef
                </div>
            </td>
        </tr>
    </table>

</body>
</html>