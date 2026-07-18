import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Stethoscope,
  Building2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import type {
  LabPersonnelDto,
  LabPersonnelPayload,
} from "../../../types/LabPersonnelTypes";
import type { LaboratoryDto } from "../../../types/types";

import { useUpdateLabPersonnel } from "../../../hooks/laboratory/useLabPersonnel";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  technician: LabPersonnelDto | null;
  laboratories: LaboratoryDto[];
}

export const UpdateLabPersonnelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  technician,
  laboratories,
}) => {
  const updateMutation = useUpdateLabPersonnel();
  const [formData, setFormData] = useState<LabPersonnelPayload>({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    laboratory_id: "",
    speciality: "",
    specifications: "",
    lab_roles: [],
  });

  useEffect(() => {
    if (technician) {
      setFormData({
        first_name: technician.user?.first_name || "",
        last_name: technician.user?.last_name || "",
        phone: technician.user?.phone || "",
        email: technician.user?.email || "",
        password: "", // Leave blank for update
        laboratory_id: technician.laboratory_id || "",
        speciality: technician.speciality || "",
        specifications: technician.specifications || "",
        lab_roles: technician.lab_roles || [],
      });
    }
  }, [technician]);

  if (!isOpen || !technician) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!technician?.id) return;

    // Ne pas envoyer le mot de passe s'il est vide
    const payload = { ...formData };
    if (!payload.password) {
      delete payload.password;
    }

    updateMutation.mutate({ id: technician.id, payload }, {
      onSuccess: () => {
        toast.success("Personnel mis à jour avec succès");
        onClose();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Une erreur est survenue");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Modifier le Profil Personnel
              </h2>
              <p className="text-sm text-gray-500">
                Mise à jour des informations du profil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations Personnelles */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User size={16} />
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                    placeholder="Nom de famille"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Connexion */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Mail size={16} />
                Contact & Connexion
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone *
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                      placeholder="Numéro de téléphone"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email (Identifiant) *
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                      placeholder="email@hopital.com"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nouveau Mot de passe (optionnel)
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="password"
                      name="password"
                      minLength={6}
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                      placeholder="Laisser vide pour ne pas modifier"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Affectation et Profil */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} />
                Affectation & Profil
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Laboratoire d'affectation *
                  </label>
                  <select
                    name="laboratory_id"
                    required
                    value={formData.laboratory_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                  >
                    <option value="">Sélectionner un laboratoire...</option>
                    {laboratories.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rôles assignés (Sélection multiple) *
                  </label>
                  <div className="space-y-3 mt-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                    {[
                      { id: "lab_receptionist", label: "Réceptionniste", desc: "Accueil, facturation, encaissement." },
                      { id: "lab_technician", label: "Technicien", desc: "Prélèvement et exécution des analyses." },
                      { id: "lab_biologist", label: "Biologiste", desc: "Validation médicale des résultats." },
                      { id: "lab_manager", label: "Manager", desc: "Configuration du catalogue et supervision." },
                    ].map((role) => (
                      <label key={role.id} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.lab_roles?.includes(role.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, lab_roles: [...(formData.lab_roles || []), role.id] });
                            } else {
                              setFormData({ ...formData, lab_roles: formData.lab_roles?.filter(r => r !== role.id) || [] });
                            }
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">{role.label}</p>
                          <p className="text-xs text-gray-500">{role.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre / Fonction affichée (Optionnel)
                  </label>
                  <div className="relative">
                    <Stethoscope
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="speciality"
                      value={formData.speciality}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                      placeholder="ex: Hématologue, Phlébotomiste..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Spécifications additionnelles
                  </label>
                  <textarea
                    name="specifications"
                    value={formData.specifications || ""}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900"
                    placeholder="Informations complémentaires, diplômes..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {updateMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Mettre à jour le personnel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
