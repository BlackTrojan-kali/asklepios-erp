<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Suivi des Transfusions Sanguines</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 11px; margin: 0; padding: 0; }
        
        .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #b91c1c; padding-bottom: 10px; }
        .title { color: #b91c1c; font-size: 20px; font-weight: bold; text-transform: uppercase; margin: 0; }
        .subtitle { color: #555; font-size: 11px; margin-top: 5px; }
        
        .filter-box { background-color: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        .filter-box p { margin: 2px 0; font-size: 10px; color: #7f1d1d; }

        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10px; }
        .data-table th { background-color: #b91c1c; color: #ffffff; padding: 8px; text-align: left; text-transform: uppercase; }
        .data-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .data-table tr:nth-child(even) { background-color: #f8fafc; }

        .status-ongoing { color: #ea580c; font-weight: bold; }
        .status-finished { color: #16a34a; font-weight: bold; }

        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; }
        
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 70%; vertical-align: top;">
                <h1 class="title">Suivi des Transfusions Sanguines</h1>
                <p class="subtitle">Registre opérationnel de l'utilisation des poches de sang</p>
            </td>
            <td style="width: 30%; vertical-align: top; text-align: right;">
                @if($asklepiosLogoBase64)
                    <img src="{{ $asklepiosLogoBase64 }}" style="max-height: 50px;" alt="Logo">
                @endif
            </td>
        </tr>
    </table>

    <div class="filter-box">
        <strong>Critères d'édition du rapport :</strong>
        <table style="width: 100%; margin-top: 5px;">
            <tr>
                <td style="width: 50%;">
                    <p><strong>Période :</strong> Du {{ $filters['start_date'] }} au {{ $filters['end_date'] }}</p>
                    <p><strong>Statut :</strong> {{ $filters['status'] === 'ON_GOING' ? 'En cours' : ($filters['status'] === 'FINISHED' ? 'Terminées' : 'Tous les statuts') }}</p>
                </td>
                <td style="width: 50%;">
                    <p><strong>Groupe Sanguin filtré :</strong> {{ $filters['blood_type'] }}</p>
                    <p><strong>Édité par :</strong> {{ $generated_by }} le {{ $generated_at }}</p>
                </td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 15%;">Date & Heure</th>
                <th style="width: 20%;">Patient (Code)</th>
                <th style="width: 25%;">Détails de la Poche</th>
                <th style="width: 15%;">Médecin Prescripteur</th>
                <th style="width: 15%;">Centre</th>
                <th style="width: 10%;">Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transfusions as $transfusion)
                @php
                    // Résolution du patient (via visite classique ou hospitalisation)
                    $patient = null;
                    if ($transfusion->consultation) {
                        $patient = $transfusion->consultation->patientVisit->patient ?? $transfusion->consultation->admission->patient ?? null;
                    }
                    $doctorName = $transfusion->consultation->profileDoctor->user->last_name ?? 'Inconnu';
                @endphp
                <tr>
                    <td>
                        <strong>Début :</strong> {{ \Carbon\Carbon::parse($transfusion->start_time)->format('d/m/Y H:i') }}<br>
                        @if($transfusion->end_time)
                            <span style="color:#666; font-size:9px;">Fin : {{ \Carbon\Carbon::parse($transfusion->end_time)->format('d/m/Y H:i') }}</span>
                        @else
                            <span style="color:#999; font-size:9px;">Non terminé</span>
                        @endif
                    </td>
                    <td>
                        @if($patient)
                            <span class="font-bold">{{ $patient->first_name }} {{ $patient->last_name }}</span><br>
                            <span style="font-size: 9px; color: #64748b;">{{ $patient->patient_code }}</span>
                        @else
                            <span style="color: #ef4444;">Patient non trouvé</span>
                        @endif
                    </td>
                    <td>
                        <span style="color: #b91c1c; font-weight: bold;">Gr. {{ $transfusion->bloodBag->blood_type ?? 'N/A' }}</span> 
                        - {{ $transfusion->bloodBag->type === 'WHOLE_BLOOD' ? 'Sang Total' : ($transfusion->bloodBag->type === 'RED_CELLS' ? 'Glob. Rouges' : 'Plasma') }}<br>
                        <span style="font-size: 9px; color: #64748b;">Code : {{ $transfusion->bloodBag->barcode ?? 'ID-'.$transfusion->blood_bag_id }} | Vol : {{ $transfusion->bloodBag->volume_ml ?? '-' }} ml</span>
                    </td>
                    <td>Dr. {{ $doctorName }}</td>
                    <td>{{ $transfusion->center->name ?? 'N/A' }}</td>
                    <td>
                        @if($transfusion->status === 'ON_GOING')
                            <span class="status-ongoing">EN COURS</span>
                        @elseif($transfusion->status === 'FINISHED')
                            <span class="status-finished">TERMINÉE</span>
                        @else
                            {{ $transfusion->status }}
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">Aucune transfusion trouvée pour cette période et ces critères.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Système de Santé & Gestion via Asclépios ERP - Imprimé le {{ $generated_at }}
    </div>

</body>
</html>