<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            font-size: 13px;
            margin: 0;
            padding: 0;
        }

        /* --- LE FILIGRANE ASKLEPIOS EN FOND --- */
        .watermark {
            position: fixed;
            top: 25%;
            left: 15%;
            width: 70%;
            opacity: 0.08; /* Très transparent */
            z-index: -1000;
            text-align: center;
        }
        .watermark img {
            max-width: 100%;
        }

        /* --- EN-TÊTE --- */
        .header-table {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #00a896;
            padding-bottom: 15px;
        }
        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: #003366;
            margin-bottom: 5px;
        }
        .company-info {
            color: #555;
            line-height: 1.5;
            font-size: 11px;
        }
        .invoice-title {
            text-align: right;
            color: #00a896;
            font-size: 32px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        /* --- SECTIONS CLIENT & PÉRIODE --- */
        .info-table {
            width: 100%;
            margin-bottom: 30px;
        }
        .box {
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 4px;
        }
        .box-title {
            color: #003366;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 0;
            margin-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
        }

        /* --- TABLEAU DES LICENCES --- */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th {
            background-color: #003366;
            color: #ffffff;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
        }
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        /* --- TOTAUX --- */
        .totals-wrapper {
            width: 100%;
        }
        .totals-table {
            width: 40%;
            float: right;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .total-final {
            background-color: #00a896;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }
        .total-final td {
            border: none;
        }

        /* --- PIED DE PAGE --- */
        .footer {
            position: fixed;
            bottom: -10px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    <div class="watermark">
        <img src="{{ public_path('images/asklepios_logo.png') }}" alt="Watermark">
    </div>

    <table class="header-table">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                <img src="{{ public_path('images/authentica_logo.png') }}" style="max-width: 150px; margin-bottom: 10px;" alt="Authentica Logo">
                <div class="company-name">AUTHENTICA SARL</div>
                <div class="company-info">
                    RC/YAO/2020/B/788<br>
                    NIU: M022014406381T<br>
                    Adresse : Odza, Yaoundé - CAMEROUN<br>
                    Tél : +(237) 653 757 515 / 691 593 825<br>
                    Web : www.authentica.cm
                </div>
            </td>
            <td style="width: 40%; vertical-align: top; text-align: right;">
                <h1 class="invoice-title">FACTURE</h1>
                <p style="font-size: 14px; font-weight: bold; color: #333;">N° {{ $invoice_number }}</p>
                <p style="color: #666;">Date : {{ $date }}</p>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td style="width: 48%; vertical-align: top;">
                <div class="box" style="border-left: 4px solid #003366;">
                    <p class="box-title">Facturé à :</p>
                    <strong>{{ $hospital->name }}</strong><br>
                    @if($hospital->niu) NIU : {{ $hospital->niu }}<br> @endif
                    Pays : {{ $hospital->country->name ?? 'Non spécifié' }}
                </div>
            </td>
            <td style="width: 4%;"></td>
            <td style="width: 48%; vertical-align: top;">
                <div class="box" style="border-left: 4px solid #00a896; background-color: #f0fdfa;">
                    <p class="box-title" style="color: #00a896; border-color: #ccfbf1;">Détails de l'abonnement</p>
                    Période du : <strong>{{ $starting_date }}</strong><br>
                    Au : <strong>{{ $ending_date }}</strong><br><br>
                    Nombre de centres actifs : <strong>{{ $center_count }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="text-center">Prix Unitaire</th>
                <th class="text-center">Qté (Centres)</th>
                <th class="text-right">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>Frais de licence ERP ({{ $item['name'] }})</td>
                <td class="text-center">{{ number_format($item['unit_price'], 0, ',', ' ') }} {{ $currency }}</td>
                <td class="text-center">{{ $item['center_count'] }}</td>
                <td class="text-right">{{ number_format($item['sub_total'], 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <td>Total HT</td>
                <td class="text-right">{{ number_format($total, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            <tr>
                <td>TVA (0%)</td>
                <td class="text-right">0 {{ $currency }}</td>
            </tr>
            <tr class="total-final">
                <td>NET À PAYER</td>
                <td class="text-right">{{ number_format($total, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <strong>AUTHENTICA SARL</strong> - YAOUNDÉ-CAMEROUN<br>
        Document généré automatiquement par le système Asklepios ERP le {{ $date }}
    </div>

</body>
</html>