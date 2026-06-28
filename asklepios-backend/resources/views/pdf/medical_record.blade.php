<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Carnet Médical - {{ $patient->name ?? 'Patient' }}</title>
    <style>
        /* --- STYLES DE BASE --- */
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        
        /* --- FILIGRANE (WATERMARK) --- */
        .watermark {
            position: fixed;
            top: 25%;
            left: 15%;
            width: 70%;
            opacity: 0.08; /* Très transparent pour ne pas gêner la lecture */
            z-index: -1000;
            pointer-events: none;
        }

        /* --- EN-TÊTE --- */
        .header {
            text-align: center;
            border-bottom: 2px solid #0056b3;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #002c5c;
            margin: 0 0 5px 0;
            font-size: 24px;
            text-transform: uppercase;
        }
        .header p { margin: 0; color: #555; }

        /* --- SECTIONS --- */
        .section-title {
            background-color: #f0f4f8;
            color: #0056b3;
            padding: 8px;
            font-size: 14px;
            font-weight: bold;
            border-left: 4px solid #0056b3;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        /* --- INFOS PATIENT --- */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .info-table td {
            padding: 5px;
            vertical-align: top;
        }
        .label { font-weight: bold; color: #555; width: 120px; }

        /* --- LISTES ET BADGES --- */
        .badge {
            display: inline-block;
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            margin-right: 5px;
        }
        .badge-red { background: #ffe4e6; color: #e11d48; }

        /* --- HISTORIQUE DES VISITES --- */
        .visit-block {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            margin-bottom: 15px;
            page-break-inside: avoid; /* Évite de couper une visite sur deux pages */
        }
        .visit-header {
            border-bottom: 1px dashed #ccc;
            padding-bottom: 5px;
            margin-bottom: 10px;
            font-weight: bold;
            color: #002c5c;
        }
        .prescription-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
        }
        .prescription-table th, .prescription-table td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: left;
        }
        .prescription-table th { background-color: #f8fafc; color: #333; }
        
        .footer {
            position: fixed;
            bottom: -20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    @if($logoBase64)
        <img src="{{ $logoBase64 }}" class="watermark" alt="Asclépios Watermark">
    @endif

    <div class="header">
        @if($logoBase64)
            <img src="{{ $logoBase64 }}" alt="Logo" style="height: 60px; margin-bottom: 10px;">
        @endif
        <h1>CARNET MÉDICAL</h1>
        <p>Généré le {{ $generated_at }} via l'ERP Asclépios</p>
    </div>

    <div class="section-title">Informations Générales & Antécédents</div>
    <table class="info-table">
        <tr>
            <td class="label">Nom complet :</td>
            <td><strong>{{ $patient->name ?? 'N/A' }}</strong></td>
            <td class="label">Date de Naissance :</td>
            <td>{{ $patient->birth_date ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="label">Sexe :</td>
            <td>{{ $patient->gender ?? 'N/A' }}</td>
            <td class="label">Groupe Sanguin :</td>
            <td>
                <span class="badge badge-red">
                    {{ $patient->medicalBackground->blood_type ?? 'Inconnu' }}
                </span>
            </td>
        </tr>
        @if($patient->medicalBackground)
            <tr>
                <td class="label">Allergies :</td>
                <td colspan="3">
                    @if(!empty($patient->medicalBackground->allergies))
                        {{ implode(', ', $patient->medicalBackground->allergies) }}
                    @else
                        <em>Aucune allergie connue</em>
                    @endif
                </td>
            </tr>
            <tr>
                <td class="label">Maladies Chroniques :</td>
                <td colspan="3">
                    @if(!empty($patient->medicalBackground->chronic_conditions))
                        {{ implode(', ', $patient->medicalBackground->chronic_conditions) }}
                    @else
                        <em>Néant</em>
                    @endif
                </td>
            </tr>
        @endif
    </table>

    <div class="section-title">Historique des Visites et Consultations</div>

    @forelse($patient->patientVisits as $visit)
        <div class="visit-block">
            <div class="visit-header">
                Visite du {{ \Carbon\Carbon::parse($visit->arrival_time)->format('d/m/Y à H:i') }} 
                - {{ $visit->center->name ?? 'Centre Inconnu' }} 
                (Type: {{ $visit->visit_type }})
            </div>

            @forelse($visit->consultations as $consultation)
                <p><strong>Médecin :</strong> Dr. {{ $consultation->profileDoctor->user->name ?? 'Inconnu' }} ({{ $consultation->profileDoctor->speciality ?? 'Généraliste' }})</p>
                
                @if($consultation->chief_complaint)
                    <p><strong>Motif de consultation :</strong> {{ $consultation->chief_complaint }}</p>
                @endif
                
                @if($consultation->prescriptions->count() > 0)
                    <strong>Prescriptions Médicamenteuses :</strong>
                    <table class="prescription-table">
                        <thead>
                            <tr>
                                <th>Médicament</th>
                                <th>Posologie / Dosage</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($consultation->prescriptions as $prescription)
                                @foreach($prescription->prescriptionLines as $line)
                                    <tr>
                                        <td>{{ $line->article->name ?? $line->custom_medication_name }}</td>
                                        <td>{{ $line->dosage }}</td>
                                    </tr>
                                @endforeach
                            @endforeach
                        </tbody>
                    </table>
                @endif
                
                @if($consultation->examRequests->count() > 0)
                    <div style="margin-top:10px;">
                        <strong>Examens prescrits :</strong>
                        <ul>
                            @foreach($consultation->examRequests as $examRequest)
                                @foreach($examRequest->examRequestLines as $line)
                                    <li>{{ $line->exam_name }} 
                                        @if($line->result_notes)
                                            <br><em>Résultat : {{ $line->result_notes }}</em>
                                        @endif
                                    </li>
                                @endforeach
                            @endforeach
                        </ul>
                    </div>
                @endif
                
            @empty
                <p><em>Aucune consultation enregistrée pour cette visite (ex: passage infirmier uniquement).</em></p>
            @endforelse
        </div>
    @empty
        <p style="text-align: center; color: #777;">Aucun historique de visite pour ce patient.</p>
    @endforelse

    <div class="footer">
        Document strictement confidentiel. Généré par Asclépios ERP Hospitalier.
    </div>
</body>
</html>