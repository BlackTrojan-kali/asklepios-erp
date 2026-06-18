<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport d'Inventaire</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #6366f1; /* Indigo pour les inventaires */
            padding-bottom: 10px;
        }
        .header h1 {
            color: #4338ca;
            margin: 0 0 5px 0;
            font-size: 22px;
        }
        .header p {
            color: #64748b;
            margin: 0;
            font-size: 11px;
        }
        .inventory-block {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .inventory-info {
            background-color: #eef2ff; /* Fond indigo très clair */
            border: 1px solid #c7d2fe;
            padding: 8px 12px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .inventory-info table {
            width: 100%;
            border: none;
        }
        .inventory-info td {
            padding: 2px;
            border: none;
            font-size: 11px;
        }
        .badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            color: #fff;
            text-transform: uppercase;
        }
        .bg-pending { background-color: #f59e0b; }
        .bg-validated { background-color: #10b981; }

        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        table.items-table th, table.items-table td {
            border: 1px solid #cbd5e1;
            padding: 6px;
            text-align: left;
        }
        table.items-table th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .font-mono { font-family: monospace; font-size: 11px; }

        /* Couleurs pour les écarts */
        .text-red { color: #dc2626; font-weight: bold; }
        .text-green { color: #059669; font-weight: bold; }
        .text-gray { color: #94a3b8; }
        
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
        <h1>Rapport Détaillé des Inventaires</h1>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

    @forelse($inventories as $inv)
        <div class="inventory-block">
            <div class="inventory-info">
                <table>
                    <tr>
                        <td width="30%"><strong>Inventaire N° :</strong> {{ $inv->id }}</td>
                        <td width="25%"><strong>Date :</strong> {{ $inv->execution_date->format('d/m/Y') }}</td>
                        <td width="25%"><strong>Succursale :</strong> {{ $inv->pharmacyBranch->name ?? 'N/A' }}</td>
                        <td width="20%" class="text-right">
                            @if($inv->status == 'PENDING') <span class="badge bg-pending">Brouillon</span>
                            @else <span class="badge bg-validated">Validé</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2"><strong>Réalisé par :</strong> {{ $inv->user->first_name ?? '' }} {{ $inv->user->last_name ?? '' }}</td>
                        <td colspan="2"><strong>Note :</strong> <i>{{ $inv->comment ?? 'Aucune' }}</i></td>
                    </tr>
                </table>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th width="35%">Désignation Article</th>
                        <th width="15%" class="text-center">Lot (Batch)</th>
                        <th width="14%" class="text-center">Emplacement</th>
                        <th width="12%" class="text-center">Qté Théorique</th>
                        <th width="12%" class="text-center">Qté Physique</th>
                        <th width="12%" class="text-center">Écart</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($inv->lines as $line)
                        <tr>
                            <td>{{ $line->batch->article->name ?? 'Article inconnu' }}</td>
                            <td class="text-center font-mono">{{ $line->batch->batch_number ?? 'N/A' }}</td>
                            <td class="text-center" style="font-size: 10px;">
                                {{ $line->storageLocation ? ($line->storageLocation->aisle . '-' . $line->storageLocation->shelf) : '-' }}
                            </td>
                            <td class="text-center font-mono">{{ $line->system_qty }}</td>
                            <td class="text-center font-mono"><strong>{{ $line->physical_qty }}</strong></td>
                            
                            <td class="text-center font-mono">
                                @if($line->descrepency < 0)
                                    <span class="text-red">{{ $line->descrepency }}</span>
                                @elseif($line->descrepency > 0)
                                    <span class="text-green">+{{ $line->descrepency }}</span>
                                @else
                                    <span class="text-gray">0</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @empty
        <p style="text-align: center; color: #777; margin-top: 50px;">Aucun inventaire trouvé pour cette période / succursale.</p>
    @endforelse

    <div class="footer">
        ERP Asklepios - Contrôle de gestion - Page <span class="page-number"></span>
    </div>

</body>
</html>