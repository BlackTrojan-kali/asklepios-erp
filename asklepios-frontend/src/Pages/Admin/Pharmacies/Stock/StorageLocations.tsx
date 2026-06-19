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
    ArrowRightLeft,
    AlertCircle,
    GripVertical,
    ArrowDownLeft
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
    // Hooks des stores
    const { 
        locations, loading: locLoading,
        getLocations, deleteLocation, assignStockToLocation // <-- Importation de ta méthode
    } = useStorageLocationStore();

    const {
        stocks, loading: stockLoading,
        getMyBranchStocks
    } = useStockStore();

    // États standards
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<StorageLocationDto | null>(null);
    const [stockToAssign, setStockToAssign] = useState<any | null>(null);

    // --- ÉTATS POUR LE DRAG & DROP ---
    const [hoveredLocationId, setHoveredLocationId] = useState<number | 'UNASSIGNED' | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Chargement initial
    useEffect(() => {
        getLocations({});
        getMyBranchStocks({});
    }, [getLocations, getMyBranchStocks]);

    const handleRefresh = () => {
        getLocations({});
        getMyBranchStocks({});
    };

    // --- LOGIQUE DRAG & DROP ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement | HTMLButtonElement>, stockId: number) => {
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

        // Vérifier si l'article est déjà à cet emplacement exact
        const stock = stocks.find(s => s.id === stockId);
        if (!stock || stock.storage_location_id === locationId) return;

        // UTILISATION DE TON STORE ICI
        const success = await assignStockToLocation({
            stock_id: stockId,
            storage_location_id: locationId // Sera null si déposé dans la zone d'attente (UNASSIGNED)
        });

        if (success) {
            handleRefresh(); // Rafraîchit les stocks pour afficher la nouvelle position
        }
    };

    // Suppression d'une zone
    const handleDelete = async (id: number, label: string) => {
        const result = await Swal.fire({
            title: 'Supprimer cet emplacement ?',
            text: `Voulez-vous vraiment supprimer "${label}" ? Les articles qui y sont stockés seront retirés de cette étagère (mais resteront en stock).`,
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

    // --- FILTRAGE ET ORGANISATION DES DONNÉES ---
    const filteredLocations = useMemo(() => {
        if (!searchTerm) return locations;
        const lowerSearch = searchTerm.toLowerCase();
        return locations.filter(loc => 
            (loc.aisle && loc.aisle.toLowerCase().includes(lowerSearch)) ||
            (loc.shelf && loc.shelf.toLowerCase().includes(lowerSearch)) ||
            (loc.code && loc.code.toLowerCase().includes(lowerSearch))
        );
    }, [locations, searchTerm]);

    const unassignedStocks = useMemo(() => {
        return stocks.filter(s => !s.storage_location_id);
    }, [stocks]);

    const isLoading = locLoading || stockLoading;

    // Composant réutilisable pour une carte "Stock" (Draggable)
    const DraggableStockCard = ({ stock }: { stock: any }) => (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, stock.id)}
            onDragEnd={handleDragEnd}
            onClick={() => setStockToAssign(stock)} // Fallback au clic
            className="group flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:border-teal-400 dark:hover:border-teal-500 transition-all text-left cursor-grab active:cursor-grabbing w-full sm:w-auto min-w-[220px]"
            title="Glissez pour déplacer, ou cliquez pour les options"
        >
            <div className="flex items-center gap-3 w-full min-w-0 pr-2">
                <div className="text-gray-300 dark:text-gray-600 group-hover:text-teal-500 shrink-0 cursor-grab">
                    <GripVertical size={16} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-gray-200 truncate">
                        {stock.batch?.article?.name || "Article inconnu"}
                    </p>
                    <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            Lot: <span className="font-mono bg-slate-100 dark:bg-gray-700 px-1 rounded">{stock.batch?.batch_number}</span>
                        </span>
                        <span className="text-xs font-black text-[#00a896] bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded shrink-0">
                            x{stock.qty}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE ET ACTIONS GLOBALES */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400 rounded-lg shadow-sm">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bibliothèque du Magasin</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Glissez-déposez vos articles pour les ranger sur les étagères.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="p-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                        title="Rafraîchir la bibliothèque"
                    >
                        <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                    </button>

                    <button 
                        onClick={() => setIsCreateOpen(true)}
                        className="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm"
                    >
                        <Plus size={18} />
                        Nouvelle Étagère
                    </button>
                </div>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher une allée, une étagère ou un code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white transition-colors"
                    />
                </div>
            </div>

            {/* CHARGEMENT GLOBAL */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Loader2 size={40} className="animate-spin text-[#00a896] mb-4" />
                    <p className="text-slate-500 dark:text-gray-400 font-medium">Analyse de la cartographie du magasin...</p>
                </div>
            ) : (
                <>
                    {/* ZONE 1 : ZONE D'ATTENTE (DROPZONE "UNASSIGNED") */}
                    <div 
                        onDragOver={(e) => handleDragOver(e, 'UNASSIGNED')}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, null)} // null pour retirer un article de son emplacement
                        className={`transition-all duration-200 rounded-xl p-5 border-2 ${
                            hoveredLocationId === 'UNASSIGNED' 
                                ? 'bg-amber-100 border-amber-500 dark:bg-amber-900/40 dark:border-amber-400 scale-[1.01]' 
                                : isDragging
                                    ? 'bg-amber-50/50 border-amber-300 border-dashed dark:bg-amber-900/10 dark:border-amber-700/50'
                                    : unassignedStocks.length > 0
                                        ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 border-dashed'
                                        : 'hidden'
                        }`}
                    >
                        <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-500">
                            <AlertCircle size={20} />
                            <h2 className="text-lg font-bold">Zone d'attente (Articles non rangés)</h2>
                            <span className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                {unassignedStocks.length}
                            </span>
                        </div>
                        
                        {unassignedStocks.length === 0 && isDragging ? (
                            <div className="py-6 text-center text-amber-600 dark:text-amber-500 opacity-70 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg">
                                <Package size={32} className="mx-auto mb-2" />
                                <p>Déposez un article ici pour le retirer de son étagère</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {unassignedStocks.map(stock => (
                                    <DraggableStockCard key={stock.id} stock={stock} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ZONE 2 : LA BIBLIOTHÈQUE (ÉTAGÈRES ET RAYONS) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLocations.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
                                <MapPin size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun emplacement ne correspond à votre recherche.</p>
                            </div>
                        ) : (
                            filteredLocations.map(loc => {
                                const stocksInLocation = stocks.filter(s => s.storage_location_id === loc.id);
                                const locLabel = [loc.aisle, loc.shelf].filter(Boolean).join(' - ') || `Zone #${loc.id}`;
                                const isHovered = hoveredLocationId === loc.id;

                                return (
                                    <div 
                                        key={loc.id} 
                                        onDragOver={(e) => handleDragOver(e, loc.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, loc.id)}
                                        className={`flex flex-col rounded-xl overflow-hidden transition-all duration-200 shadow-sm ${
                                            isHovered 
                                                ? 'bg-teal-50 border-2 border-dashed border-teal-500 dark:bg-teal-900/20 dark:border-teal-400 scale-[1.02]' 
                                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md'
                                        }`}
                                    >
                                        {/* EN-TÊTE DE L'ÉTAGÈRE */}
                                        <div className={`p-4 border-b flex justify-between items-start transition-colors ${
                                            isHovered ? 'bg-teal-100/50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-800/50' : 'bg-slate-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                                        }`}>
                                            <div>
                                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-white">
                                                    <Layers size={16} className={isHovered ? "text-teal-600 dark:text-teal-400" : "text-teal-500"} />
                                                    {locLabel}
                                                </div>
                                                {loc.code && (
                                                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700 dark:bg-gray-700 dark:text-gray-300 uppercase">
                                                        <Barcode size={10} />
                                                        {loc.code}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-1">
                                                <button onClick={() => setSelectedLocation(loc)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(loc.id, locLabel)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* CORPS DE L'ÉTAGÈRE */}
                                        <div className={`flex-1 p-3 flex flex-col gap-2 min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar transition-colors ${
                                            isHovered ? 'bg-teal-50/30 dark:bg-transparent' : 'bg-slate-50/50 dark:bg-gray-800/50'
                                        }`}>
                                            {isHovered && stocksInLocation.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                    <ArrowDownLeft size={32} className="text-teal-500 dark:text-teal-400 animate-bounce mb-2" />
                                                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">Déposer ici</span>
                                                </div>
                                            ) : stocksInLocation.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                                                    <Package size={24} className="text-gray-300 dark:text-gray-600 mb-1" />
                                                    <span className="text-xs text-gray-400">Étagère vide</span>
                                                </div>
                                            ) : (
                                                stocksInLocation.map(stock => (
                                                    <DraggableStockCard key={stock.id} stock={stock} />
                                                ))
                                            )}
                                        </div>
                                        
                                        {/* PIED DE L'ÉTAGÈRE */}
                                        <div className={`h-3 w-full border-t transition-colors ${
                                            isHovered ? 'bg-teal-200 dark:bg-teal-800 border-teal-300 dark:border-teal-700' : 'bg-slate-200 dark:bg-gray-700 border-slate-300 dark:border-gray-600'
                                        }`}></div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}

            {/* MODALES */}
            <CreateLocationModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
            />

            <UpdateLocationModal 
                isOpen={!!selectedLocation} 
                onClose={() => setSelectedLocation(null)} 
                location={selectedLocation}
            />

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