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
import useArticleStore from "../../../../functions/pharmacy/useArticleStore";

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  expiryDate: string;
  location: string;
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

// --- DONNÉES STATIQUES DE TEST ---
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Paracétamol 500mg (Efferalgan)",
    code: "MED-001",
    price: 1500,
    stock: 45,
    requiresPrescription: false,
    expiryDate: "2027-12",
    location: "Rayon A-3",
  },
  {
    id: "2",
    name: "Amoxicilline 1g (Clamoxyl)",
    code: "MED-002",
    price: 3500,
    stock: 12,
    requiresPrescription: true,
    expiryDate: "2026-09",
    location: "Rayon B-1",
  },
  {
    id: "3",
    name: "Ibuprofène 400mg",
    code: "MED-003",
    price: 1200,
    stock: 3,
    requiresPrescription: false,
    expiryDate: "2026-05",
    location: "Rayon A-1",
  },
  {
    id: "4",
    name: "Spasfon Lyoc",
    code: "MED-004",
    price: 2200,
    stock: 25,
    requiresPrescription: false,
    expiryDate: "2028-02",
    location: "Rayon C-2",
  },
  {
    id: "5",
    name: "Augmentin Enfant",
    code: "MED-005",
    price: 4800,
    stock: 8,
    requiresPrescription: true,
    expiryDate: "2026-01",
    location: "Frigo A",
  },
];

