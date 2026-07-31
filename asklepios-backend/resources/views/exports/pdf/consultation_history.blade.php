<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des Consultations</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #003366; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #003366; font-size: 20px; text-transform: uppercase; }
        .header p { margin: 5px 0 0 0; color: #666; font-size: 11px; }
        
        /* Section Statistiques */
        .stats-container { display: table; width: 100%; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px; }
        .stat-box { display: table-cell; text-align: center; width: 25%; border-right: 1px solid #e2e8f0; }
        .stat-box:last-child { border-right: none; }
        .stat-title { font-size: 10px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
        .stat-value { font-size: 16px; color: #0f172a; font-weight: bold; }
        .text-blue { color: #2563eb; }
        .text-green { color: #16a34a; }
        .text-orange { color: #d97706; }

        /* Tableau */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #003366; color: white; text-align: left; padding: 8px; font-size: 11px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 11px; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        .badge { padding: 3px 6px; border-radius: 10px; font-size: 9px; font-weight: bold; color: white; }
        .badge-success { background-color: #10b981; }
        .badge-warning { background-color: #f59e0b; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Rapport Global des Consultations</h1>
        <p>Généré le {{ date('d/m/Y à H:i') }} par {{ $user->first_name }} {{ $user->last_name }}</p>
        @if(isset($filters['start_date']) && isset($filters['end_date']))
            <p>Période : Du {{ date('d/m/Y', strtotime($filters['start_date'])) }} au {{ date('d/m/Y', strtotime($filters['end_date'])) }}</p>
        @endif
    </div>

    <!-- Statistiques -->
    <div class="stats-container">
        <div class="stat-box">
            <div class="stat-title">Total Consultations</div>
            <div class="stat-value text-blue">{{ number_format($totalConsultations, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">Chiffre d'Affaires</div>
            <div class="stat-value text-green">{{ number_format($totalRevenue, 0, ',', ' ') }} XAF</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">Facturées</div>
            <div class="stat-value">{{ number_format($totalBilled, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">En Attente de Facturation</div>
            <div class="stat-value text-orange">{{ number_format($totalUnbilled, 0, ',', ' ') }}</div>
        </div>
    </div>

    <!-- Tableau détaillé -->
    <table>
        <thead>
            <tr>
                <th>Date & Heure</th>
                <th>Patient</th>
                <th>Médecin Traitant</th>
                <th>Centre & Dpt.</th>
                <th>Motif Principal</th>
                <th style="text-align: right;">Montant</th>
                <th style="text-align: center;">Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($consultations as $c)
                <tr>
                    <td>{{ $c->created_at->format('d/m/Y H:i') }}</td>
                    
                    <td>
                        <strong>{{ $c->patientVisit->patient->first_name ?? 'Inconnu' }} {{ $c->patientVisit->patient->last_name ?? '' }}</strong><br>
                        <span style="color: #64748b; font-size: 9px;">ID: {{ $c->patientVisit->patient->id ?? '-' }}</span>
                    </td>
                    
                    <td>
                        Dr. {{ $c->doctor->user->first_name ?? '' }} {{ $c->doctor->user->last_name ?? '' }}
                    </td>
                    
                    <td>
                        {{ $c->patientVisit->center->name ?? 'Centre Non défini' }}<br>
                        <span style="color: #64748b; font-size: 9px;">
                            Dpt: {{ $c->patientVisit->consultingRoom->department->name ?? 'Général' }}
                        </span>
                    </td>
                    
                    <td style="max-width: 150px;">
                        {{ Str::limit($c->chief_complaint ?? 'Non renseigné', 40) }}
                    </td>
                    
                    <td style="text-align: right; font-weight: bold;">
                        {{ number_format($c->consultation_price, 0, ',', ' ') }} XAF
                    </td>
                    
                    <td style="text-align: center;">
                        @if($c->is_billed)
                            <span class="badge badge-success">Facturé</span>
                        @else
                            <span class="badge badge-warning">Non Facturé</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">Aucune consultation trouvée pour ces critères.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>