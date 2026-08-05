<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport - Stock de Sang</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
        .header { width: 100%; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #dc2626; margin: 0; font-size: 20px; }
        .header p { margin: 5px 0 0 0; color: #555; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; color: #333; font-weight: bold; font-size: 10px; text-transform: uppercase; }
        .bg-A { color: #dc2626; font-weight: bold; }
        .status-AVAILABLE { color: #16a34a; font-weight: bold; }
        .status-QUARANTINE { color: #d97706; font-weight: bold; }
        .status-USED { color: #2563eb; font-weight: bold; }
        .status-EXPIRED { color: #dc2626; font-weight: bold; }
        .footer { position: fixed; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 9px; color: #888; border-top: 1px solid #eee; padding-top: 5px; }
    </style>
</head>
<body>

    <div class="header">
        <h1>État du Stock : Banque de Sang</h1>
        <p>Généré le : {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}</p>
        <p>Total des poches : {{ count($bloodBags) }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Code-Barre / ID</th>
                <th>Groupe</th>
                <th>Composant</th>
                <th>Volume (ml)</th>
                <th>Provenance</th>
                <th>Frigo Assigné</th>
                <th>Date d'Expiration</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($bloodBags as $bag)
            <tr>
                <td>{{ $bag->barcode ?? 'ID: ' . $bag->id }}</td>
                <td class="bg-A">{{ $bag->blood_type }}</td>
                <td>
                    @if($bag->type === 'WHOLE_BLOOD') Sang Total
                    @elseif($bag->type === 'RED_CELLS') Globules Rouges
                    @elseif($bag->type === 'PLASMA') Plasma
                    @endif
                </td>
                <td>{{ $bag->volume_ml }}</td>
                <td>
                    @if($bag->bloodDonor)
                        Donneur: {{ $bag->bloodDonor->first_name }} {{ $bag->bloodDonor->last_name }}
                    @else
                        Externe: {{ $bag->external_supplier }}
                    @endif
                </td>
                <td>{{ $bag->bloodRefrigerator ? $bag->bloodRefrigerator->name : 'N/A' }}</td>
                <td>{{ \Carbon\Carbon::parse($bag->expiry_date)->format('d/m/Y') }}</td>
                <td class="status-{{ $bag->status }}">
                    @if($bag->status === 'AVAILABLE') DISPONIBLE
                    @elseif($bag->status === 'QUARANTINE') QUARANTAINE
                    @elseif($bag->status === 'USED') UTILISÉE
                    @elseif($bag->status === 'EXPIRED') EXPIRÉE
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Document généré par Asklepios ERP - Module Banque de Sang
    </div>

</body>
</html>