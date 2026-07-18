<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Ordonnance</title>
    <style>
        body { font-family: sans-serif; font-size: 14px; margin: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .doctor-info { float: left; width: 50%; }
        .patient-info { float: right; width: 50%; text-align: right; }
        .clear { clear: both; margin-bottom: 30px; }
        .title { text-align: center; font-size: 24px; text-decoration: underline; margin-bottom: 30px; font-weight: bold; }
        .content { margin-top: 20px; }
        .medication { margin-bottom: 15px; }
        .med-name { font-weight: bold; font-size: 16px; }
        .med-dosage { font-style: italic; color: #555; margin-left: 20px; }
        .footer { position: absolute; bottom: 30px; width: 100%; text-align: center; font-size: 12px; color: #777; }
        .signature { margin-top: 50px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        @if($center)
            <h2>{{ $center->name }}</h2>
            <p>{{ $center->address }}<br>{{ $center->phone }}</p>
        @else
            <h2>Cabinet Médical</h2>
        @endif
    </div>

    <div class="info-section">
        <div class="doctor-info">
            <strong>Dr. {{ $doctor->user->first_name }} {{ $doctor->user->last_name }}</strong><br>
            {{ $doctor->specialty }}<br>
            Tel: {{ $doctor->user->phone }}
        </div>
        <div class="patient-info">
            Date : {{ \Carbon\Carbon::parse($consultation->created_at)->format('d/m/Y') }}<br><br>
            <strong>Patient(e) :</strong> {{ $patient->first_name }} {{ $patient->last_name }}<br>
            Âge : {{ \Carbon\Carbon::parse($patient->date_of_birth)->age }} ans<br>
        </div>
        <div class="clear"></div>
    </div>

    <div class="title">ORDONNANCE MEDICALE</div>

    <div class="content">
        @foreach($prescription->prescriptionLines as $line)
            <div class="medication">
                <div class="med-name">- {{ $line->custom_medication_name ?? 'Médicament inconnu' }}</div>
                <div class="med-dosage">Posologie : {{ $line->dosage }}</div>
            </div>
        @endforeach
    </div>

    <div class="signature">
        <p>Signature & Cachet du Médecin</p>
    </div>

    <div class="footer">
        Document généré informatiquement par le système Asklepios.
    </div>
</body>
</html>
