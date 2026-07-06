<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture d'Abonnement</title>
    <style>
        @page {
            margin: 40px 50px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            font-size: 13px;
            line-height: 1.5;
            position: relative;
        }

        /* --- FILIGRANE (WATERMARK) ASCLEPIOS --- */
        .watermark {
            position: fixed;
            top: 25%; /* Ajuste selon le centrage souhaité */
            left: 15%;
            width: 70%;
            text-align: center;
            opacity: 0.15; /* Transparence (0.15 = 15% visible) */
            z-index: -1000; /* Le place derrière tout le reste du texte */
        }
        .watermark img {
            width: 100%;
            max-width: 900px; /* Taille maximale du filigrane */
        }

        /* --- UTILITAIRES --- */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-primary { color: #00a896; }
        .text-dark { color: #003366; }
        h1, h2, h3, h4 { margin: 0; }

        /* --- EN-TÊTE --- */
        .header-table {
            width: 100%;
            margin-bottom: 40px;
        }
        .header-logo {
            max-width: 280px; /* Gros logo Authentica */
            max-height: 120px;
        }
        .company-details {
            font-size: 11px;
            color: #555;
            margin-top: 15px;
        }
        .company-details strong {
            color: #222;
            font-size: 14px;
        }
        .invoice-title {
            font-size: 36px;
            font-weight: bold;
            color: #00a896;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        .invoice-meta {
            font-size: 14px;
            color: #555;
        }

        /* --- INFO CLIENT & ABONNEMENT --- */
        .info-table {
            width: 100%;
            margin-bottom: 40px;
        }
        .info-table td {
            vertical-align: top;
        }
        .box-client {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        .box-subs {
            border: 1px solid #e2e8f0;
            padding: 20px;
            border-radius: 8px;
        }
        .box-title {
            color: #003366;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
        }

        /* --- TABLEAU DES LIGNES --- */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #003366;
            color: #ffffff;
            padding: 12px 10px;
            font-size: 11px;
            text-transform: uppercase;
            text-align: left;
        }
        .items-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .items-table th.right, .items-table td.right { text-align: right; }
        .items-table th.center, .items-table td.center { text-align: center; }

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
        .totals-table tr:last-child td {
            border-bottom: none;
        }
        .net-to-pay {
            background-color: #00a896;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }
        .net-to-pay td {
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
            color: #888;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        .footer strong {
            color: #333;
        }
    </style>
</head>
<body>

    @php
        // 1. Encodage du Logo AUTHENTICA (En-tête)
        $authenticaPath = public_path('images/authentica_logo.png');
        $authenticaData = '';
        if (file_exists($authenticaPath)) {
            $authenticaData = 'data:image/png;base64,' . base64_encode(file_get_contents($authenticaPath));
        }

        // 2. Encodage du Logo ASCLEPIOS (Filigrane)
        $asklepiosPath = public_path('images/asklepios_logo.png');
        $asklepiosData = '';
        if (file_exists($asklepiosPath)) {
            $asklepiosData = 'data:image/png;base64,' . base64_encode(file_get_contents($asklepiosPath));
        }
    @endphp

    @if($asklepiosData)
    <div class="watermark">
        <img src="{{ $asklepiosData }}" alt="Filigrane Asclépios">
    </div>
    @endif

    <table class="header-table">
        <tr>
            <td width="55%" style="vertical-align: top;">
                @if($authenticaData)
                    <img src="{{ $authenticaData }}" alt="Logo Authentica" class="header-logo">
                @else
                    <h2 class="text-primary">AUTHENTICA SARL</h2>
                @endif
                
                <div class="company-details">
                    <strong>AUTHENTICA SARL</strong><br>
                    RC/YAO/2020/B/788<br>
                    NIU: M022014406381T<br>
                    Adresse: Odza, Yaoundé CAMEROUN<br>
                    Tél: +(237) 653 757 515 / 691 593 825<br>
                    Web: www.authentica.cm
                </div>
            </td>
            <td width="45%" style="vertical-align: top; text-align: right;">
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-meta">
                    <strong>N° {{ $invoice_number }}</strong><br><br>
                    Date d'émission: {{ $date }}
                </div>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td width="48%">
                <div class="box-client">
                    <div class="box-title">Facturé à :</div>
                    <strong>{{ $hospital->name }}</strong><br><br>
                    NIU: {{ $hospital->niu ?? 'Non spécifié' }}<br>
                    Pays: {{ $hospital->country->name ?? 'Non spécifié' }}
                </div>
            </td>
            <td width="4%"></td> <td width="48%">
                <div class="box-subs">
                    <div class="box-title">Détails de l'abonnement</div>
                    Période du : <strong>{{ $starting_date }}</strong><br>
                    Au : <strong>{{ $ending_date }}</strong><br><br>
                    Nombre de centres actifs : <strong>{{ $center_count }}</strong> <br>
                    Nombre de pharmacies actives : <strong>{{ $pharmacy_count }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="right">Prix Unitaire</th>
                <th class="center">Qté (Centres)</th>
                <th class="right">Total HT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>Frais de licence ERP ({{ $item['name'] }})</td>
                <td class="right">{{ number_format($item['unit_price'], 0, ',', ' ') }} {{ $currency }}</td>
                <td class="center">{{ $item['center_count'] }}</td>
                <td class="right">{{ number_format($item['sub_total'], 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-wrapper">
        <table class="totals-table">
            <tr>
                <td>Total HT</td>
                <td class="right">{{ number_format($total, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
            <tr>
                <td>TVA (0%)</td>
                <td class="right">0 {{ $currency }}</td>
            </tr>
            <tr class="net-to-pay">
                <td>NET À PAYER</td>
                <td class="right">{{ number_format($total, 0, ',', ' ') }} {{ $currency }}</td>
            </tr>
        </table>
        <div style="clear: both;"></div>
    </div>

    <div class="footer">
        <strong>AUTHENTICA SARL-YAOUNDÉ-CAMEROUN</strong><br>
        Document généré automatiquement par le système Asclépios ERP le {{ date('d/m/Y') }}.
    </div>

</body>
</html>