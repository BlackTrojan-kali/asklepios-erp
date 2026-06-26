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
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useBranches } from "../../../../hooks/pharmacy/useBranche";
import { useAuth } from "../../../../contexts/AuthContext";
import {
  useCashRegisters,
  useCreateCashRegister,
  useUpdateCashRegister,
  useDeleteCashRegister,
  useOpenCashRegisterSession,
  useCloseCashRegisterSession,
  useMyActiveSession,
} from "../../../../hooks/pharmacy/useCashRegister";
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

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isOpenSessionOpen, setIsOpenSessionOpen] = useState(false);
  const [isCloseSessionOpen, setIsCloseSessionOpen] = useState(false);

  const [selectedRegister, setSelectedRegister] =
    useState<CashRegisterDto | null>(null);

  // Form states
  const [registerName, setRegisterName] = useState("");
  const [registerStatus, setRegisterStatus] = useState<"active" | "inactive">(
    "active",
  );
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [closingBalance, setClosingBalance] = useState<number>(0);

  const handleCreateRegister = () => {
    if (!registerName.trim()) {
      toast.error("Le nom de la caisse est requis.");
      return;
    }
    createMutation.mutate(
      {
        name: registerName,
        pharmacy_branch_id: branchId,
        status: "active",
      },
      {
        onSuccess: () => {
          toast.success("Caisse créée avec succès.");
          setRegisterName("");
          setIsCreateOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur de création.";
          toast.error(msg);
        },
      },
    );
  };

  const handleUpdateRegister = () => {
    if (!selectedRegister) return;
    if (!registerName.trim()) {
      toast.error("Le nom de la caisse est requis.");
      return;
    }
    updateMutation.mutate(
      {
        id: selectedRegister.id,
        payload: {
          name: registerName,
          status: registerStatus,
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

  const handleOpenSession = () => {
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
          setOpeningBalance(0);
          setIsOpenSessionOpen(false);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || "Erreur d'ouverture.";
          toast.error(msg);
        },
      },
    );
  };

  const handleCloseSession = () => {
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
          setClosingBalance(0);
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
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Chargement des caisses...
        </span>
      </div>
    );
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
          <Activity className="h-4 w-4 text-teal-600" />
          Caisses enregistrées
        </h3>
        {isAdmin && (
          <button
            onClick={() => {
              setRegisterName("");
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
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
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-xs relative hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-base">
                        {register.name}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        ID: #{register.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMySession && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400">
                          Ma session
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          register.status === "active"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                        }`}
                      >
                        {register.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Solde de Caisse */}
                  <div className="bg-slate-50 dark:bg-gray-900/60 rounded-lg p-3 mb-3 flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                      <DollarSign className="h-3.5 w-3.5" />
                      Solde actuel
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">
                      {register.balance.toLocaleString()} {currency}
                    </span>
                  </div>

                  {/* Session Active */}
                  <div className="text-xs space-y-1.5 border-t border-gray-100 dark:border-gray-700 pt-3 mb-4">
                    <span className="block font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-[9px]">
                      Session en cours
                    </span>
                    {register.active_session ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300 font-medium">
                          <User className="h-3.5 w-3.5 text-teal-600" />
                          {userSessionName}
                        </div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 pl-5">
                          Ouverte depuis:{" "}
                          {new Date(
                            register.active_session.opened_at,
                          ).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic block">
                        Aucune session active
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
                  {/* Session Toggle buttons */}
                  <div className="flex gap-2">
                    {!isAdmin && register.status === "active" && (
                      <>
                        {!register.active_session ? (
                          <button
                            onClick={() => {
                              setSelectedRegister(register);
                              setOpeningBalance(0);
                              setIsOpenSessionOpen(true);
                            }}
                            disabled={!!myActiveSession}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              myActiveSession
                                ? "Vous avez déjà une session active ouverte ailleurs"
                                : "Ouvrir une session"
                            }
                          >
                            <Play className="h-3 w-3 fill-current" />
                            Ouvrir session
                          </button>
                        ) : (
                          isMySession && (
                            <button
                              onClick={() => {
                                setSelectedRegister(register);
                                setClosingBalance(register.balance);
                                setIsCloseSessionOpen(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
                              title="Fermer la session"
                            >
                              <Power className="h-3 w-3" />
                              Fermer session
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>

                  {/* Edit / Delete buttons (Admin only) */}
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedRegister(register);
                          setRegisterName(register.name);
                          setRegisterStatus(register.status);
                          setIsEditOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRegister(register);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Ajouter une Caisse */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                Ajouter une caisse
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Nom de la caisse
                  </label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="ex: Caisse Principale, Comptoir A..."
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateRegister}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {createMutation.isPending ? "Création..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Modifier une Caisse */}
      {isEditOpen && selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                Modifier la caisse
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Nom de la caisse
                  </label>
                  <input
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Statut de la caisse
                  </label>
                  <select
                    value={registerStatus}
                    onChange={(e) =>
                      setRegisterStatus(e.target.value as "active" | "inactive")
                    }
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
              <button
                onClick={() => {
                  setSelectedRegister(null);
                  setIsEditOpen(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateRegister}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {updateMutation.isPending ? "Modification..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Supprimer une Caisse */}
      {isDeleteOpen && selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-xl">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  Supprimer la caisse ?
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Êtes-vous sûr de vouloir supprimer la caisse{" "}
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedRegister.name}
                </span>{" "}
                ? Cette action est irréversible.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
              <button
                onClick={() => {
                  setSelectedRegister(null);
                  setIsDeleteOpen(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteRegister}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ouvrir une session */}
      {isOpenSessionOpen && selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Ouvrir la session
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Caisse : {selectedRegister.name}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Solde d'ouverture ({currency})
                  </label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) =>
                      setOpeningBalance(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
              <button
                onClick={() => {
                  setSelectedRegister(null);
                  setOpeningBalance(0);
                  setIsOpenSessionOpen(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleOpenSession}
                disabled={openSessionMutation.isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {openSessionMutation.isPending
                  ? "Ouverture..."
                  : "Ouvrir la session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Fermer une session */}
      {isCloseSessionOpen && selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Fermer la session
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Caisse : {selectedRegister.name}
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-gray-900/60 rounded-xl p-3 flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    Solde calculé (théorique)
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {selectedRegister.balance.toLocaleString()} {currency}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Solde de clôture réel ({currency})
                  </label>
                  <input
                    type="number"
                    value={closingBalance}
                    onChange={(e) =>
                      setClosingBalance(parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-sm text-slate-800 dark:text-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-gray-900/60 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-750">
              <button
                onClick={() => {
                  setSelectedRegister(null);
                  setClosingBalance(0);
                  setIsCloseSessionOpen(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCloseSession}
                disabled={closeSessionMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {closeSessionMutation.isPending
                  ? "Clôture..."
                  : "Fermer la session"}
              </button>
            </div>
          </div>
        </div>
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
