import { useState } from "react";
import Swal from "sweetalert2";
import {
  KeyRound,
  User,
  Monitor,
  Unlock,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface SessionOpeningProps {
  onSessionOpened?: (initialBalance: number) => void;
}

export default function SessionOpening({
  onSessionOpened,
}: SessionOpeningProps) {
  // --- ÉTATS ---
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Données statiques de l'environnement actuel
  const currentContext = {
    cashierName: "M. Amadou",
    tillNumber: "Caisse Principale N°02",
    date: "23 Juin 2026",
    shift: "Garde Jour (07:30 - 16:30)",
  };

  // --- ACTIONS ---
  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();

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
      text: `Vous allez initialiser la ${currentContext.tillNumber} avec un fond de caisse de ${openingBalance.toLocaleString()} XAF.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, ouvrir la caisse",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);

        // Simulation d'intégration API
        setTimeout(() => {
          Swal.fire({
            title: "Caisse Ouverte !",
            text: "Votre session de vente est maintenant active. Bons chiffres !",
            icon: "success",
            confirmButtonColor: "#059669",
          });

          setIsSubmitting(false);
          if (onSessionOpened) onSessionOpened(openingBalance);
        }, 1000);
      }
    });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800 flex flex-col justify-center items-center">
      {/* Conteneur Principal */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
        <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
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
          {/* Informations Contextuelles Statiques */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-xs">
            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Agent Affecté
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {currentContext.cashierName}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Poste de Travail
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                {currentContext.tillNumber}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Date d'exploitation
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {currentContext.date}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/60">
              <span className="text-slate-400 font-bold uppercase tracking-wider block">
                Période / Shift
              </span>
              <div className="font-semibold text-slate-700">
                {currentContext.shift}
              </div>
            </div>
          </div>

          {/* Saisie du Fond de Caisse */}
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
              Montant du Fond de Caisse Initial (XAF)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none bg-slate-100 border-r border-slate-300 rounded-l-xl px-3 font-bold text-slate-500 font-mono text-sm">
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
                className="w-full pl-20 pr-4 py-3 border border-slate-300 rounded-xl font-mono text-xl font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Saisissez{" "}
              <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                0
              </code>{" "}
              s'il n'y a aucune monnaie de départ.
            </p>
          </div>

          {/* Notes / Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Note ou Observation de début de garde (Optionnel)
            </label>
            <textarea
              placeholder="Ex: Sac de monnaie de 250 XAF fourni par le magasinier..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Bouton de Validation */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wide cursor-pointer disabled:cursor-not-allowed uppercase text-sm"
            >
              <Unlock className="w-4 h-4" />
              {isSubmitting
                ? "Initialisation..."
                : "Activer la Caisse & Ouvrir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
