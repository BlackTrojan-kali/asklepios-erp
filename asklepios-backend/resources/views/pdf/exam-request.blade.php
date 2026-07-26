<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Demande d'Examens - N° REQ-{{ str_pad($examRequest->id ?? 0, 5, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            margin: 0px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11pt;
            color: #1e293b;
            margin: 0px;
            padding: 0px;
            background-color: #ffffff;
        }

        /* BANDEAU EN-TÊTE */
        .top-stripe {
            height: 8px;
            background-color: #003366;
            width: 100%;
        }
        
        .header-container {
            padding: 25px 35px 15px 35px;
            border-bottom: 2px solid #e2e8f0;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .center-logo-title {
            font-size: 20pt;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }

        .center-subtitle {
            font-size: 9pt;
            color: #00a896;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 3px;
        }

        .center-contact {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 5px;
            line-height: 1.3;
        }

        .doc-badge {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 15px;
            text-align: right;
        }

        .doc-title {
            font-size: 11pt;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
        }

        .doc-ref {
            font-size: 9pt;
            font-weight: bold;
            color: #00a896;
            font-family: monospace;
            margin-top: 4px;
        }

        .doc-date {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 3px;
        }

        /* CORPS DE PAGE */
        .main-body {
            padding: 25px 35px;
        }

        /* CARTES MÉDECIN ET PATIENT */
        .cards-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 15px 0;
            margin-left: -15px;
            margin-right: -15px;
            margin-bottom: 20px;
        }

        .card-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 15px;
            vertical-align: top;
        }

        .card-header {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #003366;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
            margin-bottom: 8px;
        }

        .card-row {
            font-size: 9.5pt;
            margin-bottom: 4px;
            color: #334155;
        }

        .card-label {
            font-weight: bold;
            color: #64748b;
        }

        .patient-name {
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
        }

        /* RENSEIGNEMENTS CLINIQUES */
        .clinical-box {
            background-color: #eff6ff;
            border-left: 4px solid #003366;
            padding: 10px 14px;
            margin-bottom: 25px;
            border-radius: 0 6px 6px 0;
        }

        .clinical-title {
            font-size: 9pt;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .clinical-text {
            font-size: 9.5pt;
            color: #1e3a8a;
            font-style: italic;
        }

        /* TABLEAU DES EXAMENS */
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
        }

        .exam-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }

        .exam-table th {
            background-color: #003366;
            color: #ffffff;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #003366;
        }

        .exam-table td {
            padding: 10px 12px;
            font-size: 9.5pt;
            border-bottom: 1px solid #e2e8f0;
            border-left: 1px solid #e2e8f0;
            border-right: 1px solid #e2e8f0;
        }

        .exam-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .exam-name {
            font-weight: bold;
            color: #0f172a;
            font-size: 10pt;
        }

        .badge-discipline {
            display: inline-block;
            background-color: #e0f2fe;
            color: #0369a1;
            font-size: 8pt;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
        }

        /* CONSIGNES & INSTRUCTIONS */
        .instructions-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 30px;
            font-size: 9pt;
            color: #166534;
        }

        /* SIGNATURE & CACHET */
        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .stamp-box {
            width: 220px;
            height: 100px;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            text-align: center;
            vertical-align: middle;
            color: #94a3b8;
            font-size: 8pt;
        }

        .signature-title {
            font-size: 9.5pt;
            font-weight: bold;
            color: #003366;
            margin-bottom: 5px;
        }

        /* PIED DE PAGE */
        .footer-container {
            position: fixed;
            bottom: 20px;
            left: 35px;
            right: 35px;
            border-t: 1px solid #e2e8f0;
            padding-top: 8px;
            text-align: center;
            font-size: 8pt;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    <div class="top-stripe"></div>

    <!-- EN-TÊTE HÔPITAL & TITRE DU DOCUMENT -->
    <div class="header-container">
        <table class="header-table">
            <tr>
                <td style="width: 60%; vertical-align: top;">
                    <div class="center-logo-title">
                        {{ $center->name ?? 'CENTRE HOSPITALIER ASKLEPIOS' }}
                    </div>
                    <div class="center-subtitle">
                        Plateau Technique & Prescription Médicale
                    </div>
                    <div class="center-contact">
                        {{ $center->address ?? 'Service des Consultations Médicales' }}<br>
                        Tél : {{ $center->phone ?? '+237 600 000 000' }} | Email : contact@asklepios-erp.com
                    </div>
                </td>
                <td style="width: 40%; vertical-align: top;">
                    <div class="doc-badge">
                        <div class="doc-title">Ordonnance d'Analyses</div>
                        <div class="doc-ref">N° REQ-{{ str_pad($examRequest->id ?? 0, 5, '0', STR_PAD_LEFT) }}</div>
                        <div class="doc-date">Date : {{ \Carbon\Carbon::parse($consultation->created_at ?? now())->format('d/m/Y à H:i') }}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="main-body">

        <!-- CARTES DU MÉDECIN PRESCRIPTEUR ET DU PATIENT -->
        <table class="cards-table">
            <tr>
                <!-- MÉDECIN -->
                <td class="card-box" style="width: 50%;">
                    <div class="card-header">👨‍⚕️ Médecin Prescripteur</div>
                    <div class="card-row">
                        <span class="patient-name">Dr. {{ $doctor->user->first_name ?? '' }} {{ $doctor->user->last_name ?? '' }}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Spécialité :</span> {{ $doctor->specialty ?? 'Médecine Générale' }}
                    </div>
                    <div class="card-row">
                        <span class="card-label">N° Ordre / Matrice :</span> MED-{{ str_pad($doctor->id ?? 1, 4, '0', STR_PAD_LEFT) }}
                    </div>
                </td>

                <!-- PATIENT -->
                <td class="card-box" style="width: 50%;">
                    <div class="card-header">👤 Patient(e) Bénéficiaire</div>
                    <div class="card-row">
                        <span class="patient-name">{{ $patient->first_name ?? '' }} {{ $patient->last_name ?? '' }}</span>
                    </div>
                    <div class="card-row">
                        <span class="card-label">Dossier N° :</span> PAT-{{ str_pad($patient->id ?? 0, 5, '0', STR_PAD_LEFT) }}
                    </div>
                    <div class="card-row">
                        <span class="card-label">Sexe & Âge :</span> 
                        {{ ($patient->gender ?? 'M') === 'M' ? 'Masculin' : 'Féminin' }} • 
                        {{ isset($patient->birth_date) || isset($patient->bith_date) ? \Carbon\Carbon::parse($patient->birth_date ?? $patient->bith_date)->age . ' ans' : 'Âge N/A' }}
                    </div>
                </td>
            </tr>
        </table>

        <!-- RENSEIGNEMENTS CLINIQUES -->
        @if(!empty($consultation->chief_complaint))
        <div class="clinical-box">
            <div class="clinical-title">📋 Renseignements Cliniques & Indication :</div>
            <div class="clinical-text">« {{ $consultation->chief_complaint }} »</div>
        </div>
        @endif

        <!-- TITRE TABLEAU DES EXAMENS -->
        <div class="section-title">🔬 Examens Demandés (Prescription)</div>

        <!-- TABLEAU DES EXAMENS PRESCRITS -->
        <table class="exam-table">
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">N°</th>
                    <th style="width: 62%;">Désignation de l'Examen</th>
                    <th style="width: 30%; text-align: center;">Notes / Consignes</th>
                </tr>
            </thead>
            <tbody>
                @if(isset($examRequest->examRequestLines) && count($examRequest->examRequestLines) > 0)
                    @foreach($examRequest->examRequestLines as $index => $line)
                        <tr>
                            <td style="text-align: center; font-weight: bold; color: #64748b;">{{ $index + 1 }}</td>
                            <td>
                                <div class="exam-name">{{ $line->exam_name }}</div>
                            </td>
                            <td style="text-align: center; color: #64748b; font-size: 8.5pt;">
                                {{ $line->result_notes ?? 'À effectuer selon protocole' }}
                            </td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="3" style="text-align: center; color: #94a3b8; font-style: italic; padding: 20px;">
                            Aucun examen spécifié dans cette ordonnance.
                        </td>
                    </tr>
                @endif
            </tbody>
        </table>

        <!-- INSTRUCTIONS DE PRÉLÈVEMENT ET LABORATOIRE -->
        <div class="instructions-box">
            <strong>ℹ️ Recommandations au laboratoire / patient :</strong><br>
            Prière d'effectuer les analyses biologiques ou d'imagerie ci-dessus et de transmettre le bulletin de résultats directement au service médical ou par voie sécurisée au médecin prescripteur.
        </div>

        <!-- SIGNATURE ET CACHET MÉDICAL -->
        <table class="signature-table">
            <tr>
                <td style="width: 50%;"></td>
                <td style="width: 50%; text-align: right; vertical-align: top;">
                    <div class="signature-title">Cachet et Signature du Médecin</div>
                    <div style="font-size: 8.5pt; color: #64748b; margin-bottom: 8px;">Fait à {{ $center->name ?? 'l\'Hôpital' }}, le {{ \Carbon\Carbon::parse($consultation->created_at ?? now())->format('d/m/Y') }}</div>
                    <div class="stamp-box" style="float: right;">
                        <br><br>[ Emplacement Cachet Officiel ]
                    </div>
                </td>
            </tr>
        </table>

    </div>

    <!-- PIED DE PAGE CONFIDENTIEL -->
    <div class="footer-container">
        Asklepios ERP Medical Suite • Document officiel généré le {{ now()->format('d/m/Y à H:i') }} • Confidentiel Médical (Article L. 1110-4)
    </div>

</body>
</html>
