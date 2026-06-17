<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Piste d'Audit - Mouvements de Stock</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px; /* Légèrement plus petit car il y a beaucoup de colonnes */
            color: #333;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #3b82f6; /* Bleu neutre/professionnel */
            padding-bottom: 10px;
        }
        .header h1 {
            color: #1e293b;
            margin: 0 0 5px 0;
            font-size: 22px;
        }
        .header p {
            color: #64748b;
            margin: 0;
            font-size: 11px;
        }

        table.dataTable {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        table.dataTable th, table.dataTable td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
            vertical-align: middle;
        }
        table.dataTable th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
        }
        table.dataTable tr:nth-child(even) {
            background-color: #fdfdfd;
        }

        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .font-mono { font-family: monospace; font-size: 11px; }
        .font-bold { font-weight: bold; }

        /* Badges de sens du mouvement */
        .badge-entry {
            background-color: #dcfce7;
            color: #166534;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9px;
        }
        .badge-exit {
            background-color: #fee2e2;
            color: #991b1b;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9px;
        }
        
        .text-gray { color: #64748b; font-size: 9px; }

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
        <h1>Journal des Mouvements de Stock</h1>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }} | Piste d'audit sécurisée</p>
    </div>

    <table class="dataTable">
        <thead>
            <tr>
                <th width="12%">Date & Heure</th>
                <th width="8%" class="text-center">Sens</th>
                <th width="15%">Opération & Réf</th>
                <th width="30%">Article & Lot</th>
                <th width="8%" class="text-right">Quantité</th>
                <th width="10%" class="text-right">Stock Final</th>
                <th width="17%">Commentaire</th>
            </tr>
        </thead>
        <tbody>
            @forelse($movements as $m)
                @php
                    // Traduction des types d'opérations
                    $ops = [
                        'PURCHASE' => 'Achat Fourn.',
                        'RETURN' => 'Retour Fourn.',
                        'TRANSFER' => 'Transfert',
                        'INVENTORY' => 'Inventaire',
                        'SALE' => 'Vente',
                        'OTHER' => 'Autre'
                    ];
                    $operationName = $ops[$m->reference_type] ?? $m->reference_type;
                @endphp
                <tr>
                    <td class="font-mono text-gray" style="font-size: 10px;">
                        {{ $m->created_at->format('d/m/y H:i') }}<br>
                        <span style="font-size: 8px;">{{ $m->pharmacyBranch->name ?? '' }}</span>
                    </td>
                    
                    <td class="text-center">
                        @if($m->type === 'ENTRY')
                            <span class="badge-entry">+ ENTRÉE</span>
                        @else
                            <span class="badge-exit">- SORTIE</span>
                        @endif
                    </td>
                    
                    <td>
                        <span class="font-bold">{{ $operationName }}</span>
                        @if($m->reference_id)
                            <br><span class="font-mono text-gray">Réf: #{{ $m->reference_id }}</span>
                        @endif
                    </td>
                    
                    <td>
                        <span class="font-bold">{{ $m->batch->article->name ?? 'Article Inconnu' }}</span>
                        <br>
                        <span class="text-gray">
                            Lot: <span class="font-mono">{{ $m->batch->batch_number ?? 'N/A' }}</span>
                            @if($m->storageLocation)
                                | Zone: {{ $m->storageLocation->aisle }}
                            @endif
                        </span>
                    </td>
                    
                    <td class="text-right font-mono font-bold" style="{{ $m->type === 'ENTRY' ? 'color: #166534;' : 'color: #991b1b;' }}">
                        {{ $m->type === 'ENTRY' ? '+' : '-' }}{{ $m->qty }}
                    </td>
                    
                    <td class="text-right font-mono text-gray">
                        {{ $m->qty_in_stock }}
                    </td>
                    
                    <td style="font-size: 9px; color: #475569; font-style: italic;">
                        {{ $m->comment ?? '-' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 30px; color: #64748b;">
                        Aucun mouvement de stock trouvé pour la période / les critères sélectionnés.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        ERP Asklepios - Audit des Stocks - Page <span class="page-number"></span>
    </div>

</body>
</html>