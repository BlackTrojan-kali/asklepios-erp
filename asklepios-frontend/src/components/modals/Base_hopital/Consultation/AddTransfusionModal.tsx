import React, { useState, useEffect } from 'react';
import { X, Droplet, Clock, Calendar } from 'lucide-react';
import useBloodBagStore from '../../../../functions/bloodBank/useBloodBagStore';
import type { BloodBagDto } from '../../../../types/BloodManageType';

interface AddTransfusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transfusion: { blood_bag_id: number; start_time: string; blood_bag: BloodBagDto }) => void;
}

export const AddTransfusionModal: React.FC<AddTransfusionModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { bloodBags, getBloodBags, loading } = useBloodBagStore();
  
  const [selectedBagId, setSelectedBagId] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // On récupère les poches avec le statut AVAILABLE uniquement
      getBloodBags(1, { status: 'AVAILABLE' });
      
      // On pré-remplit la date à "maintenant"
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setStartTime(now.toISOString().slice(0, 16));
      setSelectedBagId(0);
    }
  }, [isOpen, getBloodBags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBagId) return;

    const bag = bloodBags.find(b => b.id === selectedBagId);
    if (bag) {
      onAdd({
        blood_bag_id: selectedBagId,
        start_time: startTime,
        blood_bag: bag // On passe l'objet complet pour l'affichage visuel
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <Droplet size={20} /> Prescrire une Transfusion
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Droplet size={16} className="text-red-500" /> Poche de sang (Disponible)
            </label>
            <select 
              required
              value={selectedBagId}
              onChange={(e) => setSelectedBagId(Number(e.target.value))}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white"
            >
              <option value={0} disabled>Sélectionner une poche en stock...</option>
              {bloodBags.map(bag => (
                <option key={bag.id} value={bag.id}>
                  Groupe {bag.blood_type} - {bag.type === 'WHOLE_BLOOD' ? 'Sang Total' : bag.type === 'RED_CELLS' ? 'Glob. Rouges' : 'Plasma'} ({bag.volume_ml}ml) - {bag.barcode || `ID-${bag.id}`}
                </option>
              ))}
            </select>
            {bloodBags.length === 0 && !loading && (
              <p className="text-xs text-red-500 font-medium mt-1">Aucune poche disponible en stock actuellement.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock size={16} className="text-gray-500" /> Heure d'administration (estimée/réelle)
            </label>
            <input 
              type="datetime-local" 
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300">
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={!selectedBagId}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};