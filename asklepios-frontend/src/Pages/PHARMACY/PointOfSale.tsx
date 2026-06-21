import React, { useState, useMemo, useRef } from "react";
import Select from "react-select";
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
} from "lucide-react";

// --- TYPES ---
interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock: number;
  requiresPrescription: boolean;
  expiryDate: string;
  location: string; // Ex: Rayon A-1
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // en pourcentage
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

export default function PointOfSale() {
  // --- ÉTATS ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("Client Passage");
  const [hasPrescription, setHasPrescription] = useState<boolean>(false);
  const [prescriptionRef, setPrescriptionRef] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "MOBILE_MONEY" | "CARD"
  >("CASH");
  const [amountReceived, setAmountReceived] = useState<number>(0);

  const searchSelectRef = useRef(null);

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
        if (existing.quantity >= product.stock) return prev; // Limite stock
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });

    // Reset la sélection du react-select
    if (searchSelectRef.current) searchSelectRef.current.clearValue();
  };

  const updateQuantity = (productId: string, qte: number) => {
    if (qte <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.min(qte, item.product.stock) };
        }
        return item;
      }),
    );
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, discount: Math.max(0, Math.min(100, discount)) };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Options pour le composant React-Select
  const productOptions = MOCK_PRODUCTS.map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.name} (${p.price} XAF)`,
    product: p,
  }));

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* ================= ZONE DE GAUCHE : PANIER & RECHERCHE ================= */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden h-full">
        {/* Barre de recherche et infos client */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4 grid grid-cols-12 gap-4 items-center">
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
                className="react-select-container"
                classNamePrefix="react-select"
                isClearable
                components={{
                  DropdownIndicator: () => (
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                  ),
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
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="col-span-3 flex items-center h-full pt-5">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasPrescription}
                onChange={(e) => setHasPrescription(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                <FileText className="w-4 h-4 text-blue-500" /> Ordonnance
                présente
              </span>
            </label>
          </div>
        </div>

        {/* Optionnel : Renseigner la réf de l'ordonnance si cochée */}
        {hasPrescription && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center gap-3 animate-fadeIn">
            <FileText className="w-5 h-5 text-blue-600" />
            <input
              type="text"
              placeholder="Numéro ou Référence de l'ordonnance / Nom du Médecin..."
              value={prescriptionRef}
              onChange={(e) => setPrescriptionRef(e.target.value)}
              className="flex-1 bg-white border border-blue-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Liste du Panier */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="bg-slate-50 p-3 font-semibold text-xs uppercase tracking-wider text-slate-500 grid grid-cols-12 border-b border-slate-200">
            <div className="col-span-5">
              Désignation / <br /> Emplacement
            </div>
            <div className="col-span-2 text-center">P.U(XAF)</div>
            <div className="col-span-2 text-center">Qté</div>
            <div className="col-span-1 text-center">Remise %</div>
            <div className="col-span-2 text-right">Total (XAF)</div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                <ShoppingCart className="w-16 h-16 stroke-1 mb-2 text-slate-300" />
                <p className="text-sm">
                  Le panier est vide. Scannez un produit pour commencer.
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemTotal =
                  item.product.price *
                  item.quantity *
                  (1 - item.discount / 100);
                const isLowStock = item.product.stock <= 5;

                return (
                  <div
                    key={item.product.id}
                    className={`grid grid-cols-12 items-center p-3 text-sm hover:bg-slate-50 transition-colors ${item.product.requiresPrescription && !hasPrescription ? "bg-red-50/50" : ""}`}
                  >
                    {/* Nom & Infos Stock/Location */}
                    <div className="col-span-5 pr-2">
                      <div className="font-medium text-slate-900 flex items-center gap-1.5">
                        {item.product.name}
                        {item.product.requiresPrescription && (
                          <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            Ordonnance Obligatoire
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">
                          {item.product.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" /> Stock:
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

                    {/* Prix unitaire */}
                    <div className="col-span-2 text-center font-mono text-slate-600">
                      {item.product.price.toLocaleString()}
                    </div>

                    {/* Quantité Sélecteur */}
                    <div className="col-span-2 flex justify-center">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-sm">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="px-2 py-1 hover:bg-slate-100 text-slate-500 border-r border-slate-200 transition-colors"
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
                          className="w-10 text-center font-semibold bg-transparent text-sm focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="px-2 py-1 hover:bg-slate-100 text-slate-500 border-l border-slate-200 transition-colors"
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remise */}
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
                        className="w-full text-center border border-slate-300 rounded p-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Total & Bouton Supprimer */}
                    <div className="col-span-2 text-right font-mono font-bold text-slate-900 flex items-center justify-end gap-3">
                      <span>{itemTotal.toLocaleString()}</span>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
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
        {/* En-tête Caisse */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">Session de Caisse</h2>
              <p className="text-xs text-slate-500">
                Caissier:{" "}
                <span className="font-medium text-slate-700">M. Amadou</span>
              </p>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
              En ligne
            </span>
          </div>
        </div>

        {/* Résumé Financier */}
        <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Résumé
            </h3>

            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Sous-total</span>
                <span className="font-mono">
                  {totals.subtotal.toLocaleString()} XAF
                </span>
              </div>
              <div className="flex justify-between text-sm text-amber-600">
                <span>Remise cumulée</span>
                <span className="font-mono">
                  - {totals.discountAmount.toLocaleString()} XAF
                </span>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 my-4 border border-emerald-100">
              <div className="flex justify-between items-center">
                <span className="text-emerald-800 font-medium text-sm">
                  NET À PAYER
                </span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {totals.total.toLocaleString()}{" "}
                  <span className="text-xs font-normal">XAF</span>
                </span>
              </div>
            </div>

            {/* Alerte Ordonnance Bloquante si oubli */}
            {!hasPrescription &&
              cart.some((i) => i.product.requiresPrescription) && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 text-xs flex items-start gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Attention :</strong>{" "}
                    Certains articles du panier exigent obligatoirement une
                    ordonnance médicale valide.
                  </div>
                </div>
              )}

            {/* Modes de paiement */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Mode de Règlement
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === "CASH" ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Espèces</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("MOBILE_MONEY")}
                  className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === "MOBILE_MONEY" ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                >
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <span className="text-xs">Momo / OM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-3 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === "CARD" ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold" : "border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                >
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <span className="text-xs">Carte BC</span>
                </button>
              </div>
            </div>

            {/* Calcul du reliquat */}
            {paymentMethod === "CASH" && (
              <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Montant Reçu (XAF)
                  </label>
                  <input
                    type="number"
                    placeholder="Entrez la somme perçue..."
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-mono text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onChange={(e) =>
                      setAmountReceived(parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex justify-between items-center pt-1 text-sm">
                  <span className="text-slate-500">Reliquat à rendre :</span>
                  <span className="font-mono font-bold text-amber-700 text-base">
                    {totals.changeDue.toLocaleString()} XAF
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Validation Bouton */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={
                cart.length === 0 ||
                (!hasPrescription &&
                  cart.some((i) => i.product.requiresPrescription))
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 tracking-wide"
            >
              <CheckCircle className="w-5 h-5" />
              VALIDER & IMPRIMER [F12]
            </button>
            <button
              type="button"
              onClick={() => setCart([])}
              className="w-full mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors py-1 text-center"
            >
              Annuler la vente en cours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
