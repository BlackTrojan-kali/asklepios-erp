<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Historique Détaillé des Commandes</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #00a896;
            padding-bottom: 10px;
        }
        .header h1 {
            color: #00a896;
            margin: 0 0 5px 0;
            font-size: 24px;
        }
        .header p {
            color: #777;
            margin: 0;
            font-size: 12px;
        }
        .order-block {
            margin-bottom: 40px;
            page-break-inside: avoid; /* Évite de couper une commande en deux sur 2 pages */
        }
        .order-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 15px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .order-info table {
            width: 100%;
            border: none;
        }
        .order-info td {
            padding: 2px;
            border: none;
        }
        .order-info strong {
            color: #1e293b;
        }
        .badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            color: #fff;
            text-transform: uppercase;
        }
        .bg-pending { background-color: #f59e0b; }
        .bg-partial { background-color: #3b82f6; }
        .bg-received { background-color: #10b981; }
        .bg-cancelled { background-color: #ef4444; }

        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        table.items-table th, table.items-table td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
        }
        table.items-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .text-red { color: #ef4444; font-weight: bold; }
        .text-green { color: #10b981; }
        
        .order-total {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            color: #0f172a;
        }
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            height: 30px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
        }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>

    <div class="header">
        <h1>Historique Détaillé des Commandes</h1>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

    @forelse($orders as $order)
        <div class="order-block">
            <div class="order-info">
                <table>
                    <tr>
                        <td width="33%"><strong>Commande :</strong> #{{ $order->id }}</td>
                        <td width="33%"><strong>Date :</strong> {{ $order->created_at->format('d/m/Y') }}</td>
                        <td width="34%" class="text-right">
                            <strong>Statut :</strong> 
                            @if($order->status == 'PENDING') <span class="badge bg-pending">En attente</span>
                            @elseif($order->status == 'PARTIALLY_RECEIVED') <span class="badge bg-partial">Partielle</span>
                            @elseif($order->status == 'RECEIVED') <span class="badge bg-received">Reçue</span>
                            @elseif($order->status == 'CANCELLED') <span class="badge bg-cancelled">Annulée</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Fournisseur :</strong> {{ $order->provider->name ?? 'N/A' }}</td>
                        <td colspan="2"><strong>Initiée par :</strong> {{ $order->user->first_name ?? 'N/A' }}</td>
                    </tr>
                </table>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th width="40%">Désignation Article</th>
                        <th width="10%" class="text-center">Qté Cmd</th>
                        <th width="10%" class="text-center">Qté Reçue</th>
                        <th width="15%" class="text-center">Écart (Manquant)</th>
                        <th width="12%" class="text-right">Prix U.</th>
                        <th width="13%" class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($order->lines as $line)
                        @php
                            $ecart = max(0, $line->qty_ordered - $line->qty_received);
                            $totalLigne = $line->qty_ordered * $line->unit_cost;
                        @endphp
                        <tr>
                            <td>{{ $line->article->name ?? 'Article inconnu' }}</td>
                            <td class="text-center">{{ $line->qty_ordered }}</td>
                            <td class="text-center">{{ $line->qty_received }}</td>
                            <td class="text-center">
                                @if($ecart > 0)
                                    <span class="text-red">- {{ $ecart }}</span>
                                @else
                                    <span class="text-green">OK</span>
                                @endif
                            </td>
                            <td class="text-right">{{ number_format($line->unit_cost, 0, ',', ' ') }}</td>
                            <td class="text-right">{{ number_format($totalLigne, 0, ',', ' ') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="order-total">
                Montant Total Commandé : {{ number_format($order->total_amount, 0, ',', ' ') }} FCFA
            </div>
        </div>
    @empty
        <p style="text-align: center; color: #777; margin-top: 50px;">Aucune commande trouvée pour les critères sélectionnés.</p>
    @endforelse

    <div class="footer">
        ERP Asklepios - Page <span class="page-number"></span>
    </div>

</body>
</html>