<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Carnet Médical - {{ $patient->patient_code }}</title>
    <style>
        /* --- CONFIGURATION DE LA PAGE A4 --- */
        @page {
            margin: 140px 40px 60px 40px; /* Haut (header), Droite, Bas (footer), Gauche */
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1f2937;
            font-size: 11px;
            line-height: 1.4;
        }

        /* --- FILIGRANE ASCLÉPIOS (GROS ET VISIBLE MAIS DISCRET) --- */
        .watermark {
            position: fixed;
            top: 25%;
            left: 15%;
            width: 70%;
            text-align: center;
            opacity: 0.12; /* Ajuster entre 0.08 et 0.15 selon le rendu souhaité */
            z-index: -1000;
        }
        .watermark img {
            width: 100%;
            max-width: 500px;
        }

        /* --- EN-TÊTE FIXE (HÔPITAL UNIQUEMENT) --- */
        header {
            position: fixed;
            top: -110px;
            left: 0;
            right: 0;
            height: 90px;
            border-bottom: 3px solid #003366;
            padding-bottom: 10px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: middle;
        }
        .hospital-logo {
            max-height: 70px;
            max-width: 180px;
        }
        .doc-title-container {
            text-align: right;
        }
        .doc-title {
            margin: 0;
            font-size: 22px;
            color: #003366;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 900;
        }
        .doc-subtitle {
            margin: 2px 0 0 0;
            font-size: 12px;
            font-weight: bold;
            color: #00a896;
        }
        .hospital-info {
            font-size: 10px;
            color: #475569;
            margin-top: 5px;
        }
        .hospital-name {
            font-size: 18px;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
        }

        /* --- PIED DE PAGE FIXE --- */
        footer {
            position: fixed;
            bottom: -40px;
            left: 0;
            right: 0;
            height: 30px;
            border-top: 2px solid #00a896;
            text-align: center;
            font-size: 9px;
            color: #64748b;
            padding-top: 5px;
        }
        .page-number:after { content: counter(page); }

        /* --- SECTIONS --- */
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background-color: #003366;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            border-left: 6px solid #00a896;
            margin-bottom: 12px;
        }

        /* --- TABLEAUX DE DONNÉES --- */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .data-table th, .data-table td {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            vertical-align: top;
        }
        .data-table th {
            background-color: #f0fdfa;
            color: #003366;
            font-weight: bold;
            width: 20%;
            text-align: left;
        }
        .data-table td {
            background-color: #ffffff;
            color: #334155;
        }

        /* --- HISTORIQUES --- */
        .timeline-item {
            border: 1px solid #e2e8f0;
            border-left: 4px solid #003366;
            border-radius: 3px;
            padding: 10px;
            margin-bottom: 15px;
            background-color: #ffffff;
            page-break-inside: avoid;
        }
        .timeline-header {
            font-weight: bold;
            color: #003366;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 5px;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .sub-title {
            color: #00a896;
            font-size: 11px;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        /* --- BADGES --- */
        .badge {
            display: inline-block;
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            margin-right: 4px;
            margin-bottom: 4px;
            border: 1px solid #cbd5e1;
        }
        .badge-red { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
        .badge-cyan { background: #ccfbf1; color: #0f766e; border-color: #99f6e4; }
        .badge-blue { background: #e0e7ff; color: #1d4ed8; border-color: #bfdbfe; }
        .badge-green { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }

        /* --- SOUS-TABLEAUX --- */
        .inner-table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 10px; }
        .inner-table th, .inner-table td { border: 1px solid #cbd5e1; padding: 4px 6px; }
        .inner-table th { background-color: #e2e8f0; color: #003366; text-align: left; }

        .text-muted { color: #64748b; }
        .page-break { page-break-after: always; }
        .highlight { color: #00a896; font-weight: bold; }
    </style>
</head>
<body>

    @php
        $decodeJSON = function($data) {
            if (empty($data)) return [];
            if (is_string($data)) {
                $decoded = json_decode($data, true);
                return is_array($decoded) ? $decoded : [];
            }
            return is_array($data) ? $data : [];
        };
        $age = !empty($patient->bith_date) ? \Carbon\Carbon::parse($patient->bith_date)->age : '?';
    @endphp

    @if($asklepiosLogoBase64)
        <div class="watermark">
            <img src="{{ $asklepiosLogoBase64 }}" alt="Filigrane Asclépios">
        </div>
    @endif

    <header>
        <table class="header-table">
            <tr>
                <td style="width: 40%;">
                    @if($hospitalLogoBase64)
                        <img src="{{ $hospitalLogoBase64 }}" class="hospital-logo" alt="Logo de l'hôpital">
                    @else
                        <div class="hospital-name">{{ $hospital->name ?? 'Hôpital Partenaire' }}</div>
                    @endif
                    <div class="hospital-info">
                        <strong>{{ $hospital->name ?? '' }}</strong><br>
                        @if(!empty($hospital->niu)) NIU : {{ $hospital->niu }} @endif
                    </div>
                </td>
                <td class="doc-title-container" style="width: 60%;">
                    <h1 class="doc-title">CARNET MÉDICAL</h1>
                    <p class="doc-subtitle">N° PATIENT : {{ $patient->patient_code }}</p>
                </td>
            </tr>
        </table>
    </header>

    <footer>
        Ce document est strictement confidentiel et couvert par le secret médical.<br>
        Généré le {{ $generated_at }} via l'ERP Asclépios - Page <span class="page-number"></span>
    </footer>

    <div class="section">
        <div class="section-title">1. Identification du Patient</div>
        <table class="data-table">
            <tr>
                <th>Nom complet</th>
                <td colspan="3" style="font-size: 14px; font-weight: bold; color: #003366;">
                    {{ mb_strtoupper($patient->first_name) }} {{ mb_strtoupper($patient->last_name ?? '') }}
                </td>
            </tr>
            <tr>
                <th>Date de naissance</th>
                <td>{{ !empty($patient->bith_date) ? \Carbon\Carbon::parse($patient->bith_date)->format('d/m/Y') : 'N/A' }} <strong class="highlight">({{ $age }} ans)</strong></td>
                <th>Sexe</th>
                <td>
                    @if($patient->gender === 'MALE') Masculin 
                    @elseif($patient->gender === 'FEMALE') Féminin 
                    @else Autre @endif
                </td>
            </tr>
            <tr>
                <th>Lieu de naissance</th>
                <td>{{ $patient->birth_place ?? 'Non spécifié' }}</td>
                <th>Téléphone</th>
                <td class="highlight">{{ $patient->contact_phone }}</td>
            </tr>
            <tr>
                <th>Adresse</th>
                <td colspan="3">{{ $patient->address ?? 'Non spécifiée' }}</td>
            </tr>
            <tr>
                <th>Contact Urgence</th>
                <td colspan="3">
                    <strong>{{ $patient->emergency_contact_name ?? 'Non renseigné' }}</strong> 
                    @if($patient->emergency_contact_number) <span class="highlight">Tél : {{ $patient->emergency_contact_number }}</span> @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. Antécédents & Terrain</div>
        @if($medicalBg)
            @php
                $allergies = $decodeJSON($medicalBg->allergies);
                $chronics = $decodeJSON($medicalBg->chronic_conditions);
                $surgeries = $decodeJSON($medicalBg->past_surgeries);
                $meds = $decodeJSON($medicalBg->current_medications);
                $vaccines = $decodeJSON($medicalBg->immunizations);
            @endphp
            <table class="data-table">
                <tr>
                    <th>Groupe Sanguin</th>
                    <td colspan="3"><span class="badge badge-red" style="font-size:12px;">{{ $medicalBg->blood_type ?? 'INCONNU' }}</span></td>
                </tr>
                <tr>
                    <th>Allergies</th>
                    <td colspan="3">
                        @forelse($allergies as $allergy) <span class="badge badge-red">{{ $allergy }}</span> @empty <span class="text-muted">Aucune allergie connue déclarée.</span> @endforelse
                    </td>
                </tr>
                <tr>
                    <th>Affections Chroniques</th>
                    <td colspan="3">
                        @forelse($chronics as $chronic) <span class="badge badge-blue">{{ $chronic }}</span> @empty <span class="text-muted">Néant.</span> @endforelse
                    </td>
                </tr>
                <tr>
                    <th>Traitements Actuels</th>
                    <td colspan="3">
                        @forelse($meds as $med) <span class="badge badge-cyan">{{ $med }}</span> @empty <span class="text-muted">Aucun traitement de fond déclaré.</span> @endforelse
                    </td>
                </tr>
                <tr>
                    <th>Chirurgies Passées</th>
                    <td colspan="3">
                        @forelse($surgeries as $surgery)
                            <span class="badge badge-blue">{{ is_array($surgery) ? ($surgery['name'] ?? 'Inconnu') . ' (' . ($surgery['year'] ?? '') . ')' : $surgery }}</span>
                        @empty
                            <span class="text-muted">Aucune intervention majeure déclarée.</span>
                        @endforelse
                    </td>
                </tr>
                <tr>
                    <th>Vaccinations</th>
                    <td colspan="3">
                        @forelse($vaccines as $vaccine) <span class="badge">{{ $vaccine }}</span> @empty <span class="text-muted">Non renseigné.</span> @endforelse
                    </td>
                </tr>
            </table>

            @if($medicalBg->family_history || $medicalBg->lifestyle_habits || $medicalBg->general_notes)
            <table class="data-table">
                @if($medicalBg->family_history)
                <tr>
                    <th>Antécédents Familiaux</th>
                    <td>{!! nl2br(e($medicalBg->family_history)) !!}</td>
                </tr>
                @endif
                @if($medicalBg->lifestyle_habits)
                <tr>
                    <th>Mode de vie</th>
                    <td>{!! nl2br(e($medicalBg->lifestyle_habits)) !!}</td>
                </tr>
                @endif
                @if($medicalBg->general_notes)
                <tr>
                    <th>Notes Générales</th>
                    <td>{!! nl2br(e($medicalBg->general_notes)) !!}</td>
                </tr>
                @endif
            </table>
            @endif
        @else
            <div class="timeline-item text-center text-muted"><em>Aucun dossier d'antécédents médicaux n'a été initialisé pour ce patient.</em></div>
        @endif
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">3. Historique des Hospitalisations</div>
        @forelse($patient->admissions ?? [] as $admission)
            <div class="timeline-item">
                <div class="timeline-header">
                    <span>Hospitalisation du {{ \Carbon\Carbon::parse($admission->admission_date)->format('d/m/Y à H:i') }}</span>
                    <span style="float: right;">
                        @if($admission->actual_discharge_date)
                            <span class="badge badge-cyan">Sorti le {{ \Carbon\Carbon::parse($admission->actual_discharge_date)->format('d/m/Y') }}</span>
                        @else
                            <span class="badge badge-red">EN COURS D'HOSPITALISATION</span>
                        @endif
                    </span>
                </div>
                
                <table style="width: 100%; font-size: 11px; margin-bottom: 8px;">
                    <tr>
                        <td width="50%"><strong>Médecin référent :</strong> Dr. {{ $admission->doctor->user->first_name ?? 'N/A' }} {{ $admission->doctor->user->last_name ?? '' }}</td>
                        <td width="50%"><strong>Chambre :</strong> {{ $admission->bed->facilityRoom->name ?? 'N/A' }} <span class="highlight">(Lit {{ $admission->bed->bed_number ?? 'N/A' }})</span></td>
                    </tr>
                </table>

                <div style="margin-bottom: 5px;"><strong>Motif d'admission :</strong> {{ $admission->reason_for_admission }}</div>
                
                @if($admission->discharge_notes)
                    <div style="background: #f0fdfa; padding: 6px; border-left: 3px solid #00a896; margin-top: 8px;">
                        <strong>Notes de sortie :</strong><br>
                        {!! nl2br(e($admission->discharge_notes)) !!}
                    </div>
                @endif
            </div>
        @empty
            <p class="text-muted"><em>Aucune hospitalisation enregistrée pour ce patient.</em></p>
        @endforelse
    </div>

    <div class="section">
        <div class="section-title">4. Historique des Consultations</div>
        @forelse($patient->patientVisits ?? [] as $visit)
            <div class="timeline-item">
                <div class="timeline-header">
                    Visite du {{ \Carbon\Carbon::parse($visit->arrival_time)->format('d/m/Y à H:i') }}
                    <span style="float: right; font-weight: normal; color: #64748b;">
                        Lieu : {{ $visit->center->name ?? 'Non spécifié' }} 
                        @if($visit->visit_type) (Type: {{ $visit->visit_type }}) @endif
                    </span>
                </div>

                @forelse($visit->consultations ?? [] as $consult)
                    <div style="margin-left: 10px; margin-bottom: 10px; margin-top: 10px;">
                        <p class="mb-2">
                            <strong>Vu par :</strong> Dr. {{ $consult->profileDoctor->user->first_name ?? 'Inconnu' }} {{ $consult->profileDoctor->user->last_name ?? '' }} 
                            <em style="color:#00a896;">({{ $consult->profileDoctor->speciality ?? 'Médecine Générale' }})</em>
                        </p>
                        
                        <p class="mb-2"><strong>Motif principal :</strong> {{ $consult->chief_complaint }}</p>

                        @php $notes = $decodeJSON($consult->clinical_data); @endphp
                        @if(!empty($notes['notes']))
                            <div style="background: #f8fafc; padding: 8px; border-left: 3px solid #003366; margin-bottom: 10px;">
                                <strong>Notes cliniques :</strong><br>
                                {!! nl2br(e($notes['notes'])) !!}
                            </div>
                        @endif

                        @if(isset($visit->performedMedicalActs) && $visit->performedMedicalActs->count() > 0 && $loop->first)
                            <div class="sub-title">Actes Médicaux Réalisés</div>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                @foreach($visit->performedMedicalActs as $act)
                                    <li>{{ $act->medicalActCatalog->name ?? 'Acte médical' }}</li>
                                @endforeach
                            </ul>
                        @endif

                        @if($consult->prescriptions && $consult->prescriptions->count() > 0)
                            <div class="sub-title">Ordonnance Médicamenteuse</div>
                            <table class="inner-table">
                                <thead>
                                    <tr>
                                        <th width="40%">Produit / Médicament</th>
                                        <th width="60%">Posologie & Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($consult->prescriptions as $prescription)
                                        @foreach($prescription->prescriptionLines as $line)
                                            <tr>
                                                <td><strong>{{ $line->custom_medication_name ?? ($line->article->name ?? 'Produit inconnu') }}</strong></td>
                                                <td>{!! nl2br(e($line->dosage)) !!}</td>
                                            </tr>
                                        @endforeach
                                    @endforeach
                                </tbody>
                            </table>
                        @endif

                        @if($consult->examRequests && $consult->examRequests->count() > 0)
                            <div class="sub-title">Demande d'Examens</div>
                            <table class="inner-table">
                                <thead>
                                    <tr>
                                        <th width="40%">Nom de l'examen</th>
                                        <th width="60%">Résultats / Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($consult->examRequests as $examRequest)
                                        @foreach($examRequest->examRequestLines as $line)
                                            <tr>
                                                <td><strong>{{ $line->exam_name }}</strong></td>
                                                <td>{{ $line->result_notes ?? 'En attente' }}</td>
                                            </tr>
                                        @endforeach
                                    @endforeach
                                </tbody>
                            </table>
                        @endif
                    </div>
                    @if(!$loop->last) <hr style="border: 0; border-top: 1px dashed #cbd5e1; margin: 15px 0;"> @endif
                @empty
                    <p class="text-muted" style="margin-left: 10px;"><em>Aucune note de consultation finalisée pour cette visite.</em></p>
                @endforelse
            </div>
        @empty
            <p class="text-muted"><em>Aucun historique de visite enregistré.</em></p>
        @endforelse
    </div>

</body>
</html>