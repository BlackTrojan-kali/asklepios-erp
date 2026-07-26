<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Historique des Rendez-vous</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        
        .header-table { width: 100%; border-bottom: 2px solid #00a896; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #003366; font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; }
        .subtitle { color: #64748b; font-size: 11px; margin: 0; }
        
        /* TABLEAU PRINCIPAL */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        .data-table th { background-color: #00a896; color: white; padding: 8px 5px; text-align: left; text-transform: uppercase; }
        .data-table td { padding: 8px 5px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        
        /* ALIGNEMENTS ET STYLES */
        .text-center { text-align: center; }
        .font-mono { font-family: monospace; font-size: 11px; }
        
        /* BADGE STATUT */
        .badge { display: inline-block; padding: 3px 6px; font-weight: bold; font-size: 9px; color: white; border-radius: 3px; }
        .bg-scheduled { background-color: #3b82f6; } /* Bleu */
        .bg-arrived { background-color: #10b981; }   /* Vert */
        .bg-cancelled { background-color: #ef4444; } /* Rouge */

        /* RÉCAPITULATIF TOTAL */
        .summary-box { width: 100%; padding: 15px; background-color: #f8fafc; border: 1px solid #cbd5e1; text-align: right; border-radius: 4px; page-break-inside: avoid; }
        .summary-title { font-size: 14px; color: #334155; margin: 0; }
        .summary-number { font-size: 24px; font-weight: bold; color: #003366; margin: 0; }

        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" style="max-height: 40px; margin-bottom: 10px;" alt="Logo">
                @endif
                <h1 class="title">Historique des Rendez-vous</h1>
                <p class="subtitle">
                    Généré par : {{ $user->first_name }} {{ $user->last_name }} 
                    ({{ $user->profile_doctor ? 'Médecin' : ($user->profile_admin ? 'Administrateur' : 'Réception') }})
                </p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
                <p style="margin: 0 0 5px 0;"><strong>Critères de recherche :</strong></p>
                <p style="margin: 0; color: #64748b; font-size: 10px;">
                    Période : 
                    @if(!empty($filters['start_date']) || !empty($filters['end_date']))
                        Du {{ !empty($filters['start_date']) ? \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') : 'Début' }} 
                        au {{ !empty($filters['end_date']) ? \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') : 'Aujourd\'hui' }}
                    @else
                        Toutes les dates
                    @endif
                    <br>
                    Statut : {{ !empty($filters['status']) ? $filters['status'] : 'Tous' }}<br>
                    Centre : {{ !empty($filters['center_id']) ? 'Centre #'.$filters['center_id'] : 'Ceux autorisés' }}<br>
                    Patient : {{ !empty($filters['patient_id']) ? 'Patient #'.$filters['patient_id'] : 'Tous' }}
                </p>
            </td>
        </tr>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 15%;">Date & Heure</th>
                <th style="width: 20%;">Patient (Code)</th>
                <th style="width: 18%;">Médecin Traitant</th>
                <th style="width: 15%;">Centre</th>
                <th style="width: 22%;">Motif de consultation</th>
                <th style="width: 10%;" class="text-center">Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($appointments as $apt)
            <tr>
                <td>
                    <strong>{{ \Carbon\Carbon::parse($apt->scheduled_datetime)->format('d/m/Y') }}</strong><br>
                    à {{ \Carbon\Carbon::parse($apt->scheduled_datetime)->format('H:i') }}
                </td>
                <td>
                    <strong>{{ $apt->patient->first_name ?? '' }} {{ $apt->patient->last_name ?? '' }}</strong><br>
                    <span style="color: #64748b; font-size: 9px;" class="font-mono">{{ $apt->patient->patient_code ?? '' }}</span>
                </td>
                <td>Dr. {{ $apt->doctor->user->first_name ?? '' }} {{ $apt->doctor->user->last_name ?? '' }}</td>
                <td>{{ $apt->center->name ?? 'N/A' }}</td>
                <td style="color: #475569;">{{ $apt->reason ?? 'Non renseigné' }}</td>
                <td class="text-center">
                    @if($apt->status === 'SCHEDULED')
                        <span class="badge bg-scheduled">PLANIFIÉ</span>
                    @elseif($apt->status === 'ARRIVED')
                        <span class="badge bg-arrived">EN SALLE</span>
                    @elseif($apt->status === 'CANCELLED')
                        <span class="badge bg-cancelled">ANNULÉ</span>
                    @else
                        <span class="badge" style="background-color: #64748b;">{{ $apt->status }}</span>
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="text-center" style="padding: 20px; color: #64748b;">
                    Aucun rendez-vous trouvé pour ces critères de recherche.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    {{-- RÉCAPITULATIF TOTAL --}}
    @if($totalCount > 0)
    <div class="summary-box">
        <p class="summary-title">Total des occurrences trouvées</p>
        <p class="summary-number">{{ $totalCount }} Rendez-vous</p>
    </div>
    @endif

    <div class="footer">
        Système de gestion hospitalière Asclépios ERP - Document interne.<br>
        Généré le {{ $generated_at }}
    </div>

</body>
</html>