export default function SaleModal({
  isOpen,
  onClose,
  onSaleSuccess,
}: SaleModalProps) {
  // 1. TOUS LES HOOKS DOIVENT ÊTRE DÉCLARÉS TOUT EN HAUT
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("Client Passage");
  const [hasPrescription, setHasPrescription] = useState<boolean>(false);
  const [prescriptionRef, setPrescriptionRef] = useState<string>(""); // Correction de la variable indéfinie
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "MOBILE_MONEY" | "CARD"
  >("CASH");
  const [amountReceived, setAmountReceived] = useState<number>(0);

  const searchSelectRef = useRef<any>(null);
  const { loading, allArticles, getAllArticles } = useArticleStore();
  // Chargement initial
  useEffect(() => {
    getAllArticles();
  }, [getAllArticles]);
  console.log("all article", allArticles);

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
        Swal.fire({
          title: "Vente enregistrée !",
          text: "Le ticket de caisse a été envoyé à l'impression.",
          icon: "success",
          confirmButtonColor: "#059669",
        });

        if (onSaleSuccess) onSaleSuccess();
        setCart([]);
        setAmountReceived(0);
        onClose();
      }
    });
  };

  const productOptions = MOCK_PRODUCTS.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name} (${p.price} XAF)`,
    product: p,
  }));

  // 2. LE RETOUR CONDITIONNEL S'EFFECTUE UNIQUEMENT APRÈS TOUS LES HOOKS
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-sans text-slate-800 backdrop-blur-xs p-4">
      <div className="flex w-full max-w-7xl h-[90vh] bg-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ================= ZONE DE GAUCHE : PANIER & RECHERCHE ================= */}
        <div className="flex-1 flex flex-col p-5 overflow-hidden h-full">
          {/* En-tête de la modale */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <ShoppingCart className="w-6 h-6 text-emerald-600" /> Effectuer
              une vente
            </h1>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg bg-white shadow-xs border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barre de recherche et infos client */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-4 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Rechercher un Médicament / Code barre
              </label>
              <div className="relative">
                <Select
                  ref={searchSelectRef}
                  options={productOptions}
                  placeholder="Scanner ou taper le nom du produit..."
                  onChange={(option) => option && addToCart(option.product)}
                  isClearable
                  components={{
                    DropdownIndicator: () => (
                      <Search className="w-5 h-5 text-slate-400 mr-3" />
                    ),
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "0.5rem",
                      borderColor: "#cbd5e1",
                    }),
                  }}
                />
              </div>
            </div>

            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Client
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="col-span-3 flex items-center h-full pt-5">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPrescription}
                  onChange={(e) => setHasPrescription(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-500" /> Ordonnance
                  présente
                </span>
              </label>
            </div>
          </div>

          {/* Réf ordonnance facultative */}
          {hasPrescription && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl mb-4 flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <input
                type="text"
                placeholder="Référence de l'ordonnance / Nom du Médecin prescripteur..."
                value={prescriptionRef}
                onChange={(e) => setPrescriptionRef(e.target.value)}
                className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Liste du Panier */}
          <div className="flex-1 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 grid grid-cols-12 border-b border-slate-200">
              <div className="col-span-5">Désignation / Emplacement</div>
              <div className="col-span-2 text-center">P.U (XAF)</div>
              <div className="col-span-2 text-center">Qté</div>
              <div className="col-span-1 text-center">Remise %</div>
              <div className="col-span-2 text-right">Total (XAF)</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                  <ShoppingCart className="w-16 h-16 stroke-1 mb-2 text-slate-300 animate-bounce" />
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
                      className={`grid grid-cols-12 items-center p-3 text-sm hover:bg-slate-50/80 transition-colors ${missingPrescription ? "bg-red-50/60" : ""}`}
                    >
                      <div className="col-span-5 pr-2">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {item.product.name}
                          {item.product.requiresPrescription && (
                            <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              Ordonnance Obligatoire
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600 font-medium">
                            {item.product.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> Stock:
                            <strong
                              className={
                                isLowStock ? "text-amber-600" : "text-slate-700"
                              }
                            >
                              {item.product.stock}
                            </strong>
                          </span>
                          <span className="text-slate-400">
                            Périm: {item.product.expiryDate}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 text-center font-mono font-medium text-slate-600">
                        {item.product.price.toLocaleString()}
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="px-2 py-1.5 hover:bg-slate-100 text-slate-500 border-r border-slate-200 transition-colors cursor-pointer"
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
                            className="w-10 text-center font-bold bg-transparent text-sm focus:outline-hidden"
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="px-2 py-1.5 hover:bg-slate-100 text-slate-500 border-l border-slate-200 transition-colors cursor-pointer"
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
                          className="w-full text-center border border-slate-300 rounded-md p-1 text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                      </div>

                      <div className="col-span-2 text-right font-mono font-bold text-slate-900 flex items-center justify-end gap-3">
                        <span>{itemTotal.toLocaleString()}</span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
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
        <div className="w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-slate-800">Session de Caisse</h2>
                <p className="text-xs text-slate-500">
                  Caissier:{" "}
                  <span className="font-semibold text-slate-700">
                    M. Amadou
                  </span>
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                En ligne
              </span>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Résumé
              </h3>

              <div className="space-y-2.5 border-b border-slate-100 pb-4">
                <div className="flex justify-between text-sm text-slate-600 font-medium">
                  <span>Sous-total</span>
                  <span className="font-mono">
                    {totals.subtotal.toLocaleString()} XAF
                  </span>
                </div>
                <div className="flex justify-between text-sm text-amber-600 font-medium">
                  <span>Remise cumulée</span>
                  <span className="font-mono">
                    - {totals.discountAmount.toLocaleString()} XAF
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/60 rounded-xl p-4 my-4 border border-emerald-100/60 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    NET À PAYER
                  </span>
                  <span className="text-2xl font-black text-emerald-900 font-mono">
                    {totals.total.toLocaleString()}{" "}
                    <span className="text-xs font-bold">XAF</span>
                  </span>
                </div>
              </div>

              {/* Alerte Ordonnance Bloquante */}
              {!hasPrescription &&
                cart.some((i) => i.product.requiresPrescription) && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-rose-800 text-xs flex items-start gap-2 mb-4 shadow-xs animate-pulse">
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
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Mode de Règlement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${paymentMethod === "CASH" ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-xs" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-[11px] font-medium">Espèces</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("MOBILE_MONEY")}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${paymentMethod === "MOBILE_MONEY" ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-xs" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <span className="text-[11px] font-medium">Momo/OM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${paymentMethod === "CARD" ? "border-purple-600 bg-purple-50 text-purple-700 font-bold shadow-xs" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-500" />
                    <span className="text-[11px] font-medium">Carte BC</span>
                  </button>
                </div>
              </div>

              {/* Calcul du reliquat */}
              {paymentMethod === "CASH" && (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Montant Reçu (XAF)
                    </label>
                    <input
                      type="number"
                      placeholder="Somme perçue..."
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-base font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      onChange={(e) =>
                        setAmountReceived(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 text-sm border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">
                      Rendu monnaie :
                    </span>
                    <span className="font-mono font-black text-amber-700 text-base">
                      {totals.changeDue.toLocaleString()} XAF
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation Boutons */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={
                  cart.length === 0 ||
                  (!hasPrescription &&
                    cart.some((i) => i.product.requiresPrescription))
                }
                onClick={handleValidateSale}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 tracking-wide cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" /> VALIDER & IMPRIMER [F12]
              </button>
              <button
                type="button"
                onClick={handleCancelSale}
                className="w-full mt-2 text-xs text-slate-400 hover:text-red-500 font-medium transition-colors py-1 text-center cursor-pointer"
              >
                Vider le panier actuel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
