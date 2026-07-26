<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Bulletin d'Analyses - {{ $request->patient->first_name }} {{ $request->patient->last_name ?? '' }}</title>
    <style>
        @page {
            margin: 130px 35px 50px 35px;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1f2937;
            font-size: 10px;
            margin: 0;
            padding: 0;
            line-height: 1.3;
        }

        .watermark {
            position: fixed;
            top: 25%;
            left: 15%;
            width: 70%;
            text-align: center;
            opacity: 0.08;
            z-index: -1000;
        }

        .watermark img {
            width: 100%;
            max-width: 450px;
        }

        /* --- HEADER FIXE --- */
        header {
            position: fixed;
            top: -105px;
            left: 0;
            right: 0;
            height: 85px;
            border-bottom: 3px solid #003366;
            padding-bottom: 8px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .header-table td {
            vertical-align: middle;
        }

        .hospital-logo {
            max-height: 65px;
            max-width: 170px;
        }

        .doc-title-container {
            text-align: right;
        }

        .doc-title {
            margin: 0;
            font-size: 18px;
            color: #003366;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 900;
        }

        .doc-subtitle {
            margin: 2px 0 0 0;
            font-size: 11px;
            font-weight: bold;
            color: #00a896;
        }

        .hospital-info {
            font-size: 9.5px;
            color: #475569;
            margin-top: 4px;
        }

        .hospital-name {
            font-size: 16px;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
            margin: 0;
        }

        /* --- FOOTER FIXE --- */
        footer {
            position: fixed;
            bottom: -35px;
            left: 0;
            right: 0;
            height: 25px;
            border-top: 2px solid #00a896;
            text-align: center;
            font-size: 8.5px;
            color: #64748b;
            padding-top: 4px;
        }

        /* --- STYLES DES TABLEAUX & BLOCS --- */
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
        }

        .info-table td {
            padding: 5px 8px;
            vertical-align: top;
            border: 1px solid #e2e8f0;
        }

        .info-label {
            font-weight: bold;
            color: #003366;
            width: 110px;
            background-color: #f0fdfa;
        }

        .test-card {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            margin-bottom: 14px;
            background-color: #ffffff;
            page-break-inside: avoid;
        }

        .test-header {
            background-color: #003366;
            color: #ffffff;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: bold;
            border-left: 5px solid #00a896;
        }

        .test-code {
            font-size: 9px;
            color: #99f6e4;
            font-weight: normal;
            margin-left: 6px;
        }

        .results-table {
            width: 100%;
            border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
            border: 1px solid #e2e8f0;
            padding: 5px 8px;
            text-align: left;
        }

        .results-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            color: #003366;
            text-transform: uppercase;
            font-size: 8.5px;
        }

        .abnormal {
            color: #dc2626;
            font-weight: bold;
        }

        .badge-abnormal {
            display: inline-block;
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fecaca;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
            margin-left: 4px;
        }

        .report-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #00a896;
            padding: 8px 10px;
            margin: 6px 0;
            font-size: 10px;
            color: #1e293b;
            white-space: pre-wrap;
            line-height: 1.4;
        }

        .signature-section {
            width: 100%;
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .signature-box {
            width: 240px;
            float: right;
            border: 1px solid #cbd5e1;
            border-top: 3px solid #003366;
            border-radius: 4px;
            padding: 8px 12px;
            text-align: center;
            background-color: #ffffff;
        }

        .signature-title {
            font-weight: bold;
            color: #003366;
            font-size: 10px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .signature-name {
            font-size: 11px;
            font-weight: bold;
            color: #0f766e;
        }

        .stamp-space {
            height: 45px;
            margin-top: 5px;
            border: 1px dashed #cbd5e1;
            border-radius: 4px;
            line-height: 45px;
            color: #94a3b8;
            font-size: 8.5px;
        }
    </style>
</head>

<body>

    @if (!empty($asklepiosLogoBase64))
        <div class="watermark">
            <img src="{{ $asklepiosLogoBase64 }}" alt="Filigrane Asclépios">
        </div>
    @endif

    {{-- EN-TÊTE FIXE --}}
    <header>
        <table class="header-table">
            <tr>
                <td style="width: 45%;">
                    @if (!empty($hospitalLogoBase64))
                        <img src="{{ $hospitalLogoBase64 }}" class="hospital-logo" alt="Logo Hôpital">
                    @else
                        <h1 class="hospital-name">{{ $request->patient->hospital->name ?? 'HÔPITAL PARTENAIRE' }}</h1>
                    @endif
                    <div class="hospital-info">
                        <strong>{{ $request->patient->hospital->name ?? '' }}</strong><br>
                        @if (isset($request->center) && $request->center)
                            {{ $request->center->name }}
                        @endif
                        @if (!empty($request->patient->hospital->niu))
                            • NIU : {{ $request->patient->hospital->niu }}
                        @endif
                    </div>
                </td>
                <td class="doc-title-container" style="width: 55%;">
                    <h1 class="doc-title">BULLETIN D'ANALYSES</h1>
                    <p class="doc-subtitle">DOSSIER BIOLOGIQUE N° REQ-{{ str_pad($request->id, 5, '0', STR_PAD_LEFT) }}
                    </p>
                </td>
            </tr>
        </table>
    </header>

    {{-- FOOTER FIXE --}}
    <footer>
        Ce bulletin d'analyses médicales est signé électroniquement par le Biologiste Responsable.<br>
        Imprimé le {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }} via l'ERP Asclépios.
    </footer>

    {{-- IDENTIFICATION PATIENT & DEMANDE --}}
    <table class="info-table">
        <tr>
            <td class="info-label">Patient :</td>
            <td style="font-size: 13px; font-weight: bold; color: #003366;">
                {{ mb_strtoupper($request->patient->last_name ?? '') }}
                {{ mb_strtoupper($request->patient->first_name) }}
            </td>
            <td class="info-label">N° Demande :</td>
            <td><strong
                    style="color: #00a896; font-size: 11px;">REQ-{{ str_pad($request->id, 5, '0', STR_PAD_LEFT) }}</strong>
            </td>
        </tr>
        <tr>
            <td class="info-label">Code Patient :</td>
            <td><strong style="font-family: monospace;">{{ $request->patient->patient_code }}</strong></td>
            <td class="info-label">Prélèvement :</td>
            <td>{{ \Carbon\Carbon::parse($request->created_at)->format('d/m/Y à H:i') }}</td>
        </tr>
        <tr>
            <td class="info-label">Date de Naissance :</td>
            <td>
                {{ !empty($request->patient->bith_date) ? \Carbon\Carbon::parse($request->patient->bith_date)->format('d/m/Y') : 'Non précisée' }}
                @if (!empty($request->patient->bith_date))
                    <strong style="color: #00a896;">({{ \Carbon\Carbon::parse($request->patient->bith_date)->age }}
                        ans)</strong>
                @endif
            </td>
            <td class="info-label">Sexe :</td>
            @php
                $gender = strtolower(trim($request->patient->gender));
                $isMale = in_array($gender, ['m', 'homme', 'male']);
            @endphp
            <td><strong>{{ $isMale ? 'Masculin (H)' : 'Féminin (F)' }}</strong></td>
        </tr>
        <tr>
            <td class="info-label">Prescripteur :</td>
            <td colspan="3">
                @if ($request->profileDoctor && $request->profileDoctor->user)
                    <strong>Dr. {{ mb_strtoupper($request->profileDoctor->user->last_name ?? '') }}
                        {{ $request->profileDoctor->user->first_name }}</strong>
                    <span
                        style="color: #64748b;">({{ $request->profileDoctor->speciality ?? 'Médecine Générale' }})</span>
                @else
                    <strong>{{ $request->external_prescriber_name ?: 'Laboratoire Central / Externe' }}</strong>
                @endif
            </td>
        </tr>
    </table>

    {{-- RÉSULTATS D'ANALYSES PAR EXAMEN --}}
    @foreach ($request->lines as $line)
        @if ($line->test)
            <div class="test-card">
                <div class="test-header">
                    EXAMEN : {{ mb_strtoupper($line->test->name) }}
                    @if ($line->test->code)
                        <span class="test-code">[{{ $line->test->code }}]</span>
                    @endif
                    @if ($line->test->category)
                        <span
                            style="float: right; font-size: 9px; font-weight: normal; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 3px;">
                            {{ $line->test->category->name }}
                        </span>
                    @endif
                </div>

                @php
                    $params = $line->test->parameters ?? collect();
                    $numericParams = $params->filter(fn($p) => $p->value_type !== 'text' && $p->value_type !== 'file');
                    $textParams = $params->filter(fn($p) => $p->value_type === 'text');
                    $fileParams = $params->filter(fn($p) => $p->value_type === 'file');
                @endphp

                {{-- 1. PARAMÈTRES STRUCTURÉS / NUMÉRIQUES --}}
                @if ($numericParams->count() > 0)
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th style="width: 40%;">Paramètre</th>
                                <th style="width: 30%;">Résultat Mesuré</th>
                                <th style="width: 15%;">Unité</th>
                                <th style="width: 15%;">Valeurs de Référence</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($numericParams as $param)
                                @php
                                    $result = $line->results->firstWhere('lab_parameter_id', $param->id);
                                    $min = $isMale ? $param->reference_min_male : $param->reference_min_female;
                                    $max = $isMale ? $param->reference_max_male : $param->reference_max_female;
                                    $val = $result ? $result->value_numeric ?? ($result->value_string ?? '-') : '-';
                                    $isAbnormal = $result ? $result->is_abnormal : false;
                                @endphp
                                <tr>
                                    <td style="font-weight: bold; color: #1e293b;">{{ $param->name }}</td>
                                    <td class="{{ $isAbnormal ? 'abnormal' : '' }}">
                                        <strong
                                            style="font-family: monospace; font-size: 11px;">{{ $val }}</strong>
                                        @if ($isAbnormal)
                                            <span class="badge-abnormal">ANOMALIE *</span>
                                        @endif
                                    </td>
                                    <td style="color: #64748b;">{{ $param->unit || '-' }}</td>
                                    <td style="color: #64748b; font-size: 9px;">
                                        @if ($min !== null && $max !== null)
                                            [{{ $min }} - {{ $max }}]
                                        @elseif ($param->reference_text)
                                            {{ $param->reference_text }}
                                        @else
                                            <em>N/A</em>
                                        @endif
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endif

                {{-- 2. COMPTES RENDUS & INTERPRÉTATIONS (TEXTE) --}}
                @foreach ($textParams as $param)
                    @php
                        $result = $line->results->firstWhere('lab_parameter_id', $param->id);
                    @endphp
                    <div style="padding: 6px 10px; border-top: 1px solid #e2e8f0;">
                        <strong style="color: #003366; font-size: 9.5px;">• {{ $param->name }} (Compte Rendu /
                            Observation) :</strong>
                        <div class="report-box">
                            {!! $result && $result->value_text ? e($result->value_text) : '<em>Aucune observation particulière.</em>' !!}
                        </div>
                    </div>
                @endforeach

                {{-- 3. PIÈCES JOINTES / CLICHÉS --}}
                @foreach ($fileParams as $param)
                    @php
                        $result = $line->results->firstWhere('lab_parameter_id', $param->id);
                    @endphp
                    <div style="padding: 6px 10px; border-top: 1px solid #e2e8f0; font-size: 9.5px;">
                        <strong style="color: #003366;">• {{ $param->name }} :</strong>
                        @if ($result && $result->file_path)
                            <span style="color: #0f766e; font-weight: bold; margin-left: 5px;">[Cliché / Document
                                numérique joint disponible dans les archives]</span>
                        @else
                            <span style="color: #94a3b8; font-style: italic; margin-left: 5px;">Aucune pièce
                                jointe</span>
                        @endif
                    </div>
                @endforeach

            </div>
        @endif
    @endforeach

    {{-- LÉGENDE & REMARQUE --}}
    <div style="font-size: 8.5px; color: #64748b; margin-top: 6px;">
        <span style="color: #dc2626; font-weight: bold;">* ANOMALIE</span> : Indique une valeur mesurée située en dehors
        des limites de référence définies par le laboratoire.
    </div>

    {{-- SECTION DE SIGNATURE BIOLOGISTE --}}
    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-title">Validation Biologique</div>
            @if ($validator)
                <div class="signature-name">Dr. {{ mb_strtoupper($validator->last_name ?? '') }}
                    {{ $validator->first_name }}</div>
                <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">Biologiste Médical Responsable</div>
            @else
                <div class="signature-name">Le Biologiste Responsable</div>
            @endif
            <div class="stamp-space">[ Cachet & Signature Électronique ]</div>
        </div>
        <div style="clear: both;"></div>
    </div>

</body>

</html>
