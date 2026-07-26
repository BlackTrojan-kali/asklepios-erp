<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Liste des Prix d'Articles</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #334155;
            margin: 20px;
            line-height: 1.4;
        }
        .header {
            border-bottom: 2px solid #0d9488;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 18px;
            font-weight: 850;
            color: #0f766e;
            text-transform: uppercase;
            margin: 0;
        }
        .meta {
            font-size: 9px;
            color: #64748b;
            margin-top: 5px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table th {
            background-color: #f1f5f9;
            color: #0f766e;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: left;
            border-bottom: 2px solid #cbd5e1;
        }
        .table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    <div class="header">
        <table width="100%">
            <tr>
                <td>
                    <h1 class="title">Fiche Tarifaire des Articles</h1>
                    <div class="meta">
                        Asclépios ERP • Grille de prix de vente pharmacie
                    </div>
                </td>
                <td class="text-right">
                    <div style="font-size: 12px; font-weight: bold; color: #0d9488;">
                        {{ $hasMultipleBranches ? 'Toutes les succursales' : ($branch->name ?? 'Succursale Locale') }}
                    </div>
                    <div class="meta">
                        Généré le : {{ date('d/m/Y H:i') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="table">
        <thead>
            <tr>
                @if($hasMultipleBranches)
                    <th width="35%">Pharmacie / Succursale</th>
                    <th width="45%">Nom de l'Article</th>
                    <th width="20%" class="text-right">Prix de Vente</th>
                @else
                    <th width="75%">Nom de l'Article</th>
                    <th width="25%" class="text-right">Prix de Vente</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @foreach($exportData as $row)
                <tr>
                    @if($hasMultipleBranches)
                        <td style="font-weight: 600; color: #475569;">{{ $row['Pharmacie'] }}</td>
                        <td>{{ $row['Article'] }}</td>
                        <td class="text-right" style="font-weight: bold; font-family: monospace;">{{ $row['Prix de Vente'] }}</td>
                    @else
                        <td>{{ $row['Article'] }}</td>
                        <td class="text-right" style="font-weight: bold; font-family: monospace;">{{ $row['Prix de Vente'] }}</td>
                    @endif
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Asclépios ERP - Solution intégrée de gestion hospitalière et de facturation pharmacie.
    </div>

</body>
</html>
