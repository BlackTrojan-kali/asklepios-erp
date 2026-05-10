import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, MapPin, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import useCountryStore from '../../../functions/country/useCountryStore'; // Ajuste le chemin
import CountryModal from '../../../components/modals/country/CountryModal'; // Ajuste le chemin
import type { CountryDto } from '../../../types/types';

const Countries = () => {
    const { countries, loading, pagination, getCountries } = useCountryStore();
    
    // États locaux
    const [searchInput, setSearchInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountryDto | null>(null);

    // Chargement initial
    useEffect(() => {
        getCountries(1, '');
    }, [getCountries]);

    // Gérer la recherche (déclenchée par le bouton ou la touche Entrée)
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        getCountries(1, searchInput);
    };

    // Ouvrir la modale pour Créer
    const handleOpenCreate = () => {
        setSelectedCountry(null);
        setIsModalOpen(true);
    };

    // Ouvrir la modale pour Modifier
    const handleOpenEdit = (country: CountryDto) => {
        setSelectedCountry(country);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#00a896]/10 text-[#00a896] rounded-lg">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366] dark:text-white">Gestion des Pays</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les pays couverts par votre ERP.</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Ajouter un pays
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search size={18} />
                        </div>
                        <input 
                            type="text" 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Rechercher par nom ou code..." 
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="bg-[#003366] hover:bg-[#002244] dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Rechercher
                    </button>
                </form>
            </div>

            {/* TABLEAU DES DONNÉES */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom du Pays</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Code ISO</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Devise</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 size={32} className="animate-spin text-[#00a896] mb-2" />
                                            <span>Chargement des données...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : countries.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        Aucun pays trouvé.
                                    </td>
                                </tr>
                            ) : (
                                countries.map((country) => (
                                    <tr key={country.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="p-4 font-medium text-slate-800 dark:text-gray-200">{country.name}</td>
                                        <td className="p-4 text-slate-600 dark:text-gray-400">
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold">{country.code}</span>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-gray-400">{country.currency}</td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => handleOpenEdit(country)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && countries.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                            <span className="ml-2">({pagination.total} résultats)</span>
                        </span>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => getCountries(pagination.currentPage - 1, searchInput)}
                                disabled={pagination.currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button 
                                onClick={() => getCountries(pagination.currentPage + 1, searchInput)}
                                disabled={pagination.currentPage === pagination.lastPage}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE CRÉATION / MODIFICATION */}
            <CountryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                countryToEdit={selectedCountry} 
            />

        </div>
    );
};

export default Countries;