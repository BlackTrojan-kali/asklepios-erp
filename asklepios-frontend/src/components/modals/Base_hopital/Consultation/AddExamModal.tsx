import React, { useState, useEffect, useMemo } from "react";
import { X, TestTube, PlusCircle } from "lucide-react";
import Select from "react-select";
import type { ExamRequestLinePayload } from "../../../../types/ConsultationTypes";

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (exam: ExamRequestLinePayload) => void;
  labTests?: any[];
}

export const AddExamModal: React.FC<AddExamModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  labTests = [],
}) => {
  const [examName, setExamName] = useState("");
  const [sendToInternalLab, setSendToInternalLab] = useState(false);
  const [labTestId, setLabTestId] = useState<number | "">("");

  useEffect(() => {
    if (isOpen) {
      setExamName("");
      setSendToInternalLab(true);
      setLabTestId("");
    }
  }, [isOpen]);

  const examOptions = useMemo(() => {
    return labTests.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.code || ""})`.trim(),
    }));
  }, [labTests]);

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

  const handleSubmit = () => {
    if (sendToInternalLab) {
      if (!labTestId) return;
      const selectedTest = labTests.find((t) => t.id === Number(labTestId));
      if (!selectedTest) return;
      onAdd({
        exam_name: selectedTest.name,
        send_to_internal_lab: true,
        lab_test_id: Number(labTestId),
      });
    } else {
      if (!examName.trim()) return;
      onAdd({ exam_name: examName.trim(), send_to_internal_lab: false });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 text-[#003366] dark:text-blue-400">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <TestTube size={20} />
            </div>
            <h2 className="text-lg font-bold font-brand">
              Prescrire un examen
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          {/* OPTIONS DE LABORATOIRE */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={sendToInternalLab}
                onChange={(e) => setSendToInternalLab(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00a896]/30 dark:peer-focus:ring-[#00a896]/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#00a896]"></div>
            </label>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Examen intégrer au laboratoire de l'hôpital
            </span>
          </div>

          {sendToInternalLab ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Sélectionner un examen de laboratoire{" "}
                <span className="text-red-500">*</span>
              </label>
              <Select
                options={examOptions}
                value={
                  examOptions.find((opt) => opt.value === labTestId) || null
                }
                onChange={(selected) =>
                  setLabTestId(selected ? selected.value : "")
                }
                placeholder="Rechercher un examen (ex: NFS, Glycémie...)"
                isClearable
                isSearchable
                styles={selectStyles}
                className="text-sm"
                noOptionsMessage={() => "Aucun examen trouvé"}
              />
              <p className="text-xs text-gray-500 mt-2">
                Cette demande sera automatiquement transmise au laboratoire de
                l'hôpital une fois la consultation validée.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 font-lato">
                Nom de l'examen prescrit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="Ex: Numération Formule Sanguine (NFS), Échographie..."
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#00a896] outline-none dark:text-white"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Le patient devra présenter l'ordonnance imprimée à un
                laboratoire externe.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 rounded-b-2xl bg-white dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={sendToInternalLab ? !labTestId : !examName.trim()}
            className="px-6 py-2 bg-[#00a896] hover:bg-[#008f7f] text-white rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <PlusCircle size={18} /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
};
