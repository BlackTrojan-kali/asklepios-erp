<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Export Catalogue Articles</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #00a896;
            padding-bottom: 10px;
        }
        .header h1 {
            color: #003366;
            margin: 0;
            font-size: 18px;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f8fafc;
            color: #003366;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
        }
        .batch-table {
            width: 100%;
            border: none;
            margin: 0;
        }
        .batch-table th, .batch-table td {
            border: none;
            border-bottom: 1px dashed #eee;
            padding: 2px 4px;
            font-size: 8px;
        }
        .batch-table tr:last-child td {
            border-bottom: none;
        }
        .badge {
            display: inline-block;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
        }
        .badge-rx { background-color: #fee2e2; color: #991b1b; }
        .badge-normal { background-color: #f3f4f6; color: #374151; }
        .footer {
            position: fixed;
            bottom: -20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #999;
        }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>

    <div class="header">
        <h1>Catalogue des Articles - Inventaire Complet</h1>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th width="20%">Article</th>
                <th width="12%">Catégorie</th>
                <th width="10%">Code-Barres</th>
                <th width="8%">Prix Défaut</th>
                <th width="8%">Ordonnance</th>
                <th width="42%">Lots associés (N° Lot | Péremption | Prix Achat)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($articles as $article)
                <tr>
                    <td>
                        <strong>{{ $article->name }}</strong><br>
                        <span style="color:#666; font-size:8px;">Min Global: {{ $article->global_min_qty }}</span>
                    </td>
                    <td>{{ $article->category->name ?? 'N/A' }}</td>
                    <td>{{ $article->barcode ?? 'N/A' }}</td>
                    <td>{{ number_format($article->default_selling_price, 0, ',', ' ') }} FCFA</td>
                    <td>
                        @if($article->is_prescripted)
                            <span class="badge badge-rx">OUI (Rx)</span>
                        @else
                            <span class="badge badge-normal">NON</span>
                        @endif
                    </td>
                    <td style="padding: 0;">
                        @if($article->batches->count() > 0)
                            <table class="batch-table">
                                @foreach($article->batches as $batch)
                                    <tr>
                                        <td width="40%"><strong>{{ $batch->batch_number }}</strong></td>
                                        <td width="30%">
                                            @if($batch->expire_date)
                                                {{ \Carbon\Carbon::parse($batch->expire_date)->format('d/m/Y') }}
                                            @else
                                                <span style="color:#999;">Pas de date</span>
                                            @endif
                                        </td>
                                        <td width="30%">{{ number_format($batch->purchase_price, 0, ',', ' ') }} FCFA</td>
                                    </tr>
                                @endforeach
                            </table>
                        @else
                            <div style="padding: 4px; color: #999; font-size:8px;">Aucun lot enregistré</div>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px;">Aucun article ne correspond à ces critères.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Asklepios ERP - Page <span class="page-number"></span>
    </div>

</body>
</html>