import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  User,
  Unlock,
  AlertTriangle,
  Calendar,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCashRegisters } from "../../hooks/pharmacy/useCashRegister";
import { useOpenCashRegisterSession } from "../../hooks/pharmacy/useCashRegisterSession";

interface SessionOpeningProps {
  onSessionOpened?: (initialBalance: number) => void;
}

export default function OpenSession({ onSessionOpened }: SessionOpeningProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const branchId = profile?.profile_pharm?.branch_id;
  const { data: registers, isLoading } = useCashRegisters(branchId);
  const openSessionMutation = useOpenCashRegisterSession();

  // --- ÉTATS ---
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | "">("");
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const cashierName = profile
    ? `${profile.first_name} ${profile.last_name || ""}`
    : "Caissier";
  const currentDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Filtrer les caisses actives et libres (sans session active)
  const idleRegisters =
    registers?.filter((r) => r.status === "active" && !r.active_session) || [];
  const selectedRegister = registers?.find((r) => r.id === selectedRegisterId);

  // --- ACTIONS ---
  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRegisterId) {
      Swal.fire({
        icon: "error",
        title: "Caisse non sélectionnée",
        text: "Veuillez sélectionner un terminal de caisse dans la liste.",
        confirmButtonColor: "#1e293b",
      });
      return;
    }

    if (openingBalance < 0) {
      Swal.fire({
        icon: "error",
        title: "Montant invalide",
        text: "Le fond de caisse initial ne peut pas être négatif.",
        confirmButtonColor: "#1e293b",
      });
      return;
    }

    Swal.fire({
      title: "Confirmer l'ouverture ?",
      text: `Vous allez initialiser la caisse "${selectedRegister?.name}" avec un fond de caisse de ${openingBalance.toLocaleString()} XAF.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, ouvrir la caisse",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        openSessionMutation.mutate(
          {
            registerId: Number(selectedRegisterId),
            payload: {
              opening_balance: openingBalance,
            },
          },
          {
            onSuccess: () => {
              Swal.fire({
                title: "Caisse Ouverte !",
                text: "Votre session de vente est maintenant active. Bons chiffres !",
                icon: "success",
                confirmButtonColor: "#059669",
              });
              if (onSessionOpened) onSessionOpened(openingBalance);
              navigate("/pharmacy/cash");
            },
            onError: (err: any) => {
              const msg =
                err.response?.data?.message ||
                "Impossible d'ouvrir la session de caisse.";
              Swal.fire({
                title: "Erreur",
                text: msg,
                icon: "error",
                confirmButtonColor: "#ef4444",
              });
            },
          },
        );
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-gray-900">
        <Loader2 size={40} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen font-sans text-slate-800 dark:text-white flex flex-col justify-center items-center">
      {/* Conteneur Principal */}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* En-tête coloré */}
        <div className="bg-slate-900 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-xl text-emerald-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide">
              Ouverture de Session
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Initialisation du terminal de caisse
            </p>
          </div>
        </div>

        {/* Rappel des consignes de sécurité */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold uppercase tracking-wider">
              Sécurité des Fonds :
            </strong>{" "}
            Veuillez recompter physiquement vos espèces avant de valider. Vous
            êtes responsable du solde de ce terminal jusqu’à sa clôture
            définitive.
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleOpenSession} className="p-6 space-y-5">
          {/* Informations Contextuelles */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-gray-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-gray-750 text-xs">
            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Agent Affecté
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-gray-300">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {cashierName}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Date d'exploitation
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-gray-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentDate}
              </div>
            </div>
          </div>

          {/* Sélection de la Caisse */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Sélectionner le Terminal de Caisse
            </label>
            <select
              required
              value={selectedRegisterId}
              onChange={(e) =>
                setSelectedRegisterId(Number(e.target.value) || "")
              }
              className="w-full px-4 py-3 border border-slate-300 dark:border-gray-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-slate-800 dark:text-white transition-colors"
            >
              <option value="">-- Choisissez un terminal de caisse --</option>
              {idleRegisters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {idleRegisters.length === 0 && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">
                Aucune caisse active et libre n'est disponible dans votre
                succursale.
              </p>
            )}
          </div>

          {/* Saisie du Fond de Caisse */}
          <div>
            <label className="block text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Montant du Fond de Caisse Initial (XAF)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none bg-slate-100 dark:bg-gray-750 border-r border-slate-300 dark:border-gray-700 rounded-l-xl px-3 font-bold text-slate-500 dark:text-gray-400 font-mono text-sm">
                XAF
              </div>
              <input
                type="number"
                required
                min="0"
                step="50"
                placeholder="Ex: 15000"
                value={openingBalance || ""}
                onChange={(e) =>
                  setOpeningBalance(parseInt(e.target.value) || 0)
                }
                className="w-full pl-20 pr-4 py-3 border border-slate-300 dark:border-gray-700 rounded-xl font-mono text-xl font-black text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-gray-500 mt-1">
              Saisissez{" "}
              <code className="font-mono bg-slate-100 dark:bg-gray-750 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">
                0
              </code>{" "}
              s'il n'y a aucune monnaie de départ.
            </p>
          </div>

          {/* Notes / Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Note ou Observation de début de garde (Optionnel)
            </label>
            <textarea
              placeholder="Ex: Sac de monnaie de 250 XAF fourni par le magasinier..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 dark:border-gray-700 rounded-xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 text-slate-800 dark:text-white transition-colors resize-none"
            />
          </div>

          {/* Bouton de Validation */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                openSessionMutation.isPending || idleRegisters.length === 0
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-gray-700 disabled:text-slate-400 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wide cursor-pointer disabled:cursor-not-allowed uppercase text-sm"
            >
              <Unlock className="w-4 h-4" />
              {openSessionMutation.isPending
                ? "Initialisation..."
                : "Activer la Caisse & Ouvrir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
