<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport des Hospitalisations</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #4f46e5; font-size: 20px; text-transform: uppercase; }
        .header p { margin: 5px 0 0 0; color: #666; font-size: 11px; }
        
        /* Section Statistiques */
        .stats-container { display: table; width: 100%; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px; }
        .stat-box { display: table-cell; text-align: center; width: 20%; border-right: 1px solid #e2e8f0; }
        .stat-box:last-child { border-right: none; }
        .stat-title { font-size: 9px; color: #64748b; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
        .stat-value { font-size: 16px; color: #0f172a; font-weight: bold; }
        .text-blue { color: #2563eb; }
        .text-indigo { color: #4f46e5; }
        .text-green { color: #16a34a; }
        .text-orange { color: #d97706; }

        /* Tableau */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #4f46e5; color: white; text-align: left; padding: 8px; font-size: 10px; }
        td { border-bottom: 1px solid #e2e8f0; padding: 8px; font-size: 10px; vertical-align: top; }
        tr:nth-child(even) { background-color: #f8fafc; }
        
        .badge { padding: 3px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; color: white; display: inline-block;}
        .badge-success { background-color: #10b981; }
        .badge-warning { background-color: #f59e0b; }
        .badge-info { background-color: #3b82f6; }
        .badge-secondary { background-color: #64748b; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Rapport d'Activité : Hospitalisations</h1>
        <p>Généré le {{ date('d/m/Y à H:i') }} par {{ $user->first_name }} {{ $user->last_name }}</p>
        @if(isset($filters['start_date']) && isset($filters['end_date']))
            <p>Période d'admission : Du {{ date('d/m/Y', strtotime($filters['start_date'])) }} au {{ date('d/m/Y', strtotime($filters['end_date'])) }}</p>
        @endif
    </div>

    <!-- Statistiques -->
    <div class="stats-container">
        <div class="stat-box">
            <div class="stat-title">Total Admissions</div>
            <div class="stat-value text-indigo">{{ number_format($totalAdmissions, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">En Cours d'Hospit.</div>
            <div class="stat-value text-blue">{{ number_format($totalAdmitted, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">Patients Libérés</div>
            <div class="stat-value text-green">{{ number_format($totalDischarged, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">Dossiers Facturés</div>
            <div class="stat-value">{{ number_format($totalBilled, 0, ',', ' ') }}</div>
        </div>
        <div class="stat-box">
            <div class="stat-title">Non Facturés</div>
            <div class="stat-value text-orange">{{ number_format($totalUnbilled, 0, ',', ' ') }}</div>
        </div>
    </div>

    <!-- Tableau détaillé -->
    <table>
        <thead>
            <tr>
                <th>Admission</th>
                <th>Patient</th>
                <th>Chambre & Lit</th>
                <th>Médecin Resp.</th>
                <th>Motif Principal</th>
                <th style="text-align: center;">Statut Méd.</th>
                <th style="text-align: center;">Facturation</th>
            </tr>
        </thead>
        <tbody>
            @forelse($admissions as $a)
                <tr>
                    <td>
                        <strong>{{ \Carbon\Carbon::parse($a->admission_date)->format('d/m/Y H:i') }}</strong><br>
                        <span style="color: #64748b;">Sortie : {{ $a->actual_discharge_date ? \Carbon\Carbon::parse($a->actual_discharge_date)->format('d/m/Y') : 'En cours' }}</span>
                    </td>
                    
                    <td>
                        <strong>{{ $a->patient->first_name ?? 'Inconnu' }} {{ $a->patient->last_name ?? '' }}</strong><br>
                        <span style="color: #64748b;">ID: {{ $a->patient->id ?? '-' }}</span>
                    </td>
                    
                    <td>
                        {{ $a->bed->room->name ?? 'Chambre N/A' }}<br>
                        <span style="color: #64748b;">
                            Lit: {{ $a->bed->bed_number ?? '-' }} <br>
                            Dpt: {{ $a->bed->room->department->name ?? '-' }}
                        </span>
                    </td>

                    <td>
                        Dr. {{ $a->doctor->user->first_name ?? 'Non' }} {{ $a->doctor->user->last_name ?? 'Assigné' }}
                    </td>
                    
                    <td style="max-width: 150px;">
                        {{ Str::limit($a->reason_for_admission ?? 'Non renseigné', 35) }}
                    </td>
                    
                    <td style="text-align: center;">
                        @if($a->status === 'ADMITTED')
                            <span class="badge badge-info">En cours</span>
                        @else
                            <span class="badge badge-secondary">Libéré</span>
                        @endif
                    </td>

                    <td style="text-align: center;">
                        @if($a->is_billed)
                            <span class="badge badge-success">Facturé</span>
                        @else
                            <span class="badge badge-warning">Non Facturé</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px;">Aucune hospitalisation trouvée pour ces critères.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>