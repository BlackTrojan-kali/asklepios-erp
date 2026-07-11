<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Résultats - {{ $request->patient->first_name }} {{ $request->patient->last_name }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #222;
            font-size: 10px; /* Taille réduite pour économiser l'espace */
            margin: 0;
            padding: 0;
            line-height: 1.2;
            position: relative;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.05; /* Très discret */
            z-index: -1000;
            width: 500px;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #001f4d; /* Bleu très sombre */
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .hospital-name {
            font-size: 16px;
            font-weight: bold;
            color: #001f4d;
            margin: 0;
            text-transform: uppercase;
        }
        .hospital-sub {
            font-size: 9px;
            color: #444;
            margin-top: 2px;
            margin-bottom: 0;
        }
        .title {
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
            text-transform: uppercase;
            background-color: #001f4d;
            color: #fff;
            padding: 4px;
            border-radius: 3px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            background-color: #fcfcfc;
            border: 1px solid #ddd;
        }
        .info-table td {
            padding: 4px 6px; /* Padding réduit */
            vertical-align: top;
            border-bottom: 1px solid #eee;
        }
        .info-label {
            font-weight: bold;
            color: #444;
            width: 110px;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .results-table th, .results-table td {
            border: 1px solid #ddd;
            padding: 4px 6px; /* Padding réduit */
            text-align: left;
        }
        .results-table th {
            background-color: #001f4d;
            font-weight: bold;
            color: #ffffff;
            text-transform: uppercase;
            font-size: 9px;
        }
        .test-category {
            background-color: #eaeaea !important;
            font-weight: bold;
            font-size: 11px;
            color: #001f4d;
            padding: 4px 6px !important;
        }
        .abnormal {
            color: #cc0000;
            font-weight: bold;
        }
        .abnormal-star {
            color: #cc0000;
            font-weight: bold;
            font-size: 12px;
            margin-left: 3px;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>

    @if (file_exists(public_path('images/logo.png')))
        <img src="{{ public_path('images/logo.png') }}" class="watermark" alt="Watermark">
    @endif

    <table class="header-table">
        <tr>
            <td style="width: 15%; text-align: left;">
                @if (file_exists(public_path('images/logo.png')))
                    <img src="{{ public_path('images/logo.png') }}" alt="Logo" style="width: 90px;">
                @endif
            </td>
            <td style="width: 85%; text-align: left;">
                @php
                    $hospital = $request->patient->hospital ?? null;
                    $center = $request->center ?? null;
                    
                    $hospitalName = $hospital ? $hospital->name : 'NOM DE L\'HÔPITAL / LABORATOIRE';
                    $nui = $hospital && $hospital->niu ? $hospital->niu : '___________________';
                    $rccm = '___________________';
                    
                    $phoneStr = '___________________';
                    if ($center && $center->phone_1) {
                        $phoneStr = $center->phone_1;
                        if ($center->phone_2) {
                            $phoneStr .= ' / ' . $center->phone_2;
                        }
                    }
                @endphp
                <h1 class="hospital-name">{{ $hospitalName }}</h1>
                <p class="hospital-sub">{{ $center->name ?? 'Centre de Prélèvement et d\'Analyses Biologiques' }}</p>
                <p class="hospital-sub">NUI : {{ $nui }} | RCCM : {{ $rccm }}</p>
                <p class="hospital-sub">Tél: {{ $phoneStr }} | Email: ___________________</p>
            </td>
        </tr>
    </table>

    <div class="title">Compte-Rendu de Résultats d'Analyses</div>

    <table class="info-table">
        <tr>
            <td class="info-label">Patient :</td>
            <td style="font-size: 12px; color: #001f4d;"><strong>{{ mb_strtoupper($request->patient->last_name) }} {{ $request->patient->first_name }}</strong></td>
            <td class="info-label">Dossier N° :</td>
            <td><strong>REQ-{{ $request->id }}</strong></td>
        </tr>
        <tr>
            <td class="info-label">Code Patient :</td>
            <td>{{ $request->patient->patient_code }}</td>
            <td class="info-label">Prélèvement le :</td>
            <td>{{ $request->created_at->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="info-label">Date de Naissance :</td>
            <td>
                {{ $request->patient->bith_date ? \Carbon\Carbon::parse($request->patient->bith_date)->format('d/m/Y') : 'Non précisé' }}
                @if ($request->patient->bith_date)
                    <strong>({{ \Carbon\Carbon::parse($request->patient->bith_date)->age }} ans)</strong>
                @endif
            </td>
            <td class="info-label">Sexe :</td>
            @php
                $gender = strtolower(trim($request->patient->gender));
                $isMale = in_array($gender, ['m', 'homme', 'male']);
            @endphp
            <td>{{ $isMale ? 'Masculin' : 'Féminin' }}</td>
        </tr>
        <tr>
            <td class="info-label">Prescripteur :</td>
            <td colspan="3">
                {{ $request->profile_doctor_id && $request->profileDoctor && $request->profileDoctor->user ? 'Dr. ' . mb_strtoupper($request->profileDoctor->user->last_name) . ' ' . $request->profileDoctor->user->first_name : ($request->external_prescriber_name ?: 'Non précisé') }}
            </td>
        </tr>
    </table>

    <table class="results-table">
        <thead>
            <tr>
                <th>Paramètre</th>
                <th>Résultat</th>
                <th>Unité</th>
                <th>Valeurs de Référence</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($request->lines as $line)
                <tr>
                    <td colspan="4" class="test-category">
                        {{ mb_strtoupper($line->test->name ?? 'Examen Inconnu') }}
                        @if ($line->test && $line->test->code)
                            <span style="font-size: 9px; color: #555; font-weight: normal;">({{ $line->test->code }})</span>
                        @endif
                    </td>
                </tr>
                @if ($line->test && $line->test->parameters)
                    @foreach ($line->test->parameters as $param)
                        @php
                            $result = $line->results->firstWhere('lab_parameter_id', $param->id);
                            $min = $isMale ? $param->reference_min_male : $param->reference_min_female;
                            $max = $isMale ? $param->reference_max_male : $param->reference_max_female;
                            $val = $result ? $result->value_numeric ?? $result->value_string : '-';
                            $isAbnormal = $result ? $result->is_abnormal : false;
                        @endphp
                        <tr>
                            <td style="padding-left: 15px;">{{ $param->name }}</td>
                            <td class="{{ $isAbnormal ? 'abnormal' : '' }}">
                                <strong>{{ $val }}</strong>
                                @if ($isAbnormal)
                                    <span class="abnormal-star">*</span>
                                @endif
                            </td>
                            <td>{{ $param->unit }}</td>
                            <td>
                                @if ($min !== null && $max !== null)
                                    {{ $min }} - {{ $max }}
                                @elseif ($param->reference_text)
                                    {{ $param->reference_text }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="4" style="text-align: center; font-style: italic; color: #888;">Aucun paramètre configuré.</td>
                    </tr>
                @endif
            @endforeach
        </tbody>
    </table>

    <div style="font-size: 9px; color: #666; margin-top: 5px;">
        <p style="margin: 0;"><span style="color: #cc0000; font-weight: bold;">*</span> : Indique une valeur en dehors des limites de référence.</p>
        <p style="margin: 2px 0 0 0; text-align: right;">Imprimé le : {{ \Carbon\Carbon::now()->format('d/m/Y à H:i') }}</p>
    </div>

</body>
</html>
