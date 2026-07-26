import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

// --- HOOKS ---
import {
  useLabPersonnelList,
  useDeleteLabPersonnel,
} from "../../../hooks/laboratory/useLabPersonnel";
import { useLaboratories } from "../../../hooks/laboratory/useLaboratory";
import { useAuth } from "../../../contexts/AuthContext";

// --- TYPES ---
import type { LabPersonnelDto } from "../../../types/LabPersonnelTypes";

// --- MODALES ---
import { CreateLabPersonnelModal } from "../../../components/modals/Laboratory/CreateLabPersonnelModal";
import { UpdateLabPersonnelModal } from "../../../components/modals/Laboratory/UpdateLabPersonnelModal";

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

const LabPersonnel = () => {
  // --- ÉTATS ---
  const { profile } = useAuth();
  const isLabManager = profile?.role_name === "laboratory";
  
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLaboratoryFilter, setSelectedLaboratoryFilter] = useState(
    isLabManager ? String(profile?.laboratory_id || "") : ""
  );

  // États pour l'ouverture des modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<LabPersonnelDto | null>(null);

  // --- HOOKS ---
  // Requête pour les laboratoires (pour le filtre et les modales)
  // On ne charge la liste des labos que si on n'est pas un lab manager (ou si on a besoin de passer les labos aux modales)
  const { data: laboratories = [] } = useLaboratories();

  // Requête pour le personnel
  const { data: personnelData, isLoading: loading } = useLabPersonnelList({
    page,
    per_page: 15,
    search: searchQuery,
    laboratory_id: selectedLaboratoryFilter,
  });

  const technicians = personnelData?.data || [];
  const pagination = personnelData?.meta;

  // Mutation pour supprimer
  const deleteMutation = useDeleteLabPersonnel();

  const fetchTechnicians = (targetPage: number = 1) => {
    setPage(targetPage);
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
    if (!isLabManager) {
      setSelectedLaboratoryFilter("");
    }
    setPage(1);
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
      deleteMutation.mutate(id, {
        onSuccess: () => {
          Swal.fire(
            "Supprimé !",
            "Le profil a été supprimé avec succès.",
            "success",
          );
        },
      });
    }
  };

  const openUpdateModal = (technician: LabPersonnelDto) => {
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
              Personnels de Laboratoire
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
            Nouveau Personnel
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, spécialité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {!isLabManager && (
            <div className="flex gap-2">
              <select
                value={selectedLaboratoryFilter}
                onChange={(e) => setSelectedLaboratoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">Tous les laboratoires</option>
                {laboratories.map((lab: any) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
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
                  Employé
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Affectation
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Rôles & Spécialité
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
                          {tech.laboratory?.name || "Non assigné"}
                        </span>
                      </div>
                    </td>

                    {/* Colonne Rôles */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tech.lab_roles?.map((role, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded text-xs font-semibold"
                          >
                            {role === "lab_receptionist" && "Réceptionniste"}
                            {role === "lab_technician" && "Technicien"}
                            {role === "lab_biologist" && "Biologiste"}
                            {role === "lab_manager" && "Manager"}
                          </span>
                        ))}
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold">
                        {tech.speciality || "Aucune"}
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
      <CreateLabPersonnelModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        laboratories={isLabManager ? laboratories.filter(l => l.id === profile?.laboratory_id) : laboratories}
      />

      <UpdateLabPersonnelModal
        isOpen={isUpdateOpen}
        onClose={() => setIsUpdateOpen(false)}
        technician={selectedTechnician}
        laboratories={isLabManager ? laboratories.filter(l => l.id === profile?.laboratory_id) : laboratories}
      />
    </div>
  );
};

export default LabPersonnel;
