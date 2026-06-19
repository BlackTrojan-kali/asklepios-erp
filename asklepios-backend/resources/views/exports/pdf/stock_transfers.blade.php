<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Transferts de Stock</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        /* --- EN-TÊTE --- */
        .header-table {
            width: 100%;
            border-bottom: 2px solid #4f46e5; /* Couleur Indigo */
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
        }
        .header-subtitle {
            font-size: 12px;
            color: #64748b;
        }
        .text-right {
            text-align: right;
        }

        /* --- FILTRES --- */
        .filters-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 10px;
        }

        /* --- TABLEAU DES DONNÉES --- */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
        }
        .data-table td {
            padding: 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        /* Évite qu'une ligne soit coupée entre deux pages */
        .data-table tr {
            page-break-inside: avoid; 
        }

        /* --- STATUTS --- */
        .status {
            font-weight: bold;
            font-size: 9px;
            padding: 3px 6px;
            border-radius: 3px;
        }
        .status.initiated { background-color: #dbeafe; color: #1d4ed8; } /* Bleu */
        .status.terminated { background-color: #d1fae5; color: #047857; } /* Émeraude */
        .status.cancelled { background-color: #fee2e2; color: #b91c1c; } /* Rouge */

        /* --- LISTE DES ARTICLES --- */
        .items-list {
            margin: 0;
            padding-left: 15px;
            font-size: 9px;
            color: #475569;
        }
        .items-list li {
            margin-bottom: 2px;
        }
        .qty-bold {
            font-weight: bold;
            color: #4f46e5;
        }

        /* --- PIED DE PAGE --- */
        .footer {
            position: fixed;
            bottom: 0px;
            left: 0px;
            right: 0px;
            height: 20px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
        }
    </style>
</head>
<body>

    <div class="footer">
        Asclépios ERP - Généré le {{ $date }} | Page <span class="pagenum"></span>
    </div>

    <table class="header-table">
        <tr>
            <td width="50%">
                <div class="header-title">ASCLÉPIOS ERP</div>
                <div class="header-subtitle">Gestion Hospitalière Intégrée</div>
            </td>
            <td width="50%" class="text-right">
                <div class="header-title" style="color: #4f46e5;">Rapport des Transferts</div>
                <div class="header-subtitle">Module Pharmacie & Magasin</div>
            </td>
        </tr>
    </table>

    <div class="filters-box">
        <strong>Critères appliqués :</strong>
        @if(empty($filters['status']) && empty($filters['start_date']) && empty($filters['end_date']))
            Tous les transferts
        @else
            @if(!empty($filters['status']))
                Statut: 
                @if($filters['status'] == 'INITIATED') En Transit 
                @elseif($filters['status'] == 'TERMINATED') Réceptionné 
                @elseif($filters['status'] == 'CANCELLED') Annulé 
                @else {{ $filters['status'] }} @endif
                |
            @endif
            @if(!empty($filters['start_date'])) Du: {{ \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') }} | @endif
            @if(!empty($filters['end_date'])) Au: {{ \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') }} @endif
        @endif
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th width="8%">ID</th>
                <th width="12%">Dates</th>
                <th width="20%">Trajet</th>
                <th width="15%">Logistique</th>
                <th width="35%">Articles Expédiés</th>
                <th width="10%">Statut</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transfers as $transfer)
                <tr>
                    <td><strong>#TRF-{{ str_pad($transfer->id, 4, '0', STR_PAD_LEFT) }}</strong></td>
                    
                    <td>
                        Exp: {{ $transfer->shipped_at ? \Carbon\Carbon::parse($transfer->shipped_at)->format('d/m/y H:i') : 'N/A' }}<br>
                        Réc: {{ $transfer->received_at ? \Carbon\Carbon::parse($transfer->received_at)->format('d/m/y H:i') : '---' }}
                    </td>
                    
                    <td>
                        <strong style="color:#b91c1c;">De:</strong> {{ $transfer->sourcePharmacy->name ?? 'N/A' }}<br>
                        <strong style="color:#047857;">Vers:</strong> {{ $transfer->destinationPharmacy->name ?? 'N/A' }}
                    </td>
                    
                    <td>
                        {{ $transfer->driver->fullname ?? 'Chauffeur Inconnu' }}<br>
                        <span style="color:#64748b; font-size:9px;">{{ $transfer->vehicule->model ?? 'Véhicule N/A' }} ({{ $transfer->vehicule->licence_plate ?? '' }})</span>
                    </td>
                    
                    <td>
                        @if($transfer->lines && $transfer->lines->count() > 0)
                            <ul class="items-list">
                                @foreach($transfer->lines as $line)
                                    <li>
                                        {{ $line->batch->article->name ?? 'Article inconnu' }} 
                                        (Lot: {{ $line->batch->batch_number ?? 'N/A' }}) - 
                                        Qté: <span class="qty-bold">{{ $line->qty_shipped }}</span>
                                    </li>
                                @endforeach
                            </ul>
                        @else
                            <span style="color:#94a3b8; font-style:italic;">Aucun détail</span>
                        @endif
                    </td>
                    
                    <td>
                        @if($transfer->status == 'INITIATED')
                            <span class="status initiated">EN TRANSIT</span>
                        @elseif($transfer->status == 'TERMINATED')
                            <span class="status terminated">RÉCEPTIONNÉ</span>
                        @elseif($transfer->status == 'CANCELLED')
                            <span class="status cancelled">ANNULÉ</span>
                        @else
                            <span class="status">{{ $transfer->status }}</span>
                        @endif
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
                        Aucun transfert trouvé pour la période sélectionnée.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

</body>
</html>