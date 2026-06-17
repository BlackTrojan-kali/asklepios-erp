<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Historique Détaillé des Retours Fournisseurs</title>
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
            border-bottom: 2px solid #e11d48; /* Rouge pour les retours */
            padding-bottom: 10px;
        }
        .header h1 {
            color: #e11d48;
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
            page-break-inside: avoid;
        }
        .order-info {
            background-color: #fff1f2; /* Fond légèrement rouge */
            border: 1px solid #fecdd3;
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
        .bg-shipped { background-color: #10b981; }
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
        <h1>Historique Détaillé des Retours</h1>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

    @forelse($returns as $r)
        <div class="order-block">
            <div class="order-info">
                <table>
                    <tr>
                        <td width="33%"><strong>Retour N° :</strong> {{ $r->id }}</td>
                        <td width="33%"><strong>Date :</strong> {{ $r->return_date->format('d/m/Y') }}</td>
                        <td width="34%" class="text-right">
                            <strong>Statut :</strong> 
                            @if($r->status == 'PENDING') <span class="badge bg-pending">En attente</span>
                            @elseif($r->status == 'SHIPPED') <span class="badge bg-shipped">Expédié</span>
                            @elseif($r->status == 'CANCELLED') <span class="badge bg-cancelled">Annulé</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Fournisseur :</strong> {{ $r->provider->name ?? 'N/A' }}</td>
                        <td colspan="2">
                            <strong>Commande d'origine :</strong> 
                            {{ $r->purchase_order_id ? '#' . $r->purchase_order_id : 'Non liée' }}
                        </td>
                    </tr>
                </table>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th width="35%">Article Renvoyé</th>
                        <th width="15%" class="text-center">Lot (Batch)</th>
                        <th width="15%" class="text-center">Qté Retournée</th>
                        <th width="35%">Motif</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($r->lines as $line)
                        <tr>
                            <td>{{ $line->article->name ?? 'Article inconnu' }}</td>
                            <td class="text-center font-mono">{{ $line->batch->batch_number ?? 'N/A' }}</td>
                            <td class="text-center text-red">{{ $line->qty_returned }}</td>
                            <td>{{ $line->reason ?? 'Non précisé' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @empty
        <p style="text-align: center; color: #777; margin-top: 50px;">Aucun retour trouvé pour les critères sélectionnés.</p>
    @endforelse

    <div class="footer">
        ERP Asklepios - Page <span class="page-number"></span>
    </div>

</body>
</html>