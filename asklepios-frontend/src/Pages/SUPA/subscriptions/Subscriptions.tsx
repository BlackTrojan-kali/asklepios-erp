import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Download, RefreshCw, Eye, ChevronLeft, ChevronRight, Loader2, CalendarDays } from 'lucide-react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

// Stores
import useSubscriptionStore from '../../../functions/subscriptions/useSubscriptionStore';
import useHospitalStore from '../../../functions/hospital/useHospitalStore'; 
import useLicenceStore from '../../../functions/licence/useLicenceStore'; 
// Assure-toi d'avoir un useCountryStore ou remplace par un fetch direct
// import useCountryStore from '../../functions/country/useCountryStore'; 

// Modèles et Types
import type { SubscriptionDto, SubscriptionPreviewDto } from "../../../types/types" ;

// Modales
import { CreateSubscriptionModal } from '../../../components/modals/Subscription/CreateSubscriptionModal';
import { UpdateSubscriptionModal } from '../../../components/modals/Subscription/UpdateSubscriptionModal'; 
import useCountryStore from '../../../functions/country/useCountryStore';

const Subscriptions = () => {
    const { 
        subscriptions, loading, actionLoading, pagination, 
        getSubscriptions, deleteSubscription, renewSubscription, 
        downloadInvoicePDF, previewSubscriptionInvoice 
    } = useSubscriptionStore();

    // Pour alimenter les menus déroulants des filtres et des modales de création
    const { hospitals, getHospitals } = useHospitalStore();
    const { licences, getLicences } = useLicenceStore();
    
    const { countries,  getCountries } = useCountryStore();

    // États pour les Filtres
    const [filters, setFilters] = useState({
        hospital_id: '',
        country_id: '',
        from_date: '',
        to_date: ''
    });

    // États pour les Modales
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<SubscriptionDto | null>(null);
    
    // État pour la prévisualisation
    const [previewData, setPreviewData] = useState<SubscriptionPreviewDto | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Chargement initial
    useEffect(() => {
        getCountries(1,"",100);
        getSubscriptions(1, {});
        getHospitals(1, '', 100); // Récupère 100 hôpitaux pour les selects
        getLicences(1, '', 100);
        // getCountries() ...
    }, [getSubscriptions, getHospitals, getLicences]);

    // Lancer la recherche avec filtres
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getSubscriptions(1, filters);
    };

    // --- ACTIONS ---

    const handleRenew = async (id: number) => {
        const result = await Swal.fire({
            title: 'Renouveler le contrat ?',
            text: "Cela ajoutera automatiquement 30 jours à la date de fin de ce contrat.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00a896',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, prolonger (+30 jours)',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });
        if (result.isConfirmed) {
            await renewSubscription(id);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Supprimer ce contrat ?',
            text: "Cette action est irréversible et annulera l'accès de l'hôpital aux licences.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Annuler',
            confirmButtonText: 'Oui, supprimer',
            customClass: {
                popup: 'rounded-2xl dark:bg-gray-800 dark:text-gray-200'
            }
        });
        if (result.isConfirmed) {
            await deleteSubscription(id);
        }
    };

    const handlePreview = async (id: number) => {
        const data = await previewSubscriptionInvoice(id);
        if (data) {
            setPreviewData(data);
            setIsPreviewOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[#003366] dark:text-white">Contrats & Souscriptions</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gérez les abonnements et la facturation des hôpitaux.</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-[#00a896] hover:bg-[#008f7e] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nouveau Contrat
                </button>
            </div>

            {/* BARRE DE FILTRES AVANCÉS */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hôpital</label>
                        <select 
                            value={filters.hospital_id}
                            onChange={(e) => setFilters({...filters, hospital_id: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white"
                        >
                            <option value="">Tous les hôpitaux</option>
                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Actif à partir de</label>
                        <input 
                            type="date" 
                            value={filters.from_date}
                            onChange={(e) => setFilters({...filters, from_date: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jusqu'au</label>
                        <input 
                            type="date" 
                            value={filters.to_date}
                            onChange={(e) => setFilters({...filters, to_date: e.target.value})}
                            className="w-full p-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-sm text-slate-800 dark:text-white"
                        />
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                        <button 
                            type="submit" 
                            className="flex-1 bg-[#003366] hover:bg-[#002244] dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex justify-center items-center gap-2"
                        >
                            <Search size={16} /> Filtrer
                        </button>
                        <button 
                            type="button"
                            onClick={() => {
                                setFilters({ hospital_id: '', country_id: '', from_date: '', to_date: '' });
                                getSubscriptions(1, {});
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border dark:border-gray-600 rounded-lg font-medium transition-colors text-sm"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES SOUSCRIPTIONS */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hôpital & Pays</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Période d'abonnement</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Licences Incluses</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Facturation & Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center">
                                        <Loader2 size={32} className="animate-spin text-[#00a896] mx-auto mb-2" />
                                    </td>
                                </tr>
                            ) : subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">Aucune souscription trouvée.</td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => {
                                    // Calcul rapide pour savoir si le contrat est expiré
                                    const isExpired = new Date(sub.ending_date) < new Date();

                                    return (
                                    <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30 transition-colors">
                                        
                                        {/* HÔPITAL & PAYS */}
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-gray-200">{sub.hospital?.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-gray-400">{sub.country?.name || 'Cameroun'}</div>
                                        </td>
                                        
                                        {/* PÉRIODE */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                                                <CalendarDays size={14} className="text-gray-400 dark:text-gray-500" />
                                                <span>{new Date(sub.starting_date).toLocaleDateString()} - {new Date(sub.ending_date).toLocaleDateString()}</span>
                                            </div>
                                            {isExpired ? (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-bold">Expiré</span>
                                            ) : (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-bold">Actif</span>
                                            )}
                                        </td>

                                        {/* LICENCES */}
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {sub.items?.map((item, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-gray-700 text-xs text-slate-700 dark:text-gray-300 rounded-md border border-slate-200 dark:border-gray-600">
                                                        {item.licence?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>

                                        {/* ACTIONS */}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end items-center gap-1">
                                                
                                                {/* Boutons Facturation */}
                                                <button onClick={() => handlePreview(sub.id)} title="Prévisualiser la facture" className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                                                    <Eye size={18} />
                                                </button>
                                                <button onClick={() => downloadInvoicePDF(sub.id, sub.hospital?.name || 'Hopital')} title="Télécharger PDF" disabled={actionLoading} className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg disabled:opacity-50 transition-colors">
                                                    <Download size={18} />
                                                </button>

                                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                                                {/* Boutons Gestion */}
                                                <button onClick={() => handleRenew(sub.id)} title="Prolonger de 30 jours" className="p-2 text-orange-500 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors">
                                                    <RefreshCw size={18} />
                                                </button>
                                                <button onClick={() => setSelectedSub(sub)} title="Modifier" className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(sub.id)} title="Supprimer" className="p-2 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && subscriptions.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-900/50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Page <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.currentPage}</span> sur <span className="font-semibold text-slate-800 dark:text-gray-200">{pagination.lastPage}</span>
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => getSubscriptions(pagination.currentPage - 1, filters)} disabled={pagination.currentPage === 1} className="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"><ChevronLeft size={18}/></button>
                            <button onClick={() => getSubscriptions(pagination.currentPage + 1, filters)} disabled={pagination.currentPage === pagination.lastPage} className="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"><ChevronRight size={18}/></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALES DE CRÉATION ET MODIFICATION */}
            <CreateSubscriptionModal 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
                dataSources={{ hospitals, countries, licences }} 
            />

            <UpdateSubscriptionModal 
                isOpen={!!selectedSub} 
                onClose={() => setSelectedSub(null)} 
                subscription={selectedSub}
                dataSources={{ hospitals, countries, licences }} 
            />

            {/* MODALE DE PRÉVISUALISATION DE FACTURE */}
            {isPreviewOpen && previewData && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-[#003366] dark:bg-gray-900 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Aperçu de la Facture</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Facturé à</p>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{previewData.hospital_name}</h4>
                            
                            <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-lg mb-4 text-sm border border-slate-100 dark:border-gray-700 text-slate-800 dark:text-gray-200">
                                Période : <strong>{new Date(previewData.period.start).toLocaleDateString()}</strong> au <strong>{new Date(previewData.period.end).toLocaleDateString()}</strong>
                            </div>

                            <table className="w-full text-sm mb-4">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                                        <th className="pb-2">Licence</th>
                                        <th className="pb-2 text-center">Centres</th>
                                        <th className="pb-2 text-right">Sous-total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.licences.map((lic, i) => (
                                        <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50 text-slate-800 dark:text-gray-200">
                                            <td className="py-2">{lic.licence_name}</td>
                                            <td className="py-2 text-center">{lic.center_count}</td>
                                            <td className="py-2 text-right">{lic.sub_total.toLocaleString()} {previewData.currency}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="flex justify-between items-center bg-[#00a896] dark:bg-teal-700 text-white p-4 rounded-lg">
                                <span className="font-bold">NET À PAYER</span>
                                <span className="text-xl font-bold">{previewData.total_amount.toLocaleString()} {previewData.currency}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Subscriptions;