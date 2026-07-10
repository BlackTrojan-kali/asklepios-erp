import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

// --- STORES ---
import useLabTechnicianStore from "../../../../functions/base_hospital/useLabTechnicianStore";
import useCenterStore from "../../../../functions/center/useCenterStore";

// --- TYPES ---
import type { LabTechnicianDto } from "../../../../types/LabTechnicianTypes";

// --- MODALES ---
import { CreateLabTechnicianModal } from "../../../../components/modals/Base_hopital/Laboratory/CreateLabTechnicianModal";
import { UpdateLabTechnicianModal } from "../../../../components/modals/Base_hopital/Laboratory/UpdateLabTechnicianModal";

const SkeletonRow = () => (
  <tr className="animate-pulse bg-white dark:bg-gray-800">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col gap-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-28 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-end gap-2">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </td>
  </tr>
);

const LabTechnicians = () => {
  // --- STORES ---
  const {
    technicians,
    loading,
    pagination,
    getTechnicians,
    deleteTechnician,
    createTechnician,
    updateTechnician,
  } = useLabTechnicianStore();

  const { centers, getCenters } = useCenterStore();

  // --- ÉTATS ---
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCenterFilter, setSelectedCenterFilter] = useState("");

  // États pour l'ouverture des modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<LabTechnicianDto | null>(null);

  // --- CHARGEMENT INITIAL ---
  useEffect(() => {
    getCenters(1, {}, 100);
  }, [getCenters]);

  const fetchTechnicians = (targetPage: number = 1) => {
    getTechnicians(targetPage, {
      search: searchQuery,
      center_id: selectedCenterFilter,
    });
  };

  useEffect(() => {
    fetchTechnicians(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRefresh = () => {
    fetchTechnicians(page);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTechnicians(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCenterFilter("");
    setPage(1);
    getTechnicians(1, { search: "", center_id: "" });
  };

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: "Supprimer ce technicien ?",
      text: `Le compte et le profil de ${name} seront définitivement supprimés.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      await deleteTechnician(id);
    }
  };

  const openUpdateModal = (technician: LabTechnicianDto) => {
    setSelectedTechnician(technician);
    setIsUpdateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* EN-TÊTE DE LA PAGE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Techniciens de Laboratoire
            </h1>
            <p className="text-sm text-gray-500">
              Gestion du personnel habilité au laboratoire
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            title="Rafraîchir"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus size={20} />
            Nouveau Technicien
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col sm:flex-row gap-4"
        >
          {/* Recherche Texte */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Rechercher (nom, email, téléphone, spécialité...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 text-slate-800 dark:text-white"
            />
          </div>

          {/* Filtre Centre */}
          <select
            value={selectedCenterFilter}
            onChange={(e) => setSelectedCenterFilter(e.target.value)}
            className="w-full sm:w-48 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 text-slate-800 dark:text-white"
          >
            <option value="">Tous les centres</option>
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>

          {/* Boutons de filtrage */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Filtrer
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* TABLEAU DES TECHNICIENS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Technicien
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Affectation
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Spécialité
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : technicians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <ShieldCheck size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                        Aucun technicien trouvé
                      </p>
                      <p className="text-sm">
                        Modifiez vos filtres ou ajoutez un nouveau profil.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                technicians.map((tech) => (
                  <tr
                    key={tech.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    {/* Colonne Profil */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                          {tech.user?.first_name?.charAt(0)}
                          {tech.user?.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {tech.user?.first_name} {tech.user?.last_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Colonne Contact */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400" />
                          {tech.user?.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          {tech.user?.email}
                        </div>
                      </div>
                    </td>

                    {/* Colonne Affectation */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Building2 size={16} className="text-blue-500" />
                        <span className="font-medium">
                          {tech.center?.name || "Non assigné"}
                        </span>
                      </div>
                    </td>

                    {/* Colonne Spécialité */}
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">
                        {tech.speciality}
                      </span>
                      {tech.specifications && (
                        <p
                          className="text-xs text-gray-500 mt-1 line-clamp-1"
                          title={tech.specifications}
                        >
                          {tech.specifications}
                        </p>
                      )}
                    </td>

                    {/* Colonne Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openUpdateModal(tech)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              tech.id,
                              `${tech.user?.first_name} ${tech.user?.last_name || ""}`,
                            )
                          }
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pagination && pagination.lastPage > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
            <span className="text-sm text-gray-500">
              Affichage de la page{" "}
              <span className="font-medium text-slate-800 dark:text-white">
                {pagination.currentPage}
              </span>{" "}
              sur{" "}
              <span className="font-medium text-slate-800 dark:text-white">
                {pagination.lastPage}
              </span>{" "}
              ({pagination.total} techniciens au total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.lastPage, p + 1))
                }
                disabled={page === pagination.lastPage || loading}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALES */}
      <CreateLabTechnicianModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={createTechnician}
        centers={centers}
        loading={loading}
      />

      <UpdateLabTechnicianModal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        onSubmit={updateTechnician}
        technician={selectedTechnician}
        centers={centers}
        loading={loading}
      />
    </div>
  );
};

export default LabTechnicians;
