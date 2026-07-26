import { useState, useMemo, useRef, useEffect } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  User,
  FileText,
  CreditCard,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  ShoppingCart,
  X,
} from "lucide-react";
import { useAuth } from "../../../../contexts/AuthContext";
import { useBranchArticlesAll } from "../../../../hooks/pharmacy/useBrancheArticle";
import { useCreatePosSale } from "../../../../hooks/pharmacy/usePosSale";
import { useMyActiveSession } from "../../../../hooks/pharmacy/useCashRegisterSession";
import { usePaymentAccounts } from "../../../../hooks/pharmacy/usePaymentAccount";
import usePatientStore from "../../../../functions/base_hospital/usePatientStore";
import type { PatientDto } from "../../../../types/PatientTypes";
import api from "../../../../api/api";
import SaleReceiptPreviewModal from "./SaleReceiptPreviewModal";

// --- TYPES ---
interface Product {
  id: string;
  articleId: number;
  batchId?: number;
  batchNumber?: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  expiryDate: string;
  location: string;
  imageUrl?: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Pourcentage
}

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleSuccess?: () => void;
}

// --- DONNÉES STATIQUES DE TEST SUPPRIMÉES ---

export default function CreateSaleModal({
  isOpen,
  onClose,
  onSaleSuccess,
}: SaleModalProps) {
  // 1. TOUS LES HOOKS DOIVENT ÊTRE DÉCLARÉS TOUT EN HAUT
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hasPrescription, setHasPrescription] = useState<boolean>(false);
  const [prescriptionRef, setPrescriptionRef] = useState<string>(""); // Correction de la variable indéfinie
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "MOBILE_MONEY" | "CARD"
  >("CASH");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [selectedAccountId, setSelectedAccountId] = useState<
    number | undefined
  >(undefined);

  // PATIENT SYSTEM
  const { allPatients, getAllPatients } = usePatientStore();
  const [selectedPatient, setSelectedPatient] = useState<PatientDto | null>(
    null,
  );

  const searchSelectRef = useRef<any>(null);

  // URL de base pour les médias / images
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const formatImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  };

  // RÉCUPÉRATION ROBUSTE DU BRANCH_ID ET DES PRODUITS DE LA BRANCHE
  const { profile } = useAuth();
  const { data: myActiveSession } = useMyActiveSession();

  const currentBranchId =
    profile?.profile_pharm?.branch_id ||
    myActiveSession?.register?.pharmacy_branch_id ||
    myActiveSession?.register?.branch_id ||
    (profile as any)?.branch_id ||
    null;

  const { data: branchArticles, isLoading: loading } =
    useBranchArticlesAll(currentBranchId);

  // Charger les comptes de trésorerie de la succursale (non-admin)
  const { data: paymentAccounts } = usePaymentAccounts(
    { pharmacy_branch_id: currentBranchId || undefined },
    false,
  );

  const activePaymentAccounts = useMemo(() => {
    return paymentAccounts?.filter((acc) => acc.status === "active") || [];
  }, [paymentAccounts]);

  const momoAccounts = useMemo(() => {
    return activePaymentAccounts.filter((acc) => acc.type === "mobile_money");
  }, [activePaymentAccounts]);

  const bankAccounts = useMemo(() => {
    return activePaymentAccounts.filter((acc) => acc.type === "bank");
  }, [activePaymentAccounts]);

  const selectedAccount = useMemo(() => {
    return activePaymentAccounts.find((acc) => acc.id === selectedAccountId);
  }, [activePaymentAccounts, selectedAccountId]);

  const createSaleMutation = useCreatePosSale();
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

  const cashierName = myActiveSession?.user
    ? `${myActiveSession.user.first_name} ${myActiveSession.user.last_name || ""}`
    : "Caissier";
  const registerName = myActiveSession?.register?.name || "N/A";

  // Charger les patients à l'ouverture de la modal
  useEffect(() => {
    if (isOpen) {
      getAllPatients();
    }
  }, [isOpen, getAllPatients]);

  // Options pour React-Select pour les patients
  const patientOptions = useMemo(() => {
    return allPatients.map((p) => ({
      value: p.id,
      label: `${p.patient_code} - ${p.first_name} ${p.last_name || ""}`,
      patient: p,
    }));
  }, [allPatients]);

  const handleCloseReceiptPreview = () => {
    setCompletedSaleId(null);
    setCart([]);
    setAmountReceived(0);
    setSelectedAccountId(undefined);
    setSelectedPatient(null);
    setHasPrescription(false);
    setPrescriptionRef("");
    if (onSaleSuccess) onSaleSuccess();
    onClose();
  };

  // Conversion des articles de la succursale au format Product attendu par le panier, avec gestion et tri des lots (FEFO)
  const products = useMemo<Product[]>(() => {
    if (!branchArticles) return [];

    const list: Product[] = [];

    const formatLoc = (loc: any) => {
      if (!loc) return null;
      const code = loc.code ? `[${loc.code}] ` : "";
      //   const aisle = loc.aisle ? `Allée ${loc.aisle}` : "";
      // const shelf = loc.shelf ? `${loc.aisle ? " - " : ""}Étagère ${loc.shelf}` : "";
      const full = `${code}`.trim();
      return full || null;
    };

    branchArticles.forEach((article) => {
      const defaultLocStr =
        formatLoc(article.default_storage_location) || "Non classé";

      const finalPrice =
        typeof article.selling_price === "string"
          ? parseFloat(article.selling_price)
          : Number(article.selling_price || 0);

      const formattedImage = formatImageUrl(article.image_url);

      if (
        article.track_batches &&
        article.batches &&
        article.batches.length > 0
      ) {
        let hasAvailableLot = false;

        // Pour les articles avec suivi des lots, on crée un produit distinct par lot disponible en stock
        article.batches.forEach((batch) => {
          const batchQty = Number(batch.qty || 0);
          const batchLocStr =
            formatLoc((batch as any).storage_location) || defaultLocStr;
          if (batchQty > 0) {
            hasAvailableLot = true;
            list.push({
              id: `${article.id}-${batch.id}`,
              articleId: article.id,
              batchId: batch.id,
              batchNumber: batch.batch_number,
              name: `${article.name} [Lot: ${batch.batch_number}]`,
              code: article.barcode || `ART-${article.id}`,
              price: finalPrice,
              stock: batchQty,
              requiresPrescription: Boolean(article.is_prescripted),
              expiryDate: batch.expire_date || "Sans date",
              location: batchLocStr,
              imageUrl: formattedImage,
            });
          }
        });

        // Si l'article n'a plus aucun stock de lot mais qu'il existe, on l'ajoute comme rupture
        if (!hasAvailableLot) {
          list.push({
            id: `${article.id}-rupture`,
            articleId: article.id,
            name: `${article.name} (Rupture)`,
            code: article.barcode || `ART-${article.id}`,
            price: finalPrice,
            stock: 0,
            requiresPrescription: Boolean(article.is_prescripted),
            expiryDate: "N/A",
            location: defaultLocStr,
            imageUrl: formattedImage,
          });
        }
      } else {
        // Articles sans suivi de lots
        const totalStock = Number(article.stock_qty || 0);
        list.push({
          id: article.id.toString(),
          articleId: article.id,
          name: article.name,
          code: article.barcode || `ART-${article.id}`,
          price: finalPrice,
          stock: totalStock,
          requiresPrescription: Boolean(article.is_prescripted),
          expiryDate: "N/A",
          location: defaultLocStr,
          imageUrl: formattedImage,
        });
      }
    });

    // Tri par date d'expiration (FEFO : First Expired First Out)
    return list.sort((a, b) => {
      const isANa = a.expiryDate === "N/A" || a.expiryDate === "Sans date";
      const isBNa = b.expiryDate === "N/A" || b.expiryDate === "Sans date";

      if (isANa && !isBNa) return 1;
      if (!isANa && isBNa) return -1;
      if (isANa && isBNa) return 0;

      return (
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
    });
  }, [branchArticles]);

  // --- CALCULS (MEMOIZED) ---
  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const discountAmount = cart.reduce(
      (sum, item) =>
        sum + item.product.price * item.quantity * (item.discount / 100),
      0,
    );
    const total = subtotal - discountAmount;
    const changeDue = amountReceived > total ? amountReceived - total : 0;

    return { subtotal, discountAmount, total, changeDue };
  }, [cart, amountReceived]);

  // --- ACTIONS ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          Swal.fire({
            icon: "error",
            title: "Stock insuffisant",
            text: `Il ne reste que ${product.stock} unités.`,
            confirmButtonColor: "#10b981",
          });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });

    if (searchSelectRef.current) searchSelectRef.current.clearValue();
  };

  const updateQuantity = (productId: string, qte: number) => {
    if (qte <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(qte, item.product.stock) }
          : item,
      ),
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, discount: Math.max(0, Math.min(100, discount)) }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleCancelSale = () => {
    Swal.fire({
      title: "Annuler la vente ?",
      text: "Le panier actuel sera entièrement vidé.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, vider",
      cancelButtonText: "Non",
    }).then((result) => {
      if (result.isConfirmed) {
        setCart([]);
        setAmountReceived(0);
      }
    });
  };

  const handleValidateSale = () => {
    if (paymentMethod === "CASH" && amountReceived < totals.total) {
      Swal.fire({
        icon: "error",
        title: "Montant insuffisant",
        text: "La somme perçue est inférieure au net à payer.",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    Swal.fire({
      title: "Confirmer l'encaissement",
      text: `Valider la vente d'un montant de ${totals.total.toLocaleString()} XAF ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Valider & Imprimer",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        // Formater le panier pour l'API
        const itemsPayload = cart.map((item) => ({
          article_id: item.product.articleId,
          batch_id: item.product.batchId || null,
          qty: item.quantity,
          unit_price: item.product.price,
          discount: item.discount,
        }));

        createSaleMutation.mutate(
          {
            customer_name: selectedPatient
              ? `${selectedPatient.first_name} ${selectedPatient.last_name || ""}`.trim()
              : "Anonyme",
            patient_id: selectedPatient ? selectedPatient.id : undefined,
            has_prescription: hasPrescription,
            prescription_ref: prescriptionRef,
            payment_method: paymentMethod,
            payment_account_id: selectedAccountId,
            amount_received:
              paymentMethod === "CASH" ? amountReceived : totals.total,
            items: itemsPayload,
          },
          {
            onSuccess: (data) => {
              Swal.fire({
                title: "Vente enregistrée !",
                text: "La vente a été sauvegardée avec succès.",
                icon: "success",
                confirmButtonColor: "#059669",
              });
              setCompletedSaleId(data.id);
            },
            onError: (err: any) => {
              const msg =
                err.response?.data?.message ||
                "Impossible d'enregistrer la vente.";
              Swal.fire({
                title: "Erreur de validation",
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

  const productOptions = useMemo(() => {
    return products.map((p) => {
      const expLabel =
        p.expiryDate !== "N/A" ? ` [Périm: ${p.expiryDate}]` : "";
      const stockLabel = ` (Stock: ${p.stock})`;
      return {
        value: p.id,
        label: `${p.code} - ${p.name}${expLabel}${stockLabel} - ${p.price} XAF`,
        product: p,
      };
    });
  }, [products]);

  // 2. LE RETOUR CONDITIONNEL S'EFFECTUE UNIQUEMENT APRÈS TOUS LES HOOKS
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-sans text-slate-800 dark:text-gray-200 backdrop-blur-xs">
      <div className="flex w-screen h-screen bg-slate-100 dark:bg-gray-900 shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* ================= ZONE DE GAUCHE : PANIER & RECHERCHE ================= */}
        <div className="flex-1 flex flex-col p-5 overflow-hidden h-full">
          {/* En-tête de la modale */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <ShoppingCart className="w-6 h-6 text-emerald-600" /> Effectuer
              une vente
            </h1>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 rounded-lg bg-white dark:bg-gray-800 shadow-xs border border-slate-200 dark:border-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barre de recherche et infos client */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xs border border-slate-200 dark:border-gray-700 mb-4 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-6">
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Rechercher un Médicament / Code barre
              </label>
              <div className="relative">
                <Select
                  ref={searchSelectRef}
                  options={productOptions}
                  placeholder="Scanner ou taper le nom du produit..."
                  onChange={(option) => option && addToCart(option.product)}
                  isClearable
                  formatOptionLabel={(data: any) => {
                    const p = data.product;
                    return (
                      <div className="flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-gray-700/60 last:border-0">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-gray-700 bg-white shrink-0 shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center border border-slate-200 dark:border-gray-700 shrink-0">
                            <Package className="w-6 h-6 text-slate-400 dark:text-gray-500" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-gray-100 truncate">
                              {p.name}
                            </span>
                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 shrink-0 font-mono">
                              {p.price.toLocaleString()} XAF
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-gray-300">
                            <span className="bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700">
                              {p.code}
                            </span>
                            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-blue-200 dark:border-blue-800/40">
                              Emplacement: {p.location}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                p.stock <= 0
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : p.stock <= 5
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                            >
                              Stock: {p.stock}
                            </span>
                            {p.expiryDate !== "N/A" && (
                              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                                Périm: {p.expiryDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  components={{
                    DropdownIndicator: () => (
                      <Search className="w-5 h-5 text-slate-400 mr-3" />
                    ),
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      borderColor: document.documentElement.classList.contains(
                        "dark",
                      )
                        ? "#4b5563"
                        : "#cbd5e1",
                      backgroundColor:
                        document.documentElement.classList.contains("dark")
                          ? "#1f2937"
                          : "#ffffff",
                      color: document.documentElement.classList.contains("dark")
                        ? "#ffffff"
                        : "#1e293b",
                    }),
                    input: (base) => ({
                      ...base,
                      color: document.documentElement.classList.contains("dark")
                        ? "#ffffff"
                        : "#1e293b",
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: document.documentElement.classList.contains("dark")
                        ? "#9ca3af"
                        : "#64748b",
                      fontSize: "0.875rem",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: document.documentElement.classList.contains("dark")
                        ? "#ffffff"
                        : "#1e293b",
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor:
                        document.documentElement.classList.contains("dark")
                          ? "#1f2937"
                          : "#ffffff",
                      border: document.documentElement.classList.contains(
                        "dark",
                      )
                        ? "1px solid #374151"
                        : "1px solid #e2e8f0",
                      zIndex: 9999,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#059669"
                        : state.isFocused
                          ? document.documentElement.classList.contains("dark")
                            ? "#374151"
                            : "#f1f5f9"
                          : "transparent",
                      color: state.isSelected
                        ? "#ffffff"
                        : document.documentElement.classList.contains("dark")
                          ? "#ffffff"
                          : "#1e293b",
                    }),
                  }}
                />
              </div>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Patient / Client
              </label>
              <Select
                options={patientOptions}
                placeholder="Client Anonyme (Rechercher...)"
                value={
                  selectedPatient
                    ? {
                        value: selectedPatient.id,
                        label: `${selectedPatient.patient_code} - ${selectedPatient.first_name} ${selectedPatient.last_name || ""}`,
                      }
                    : null
                }
                onChange={(val: any) => {
                  setSelectedPatient(val ? val.patient : null);
                }}
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    borderColor: document.documentElement.classList.contains(
                      "dark",
                    )
                      ? "#4b5563"
                      : "#cbd5e1",
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#1f2937"
                        : "#ffffff",
                    color: document.documentElement.classList.contains("dark")
                      ? "#ffffff"
                      : "#1e293b",
                    fontSize: "0.875rem",
                    minHeight: "38px",
                  }),
                  input: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains("dark")
                      ? "#ffffff"
                      : "#1e293b",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains("dark")
                      ? "#9ca3af"
                      : "#64748b",
                    fontSize: "0.875rem",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: document.documentElement.classList.contains("dark")
                      ? "#ffffff"
                      : "#1e293b",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor:
                      document.documentElement.classList.contains("dark")
                        ? "#1f2937"
                        : "#ffffff",
                    border: document.documentElement.classList.contains("dark")
                      ? "1px solid #374151"
                      : "1px solid #e2e8f0",
                    zIndex: 9999,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#059669"
                      : state.isFocused
                        ? document.documentElement.classList.contains("dark")
                          ? "#374151"
                          : "#f1f5f9"
                        : "transparent",
                    color: state.isSelected
                      ? "#ffffff"
                      : document.documentElement.classList.contains("dark")
                        ? "#ffffff"
                        : "#1e293b",
                    fontSize: "0.75rem",
                  }),
                }}
              />
            </div>

            <div className="col-span-3 flex items-center h-full pt-5">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPrescription}
                  onChange={(e) => setHasPrescription(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-500" /> Ordonnance
                  présente
                </span>
              </label>
            </div>
          </div>

          {/* Réf ordonnance facultative */}
          {hasPrescription && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 p-3 rounded-xl mb-4 flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2 text-blue-900 dark:text-blue-300">
              <FileText className="w-5 h-5 text-blue-600" />
              <input
                type="text"
                placeholder="Référence de l'ordonnance / Nom du Médecin prescripteur..."
                value={prescriptionRef}
                onChange={(e) => setPrescriptionRef(e.target.value)}
                className="flex-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Liste du Panier */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="bg-slate-50 dark:bg-gray-900/60 p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 grid grid-cols-12 border-b border-slate-200 dark:border-gray-750">
              <div className="col-span-5">Désignation / Emplacement</div>
              <div className="col-span-2 text-center">P.U (XAF)</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-1 text-center">Remise %</div>
              <div className="col-span-2 text-right">Total (XAF)</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 p-8">
                  <ShoppingCart className="w-16 h-16 stroke-1 mb-2 text-slate-300 dark:text-gray-650 animate-bounce" />
                  <p className="text-sm font-medium">
                    Le panier est vide. Scannez un produit.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemTotal =
                    item.product.price *
                    item.quantity *
                    (1 - item.discount / 100);
                  const isLowStock = item.product.stock <= 5;
                  const missingPrescription =
                    item.product.requiresPrescription && !hasPrescription;

                  return (
                    <div
                      key={item.product.id}
                      className={`grid grid-cols-12 items-center p-3 text-sm hover:bg-slate-50/80 dark:hover:bg-gray-750/30 transition-colors ${missingPrescription ? "bg-red-50/60 dark:bg-red-950/20" : ""}`}
                    >
                      <div className="col-span-5 pr-2 flex items-center gap-3">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-gray-700 bg-white shrink-0 shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center border border-slate-200 dark:border-gray-700 shrink-0">
                            <Package className="w-5 h-5 text-slate-400 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <div className="font-bold text-sm text-slate-900 dark:text-gray-100 flex items-center gap-1.5 flex-wrap">
                            {item.product.name}
                            {item.product.requiresPrescription && (
                              <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Ordonnance Obligatoire
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-gray-300 flex items-center gap-2 flex-wrap">
                            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold border border-blue-200 dark:border-blue-800/40">
                              {item.product.location}
                            </span>
                            <span className="flex items-center gap-1 text-[11px]">
                              <Package className="w-3.5 h-3.5 text-slate-400 dark:text-gray-400" />{" "}
                              Stock:
                              <strong
                                className={
                                  isLowStock
                                    ? "text-amber-600 dark:text-amber-400 font-bold"
                                    : "text-slate-800 dark:text-gray-200 font-semibold"
                                }
                              >
                                {item.product.stock}
                              </strong>
                            </span>
                            {item.product.expiryDate !== "N/A" && (
                              <span className="text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                                Périm: {item.product.expiryDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 text-center font-mono font-medium text-slate-600 dark:text-gray-350">
                        {item.product.price.toLocaleString()}
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-xs">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 border-r border-slate-200 dark:border-gray-600 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.product.id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-10 text-center font-bold bg-transparent text-sm focus:outline-hidden text-slate-900 dark:text-white"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 border-l border-slate-200 dark:border-gray-600 transition-colors cursor-pointer"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-1 px-1">
                        <input
                          type="number"
                          value={item.discount || ""}
                          placeholder="0"
                          onChange={(e) =>
                            updateDiscount(
                              item.product.id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full text-center border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md p-1 text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white font-semibold"
                        />
                      </div>

                      <div className="col-span-2 text-right font-mono font-bold text-slate-900 dark:text-white flex items-center justify-end gap-3">
                        <span>{itemTotal.toLocaleString()}</span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-rose-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= ZONE DE DROITE : RÈGLEMENT & ACTIONS ================= */}
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-slate-200 dark:border-gray-700 shadow-xl flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/60">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800 dark:text-white">
                  Session de Caisse
                </h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Caissier:{" "}
                  <span className="font-semibold text-slate-700 dark:text-gray-250">
                    {cashierName}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">
                  Terminal: {registerName}
                </p>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>{" "}
                En ligne
              </span>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto dark:bg-gray-800">
            <div>
              <h3 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                Résumé
              </h3>

              <div className="space-y-2.5 border-b border-slate-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between text-sm text-slate-600 dark:text-gray-400 font-medium">
                  <span>Sous-total</span>
                  <span className="font-mono">
                    {totals.subtotal.toLocaleString()} XAF
                  </span>
                </div>
                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400 font-medium">
                  <span>Remise cumulée</span>
                  <span className="font-mono">
                    - {totals.discountAmount.toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-4 my-4 border border-emerald-100/60 dark:border-emerald-900/30 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    NET À PAYER
                  </span>
                  <span className="text-2xl font-black text-emerald-900 dark:text-emerald-300 font-mono">
                    {totals.total.toLocaleString()}{" "}
                    <span className="text-xs font-bold">XAF</span>
                  </span>
                </div>
              </div>

              {/* Alerte Ordonnance Bloquante */}
              {!hasPrescription &&
                cart.some((i) => i.product.requiresPrescription) && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-3.5 text-rose-800 dark:text-rose-350 text-xs flex items-start gap-2 mb-4 shadow-xs animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold uppercase tracking-wide">
                        Bloquant :
                      </strong>{" "}
                      Certains articles exigent obligatoirement une ordonnance
                      médicale pour autoriser la vente.
                    </div>
                  </div>
                )}

              {/* Modes de paiement */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Mode de Règlement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("CASH");
                      setSelectedAccountId(undefined);
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${paymentMethod === "CASH" ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs" : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-600 dark:text-gray-300"}`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-[11px] font-medium">Espèces</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("MOBILE_MONEY");
                      setSelectedAccountId(momoAccounts[0]?.id);
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${paymentMethod === "MOBILE_MONEY" ? "border-blue-600 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold shadow-xs" : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-600 dark:text-gray-300"}`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span className="text-[11px] font-medium">Momo/OM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("CARD");
                      setSelectedAccountId(bankAccounts[0]?.id);
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${paymentMethod === "CARD" ? "border-purple-600 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-bold shadow-xs" : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-600 dark:text-gray-300"}`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-500" />
                    <span className="text-[11px] font-medium">Carte BC</span>
                  </button>
                </div>
              </div>

              {/* Sélection du compte de trésorerie si dématérialisé */}
              {paymentMethod === "MOBILE_MONEY" && (
                <div className="mb-4">
                  {momoAccounts.length === 0 ? (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-3.5 text-rose-850 dark:text-rose-350 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        Aucun compte Mobile Money actif n'est configuré pour
                        cette succursale. Le règlement Momo est impossible.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                        Compte de Règlement Momo
                      </label>
                      <div className="flex flex-col gap-1.5">
                        {momoAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => setSelectedAccountId(acc.id)}
                            className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                              selectedAccountId === acc.id
                                ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-bold"
                                : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-gray-300"
                            }`}
                          >
                            <span>{acc.name}</span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-slate-500">
                              {acc.account_number || "Sans numéro"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "CARD" && (
                <div className="mb-4">
                  {bankAccounts.length === 0 ? (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-3.5 text-rose-850 dark:text-rose-350 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        Aucun compte bancaire actif n'est configuré pour cette
                        succursale. Le règlement par carte est impossible.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                        Compte Bancaire de Réception
                      </label>
                      <div className="flex flex-col gap-1.5">
                        {bankAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => setSelectedAccountId(acc.id)}
                            className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                              selectedAccountId === acc.id
                                ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-bold"
                                : "border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-750 text-slate-700 dark:text-gray-300"
                            }`}
                          >
                            <span>{acc.name}</span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-slate-500">
                              {acc.account_number || "Sans numéro"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Code marchand caisse si Momo ou Carte */}
              {paymentMethod !== "CASH" && selectedAccount?.account_number && (
                <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/30 rounded-xl flex items-center justify-between text-teal-800 dark:text-teal-400 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <span className="font-medium">
                    {paymentMethod === "MOBILE_MONEY"
                      ? `Code marchand (${selectedAccount.name}) :`
                      : `Numéro de compte (${selectedAccount.account_number}) :`}
                  </span>
                  <strong className="font-mono text-sm bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded">
                    {selectedAccount.account_number}
                  </strong>
                </div>
              )}

              {/* Calcul du reliquat */}
              {paymentMethod === "CASH" && (
                <div className="space-y-3 bg-slate-50 dark:bg-gray-900/40 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-gray-400 mb-1">
                      Montant Reçu (XAF)
                    </label>
                    <input
                      type="number"
                      placeholder="Somme perçue..."
                      className="w-full bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 font-mono text-base font-black text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      onChange={(e) =>
                        setAmountReceived(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-sm border-t border-slate-200/60 dark:border-gray-700">
                    <span className="text-slate-500 dark:text-gray-400 font-medium">
                      Rendu monnaie :
                    </span>
                    <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-base">
                      {totals.changeDue.toLocaleString()} XAF
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Boutons */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-gray-700">
              <button
                type="button"
                disabled={
                  cart.length === 0 ||
                  (!hasPrescription &&
                    cart.some((i) => i.product.requiresPrescription)) ||
                  (paymentMethod !== "CASH" && !selectedAccountId)
                }
                onClick={handleValidateSale}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-gray-700 disabled:text-slate-400 dark:disabled:text-gray-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" /> VALIDER & IMPRIMER [F12]
              </button>
              <button
                type="button"
                onClick={handleCancelSale}
                className="w-full mt-2 text-xs text-red-500 dark:text-rose-450 font-medium transition-colors py-1 text-center cursor-pointer"
              >
                Vider le panier actuel
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE PREVISUALISATION DE LA FACTURE */}
        {completedSaleId !== null && (
          <SaleReceiptPreviewModal
            isOpen={completedSaleId !== null}
            saleId={completedSaleId}
            onClose={handleCloseReceiptPreview}
          />
        )}
      </div>
    </div>
  );
}
