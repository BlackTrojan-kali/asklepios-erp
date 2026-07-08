import { useState } from "react";
import {
  Store,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  DollarSign,
  AlertCircle,
  MapPin,
  Activity,
  Play,
  Power,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import { useAuth } from "../../../../contexts/AuthContext";
import CreateCashRegisterModal from "../../../../components/modals/Pharmacy/Admin/CreateCashRegisterModal";
import EditCashRegisterModal from "../../../../components/modals/Pharmacy/Admin/EditCashRegisterModal";
import DeleteCashRegisterModal from "../../../../components/modals/Pharmacy/Admin/DeleteCashRegisterModal";
import OpenCashRegisterSessionModal from "../../../../components/modals/Pharmacy/Admin/OpenCashRegisterSessionModal";
import CloseCashRegisterSessionModal from "../../../../components/modals/Pharmacy/Admin/CloseCashRegisterSessionModal";
import CashRegisterDetailsModal from "../../../../components/modals/Pharmacy/Admin/CashRegisterDetailsModal";
import {
  useCashRegisters,
  useCreateCashRegister,
  useUpdateCashRegister,
  useDeleteCashRegister,
} from "../../../../hooks/pharmacy/useCashRegister";
import {
  useOpenCashRegisterSession,
  useCloseCashRegisterSession,
  useMyActiveSession,
} from "../../../../hooks/pharmacy/useCashRegisterSession";
import type { CashRegisterDto } from "../../../../services/pharmacy/cashRegisterService";

function BranchesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 shadow-xs overflow-hidden"
        >
          <div className="flex justify-between items-center p-5">
            <div className="flex items-center gap-4 w-full">
              <div className="p-3 bg-slate-200 dark:bg-gray-750 rounded-xl h-12 w-12 flex-shrink-0" />
              <div className="space-y-2 w-full max-w-md">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-slate-200 dark:bg-gray-750 rounded w-1/3" />
                  <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-20" />
                </div>
                <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-750 flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CashRegistersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-205 dark:border-gray-700 p-4 shadow-xs flex flex-col justify-between h-48"
        >
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-2">
                <div className="h-5 bg-slate-200 dark:bg-gray-750 rounded w-24" />
                <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-12" />
              </div>
              <div className="h-5 bg-slate-200 dark:bg-gray-750 rounded-full w-14" />
            </div>
            <div className="h-10 bg-slate-100 dark:bg-gray-800 rounded-lg mb-3" />
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-16" />
              <div className="h-4 bg-slate-200 dark:bg-gray-750 rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface BranchRegistersListProps {
  branchId: number;
  currency: string;
  isAdmin: boolean;
}

