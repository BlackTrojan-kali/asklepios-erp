import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import Select from "react-select";
import {
  useCreateLabTest,
  useUpdateLabTest,
} from "../../../hooks/laboratory/useLabTest";
import { useLabCategories } from "../../../hooks/laboratory/useLabCategory";
import type { LabTestDto } from "../../../types/types";
import { Button } from "../../common/Button";

interface LabTestFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTest: LabTestDto | null;
  selectedCategoryOption: any; // Used to pre-fill the form if filtering
}

const LabTestForm: React.FC<LabTestFormProps> = ({
  isOpen,
  onClose,
  selectedTest,
  selectedCategoryOption,
}) => {
  const { data: categories = [] } = useLabCategories();
  const createMutation = useCreateLabTest();
  const updateMutation = useUpdateLabTest();

  const [formData, setFormData] = useState({
    lab_category_id: 0,
    code: "",
    name: "",
    sample_type_required: "",
    price: 0,
    is_active: true,
  });

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  useEffect(() => {
    if (selectedTest) {
      setFormData({
        lab_category_id: selectedTest.lab_category_id,
        code: selectedTest.code,
        name: selectedTest.name,
        sample_type_required: selectedTest.sample_type_required,
        price: selectedTest.price,
        is_active: selectedTest.is_active,
      });
    } else {
      setFormData({
        lab_category_id: 0,
        code: "",
        name: "",
        sample_type_required: "",
        price: 0,
        is_active: true,
      });
    }
  }, [selectedTest, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.lab_category_id || formData.lab_category_id === 0) {
      toast.error("Veuillez sélectionner une catégorie");
      return;
    }

    const payload = { ...formData, price: Number(formData.price) };

    if (selectedTest) {
      updateMutation.mutate(
        { id: selectedTest.id, payload },
        {
          onSuccess: () => {
            toast.success("Examen mis à jour avec succès");
            onClose();
          },
          onError: () => toast.error("Erreur lors de la mise à jour"),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Examen créé avec succès");
          onClose();
        },
        onError: () => toast.error("Erreur lors de la création"),
      });
    }
  };

  // React-select styles
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: "transparent",
      borderColor: "inherit",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains("dark")
        ? "#1f2937"
        : "white",
      zIndex: 9999,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "white"
        : "black",
    }),
    input: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "white"
        : "black",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#9ca3af"
        : "#6b7280",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused
        ? document.documentElement.classList.contains("dark")
          ? "#374151"
          : "#f1f5f9"
        : "transparent",
      color: document.documentElement.classList.contains("dark")
        ? "white"
        : "black",
    }),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg my-8 transform transition-all">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
          {selectedTest ? "Modifier l'examen" : "Nouvel Examen"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
              Catégorie *
            </label>
            <Select
              required
              options={categoryOptions}
              value={
                categoryOptions.find(
                  (o) => o.value === formData.lab_category_id,
                ) || null
              }
              onChange={(option: any) =>
                setFormData({
                  ...formData,
                  lab_category_id: option?.value || 0,
                })
              }
              placeholder="Sélectionner une catégorie..."
              isClearable
              styles={selectStyles}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                Code *
              </label>
              <input
                required
                className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
                Prix (FCFA) *
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
              Nom de l'examen *
            </label>
            <input
              required
              className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-gray-300">
              Type de prélèvement *
            </label>
            <input
              required
              placeholder="ex: Tube EDTA, Tube Sec..."
              className="w-full border p-2 rounded bg-slate-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#00a896] focus:border-transparent outline-none"
              value={formData.sample_type_required}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sample_type_required: e.target.value,
                })
              }
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 text-[#00a896] rounded border-gray-300 focus:ring-[#00a896]"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-slate-700 dark:text-gray-300 cursor-pointer"
            >
              Examen actif (disponible à la prescription)
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending || updateMutation.isPending}
              tooltip="Annuler les modifications"
              tooltipPosition="top"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending || updateMutation.isPending}
              tooltip="Enregistrer la fiche examen"
              tooltipPosition="top"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabTestForm;
