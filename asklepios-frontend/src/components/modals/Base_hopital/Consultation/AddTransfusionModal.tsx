import React, { useState, useEffect } from 'react';
import { X, Droplet, Clock, AlertCircle } from 'lucide-react';
import useBloodBagStore from '../../../../functions/bloodBank/useBloodBagStore';
import type { BloodBagDto } from '../../../../types/BloodManageType';

interface AddTransfusionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transfusion: { blood_bag_id: number; start_time: string; blood_bag: BloodBagDto }) => void;
  patientBloodType: string; // 👉 NOUVEAU PROP POUR LA VÉRIFICATION
}

export const AddTransfusionModal: React.FC<AddTransfusionModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  patientBloodType 
}) => {
  const { bloodBags, getBloodBags, loading } = useBloodBagStore();
  
  const [selectedBagId, setSelectedBagId] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('');

  // 👉 MATRICE DE COMPATIBILITÉ UNIVERSELLE (Côté Client)
  const isBloodCompatible = (recipientType: string, donorType: string) => {
    const matrix: Record<string, string[]> = {
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'A+':  ['O-', 'O+', 'A-', 'A+'],
      'A-':  ['O-', 'A-'],
      'B+':  ['O-', 'O+', 'B-', 'B+'],
      'B-':  ['O-', 'B-'],
      'O+':  ['O-', 'O+'],
      'O-':  ['O-']
    };
    return matrix[recipientType]?.includes(donorType) ?? false;
  };

  useEffect(() => {
    if (isOpen) {
      getBloodBags(1, { status: 'AVAILABLE' });
      
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
    
    // Double vérification de sécurité au submit
    if (bag && !isBloodCompatible(patientBloodType, bag.blood_type)) {
      alert("Erreur de sécurité : Cette poche n'est pas compatible avec le patient !");
      return;
    }

    if (bag) {
      onAdd({
        blood_bag_id: selectedBagId,
        start_time: startTime,
        blood_bag: bag
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <Droplet size={20} /> Prescrire une Transfusion
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 👉 RAPPEL VISUEL DU GROUPE DU PATIENT */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-3">
            <AlertCircle size={20} className="text-blue-500" />
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              Groupe du receveur : <span className="font-bold text-red-600 dark:text-red-400 text-base ml-1">{patientBloodType}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Droplet size={16} className="text-red-500" /> Poche de sang (Compatible)
            </label>
            <select 
              required
              value={selectedBagId}
              onChange={(e) => setSelectedBagId(Number(e.target.value))}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 text-slate-700 dark:text-white transition-shadow"
            >
              <option value={0} disabled>Sélectionner une poche en stock...</option>
              {bloodBags.map(bag => {
                // 👉 ON CALCULE LA COMPATIBILITÉ POUR CHAQUE POCHE
                const compatible = isBloodCompatible(patientBloodType, bag.blood_type);
                
                return (
                  <option 
                    key={bag.id} 
                    value={bag.id} 
                    disabled={!compatible} // 🚫 DÉSACTIVE LES POCHES INCOMPATIBLES
                    className={!compatible ? 'text-gray-400 bg-gray-100 dark:bg-gray-800' : 'text-gray-900 dark:text-white'}
                  >
                    Gr. {bag.blood_type} - {bag.type === 'WHOLE_BLOOD' ? 'Sang Total' : bag.type === 'RED_CELLS' ? 'Glob. Rouges' : 'Plasma'} ({bag.volume_ml}ml)
                    {!compatible ? ' ❌ (Incompatible)' : ' ✅'}
                  </option>
                )
              })}
            </select>
            {bloodBags.length === 0 && !loading && (
              <p className="text-xs text-red-500 font-medium mt-1">Aucune poche disponible en stock actuellement.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Clock size={16} className="text-gray-500" /> Heure d'administration (estimée)
            </label>
            <input 
              type="datetime-local" 
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 text-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark] transition-shadow"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={!selectedBagId}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};