function BranchRegistersList({
  branchId,
  currency,
  isAdmin,
}: BranchRegistersListProps) {
  const { data: registers, isLoading, error } = useCashRegisters(branchId);
  const { data: myActiveSession } = useMyActiveSession();

  const createMutation = useCreateCashRegister();
  const updateMutation = useUpdateCashRegister();
  const deleteMutation = useDeleteCashRegister();
  const openSessionMutation = useOpenCashRegisterSession();
  const closeSessionMutation = useCloseCashRegisterSession();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isOpenSessionOpen, setIsOpenSessionOpen] = useState(false);
  const [isCloseSessionOpen, setIsCloseSessionOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [selectedRegister, setSelectedRegister] =
    useState<CashRegisterDto | null>(null);

  const handleCreateRegister = (name: string, merchantCode: string) => {
    createMutation.mutate(
      {
        name,
        pharmacy_branch_id: branchId,
        status: "active",
        merchant_code: merchantCode,
      },
      {
        onSuccess: () => {
          toast.success("Caisse créée avec succès.");
          setIsCreateOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur de création.";
          toast.error(msg);
        },
      },
    );
  };

  const handleUpdateRegister = (
    name: string,
    merchantCode: string,
    status: "active" | "inactive",
  ) => {
    if (!selectedRegister) return;
    updateMutation.mutate(
      {
        id: selectedRegister.id,
        payload: {
          name,
          status,
          merchant_code: merchantCode,
        },
      },
      {
        onSuccess: () => {
          toast.success("Caisse mise à jour avec succès.");
          setSelectedRegister(null);
          setIsEditOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur de modification.";
          toast.error(msg);
        },
      },
    );
  };

  const handleDeleteRegister = () => {
    if (!selectedRegister) return;
    deleteMutation.mutate(selectedRegister.id, {
      onSuccess: () => {
        toast.success("Caisse supprimée avec succès.");
        setSelectedRegister(null);
        setIsDeleteOpen(false);
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || "Erreur de suppression.";
        toast.error(msg);
      },
    });
  };

  const handleOpenSession = (openingBalance: number) => {
    if (!selectedRegister) return;
    openSessionMutation.mutate(
      {
        registerId: selectedRegister.id,
        payload: {
          opening_balance: openingBalance,
        },
      },
      {
        onSuccess: () => {
          toast.success("Session de caisse ouverte.");
          setSelectedRegister(null);
          setIsOpenSessionOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur d'ouverture.";
          toast.error(msg);
        },
      },
    );
  };

  const handleCloseSession = (closingBalance: number) => {
    if (!selectedRegister || !selectedRegister.active_session) return;
    closeSessionMutation.mutate(
      {
        sessionId: selectedRegister.active_session.id,
        payload: {
          closing_balance: closingBalance,
        },
      },
      {
        onSuccess: () => {
          toast.success("Session de caisse fermée.");
          setSelectedRegister(null);
          setIsCloseSessionOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur de fermeture.";
          toast.error(msg);
        },
      },
    );
  };

  if (isLoading) {
    return <CashRegistersSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <span className="text-sm text-red-800 dark:text-red-300">
          Erreur de chargement des caisses.
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
          <Activity className="h-4 w-4 text-teal-605" />
          Caisses enregistrées
        </h3>
        {isAdmin && (
          <button
            onClick={() => {
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une caisse
          </button>
        )}
      </div>

      {registers?.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 text-center py-10 rounded-xl border border-gray-150 dark:border-gray-700">
          <DollarSign className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune caisse configurée pour cette succursale.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registers?.map((register) => {
            const isMySession =
              myActiveSession &&
              register.active_session &&
              myActiveSession.id === register.active_session.id;
            const userSessionName = register.active_session?.user
              ? `${register.active_session.user.first_name} ${register.active_session.user.last_name || ""}`
              : "Inconnu";

            return (
              <div
                key={register.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                          {register.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono pl-5.5">
                        code marchant:{" "}
                        {register.merchant_code && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">
                              •
                            </span>
                            <span className="text-teal-600 dark:text-teal-400 font-medium">
                              {register.merchant_code}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`text-[9px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded-full ${
                          register.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {register.status === "active" ? "Active" : "Inactive"}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-px opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedRegister(register);
                              setIsEditOpen(true);
                            }}
                            className="p-1 text-blue-500 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRegister(register);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Solde */}
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
                      Solde
                    </span>
                    <div className="text-lg font-bold text-gray-900 dark:text-white font-mono tracking-tight flex items-baseline gap-0.5">
                      {register.balance.toLocaleString()}
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        XAF
                      </span>
                    </div>
                  </div>

                  {/* Session */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 dark:text-gray-500">
                        Session
                      </span>
                      {register.active_session ? (
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-medium">
                          <User className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                          <span className="text-[11px]">{userSessionName}</span>
                          {isMySession && (
                            <span className="text-[8px] uppercase tracking-wide font-bold px-1 py-px bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded">
                              Moi
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic text-[11px]">
                          Aucune
                        </span>
                      )}
                    </div>
                    {register.active_session && (
                      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        <span>Depuis</span>
                        <span>
                          {new Date(
                            register.active_session.opened_at,
                          ).toLocaleDateString()}{" "}
                          {new Date(
                            register.active_session.opened_at,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  {!isAdmin && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700">
                      {register.status === "active" && (
                        <>
                          {!register.active_session ? (
                            <button
                              onClick={() => {
                                setSelectedRegister(register);
                                setIsOpenSessionOpen(true);
                              }}
                              disabled={!!myActiveSession}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              Ouvrir session
                            </button>
                          ) : (
                            isMySession && (
                              <button
                                onClick={() => {
                                  setSelectedRegister(register);
                                  setIsCloseSessionOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                <Power className="h-3 w-3" />
                                Fermer session
                              </button>
                            )
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setSelectedRegister(register);
                        setIsDetailsOpen(true);
                      }}
                      className="w-full mt-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Superviser
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCreateOpen && (
        <CreateCashRegisterModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateRegister}
          isPending={createMutation.isPending}
        />
      )}

      {isEditOpen && selectedRegister && (
        <EditCashRegisterModal
          isOpen={isEditOpen}
          onClose={() => {
            setSelectedRegister(null);
            setIsEditOpen(false);
          }}
          onSubmit={handleUpdateRegister}
          isPending={updateMutation.isPending}
          register={selectedRegister}
        />
      )}

      {isDeleteOpen && selectedRegister && (
        <DeleteCashRegisterModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setSelectedRegister(null);
            setIsDeleteOpen(false);
          }}
          onConfirm={handleDeleteRegister}
          isPending={deleteMutation.isPending}
          register={selectedRegister}
        />
      )}

      {isOpenSessionOpen && selectedRegister && (
        <OpenCashRegisterSessionModal
          isOpen={isOpenSessionOpen}
          onClose={() => {
            setSelectedRegister(null);
            setIsOpenSessionOpen(false);
          }}
          onSubmit={handleOpenSession}
          isPending={openSessionMutation.isPending}
          currency={currency}
          register={selectedRegister}
        />
      )}

      {isCloseSessionOpen && selectedRegister && (
        <CloseCashRegisterSessionModal
          isOpen={isCloseSessionOpen}
          onClose={() => {
            setSelectedRegister(null);
            setIsCloseSessionOpen(false);
          }}
          onSubmit={handleCloseSession}
          isPending={closeSessionMutation.isPending}
          register={selectedRegister}
          currency={currency}
        />
      )}

      {isDetailsOpen && selectedRegister && (
        <CashRegisterDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setSelectedRegister(null);
            setIsDetailsOpen(false);
          }}
          register={selectedRegister}
        />
      )}
    </div>
  );
}

export default function CashRegister() {
  const { data: branches, isLoading, error } = useBranches();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleBranch = (branchId: number) => {
    setExpandedBranchId((prev) => (prev === branchId ? null : branchId));
  };

  // Filtrer les succursales sur la recherche
  const filteredBranches = branches?.filter(
    (branch) =>
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.adress.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
              <Store className="h-8 w-8" />
            </span>
            Gestion des Caisses / Points de Vente
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Configurez et supervisez les caisses de vos succursales et suivez
            les sessions actives des caissiers.
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher une pharmacie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-slate-800 dark:text-white transition-all"
          />
        </div>
      </div>

      {/* Chargement */}
      {isLoading && <BranchesSkeleton />}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              Erreur de chargement
            </h3>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
              Impossible de récupérer la liste des succursales. Veuillez
              réessayer ultérieurement.
            </p>
          </div>
        </div>
      )}

      {/* Liste des succursales */}
      {!isLoading && !error && filteredBranches && (
        <div className="space-y-4">
          {filteredBranches.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 text-center py-16 rounded-xl border border-gray-100 dark:border-gray-700">
              <Store className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Aucune pharmacie trouvée
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Aucune succursale ne correspond à votre recherche.
              </p>
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const isExpanded = expandedBranchId === branch.id;
              const currency = branch.country?.currency || "FCFA";

              return (
                <div
                  key={branch.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-150 dark:border-gray-700 shadow-xs overflow-hidden transition-all duration-300"
                >
                  {/* Accordéon Header */}
                  <div
                    onClick={() => toggleBranch(branch.id)}
                    className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-gray-750/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl transition-colors ${
                          branch.type === "central_warehouse"
                            ? "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}
                      >
                        <Store className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          {branch.name}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              branch.type === "central_warehouse"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {branch.type === "central_warehouse"
                              ? "Magasin Central"
                              : "Point de Vente"}
                          </span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {branch.adress}
                          {branch.country && ` • ${branch.country.name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accordéon Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-150 dark:border-gray-750 bg-slate-50/50 dark:bg-gray-900/40 p-5 transition-all animate-in slide-in-from-top-2 duration-200">
                      <BranchRegistersList
                        branchId={branch.id}
                        currency={currency}
                        isAdmin={isAdmin}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
