<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Liste des Bordereaux d'Assurance</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #00a896; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #00a896; font-size: 20px; text-transform: uppercase; }
        .header p { margin: 5px 0 0 0; color: #666; font-size: 11px; }
        
        .stats-container { display: table; width: 100%; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px; }
        .stat-box { display: table-cell; text-align: center; width: 50%; border-right: 1px solid #e2e8f0; }
        .stat-box:last-child { border-right: none; }
        .stat-title { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
        .stat-value { font-size: 16px; color: #0f172a; font-weight: bold; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #00a896; color: white; text-align: left; padding: 8px; font-size: 11px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 11px; vertical-align: middle; }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        .badge { padding: 3px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; color: white; }
        .badge-draft { background-color: #64748b; }
        .badge-submitted { background-color: #3b82f6; }
        .badge-paid { background-color: #10b981; }
        .badge-disputed { background-color: #ef4444; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Rapport des Bordereaux d'Assurance</h1>
        <p>Généré le {{ date('d/m/Y à H:i') }} par {{ $user->first_name }} {{ $user->last_name }}</p>
    </div>

    <!-- Statistiques Globales -->
    <div class="stats-container">
        <div class="stat-box">
            <div class="stat-title">Total Bordereaux</div>
            <div class="stat-value">{{ number_format($totalClaims, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">Montant Total Réclamé</div>
            <div class="stat-value" style="color: #00a896;">{{ number_format($totalAmount, 0, ',', ' ') }} XAF</div>
        </div>
    </div>

    <!-- Tableau -->
    <table>
        <thead>
            <tr>
                <th>Réf. / ID</th>
                <th>Assurance</th>
                <th>Centre</th>
                <th>Mois</th>
                <th style="text-align: center;">Nbr Factures</th>
                <th style="text-align: right;">Montant Total</th>
                <th style="text-align: center;">Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($claims as $c)
                <tr>
                    <td>
                        <strong>{{ $c->claim_refence ?? 'N/A' }}</strong><br>
                        <span style="color: #64748b; font-size: 9px;">ID SYS: {{ $c->id }}</span>
                    </td>
                    <td>{{ $c->insuranceCompany->name ?? 'Inconnue' }}</td>
                    <td>{{ $c->center->name ?? 'Général' }}</td>
                    <td>{{ $c->claim_month ? $c->claim_month->format('m/Y') : '-' }}</td>
                    <td style="text-align: center;">{{ $c->invoice_splits_count ?? 0 }}</td>
                    <td style="text-align: right; font-weight: bold;">
                        {{ number_format($c->total_claim_amount, 0, ',', ' ') }} XAF
                    </td>
                    <td style="text-align: center;">
                        @if($c->status === 'DRAFT') <span class="badge badge-draft">Brouillon</span>
                        @elseif($c->status === 'SUBMITTED') <span class="badge badge-submitted">Soumis</span>
                        @elseif($c->status === 'PAID') <span class="badge badge-paid">Payé</span>
                        @elseif($c->status === 'DISPUTED') <span class="badge badge-disputed">Litige</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">Aucun bordereau trouvé pour ces critères.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>