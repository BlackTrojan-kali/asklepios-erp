import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
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
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { useMyActiveSession, useCloseCashRegisterSession } from "../../hooks/pharmacy/useCashRegister";

export default function CloseSession() {
  const navigate = useNavigate();
  const { data: myActiveSession, isLoading, error } = useMyActiveSession();
  const closeSessionMutation = useCloseCashRegisterSession();

  // --- ÉTATS FORMULAIRE CLÔTURE ---
  const [countedCash, setCountedCash] = useState<number>(0);
  const [countedMomo, setCountedMomo] = useState<number>(0);
  const [countedCard, setCountedCard] = useState<number>(0);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Données de la session dynamique
  const cashierName = myActiveSession?.user
    ? `${myActiveSession.user.first_name} ${myActiveSession.user.last_name || ""}`
    : "";
  const tillNumber = myActiveSession?.register?.name || "";
  const openedAt = myActiveSession?.opened_at
    ? new Date(myActiveSession.opened_at).toLocaleString()
    : "";
  const initialBalance = myActiveSession?.opening_balance || 0;
  const currency = myActiveSession?.register?.branch?.country?.currency || "FCFA";

  // Données théoriques en temps réel du backend
  const theoreticalSales = {
    cash: myActiveSession?.sales_totals?.cash || 0,
    mobileMoney: myActiveSession?.sales_totals?.mobile_money || 0,
    card: myActiveSession?.sales_totals?.card || 0,
  };

  // --- CALCULS DU NET ATTENDU EN CAISSE ---
  const totals = useMemo(() => {
    // Le cash attendu = Fond de caisse initial + Ventes cash du système
    const expectedCash = initialBalance + theoreticalSales.cash;
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
  }, [initialBalance, theoreticalSales.cash, theoreticalSales.mobileMoney, theoreticalSales.card, countedCash, countedMomo, countedCard]);

  // --- ACTIONS : CLÔTURE DE LA CAISSE ---
  const handleCloseRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!myActiveSession) return;

    if (!password.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation requise",
        text: "Veuillez entrer votre mot de passe pour confirmer la clôture.",
        confirmButtonColor: "#1e293b",
      });
      return;
    }

    let textAlert = "Voulez-vous valider l'arrêt de caisse et verrouiller la session ?";
    if (totals.globalGap !== 0) {
      textAlert = `Attention : Un écart global de caisse de ${totals.globalGap.toLocaleString()} ${currency} a été détecté. Confirmer la clôture ?`;
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
        closeSessionMutation.mutate(
          {
            sessionId: myActiveSession.id,
            payload: {
              closing_balance: countedCash,
              password,
            },
          },
          {
            onSuccess: () => {
              Swal.fire({
                title: "Session clôturée !",
                text: "Le rapport d'arrêté de caisse (Z) a été généré.",
                icon: "success",
                confirmButtonColor: "#10b981",
              });
              // Vider le mot de passe
              setPassword("");
              navigate("/pharmacy/cash/session/open");
            },
            onError: (err: any) => {
              const msg = err.response?.data?.message || "Le mot de passe de validation est incorrect.";
              Swal.fire({
                title: "Échec de clôture",
                text: msg,
                icon: "error",
                confirmButtonColor: "#ef4444",
              });
            },
          }
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

  if (error || !myActiveSession || !myActiveSession.id) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen flex flex-col justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-gray-700 text-center max-w-sm">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Aucune session active</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Il semble que vous n'ayez aucune session de caisse en cours pour le moment.
          </p>
          <button
            onClick={() => navigate("/pharmacy/cash/session/open")}
            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Aller à l'ouverture de caisse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 dark:bg-gray-900 min-h-screen font-sans text-slate-800 dark:text-white">
      <div className="animate-in fade-in duration-200 max-w-6xl mx-auto">
        {/* Bannière de Session Active */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Session de Caisse Ouverte
              </h1>
              <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-gray-300">
                  <User className="w-3.5 h-3.5" /> Caissier : {cashierName}
                </span>
                <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-gray-300">
                  <Clock className="w-3.5 h-3.5" /> Depuis le : {openedAt}
                </span>
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs text-slate-505 dark:text-gray-300 bg-slate-50 dark:bg-gray-900/60 px-4 py-2 border border-slate-200 dark:border-gray-700 rounded-xl">
            Fond de Caisse de départ :{" "}
            <strong className="text-slate-900 dark:text-white">
              {initialBalance.toLocaleString()} {currency}
            </strong>
          </div>
        </div>

        <form onSubmit={handleCloseRegister} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Saisie du pointage (Gauche) */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-slate-500" /> Comptage Physique des Fonds
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Comptez l'argent physique présent dans votre tiroir et validez les montants ci-dessous.
              </p>
            </div>

            {/* Saisie Espèces */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-200/60 dark:border-gray-750">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-gray-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Espèces Physiques (Cash)
                </label>
                <p className="text-xs text-slate-400 dark:text-gray-500">
                  Total billets + pièces du tiroir
                </p>
              </div>
              <input
                type="number"
                placeholder="0 XAF"
                min="0"
                value={countedCash || ""}
                onChange={(e) => setCountedCash(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-700 rounded-lg text-right font-mono font-black bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Saisie Mobile Money */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-200/60 dark:border-gray-750">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-gray-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-500" /> Reçus Mobile Money
                </label>
                <p className="text-xs text-slate-400 dark:text-gray-500">
                  Cumul des transactions Orange / MTN
                </p>
              </div>
              <input
                type="number"
                placeholder="0 XAF"
                min="0"
                value={countedMomo || ""}
                onChange={(e) => setCountedMomo(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-700 rounded-lg text-right font-mono font-black bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Saisie Carte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-slate-200/60 dark:border-gray-750">
              <div>
                <label className="text-sm font-bold text-slate-800 dark:text-gray-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-500" /> Tickets Carte Bancaire
                </label>
                <p className="text-xs text-slate-400 dark:text-gray-500">
                  Cumul des reçus du terminal TPE
                </p>
              </div>
              <input
                type="number"
                placeholder="0 XAF"
                min="0"
                value={countedCard || ""}
                onChange={(e) => setCountedCard(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-700 rounded-lg text-right font-mono font-black bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>
          </div>

          {/* Pointage Automatique & Écarts (Droite) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            {/* Tableau comparatif attendu / compté */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-gray-700 flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-4 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-slate-500" /> Analyse des Écarts de Caisse
                </h2>

                <div className="space-y-4">
                  {/* Ligne Espèces */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100 dark:border-gray-700">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-gray-300">Espèces (avec Fond)</span>
                      <p className="text-[11px] text-slate-400 dark:text-gray-500">
                        Attendu : {totals.expectedCash.toLocaleString()} {currency}
                      </p>
                    </div>
                    <span className={`font-mono font-bold ${totals.gapCash === 0 ? "text-slate-600 dark:text-gray-400" : totals.gapCash > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {totals.gapCash >= 0 ? "+" : ""}
                      {totals.gapCash.toLocaleString()} {currency}
                    </span>
                  </div>

                  {/* Ligne MoMo */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100 dark:border-gray-700">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-gray-300">Mobile Money</span>
                      <p className="text-[11px] text-slate-400 dark:text-gray-500">
                        Attendu : {totals.expectedMomo.toLocaleString()} {currency}
                      </p>
                    </div>
                    <span className={`font-mono font-bold ${totals.gapMomo === 0 ? "text-slate-600 dark:text-gray-400" : totals.gapMomo > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {totals.gapMomo >= 0 ? "+" : ""}
                      {totals.gapMomo.toLocaleString()} {currency}
                    </span>
                  </div>

                  {/* Ligne Carte */}
                  <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-100 dark:border-gray-700">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-gray-300">Carte Bancaire</span>
                      <p className="text-[11px] text-slate-400 dark:text-gray-500">
                        Attendu : {totals.expectedCard.toLocaleString()} {currency}
                      </p>
                    </div>
                    <span className={`font-mono font-bold ${totals.gapCard === 0 ? "text-slate-600 dark:text-gray-400" : totals.gapCard > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                      {totals.gapCard >= 0 ? "+" : ""}
                      {totals.gapCard.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                {/* Bloc Écart Global */}
                <div className={`mt-6 p-4 rounded-xl border flex justify-between items-center transition-colors
                  ${totals.globalGap === 0 ? "bg-slate-50 border-slate-200 dark:bg-gray-900/30 dark:border-gray-700" : totals.globalGap > 0 ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30" : "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30"}`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400">
                    Bilan / Écart Global
                  </span>
                  <span className={`text-xl font-black font-mono
                    ${totals.globalGap === 0 ? "text-slate-700 dark:text-white" : totals.globalGap > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                  >
                    {totals.globalGap >= 0 ? "+" : ""}
                    {totals.globalGap.toLocaleString()} {currency}
                  </span>
                </div>

                {/* Message d'erreur bloquant si trou de caisse */}
                {totals.globalGap < 0 && (
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30 rounded-xl p-3 text-amber-850 dark:text-amber-300 text-xs flex items-start gap-2 mt-4 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Alerte Trou de Caisse :</strong> Le montant compté est inférieur aux ventes système. L'écart sera consigné sur le rapport d'audit.
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation par mot de passe & Action Clôture */}
              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
                    Confirmer avec votre mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Saisissez votre mot de passe..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={closeSessionMutation.isPending}
                  className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-teal-600 dark:hover:bg-teal-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer disabled:cursor-not-allowed uppercase text-xs"
                >
                  {closeSessionMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Clôture en cours...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> CLÔTURER & IMPRIMER LE RAPPORT (Z)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
