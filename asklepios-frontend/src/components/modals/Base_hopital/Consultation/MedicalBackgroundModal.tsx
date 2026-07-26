import React, { useState, useEffect, useMemo } from "react";
import { X, Activity, Save, Loader2, Droplet } from "lucide-react";
import Select from "react-select";
import useMedicalBgStore from "../../../../functions/base_hospital/useMedicalBgStore";
import type {
  MedicalBackgroundDto,
  MedicalBackgroundPayload,
  BloodType,
} from "../../../../types/medicalBGTypes";

interface MedicalBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  existingData?: MedicalBackgroundDto | null;
  AutoRefreshPage: () => void;
}

export const MedicalBackgroundModal: React.FC<MedicalBackgroundModalProps> = ({
  isOpen,
  onClose,
  patientId,
  existingData,
  AutoRefreshPage,
}) => {
  const { createMedicalBackground, updateMedicalBackground, actionLoading } = useMedicalBgStore();

  const [bloodType, setBloodType] = useState<BloodType>("UNKNOWN");
  const [allergies, setAllergies] = useState("");
  const [chronicDiseases, setChronicDiseases] = useState("");
  const [surgicalHistory, setSurgicalHistory] = useState("");
  const [currentTreatments, setCurrentTreatments] = useState("");
  const [immunizations, setImmunizations] = useState("");
  
  // Champs de type String (Textarea)
  const [familyHistory, setFamilyHistory] = useState("");
  const [lifestyleHabits, setLifestyleHabits] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");

  useEffect(() => {
    if (existingData) {
      setBloodType(existingData.blood_type || "UNKNOWN");
      
      // Champs de type Array (Tableaux)
      setAllergies(existingData.allergies?.join(", ") || "");
      setChronicDiseases(existingData.chronic_diseases?.join(", ") || "");
      setSurgicalHistory(existingData.surgical_history?.join(", ") || "");
      setCurrentTreatments(existingData.current_treatments?.join(", ") || "");
      
      // Sécurité pour le typage dynamique
      const data: any = existingData;
      setImmunizations(data.immunizations?.join(", ") || "");
      
      // 👉 CORRECTION ICI : Ce sont de simples chaînes de caractères (Strings), pas des tableaux
      setFamilyHistory(data.family_history || "");
      setLifestyleHabits(data.lifestyle_habits || "");
      setGeneralNotes(data.general_notes || "");
      
    } else {
      setBloodType("UNKNOWN");
      setAllergies("");
      setChronicDiseases("");
      setSurgicalHistory("");
      setCurrentTreatments("");
      setImmunizations("");
      setFamilyHistory("");
      setLifestyleHabits("");
      setGeneralNotes("");
    }
  }, [existingData, isOpen]);

  const bloodTypeOptions = useMemo(
    () => [
      { value: "UNKNOWN", label: "Inconnu" },
      { value: "A+", label: "A+" },
      { value: "A-", label: "A-" },
      { value: "B+", label: "B+" },
      { value: "B-", label: "B-" },
      { value: "AB+", label: "AB+" },
      { value: "AB-", label: "AB-" },
      { value: "O+", label: "O+" },
      { value: "O-", label: "O-" },
    ],
    []
  );

  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#1f2937"
        : "#ffffff",
      borderColor: state.isFocused
        ? "#00a896"
        : document.documentElement.classList.contains("dark")
          ? "#374151"
          : "#d1d5db",
      borderRadius: "0.5rem",
      padding: "2px",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(0, 168, 150, 0.2)" : "none",
      "&:hover": { borderColor: "#00a896" },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#1f2937"
        : "#ffffff",
      borderRadius: "0.5rem",
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#00a896"
        : state.isFocused
          ? document.documentElement.classList.contains("dark")
            ? "#374151"
            : "#f3f4f6"
          : "transparent",
      color: state.isSelected
        ? "#ffffff"
        : document.documentElement.classList.contains("dark")
          ? "#f3f4f6"
          : "#1f2937",
      cursor: "pointer",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#f3f4f6"
        : "#1f2937",
    }),
    input: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#f3f4f6"
        : "#1f2937",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "#9ca3af",
    }),
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Si votre interface (DTO) exige que family_history et lifestyle_habits soient des tableaux,
    // il faudra corriger le type dans votre fichier medicalBGTypes.ts pour accepter des `string`.
    const payload: any = {
      blood_type: bloodType,
      
      // Ces champs sont des tableaux
      allergies: allergies.split(",").map((s) => s.trim()).filter(Boolean),
      chronic_diseases: chronicDiseases.split(",").map((s) => s.trim()).filter(Boolean),
      surgical_history: surgicalHistory.split(",").map((s) => s.trim()).filter(Boolean),
      current_treatments: currentTreatments.split(",").map((s) => s.trim()).filter(Boolean),
      immunizations: immunizations.split(",").map((s) => s.trim()).filter(Boolean),
      
      // 👉 CORRECTION ICI : On envoie ces champs comme de simples chaînes de caractères (Strings)
      family_history: familyHistory.trim(),
      lifestyle_habits: lifestyleHabits.trim(),
      general_notes: generalNotes.trim(),
    };

    const result = existingData
      ? await updateMedicalBackground(patientId, payload)
      : await createMedicalBackground(patientId, payload);

    if (result) {
      AutoRefreshPage();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
            <div className="p-2 bg-[#00a896]/10 text-[#00a896] rounded-lg">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-brand">
                Antécédents Médicaux du Patient
              </h2>
              <p className="text-xs text-gray-500">
                Renseignez le profil biologique, les allergies et les habitudes du patient.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          
          {/* Groupe Sanguin */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 font-lato">
              <Droplet size={16} className="text-red-500" /> Groupe Sanguin
            </label>
            <div className="w-full md:w-1/2">
              <Select
                options={bloodTypeOptions}
                value={
                  bloodTypeOptions.find((opt) => opt.value === bloodType) ||
                  bloodTypeOptions[0]
                }
                onChange={(selected) =>
                  setBloodType((selected?.value || "UNKNOWN") as BloodType)
                }
                isSearchable
                styles={selectStyles}
                className="text-sm"
              />
            </div>
          </div>

          {/* Grille des Listes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Allergies
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Ex: Pénicilline, Pollen, Arachides"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Maladies Chroniques
              </label>
              <input
                type="text"
                value={chronicDiseases}
                onChange={(e) => setChronicDiseases(e.target.value)}
                placeholder="Ex: Diabète type 2, Hypertension"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Antécédents Chirurgicaux
              </label>
              <input
                type="text"
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                placeholder="Ex: Appendicectomie (2015), Césarienne (2020)"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Traitements en cours
              </label>
              <input
                type="text"
                value={currentTreatments}
                onChange={(e) => setCurrentTreatments(e.target.value)}
                placeholder="Ex: Metformine 500mg, Lisinopril 10mg"
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
              Vaccinations
            </label>
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
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Antécédents Familiaux
              </label>
              <textarea
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Habitudes de vie (Tabac, Alcool...)
              </label>
              <textarea
                value={lifestyleHabits}
                onChange={(e) => setLifestyleHabits(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none resize-none dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
              Notes Générales
            </label>
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
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-[#faf8f1] dark:bg-gray-900 shrink-0">
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
              <>
                <Loader2 size={18} className="animate-spin" /> Sauvegarde...
              </>
            ) : (
              <>
                <Save size={18} />{" "}
                {existingData ? "Mettre à jour" : "Enregistrer"}
              </>
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
};