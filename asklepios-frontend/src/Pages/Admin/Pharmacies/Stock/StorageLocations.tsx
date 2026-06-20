import React, { useEffect, useState, useMemo } from 'react';
import { 
    LayoutGrid, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    RefreshCw, 
    Loader2,
    MapPin,
    Barcode,
    Layers,
    Package,
    AlertCircle,
    GripVertical,
    ArrowDownLeft,
    Filter,
    ArrowRightLeft
} from 'lucide-react';
import Swal from 'sweetalert2';

// Stores
import useStorageLocationStore from '../../../../functions/pharmacy/useStorageLocationStore';
import useStockStore from '../../../../functions/pharmacy/useStockStore';

// Types
import type { StorageLocationDto } from '../../../../types/PharmMagTypes';

// Modales
import { CreateLocationModal } from '../../../../components/modals/Pharmacy/storage_location/CreateLocationModal';
import { UpdateLocationModal } from '../../../../components/modals/Pharmacy/storage_location/UpdateLocationModal';
import { AssignStockModal } from '../../../../components/modals/Pharmacy/storage_location/AssignStockModal';

const StorageLocations = () => {
    // --- STORES ---
    const { 
        locations, loading: locLoading,
        getLocations, deleteLocation, assignStockToLocation
    } = useStorageLocationStore();

    const {
        stocks, loading: stockLoading,
        getMyBranchStocks
    } = useStockStore();

    // --- ÉTATS STANDARDS ---
    const [unassignedSearch, setUnassignedSearch] = useState(''); // Recherche colonne gauche
    const [locationSearch, setLocationSearch] = useState('');     // Recherche colonne droite
    const [hideEmpty, setHideEmpty] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<StorageLocationDto | null>(null);
    const [stockToAssign, setStockToAssign] = useState<any | null>(null);

    // --- ÉTATS POUR LE DRAG & DROP ---
    const [hoveredLocationId, setHoveredLocationId] = useState<number | 'UNASSIGNED' | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // --- CHARGEMENT ---
    useEffect(() => {
        getLocations({});
        // Chargement large pour permettre le drag & drop client-side
        getMyBranchStocks({ per_page: 3000 }); 
    }, [getLocations, getMyBranchStocks]);

    const handleRefresh = () => {
        getLocations({});
        getMyBranchStocks({ per_page: 3000 });
    };

    // --- LOGIQUE DRAG & DROP ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, stockId: number) => {
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', stockId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setHoveredLocationId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, locationId: number | 'UNASSIGNED') => {
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move';
        if (hoveredLocationId !== locationId) {
            setHoveredLocationId(locationId);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setHoveredLocationId(null);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, locationId: number | null) => {
        e.preventDefault();
        setHoveredLocationId(null);
        setIsDragging(false);

        const stockIdStr = e.dataTransfer.getData('text/plain');
        if (!stockIdStr) return;
        const stockId = parseInt(stockIdStr, 10);

        const stock = stocks.find(s => s.id === stockId);
        if (!stock || stock.storage_location_id === locationId) return;

        // Appel API
        const success = await assignStockToLocation({
            stock_id: stockId,
            storage_location_id: locationId 
        });

        if (success) handleRefresh(); 
    };

    // --- LOGIQUE DE SUPPRESSION D'UNE ÉTAGÈRE ---
    const handleDelete = async (id: number, label: string) => {
        const result = await Swal.fire({
            title: 'Supprimer cet emplacement ?',
            text: `Voulez-vous vraiment supprimer "${label}" ? Les articles qui y sont stockés retourneront dans la zone d'attente (colonne de gauche).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: { popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200' }
        });
        
        if (result.isConfirmed) {
            const success = await deleteLocation(id);
            if(success) handleRefresh(); 
        }
    };

    // ==========================================
    // MOTEUR DE FILTRAGE (DOUBLE RECHERCHE)
    // ==========================================
    
    // 1. COLONNE GAUCHE (Articles non assignés)
    const filteredUnassignedStocks = useMemo(() => {
        const unassigned = stocks.filter(s => !s.storage_location_id);
        if (!unassignedSearch) return unassigned;
        
        const searchLower = unassignedSearch.toLowerCase();
        return unassigned.filter(s => 
            s.batch?.article?.name?.toLowerCase().includes(searchLower) ||
            s.batch?.batch_number?.toLowerCase().includes(searchLower)
        );
    }, [stocks, unassignedSearch]);

    // 2. COLONNE DROITE (Étagères et leur contenu)
    const processedLocations = useMemo(() => {
        const searchLower = locationSearch.toLowerCase();
        
        return locations.map(loc => {
            const stocksInLoc = stocks.filter(s => s.storage_location_id === loc.id);
            
            const matchingStocks = stocksInLoc.filter(s => 
                !locationSearch ||
                s.batch?.article?.name?.toLowerCase().includes(searchLower) ||
                s.batch?.batch_number?.toLowerCase().includes(searchLower)
            );

            const locMatchesSearch = !locationSearch || 
                (loc.aisle && loc.aisle.toLowerCase().includes(searchLower)) ||
                (loc.shelf && loc.shelf.toLowerCase().includes(searchLower)) ||
                (loc.code && loc.code.toLowerCase().includes(searchLower));

            const hasMatchingStocks = matchingStocks.length > 0;
            const isEmpty = stocksInLoc.length === 0;

            const isVisible = (locMatchesSearch || hasMatchingStocks) && (!hideEmpty || !isEmpty);

            return {
                ...loc,
                displayStocks: locMatchesSearch && !hasMatchingStocks ? stocksInLoc : matchingStocks,
                isEmpty,
                isVisible
            };
        }).filter(loc => loc.isVisible);
    }, [locations, stocks, locationSearch, hideEmpty]);

    const isLoading = locLoading || stockLoading;

    // --- COMPOSANT : CARTE ARTICLE DRAGGABLE ---
    const DraggableStockCard = ({ stock }: { stock: any }) => (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, stock.id)}
            onDragEnd={handleDragEnd}
            onClick={() => setStockToAssign(stock)} 
            className="group flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm hover:shadow hover:border-teal-400 dark:hover:border-teal-500 transition-all text-left cursor-grab active:cursor-grabbing w-full"
            title="Glissez pour déplacer, ou cliquez pour les options"
        >
            <div className="flex items-center gap-2 w-full min-w-0 pr-1">
                <div className="text-gray-300 dark:text-gray-600 group-hover:text-teal-500 shrink-0 cursor-grab">
                    <GripVertical size={14} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-gray-200 truncate leading-tight">
                        {stock.batch?.article?.name || "Article inconnu"}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate">
                            Lot: <span className="font-mono">{stock.batch?.batch_number}</span>
                        </span>
                        <span className="text-[10px] font-black text-[#00a896] bg-teal-50 dark:bg-teal-900/30 px-1 rounded shrink-0">
                            x{stock.qty}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] space-y-4">
            
            {/* EN-TÊTE ET ACTIONS GLOBALES */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg shadow-sm">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Rangement & Logistique</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Glissez de gauche à droite pour ranger, ou de droite à gauche pour retirer.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>
                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} /> Nouvelle Étagère
                    </button>
                </div>
            </div>

            {/* SPLIT SCREEN : 2 COLONNES */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
                
                {/* ========================================================= */}
                {/* COLONNE GAUCHE : ZONE D'ATTENTE (ARTICLES NON ASSIGNÉS)   */}
                {/* ========================================================= */}
                <div className="w-full lg:w-[320px] xl:w-[380px] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                    
                    {/* Header Gauche */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-900/10 shrink-0">
                        <div className="flex items-center justify-between mb-3 text-amber-700 dark:text-amber-500">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} />
                                <h2 className="text-sm font-bold uppercase tracking-wide">Zone d'attente</h2>
                            </div>
                            <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">
                                {filteredUnassignedStocks.length}
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Filtrer les articles en vrac..."
                                value={unassignedSearch}
                                onChange={(e) => setUnassignedSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700/50 rounded-lg outline-none focus:border-amber-400 text-xs text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Contenu Gauche (Zone de Drop pour désassigner) */}
                    <div 
                        onDragOver={(e) => handleDragOver(e, 'UNASSIGNED')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, null)} // Null = Désassigner
                        className={`flex-1 overflow-y-auto p-3 custom-scrollbar transition-colors ${
                            hoveredLocationId === 'UNASSIGNED' 
                                ? 'bg-amber-100/50 dark:bg-amber-900/30' 
                                : isDragging 
                                    ? 'bg-amber-50/30 dark:bg-amber-900/5' 
                                    : 'bg-slate-50 dark:bg-transparent'
                        }`}
                    >
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-amber-500" /></div>
                        ) : filteredUnassignedStocks.length === 0 ? (
                            <div className="text-center p-8 text-amber-600/50 dark:text-amber-500/40 text-sm border-2 border-dashed border-amber-200 dark:border-amber-800/50 rounded-lg">
                                {isDragging ? (
                                    <>
                                        <ArrowRightLeft size={32} className="mx-auto mb-2 opacity-50" />
                                        Déposez ici pour retirer de l'étagère
                                    </>
                                ) : (
                                    <>
                                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                                        {unassignedSearch ? "Aucun article trouvé." : "Tous vos articles sont rangés !"}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {filteredUnassignedStocks.map(stock => (
                                    <DraggableStockCard key={stock.id} stock={stock} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>


                {/* ========================================================= */}
                {/* COLONNE DROITE : LA CARTOGRAPHIE DU MAGASIN               */}
                {/* ========================================================= */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-w-0">
                    
                    {/* Header Droite */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30 shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3 top-2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Rechercher une étagère, un produit rangé..."
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                            />
                        </div>
                        
                        <button 
                            onClick={() => setHideEmpty(!hideEmpty)}
                            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                                hideEmpty 
                                    ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800/50' 
                                    : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Filter size={14} />
                            {hideEmpty ? 'Étagères vides masquées' : 'Masquer les vides'}
                        </button>
                    </div>

                    {/* Contenu Droite (Grille des étagères) */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 size={40} className="animate-spin text-teal-500" /></div>
                        ) : processedLocations.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                                <MapPin size={48} className="mx-auto mb-3 opacity-50" />
                                <p className="font-medium">
                                    {locationSearch ? "Aucun résultat pour cette recherche." : "Aucun emplacement configuré."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {processedLocations.map(loc => {
                                    const locLabel = [loc.aisle, loc.shelf].filter(Boolean).join(' - ') || `Zone #${loc.id}`;
                                    const isHovered = hoveredLocationId === loc.id;

                                    return (
                                        <div 
                                            key={loc.id} 
                                            onDragOver={(e) => handleDragOver(e, loc.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, loc.id)}
                                            className={`flex flex-col h-[280px] rounded-xl overflow-hidden transition-all duration-200 shadow-sm ${
                                                isHovered 
                                                    ? 'bg-teal-50 border-2 border-dashed border-teal-500 dark:bg-teal-900/20 dark:border-teal-400 scale-[1.02]' 
                                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            {/* Header Étagère */}
                                            <div className={`p-2.5 border-b flex justify-between items-start transition-colors shrink-0 ${
                                                isHovered ? 'bg-teal-100/50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-800/50' : 'bg-slate-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700'
                                            }`}>
                                                <div className="min-w-0 pr-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white truncate">
                                                        <Layers size={14} className={isHovered ? "text-teal-600 dark:text-teal-400" : "text-teal-500"} />
                                                        <span className="truncate">{locLabel}</span>
                                                    </div>
                                                    {loc.code && (
                                                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300 uppercase">
                                                            <Barcode size={10} /> {loc.code}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={() => setSelectedLocation(loc)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors" title="Modifier">
                                                        <Edit size={12} />
                                                    </button>
                                                    <button onClick={() => handleDelete(loc.id, locLabel)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition-colors" title="Supprimer">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Body Étagère (Scrollable list of items) */}
                                            <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
                                                {isHovered && loc.displayStocks.length === 0 ? (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                        <ArrowDownLeft size={24} className="text-teal-500 dark:text-teal-400 animate-bounce mb-1" />
                                                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Déposer ici</span>
                                                    </div>
                                                ) : loc.displayStocks.length === 0 ? (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                                        <Package size={20} className="text-gray-400 dark:text-gray-500 mb-1" />
                                                        <span className="text-[10px] text-gray-500">Étagère vide</span>
                                                    </div>
                                                ) : (
                                                    loc.displayStocks.map((stock: any) => (
                                                        <DraggableStockCard key={stock.id} stock={stock} />
                                                    ))
                                                )}
                                            </div>
                                            
                                            {/* Indicateur visuel du bas */}
                                            <div className={`h-1.5 w-full border-t shrink-0 transition-colors ${
                                                isHovered ? 'bg-teal-200 dark:bg-teal-800 border-teal-300 dark:border-teal-700' : 'bg-slate-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                                            }`}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* MODALES */}
            <CreateLocationModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <UpdateLocationModal isOpen={!!selectedLocation} onClose={() => setSelectedLocation(null)} location={selectedLocation} />
            <AssignStockModal
                isOpen={!!stockToAssign}
                onClose={() => setStockToAssign(null)}
                stockId={stockToAssign?.id}
                articleName={stockToAssign?.batch?.article?.name || "Article sélectionné"}
                currentLocationId={stockToAssign?.storage_location_id}
                locations={locations}
                onSuccess={handleRefresh}
            />

        </div>
    );
};

export default StorageLocations;