import React from "react";
import { X, Printer } from "lucide-react";
import { type PosSaleDto } from "../../../../services/pharmacy/posSaleService";

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: PosSaleDto | null;
  currency: string;
  onReprint: (saleId: number) => void;
}

export default function SaleDetailModal({
  isOpen,
  onClose,
  sale,
  currency,
  onReprint,
}: SaleDetailModalProps) {
  if (!isOpen || !sale) return null;

  const saleDate = sale.created_at ? new Date(sale.created_at) : new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 text-slate-800 dark:text-gray-200">
        <div className="p-5 border-b border-slate-100 dark:border-gray-750 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900/10">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Détails Vente - {sale.receipt_number}
            </h3>
            <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">
              Effectuée le {saleDate.toLocaleString("fr-FR")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-gray-250 p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                Client
              </span>
              <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                {sale.customer_name || "Anonyme"}
                {sale.patient && (
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-mono block mt-0.5">
                    Code : {sale.patient.patient_code}
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                Méthode Paiement
              </span>
              <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                {sale.payment_method === "CASH"
                  ? "Espèces"
                  : sale.payment_method === "MOBILE_MONEY"
                    ? "Momo/OM"
                    : "Carte"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block">
                Réf Ordonnance
              </span>
              <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                {sale.prescription_ref || "Aucune"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-2">
              Produits vendus
            </span>
            <div className="border border-slate-150 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-gray-900 text-slate-400 dark:text-gray-450 uppercase font-bold tracking-wider border-b border-slate-150 dark:border-gray-700">
                  <tr>
                    <th className="p-3">Article</th>
                    <th className="p-3 text-center">Qté</th>
                    <th className="p-3 text-right">Prix Unit. (XAF)</th>
                    <th className="p-3 text-right">Remise</th>
                    <th className="p-3 text-right">Total (XAF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-slate-700 dark:text-gray-300">
                  {sale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        {item.article?.name}
                        {item.batch?.batch_number && (
                          <span className="block text-[9px] text-slate-400 dark:text-gray-500 font-normal mt-0.5">
                            Lot : {item.batch.batch_number}{" "}
                            {item.batch.expire_date
                              ? `(Exp: ${new Date(item.batch.expire_date).toLocaleDateString("fr-FR")})`
                              : ""}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold">{item.qty}</td>
                      <td className="p-3 text-right font-mono">
                        {item.unit_price.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-500">
                        {item.discount > 0 ? `-${item.discount}%` : "0%"}
                      </td>
                      <td className="p-3 text-right font-bold font-mono text-slate-900 dark:text-white">
                        {item.sub_total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 dark:bg-gray-900 border-t border-slate-150 dark:border-gray-700 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-450 dark:text-gray-500 font-bold uppercase tracking-wider block">
              Montant total
            </span>
            <strong className="text-xl font-mono text-emerald-600 dark:text-emerald-450 font-black">
              {sale.total_amount.toLocaleString()} {currency}
            </strong>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onReprint(sale.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Réimprimer Facture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
