import React, { useState, useEffect } from 'react';
import { X, Activity, Save, Loader2, Droplet } from 'lucide-react';
import useMedicalBgStore from '../../../../functions/base_hospital/useMedicalBgStore'; // Ajuste le chemin
import type { MedicalBackgroundDto, MedicalBackgroundPayload, BloodType } from '../../../../types/medicalBGTypes';

interface MedicalBackgroundModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: number;
    existingData?: MedicalBackgroundDto | null;
}

export const MedicalBackgroundModal: React.FC<MedicalBackgroundModalProps> = ({
    isOpen,
    onClose,
    patientId,
    existingData
}) => {
    const { createMedicalBackground, updateMedicalBackground, actionLoading } = useMedicalBgStore();

    // --- ÉTATS DU FORMULAIRE ---
    const [bloodType, setBloodType] = useState<BloodType>('UNKNOWN');
    
    // Les champs tableaux sont gérés comme des chaînes séparées par des virgules dans l'UI
    const [allergies, setAllergies] = useState('');
    const [chronicConditions, setChronicConditions] = useState('');
    const [pastSurgeries, setPastSurgeries] = useState('');
    const [currentMedications, setCurrentMedications] = useState('');
    const [immunizations, setImmunizations] = useState('');
    
    // Champs textes libres
    const [familyHistory, setFamilyHistory] = useState('');
    const [lifestyleHabits, setLifestyleHabits] = useState('');
    const [generalNotes, setGeneralNotes] = useState('');

    // --- INITIALISATION ---
    useEffect(() => {
        if (isOpen) {
            if (existingData) {
                // Mode Édition
                setBloodType(existingData.blood_type || 'UNKNOWN');
                setAllergies(existingData.allergies?.join(', ') || '');
                setChronicConditions(existingData.chronic_conditions?.join(', ') || '');
                setPastSurgeries(existingData.past_surgeries?.join(', ') || '');
                setCurrentMedications(existingData.current_medications?.join(', ') || '');
                setImmunizations(existingData.immunizations?.join(', ') || '');
                setFamilyHistory(existingData.family_history || '');
                setLifestyleHabits(existingData.lifestyle_habits || '');
                setGeneralNotes(existingData.general_notes || '');
            } else {
                // Mode Création (Reset)
                setBloodType('UNKNOWN');
                setAllergies('');
                setChronicConditions('');
                setPastSurgeries('');
                setCurrentMedications('');
                setImmunizations('');
                setFamilyHistory('');
                setLifestyleHabits('');
                setGeneralNotes('');
            }
        }
    }, [isOpen, existingData]);

    if (!isOpen) return null;

    // --- UTILITAIRE : Convertir string -> array ---
    const parseStringToArray = (str: string): string[] | null => {
        if (!str.trim()) return null;
        return str.split(',').map(item => item.trim()).filter(item => item.length > 0);
    };

    // --- SOUMISSION ---
    const handleSubmit = async () => {
        if (!patientId) return;

        const payload: MedicalBackgroundPayload = {
            blood_type: bloodType,
            allergies: parseStringToArray(allergies),
            chronic_conditions: parseStringToArray(chronicConditions),
            past_surgeries: parseStringToArray(pastSurgeries),
            current_medications: parseStringToArray(currentMedications),
            immunizations: parseStringToArray(immunizations),
            family_history: familyHistory || null,
            lifestyle_habits: lifestyleHabits || null,
            general_notes: generalNotes || null,
        };

        let success = false;

        if (existingData) {
            success = !!(await updateMedicalBackground(patientId, payload));
        } else {
            success = !!(await createMedicalBackground(patientId, payload));
        }

        if (success) {
            onClose();
        }
    };

    return (
        // z-[60] permet la superposition sur une modale standard z-50
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 my-8">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-[#faf8f1] dark:bg-gray-900 rounded-t-2xl z-10">
                    <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
                        <Activity size={24} />
                        <div>
                            <h2 className="text-xl font-bold font-brand">
                                {existingData ? 'Mettre à jour les antécédents' : 'Créer le dossier médical'}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Séparez les éléments par des virgules (ex: Pénicilline, Arachides)
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-6">
                    
                    {/* Groupe Sanguin */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-lato">
                            <Droplet size={16} className="text-red-500" /> Groupe Sanguin
                        </label>
                        <select 
                            value={bloodType} 
                            onChange={(e) => setBloodType(e.target.value as BloodType)}
                            className="w-full md:w-1/3 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                        >
                            <option value="UNKNOWN">Inconnu</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>

                    {/* Grille des Listes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Allergies</label>
                            <input 
                                type="text" 
                                value={allergies} 
                                onChange={(e) => setAllergies(e.target.value)}
                                placeholder="Ex: Pénicilline, Pollen, Arachides"
                                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Maladies Chroniques</label>
                            <input 
                                type="text" 
                                value={chronicConditions} 
                                onChange={(e) => setChronicConditions(e.target.value)}
                                placeholder="Ex: Diabète type 2, Hypertension"
                                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Antécédents Chirurgicaux</label>
                            <input 
                                type="text" 
                                value={pastSurgeries} 
                                onChange={(e) => setPastSurgeries(e.target.value)}
                                placeholder="Ex: Appendicectomie (2015), Césarienne (2020)"
                                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Traitements en cours</label>
                            <input 
                                type="text" 
                                value={currentMedications} 
                                onChange={(e) => setCurrentMedications(e.target.value)}
                                placeholder="Ex: Metformine 500mg, Lisinopril 10mg"
                                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Vaccinations</label>
                        <input 
                            type="text" 
                            value={immunizations} 
                            onChange={(e) => setImmunizations(e.target.value)}
                            placeholder="Ex: Fièvre Jaune, Tétanos, Covid-19"
                            className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                        />
                    </div>

                    {/* Grille Textes Longs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Antécédents Familiaux</label>
                            <textarea 
                                value={familyHistory} 
                                onChange={(e) => setFamilyHistory(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Habitudes de vie (Tabac, Alcool...)</label>
                            <textarea 
                                value={lifestyleHabits} 
                                onChange={(e) => setLifestyleHabits(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">Notes Générales</label>
                        <textarea 
                            value={generalNotes} 
                            onChange={(e) => setGeneralNotes(e.target.value)}
                            rows={3}
                            placeholder="Observations complémentaires..."
                            className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 sticky bottom-0 bg-[#faf8f1] dark:bg-gray-900 rounded-b-2xl z-10">
                    <button 
                        onClick={onClose} 
                        disabled={actionLoading}
                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={actionLoading}
                        className="px-6 py-2.5 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                    >
                        {actionLoading ? (
                            <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</>
                        ) : (
                            <><Save size={18} /> {existingData ? 'Mettre à jour' : 'Enregistrer'}</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};