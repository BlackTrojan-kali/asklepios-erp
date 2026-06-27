<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Calendrier des Rendez-vous - Asklepios</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 12px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00a896; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #1e293b; font-size: 24px; }
        .date-section { margin-top: 25px; margin-bottom: 10px; background-color: #f1f5f9; padding: 8px; border-left: 4px solid #00a896; font-size: 16px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 10px; border: 1px solid #e2e8f0; text-align: left; }
        th { background-color: #f8fafc; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 10px; }
        .time { font-weight: bold; color: #0f172a; }
        .status-SCHEDULED { color: #2563eb; font-weight: bold; }
        .status-CANCELLED { color: #dc2626; font-weight: bold; text-decoration: line-through; }
        .status-ARRIVED { color: #16a34a; font-weight: bold; }
        .patient-name { font-weight: bold; color: #1e293b; }
        .doctor-name { font-size: 11px; color: #64748b; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Calendrier Visuel des Rendez-vous</h1>
        <p>Filtre appliqué : {{ $date_filter }}</p>
        <p>Édité le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

    @forelse($groupedAppointments as $date => $appointments)
        
        <div class="date-section">
            📅 Journée du {{ \Carbon\Carbon::parse($date)->translatedFormat('l d F Y') }}
        </div>

        <table>
            <thead>
                <tr>
                    <th width="10%">Heure</th>
                    <th width="30%">Patient</th>
                    <th width="25%">Médecin</th>
                    <th width="20%">Motif</th>
                    <th width="15%">Statut</th>
                </tr>
            </thead>
            <tbody>
                @foreach($appointments as $app)
                <tr>
                    <td class="time">{{ $app->scheduled_datetime->format('H:i') }}</td>
                    <td>
                        <span class="patient-name">{{ $app->patient->first_name }} {{ $app->patient->last_name }}</span><br>
                        <span style="font-size: 10px; color: #64748b;">Code: {{ $app->patient->patient_code }}</span>
                    </td>
                    <td>
                        <span class="doctor-name">Dr. {{ $app->doctor->user->first_name ?? 'Inconnu' }}</span><br>
                        <span style="font-size: 10px; color: #64748b;">Centre: {{ $app->center->name }}</span>
                    </td>
                    <td>{{ $app->reason ?? 'Non spécifié' }}</td>
                    <td class="status-{{ $app->status }}">
                        @if($app->status === 'SCHEDULED')
                            Planifié
                        @elseif($app->status === 'CANCELLED')
                            Annulé
                        @elseif($app->status === 'ARRIVED')
                            Sur place
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

    @empty
        <div style="text-align: center; margin-top: 50px; color: #94a3b8; font-size: 16px;">
            Aucun rendez-vous trouvé pour les critères sélectionnés.
        </div>
    @endforelse

</body>
</html>