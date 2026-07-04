<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Historique Détaillé des Retours Fournisseurs</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        /* --- Structure Header --- */
        .header-table {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #e11d48;
            padding-bottom: 10px;
        }
        .header-table h1 {
            color: #e11d48;
            margin: 0 0 5px 0;
            font-size: 20px;
            text-transform: uppercase;
        }
        .header-table p {
            color: #777;
            margin: 0;
            font-size: 10px;
        }

        /* --- Blocs de Commandes --- */
        .order-block {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .order-info {
            background-color: #fff1f2;
            border: 1px solid #fecdd3;
            padding: 10px 15px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .order-info table {
            width: 100%;
            border: none;
        }
        .order-info td {
            padding: 2px;
            border: none;
        }
        .order-info strong {
            color: #1e293b;
        }
        
        /* --- Badges --- */
        .badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            color: #fff;
            text-transform: uppercase;
        }
        .bg-pending { background-color: #f59e0b; }
        .bg-shipped { background-color: #10b981; }
        .bg-cancelled { background-color: #ef4444; }

        /* --- Tableau des lignes --- */
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        table.items-table th, table.items-table td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
        }
        table.items-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
        }
        
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .text-red { color: #ef4444; font-weight: bold; }
        
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            height: 30px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
        }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 50%; vertical-align: top;">
                <h1>Historique des Retours</h1>
                <p>Généré par : {{ $user->first_name }} {{ $user->last_name }} le {{ now()->format('d/m/Y à H:i') }}</p>
            </td>
            <td style="width: 50%; vertical-align: top; text-align: right;">
                <p style="margin: 0 0 5px 0; color: #1e293b;"><strong>Critères de recherche :</strong></p>
                <p style="margin: 0; color: #777; font-size: 10px; line-height: 1.4;">
                    Période : 
                    @if(!empty($filters['start_date']) || !empty($filters['end_date']))
                        Du {{ !empty($filters['start_date']) ? \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') : 'Début' }} 
                        au {{ !empty($filters['end_date']) ? \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') : 'Aujourd\'hui' }}
                    @else
                        Toutes les dates
                    @endif
                    <br>
                    Succursale : {{ !empty($filters['pharmacy_branch_id']) ? 'Succursale #'.$filters['pharmacy_branch_id'] : ($user->profile_admin ? 'Toutes les succursales' : 'Votre succursale') }}
                    <br>
                    Statut : {{ !empty($filters['status']) ? $filters['status'] : 'Tous' }}
                </p>
            </td>
        </tr>
    </table>

    @forelse($returns as $r)
        <div class="order-block">
            <div class="order-info">
                <table>
                    <tr>
                        <td width="33%"><strong>Retour N° :</strong> {{ $r->id }}</td>
                        <td width="33%"><strong>Date :</strong> {{ $r->return_date->format('d/m/Y') }}</td>
                        <td width="34%" class="text-right">
                            <strong>Statut :</strong> 
                            @if($r->status == 'PENDING') <span class="badge bg-pending">En attente</span>
                            @elseif($r->status == 'SHIPPED') <span class="badge bg-shipped">Expédié</span>
                            @elseif($r->status == 'CANCELLED') <span class="badge bg-cancelled">Annulé</span>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Fournisseur :</strong> {{ $r->provider->name ?? 'N/A' }}</td>
                        <td colspan="2">
                            <strong>Commande d'origine :</strong> 
                            {{ $r->purchase_order_id ? '#' . $r->purchase_order_id : 'Non liée' }}
                            @if($user->profile_admin)
                                <span style="margin-left: 15px; color: #64748b; font-size: 10px;">
                                    <strong>Source :</strong> {{ $r->sourcePharmacy->name ?? 'N/A' }}
                                </span>
                            @endif
                        </td>
                    </tr>
                </table>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th width="35%">Article Renvoyé</th>
                        <th width="15%" class="text-center">Lot (Batch)</th>
                        <th width="15%" class="text-center">Qté Retournée</th>
                        <th width="35%">Motif</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($r->lines as $line)
                        <tr>
                            <td>{{ $line->article->name ?? 'Article inconnu' }}</td>
                            <td class="text-center font-mono">{{ $line->batch->batch_number ?? 'N/A' }}</td>
                            <td class="text-center text-red">{{ $line->qty_returned }}</td>
                            <td>{{ $line->reason ?? 'Non précisé' }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @empty
        <p style="text-align: center; color: #777; margin-top: 50px; padding: 30px; border: 1px dashed #cbd5e1;">
            Aucun retour trouvé pour les critères sélectionnés.
        </p>
    @endforelse

    <div class="footer">
        ERP Asclépios - Page <span class="page-number"></span>
    </div>

</body>
</html>