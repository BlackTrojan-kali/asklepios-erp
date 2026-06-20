<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bordereau de Route #{{ str_pad($transfer->id, 5, '0', STR_PAD_LEFT) }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
        .uppercase { text-transform: uppercase; }
        
        /* En-tête */
        .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
        .hospital-name { font-size: 18px; font-weight: bold; color: #0f172a; }
        .doc-title { font-size: 22px; font-weight: bold; color: #d97706; /* Orange pour la logistique */ }
        
        /* Blocs d'information */
        .info-table { width: 100%; margin-bottom: 20px; }
        .box { border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; background-color: #f8fafc; }
        .box-title { font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
        
        /* Transport */
        .transport-box { border: 2px dashed #94a3b8; padding: 10px; background-color: #f1f5f9; margin-bottom: 20px; }
        
        /* Tableau des articles */
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background-color: #e2e8f0; color: #1e293b; padding: 8px; text-align: left; font-size: 11px; border: 1px solid #cbd5e1; }
        .items-table td { padding: 8px; border: 1px solid #cbd5e1; font-size: 11px; }
        .items-table th.text-center, .items-table td.text-center { text-align: center; }
        
        /* Signatures */
        .signature-table { width: 100%; margin-top: 50px; page-break-inside: avoid; }
        .signature-box { border: 1px solid #cbd5e1; height: 100px; padding: 5px; text-align: center; font-size: 10px; color: #64748b; }
        .signature-title { font-weight: bold; color: #0f172a; margin-bottom: 10px; font-size: 11px; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td width="50%">
                <div class="hospital-name">ASCLÉPIOS ERP</div>
                <div style="color: #64748b;">Réseau des Pharmacies</div>
            </td>
            <td width="50%" class="text-right">
                <div class="doc-title uppercase">Bordereau de Route</div>
                <div class="bold mt-10" style="font-size: 14px;">N° TRF-{{ str_pad($transfer->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div>Date d'édition : {{ date('d/m/Y H:i') }}</div>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td width="48%" valign="top">
                <div class="box">
                    <div class="box-title uppercase">Expéditeur (Départ)</div>
                    <div class="bold" style="font-size: 14px;">{{ $transfer->sourcePharmacy->name ?? 'Pharmacie Inconnue' }}</div>
                    @if($transfer->sourcePharmacy && $transfer->sourcePharmacy->adress)
                        <div class="mt-10">{{ $transfer->sourcePharmacy->adress }}</div>
                    @endif
                    <div class="mt-10" style="color: #64748b;">Date d'expédition : {{ $transfer->shipped_at ? \Carbon\Carbon::parse($transfer->shipped_at)->format('d/m/Y H:i') : 'En attente' }}</div>
                </div>
            </td>
            <td width="4%"></td>
            <td width="48%" valign="top">
                <div class="box">
                    <div class="box-title uppercase">Destinataire (Arrivée)</div>
                    <div class="bold" style="font-size: 14px;">{{ $transfer->destinationPharmacy->name ?? 'Pharmacie Inconnue' }}</div>
                    @if($transfer->destinationPharmacy && $transfer->destinationPharmacy->adress)
                        <div class="mt-10">{{ $transfer->destinationPharmacy->adress }}</div>
                    @endif
                    <div class="mt-10" style="color: #64748b;">Statut actuel : <span class="bold">{{ $transfer->status }}</span></div>
                </div>
            </td>
        </tr>
    </table>

    <div class="transport-box">
        <table width="100%">
            <tr>
                <td width="50%">
                    <span class="bold">Chauffeur / Transporteur :</span><br>
                    {{ $transfer->driver->fullname ?? 'Non assigné' }} 
                    @if($transfer->driver && $transfer->driver->phone) (Tél: {{ $transfer->driver->phone }}) @endif
                </td>
                <td width="50%">
                    <span class="bold">Véhicule d'expédition :</span><br>
                    {{ $transfer->vehicule->model ?? 'Véhicule inconnu' }} - Immat: <span class="bold">{{ $transfer->vehicule->licence_plate ?? 'N/A' }}</span>
                </td>
            </tr>
        </table>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th width="5%" class="text-center">#</th>
                <th width="50%">Désignation de l'Article</th>
                <th width="25%" class="text-center">N° de Lot</th>
                <th width="10%" class="text-center">Qté Exp.</th>
                <th width="10%" class="text-center">Pointage</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transfer->lines as $index => $line)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td><span class="bold">{{ $line->batch->article->name ?? 'Article inconnu' }}</span></td>
                <td class="text-center">{{ $line->batch->batch_number ?? 'N/A' }}</td>
                <td class="text-center bold" style="font-size: 12px;">{{ $line->qty_shipped }}</td>
                <td class="text-center">
                    <div style="width: 15px; height: 15px; border: 1px solid #333; margin: 0 auto;"></div>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="signature-table">
        <tr>
            <td width="30%">
                <div class="signature-box">
                    <div class="signature-title">L'EXPÉDITEUR</div>
                    (Signature & Cachet)
                </div>
            </td>
            <td width="5%"></td>
            <td width="30%">
                <div class="signature-box">
                    <div class="signature-title">LE TRANSPORTEUR</div>
                    (Signature)
                </div>
            </td>
            <td width="5%"></td>
            <td width="30%">
                <div class="signature-box">
                    <div class="signature-title">LE DESTINATAIRE</div>
                    (Signature & Cachet à réception)
                </div>
            </td>
        </tr>
    </table>

</body>
</html>