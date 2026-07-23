<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture INV-{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; font-size: 12px; margin: 0; padding: 0; }
        
        .watermark { position: fixed; top: 25%; left: 15%; width: 70%; opacity: 0.10; z-index: -1000; text-align: center; }
        .watermark img { max-width: 100%; }

        /* --- EN-TÊTE --- */
        .header-table { width: 100%; margin-bottom: 20px; border-bottom: 2px solid #003366; padding-bottom: 10px; }
        .hospital-name { font-size: 20px; font-weight: bold; color: #003366; text-transform: uppercase; margin-bottom: 5px; }
        .hospital-info { color: #555; line-height: 1.4; font-size: 10px; }
        .invoice-title { text-align: right; color: #003366; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px; }

        /* --- INFO PATIENT & FACTURE --- */
        .info-table { width: 100%; margin-bottom: 20px; }
        .box { padding: 12px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; }
        .box-title { color: #003366; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        .status-badge { display: inline-block; padding: 3px 8px; font-weight: bold; font-size: 11px; color: white; border-radius: 3px; }
        .bg-paid { background-color: #10b981; }
        .bg-unpaid { background-color: #ef4444; }

        /* --- LIGNES DE FACTURATION --- */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
        .items-table th { background-color: #003366; color: #ffffff; padding: 8px; text-align: left; text-transform: uppercase; }
        .items-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; font-size: 12px; }

        /* --- TOTAUX --- */
        .totals-wrapper { width: 100%; margin-top: 10px; }
        .totals-table { width: 50%; float: right; border-collapse: collapse; font-size: 12px; }
        .totals-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        .total-final { background-color: #00a896; color: white; font-weight: bold; font-size: 14px; }
        .total-final td { border: none; }
        .text-insurance { color: #0284c7; }
        .text-payment { color: #10b981; }
        .font-bold { font-weight: bold; }

        /* --- PIED DE PAGE --- */
        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>

    @if($asklepiosLogoBase64)
        <div class="watermark">
            <img src="{{ $asklepiosLogoBase64 }}" alt="Asklepios Logo">
        </div>
    @endif

    <table class="header-table">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                @if($hospitalLogoBase64)
                    <img src="{{ $hospitalLogoBase64 }}" style="max-height: 60px; margin-bottom: 5px;" alt="Logo Hôpital">
                @else
                    <div class="hospital-name">{{ $hospital->name ?? 'HÔPITAL' }}</div>
                @endif
                <div class="hospital-info">
                    @if(isset($hospital->niu)) NIU: {{ $hospital->niu }}<br> @endif
                    Contact : {{ $hospital->contact_phone ?? 'N/A' }}<br>
                    Centre émetteur : {{ $invoice->center->name ?? 'N/A' }}
                </div>
            </td>
            <td style="width: 40%; vertical-align: top; text-align: right;">
                <h1 class="invoice-title">FACTURE</h1>
                <p style="font-size: 14px; font-weight: bold; margin-bottom: 2px;">N° INV-{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</p>
                <p style="color: #666; margin-top: 2px;">Date : {{ \Carbon\Carbon::parse($invoice->created_at)->format('d/m/Y H:i') }}</p>
                <div class="status-badge {{ $invoice->status === 'PAID' ? 'bg-paid' : 'bg-unpaid' }}">
                    {{ $invoice->status === 'PAID' ? 'SOLDE (PAYÉ)' : 'NON SOLDE' }}
                </div>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td style="width: 100%; vertical-align: top;">
                <div class="box" style="border-left: 4px solid #00a896;">
                    <p class="box-title">Informations du Patient</p>
                    <table style="width: 100%; font-size: 11px;">
                        <tr>
                            <td style="width: 50%;">
                                <strong>Nom complet :</strong> {{ $patient->first_name }} {{ $patient->last_name }}<br>
                                <strong>Code Patient :</strong> {{ $patient->patient_code }}<br>
                                @if(isset($invoice->insurance_part) && $invoice->insurance_part > 0)
                                    <strong style="color: #0284c7;">Statut :</strong> Patient Assuré (Tiers Payant)
                                @endif
                            </td>
                            <td style="width: 50%; text-align: right;">
                                <strong>Téléphone :</strong> {{ $patient->contact_phone ?? 'N/A' }}<br>
                                <strong>Âge :</strong> {{ $patient->birth_date ? \Carbon\Carbon::parse($patient->birth_date)->age . ' ans' : 'N/A' }}
                            </td>
                        </tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 70%;">Désignation des Prestations</th>
                <th style="width: 30%;" class="text-right">Montant (FCFA)</th>
            </tr>
        </thead>
        <tbody>
            {{-- 1. CONSULTATIONS --}}
            @if(isset($invoice->consultations))
                @foreach($invoice->consultations as $consultation)
                    @if($consultation->consultation_price > 0)
                    <tr>
                        <td>Consultation Médicale - Dr. {{ $consultation->profileDoctor->user->first_name ?? '' }}</td>
                        <td class="text-right font-mono">{{ number_format($consultation->consultation_price, 0, ',', ' ') }}</td>
                    </tr>
                    @endif
                @endforeach
            @endif

            {{-- 2. ACTES MÉDICAUX --}}
            @if(isset($invoice->performedMedicalActs))
                @foreach($invoice->performedMedicalActs as $act)
                    <tr>
                        <td>Acte Médical : {{ $act->medicalActCatalog->name ?? 'Soin' }}</td>
                        <td class="text-right font-mono">{{ number_format($act->applied_price, 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
            @endif

            {{-- 3. ADMISSIONS (Hospitalisations) --}}
            @if(isset($admissions))
                @foreach($admissions as $adm)
                    <tr>
                        <td>{{ $adm['description'] }}</td>
                        <td class="text-right font-mono">{{ number_format($adm['subtotal'], 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
            @endif

            {{-- 4. EXAMENS DE LABORATOIRE (Si module Labo actif) --}}
            @if(isset($invoice->labRequests))
                @foreach($invoice->labRequests as $labReq)
                    @if(isset($labReq->lines))
                        @foreach($labReq->lines as $line)
                            @if($line->test)
                            <tr>
                                <td>Examen Labo : {{ $line->test->name }}</td>
                                <td class="text-right font-mono">{{ number_format($line->test->price, 0, ',', ' ') }}</td>
                            </tr>
                            @endif
                        @endforeach
                    @endif
                @endforeach
            @endif

        </tbody>
    </table>

    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <td>Total Général (Brut)</td>
                <td class="text-right font-mono">{{ number_format($invoice->total_amount, 0, ',', ' ') }}</td>
            </tr>
            
            {{-- AFFICHAGE DE LA PRISE EN CHARGE ASSURANCE --}}
            @php
                $insurancePart = $invoice->insurance_part ?? 0;
                $patientPart = $invoice->patient_part ?? $invoice->total_amount;
            @endphp

            @if($insurancePart > 0)
            <tr>
                <td class="text-insurance font-bold">Prise en charge Assurance</td>
                <td class="text-right font-mono text-insurance font-bold">- {{ number_format($insurancePart, 0, ',', ' ') }}</td>
            </tr>
            @endif

            {{-- PART PATIENT RÉELLE --}}
            <tr>
                <td class="font-bold" style="font-size: 13px;">Part Patient</td>
                <td class="text-right font-mono font-bold" style="font-size: 13px;">{{ number_format($patientPart, 0, ',', ' ') }}</td>
            </tr>

            @php
                $totalPaid = isset($invoice->payments) ? $invoice->payments->sum('amount') : 0;
            @endphp
            
            {{-- ACOMPTES / DÉJÀ VERSÉ --}}
            @if($totalPaid > 0)
            <tr>
                <td class="text-payment">Déjà Versé (Acomptes)</td>
                <td class="text-right font-mono text-payment">- {{ number_format($totalPaid, 0, ',', ' ') }}</td>
            </tr>
            @endif

            {{-- NET À PAYER (Ce qu'il reste à payer de la poche du patient) --}}
            <tr class="total-final">
                <td>NET À PAYER (Patient)</td>
                <td class="text-right font-mono">{{ number_format(max(0, $patientPart - $totalPaid), 0, ',', ' ') }} FCFA</td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>

    @if(isset($invoice->payments) && $invoice->payments->count() > 0)
    <div style="margin-top: 30px;">
        <p style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 5px;">Historique des paiements du patient</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; color: #64748b;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <th style="text-align: left; padding: 4px 0;">Date</th>
                <th style="text-align: left; padding: 4px 0;">Méthode</th>
                <th style="text-align: right; padding: 4px 0;">Montant</th>
            </tr>
            @foreach($invoice->payments as $payment)
            <tr>
                <td style="padding: 4px 0;">{{ \Carbon\Carbon::parse($payment->created_at)->format('d/m/Y H:i') }}</td>
                <td style="padding: 4px 0;">{{ $payment->payment_method }}</td>
                <td style="text-align: right; padding: 4px 0;">{{ number_format($payment->amount, 0, ',', ' ') }} FCFA</td>
            </tr>
            @endforeach
        </table>
    </div>
    @endif

    <div class="footer">
        {{ $hospital->name ?? 'Établissement' }} - Santé & Gestion via Asclépios ERP<br>
        Document généré le {{ $generated_at }}
    </div>

</body>
</html>