import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Play,
  Lock,
  DollarSign,
  Smartphone,
  CreditCard,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
} from "lucide-react";

// --- INTERFACES DES ÉTATS ---
interface ActiveSession {
  cashierName: string;
  tillNumber: string;
  openedAt: string;
  initialBalance: number; // Fond de caisse de départ
}

export default function RegisterSession() {
  // --- ÉTAT DE LA SESSION ACTIVE (Statique pour le test) ---
  // Pour tester l'écran d'ouverture, passez cet état à `null`
  const [activeSession, setActiveSession] = useState<ActiveSession | null>({
    cashierName: "M. Amadou",
    tillNumber: "Caisse #02",
    openedAt: "2026-06-23 07:30",
    initialBalance: 15000, // 15 000 XAF de monnaie au départ
  });

  // --- ÉTATS FORMULAIRE OUVERTURE ---
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // --- ÉTATS FORMULAIRE CLÔTURE (Comptage du soir) ---
  const [countedCash, setCountedCash] = useState<number>(0);
  const [countedMomo, setCountedMomo] = useState<number>(0);
  const [countedCard, setCountedCard] = useState<number>(0);

  // --- DONNÉES THÉORIQUES DE TEST (Calculées par le backend en temps réel) ---
  const theoreticalSales = {
    cash: 125000, // Ventes en espèces enregistrées par le système
    mobileMoney: 85000, // Ventes Orange/MTN Mobile Money enregistrées
    card: 45000, // Ventes par carte enregistrées
  };

  // --- CALCULS DU NET ATTENDU EN CAISSE ---
  const totals = useMemo(() => {
    if (!activeSession)
      return {
        expectedCash: 0,
        expectedTotal: 0,
        gapCash: 0,
        gapMomo: 0,
        gapCard: 0,
        globalGap: 0,
      };

    // Le cash attendu = Fond de caisse initial + Ventes cash du système
    const expectedCash = activeSession.initialBalance + theoreticalSales.cash;
    const expectedMomo = theoreticalSales.mobileMoney;
    const expectedCard = theoreticalSales.card;

    // Calcul des écarts (Compté - Attendu)
    const gapCash = countedCash - expectedCash;
    const gapMomo = countedMomo - expectedMomo;
    const gapCard = countedCard - expectedCard;
    const globalGap = gapCash + gapMomo + gapCard;

    return {
      expectedCash,
      expectedMomo,
      expectedCard,
      gapCash,
      gapMomo,
      gapCard,
      globalGap,
    };
  }, [activeSession, countedCash, countedMomo, countedCard]);

  // --- ACTIONS : OUVERTURE DE LA CAISSE ---
  const handleOpenRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingBalance < 0) return;

    Swal.fire({
      title: "Ouvrir la caisse ?",
      text: `Vous allez initialiser la caisse avec un fond de ${openingBalance.toLocaleString()} XAF.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Confirmer l'ouverture",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        setActiveSession({
          cashierName: "M. Amadou",
          tillNumber: "Caisse #02",
          openedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
          initialBalance: openingBalance,
        });
        Swal.fire({
          title: "Caisse ouverte !",
          text: "Le terminal est prêt pour les ventes.",
          icon: "success",
          confirmButtonColor: "#059669",
        });
      }
    });
  };

  // --- ACTIONS : CLÔTURE DE LA CAISSE ---
  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();

    let textAlert =
      "Voulez-vous valider l'arrêt de caisse et verrouiller la session ?";
    if (totals.globalGap !== 0) {
      textAlert = `Attention : Un écart global de caisse de ${totals.globalGap.toLocaleString()} XAF a été détecté. Confirmer la clôture ?`;
    }

    Swal.fire({
      title: "Clôturer la session ?",
      text: textAlert,
      icon: totals.globalGap === 0 ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: totals.globalGap === 0 ? "#1e293b" : "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, fermer la caisse",
      cancelButtonText: "Retour",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Session clôturée avec succès !",
          text: "Le rapport d'arrêté de caisse (Z) a été généré.",
          icon: "success",
          confirmButtonColor: "#10b981",
        });
        // Reset des états locaux
        setActiveSession(null);
        setCountedCash(0);
        setCountedMomo(0);
        setCountedCard(0);
      }
    });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* ================= ÉTAT 1 : AUCUNE SESSION ACTIVE (ÉCRAN D'OUVERTURE) ================= */}
      {!activeSession ? (
        <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-6 bg-slate-900 text-white text-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-900">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <h2 className="text-xl font-black">Ouverture de Caisse</h2>
            <p className="text-xs text-slate-400 mt-1">
              Initialisez votre tiroir-caisse pour démarrer la journée
            </p>
          </div>

          <form onSubmit={handleOpenRegister} className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Nom de l'Opérateur
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value="M. Amadou"
                  disabled
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Numéro de Terminal
              </label>
              <input
                type="text"
                value="Caisse principale #02"
                disabled
                className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Fond de Caisse Initial (XAF)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-emerald-600 font-bold" />
                <input
                  type="number"
                  required
                  placeholder="Entrez le montant de la monnaie de départ..."
                  value={openingBalance || ""}
                  onChange={(e) =>
                    setOpeningBalance(parseInt(e.target.value) || 0)
                  }
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-base font-bold font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Somme en espèces laissée pour le rendu de monnaie aux premiers
                clients.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer mt-2"
            >
              <CheckCircle2 className="w-4 h-4" /> VALIDER L'OUVERTURE
            </button>
          </form>
        </div>
      ) : (
        // ================= ÉTAT 2 : SESSION ACTIVE (ÉCRAN DE POINTS & CLÔTURE) =================
        <div className="animate-in fade-in duration-200">
          {/* Bannière de Session Active */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  Session de Caisse Ouverte
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="w-3.5 h-3.5" /> Caissier :{" "}
                    {activeSession.cashierName}
                  </span>
                  <span className="flex items-center gap-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    <Clock className="w-3.5 h-3.5" /> Depuis le :{" "}
                    {activeSession.openedAt}
                  </span>
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-500 bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl">
              Fond de Caisse de départ :{" "}
              <strong className="text-slate-900">
                {activeSession.initialBalance.toLocaleString()} XAF
              </strong>
            </div>
          </div>

          <form
            onSubmit={handleCloseRegister}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Saisie du pointage (Gauche) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-slate-500" /> Comptage
                  Physique des Fonds
                </h2>
                <p className="text-xs text-slate-500">
                  Comptez l'argent physique présent dans votre tiroir et validez
                  les montants ci-dessous.
                </p>
              </div>

              {/* Saisie Espèces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Espèces
                    Physiques (Cash)
                  </label>
                  <p className="text-xs text-slate-400">
                    Total billets + pièces du tiroir
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="0 XAF"
                  value={countedCash || ""}
                  onChange={(e) =>
                    setCountedCash(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-right font-mono font-black bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Saisie Mobile Money */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-500" /> Reçus
                    Mobile Money
                  </label>
                  <p className="text-xs text-slate-400">
                    Cumul des transactions Orange / MTN
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="0 XAF"
                  value={countedMomo || ""}
                  onChange={(e) =>
                    setCountedMomo(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-right font-mono font-black bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Saisie Carte */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-purple-500" /> Tickets
                    Carte Bancaire
                  </label>
                  <p className="text-xs text-slate-400">
                    Cumul des reçus du terminal TPE
                  </p>
                </div>
                <input
                  type="number"
                  placeholder="0 XAF"
                  value={countedCard || ""}
                  onChange={(e) =>
                    setCountedCard(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-right font-mono font-black bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Pointage Automatique & Écarts (Droite) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              {/* Tableau comparatif attendu / compté */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex-1">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" /> Analyse
                  des Écarts de Caisse
                </h2>

                <div className="space-y-4">
                  {/* Ligne Espèces */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-700">
                        Espèces (avec Fond)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Attendu : {totals.expectedCash.toLocaleString()} XAF
                      </p>
                    </div>
                    <span
                      className={`font-mono font-bold ${totals.gapCash === 0 ? "text-slate-600" : totals.gapCash > 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {totals.gapCash >= 0 ? "+" : ""}
                      {totals.gapCash.toLocaleString()} XAF
                    </span>
                  </div>

                  {/* Ligne MoMo */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-700">
                        Mobile Money
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Attendu : {totals.expectedMomo.toLocaleString()} XAF
                      </p>
                    </div>
                    <span
                      className={`font-mono font-bold ${totals.gapMomo === 0 ? "text-slate-600" : totals.gapMomo > 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {totals.gapMomo >= 0 ? "+" : ""}
                      {totals.gapMomo.toLocaleString()} XAF
                    </span>
                  </div>

                  {/* Ligne Carte */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-700">
                        Carte Bancaire
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Attendu : {totals.expectedCard.toLocaleString()} XAF
                      </p>
                    </div>
                    <span
                      className={`font-mono font-bold ${totals.gapCard === 0 ? "text-slate-600" : totals.gapCard > 0 ? "text-emerald-600" : "text-rose-600"}`}
                    >
                      {totals.gapCard >= 0 ? "+" : ""}
                      {totals.gapCard.toLocaleString()} XAF
                    </span>
                  </div>
                </div>

                {/* Bloc Écart Global */}
                <div
                  className={`mt-6 p-4 rounded-xl border flex justify-between items-center transition-colors
                  ${totals.globalGap === 0 ? "bg-slate-50 border-slate-200" : totals.globalGap > 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Bilan / Écart Global
                  </span>
                  <span
                    className={`text-xl font-black font-mono
                    ${totals.globalGap === 0 ? "text-slate-700" : totals.globalGap > 0 ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {totals.globalGap >= 0 ? "+" : ""}
                    {totals.globalGap.toLocaleString()} XAF
                  </span>
                </div>

                {/* Message d'erreur bloquant si trou de caisse */}
                {totals.globalGap < 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-start gap-2 mt-4 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">
                        Alerte Trou de Caisse :
                      </strong>{" "}
                      Le montant compté est inférieur aux ventes système.
                      L'écart sera consigné sur le rapport d'audit.
                    </div>
                  </div>
                )}
              </div>

              {/* Action Clôture */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer"
                >
                  <Lock className="w-4 h-4" /> CLÔTURER & IMPRIMER LE RAPPORT
                  (Z)
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
