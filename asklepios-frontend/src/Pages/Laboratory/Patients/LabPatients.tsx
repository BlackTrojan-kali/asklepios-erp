import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Search,
  User,
  Activity,
  FileText,
  FileDown,
  Fingerprint,
  Phone,
  Calendar,
  CreditCard,
} from "lucide-react";
import usePatientStore from "../../../functions/base_hospital/usePatientStore";
import useMedicalBgStore from "../../../functions/base_hospital/useMedicalBgStore";
import { PatientGender } from "../../../types/PatientTypes";
import type { PatientDto } from "../../../types/PatientTypes";
import { CreatePatientModal } from "../../../components/modals/Base_hopital/Patient/CreatePatientModal";
import { CreateLabRequestModal } from "../../../components/modals/Laboratory/Comptoir/CreateLabRequestModal";
import { CreatePaymentModal } from "../../../components/modals/Base_hopital/Finance/CreatePaymentModal";
import { useLabRequests } from "../../../hooks/laboratory/useLabRequest";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";

const LabPatients = () => {
  const { patients, loading, getPatients } = usePatientStore();
  const { downloadMedicalRecord } = useMedicalBgStore();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedPatientForRequest, setSelectedPatientForRequest] =
    useState<PatientDto | null>(null);

  const { data: pendingRequests } = useLabRequests('PENDING_PAYMENT');
  const queryClient = useQueryClient();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Résolution du lab_role depuis le profil connecté
  const rawLabRoles = (profile as any)?.profile_lab?.lab_roles;
  const userLabRoles: string[] = Array.isArray(rawLabRoles)
    ? rawLabRoles
    : typeof rawLabRoles === "string"
      ? (() => { try { return JSON.parse(rawLabRoles); } catch { return []; } })()
      : [];
  const isLabReceptionist = userLabRoles.includes("lab_receptionist");

  const handlePay = (req: any) => {
    setSelectedInvoice(req.invoice);
    setIsPaymentModalOpen(true);
  };

  useEffect(() => {
    getPatients(1, { search: searchTerm }, 50);
  }, [searchTerm, getPatients]);

  const handleCreateRequest = (patient?: PatientDto) => {
    setSelectedPatientForRequest(patient || null);
    setIsCreateRequestOpen(true);
  };

  const handleDownloadRecord = async (patientId: number) => {
    toast.promise(downloadMedicalRecord(patientId, "download"), {
      loading: "Génération du carnet médical...",
      success: "Téléchargement démarré !",
      error: "Erreur lors du téléchargement.",
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR");
  };

  const getGenderLabel = (gender: PatientGender) => {
    switch (gender) {
      case PatientGender.MALE:
        return "Homme";
      case PatientGender.FEMALE:
        return "Femme";
      case PatientGender.OTHER:
        return "Autre";
      default:
        return "Non spécifié";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Dossiers Patients
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gérez les patients et créez des demandes d'examens (Comptoir Labo)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsCreatePatientOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <User className="w-5 h-5" />
            Nouveau Patient
          </button>
          <button
            onClick={() => handleCreateRequest()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Activity className="w-5 h-5" />
            Nouvel Examen
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Rechercher un patient (nom, code, téléphone)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date de Naissance
                </th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Aucun patient trouvé.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50 font-mono text-xs font-bold tracking-wide">
                        <Fingerprint size={14} />
                        {patient.patient_code}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-gray-200 uppercase">
                        {patient.first_name}{" "}
                        <span className="font-medium text-slate-600 dark:text-gray-400">
                          {patient.last_name}
                        </span>
                      </div>
                      {patient.gender && (
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {getGenderLabel(patient.gender)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        {patient.contact_phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-gray-300">
                        <Calendar
                          size={14}
                          className="text-gray-400 shrink-0"
                        />
                        <span>{formatDate(patient.bith_date)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {(() => {
                          // La réceptionniste labo ne gère pas la facturation
                          if (isLabReceptionist) return null;
                          const pendingReq = pendingRequests?.find(req => req.patient_id === patient.id);
                          return pendingReq ? (
                            <button
                              onClick={() => handlePay(pendingReq)}
                              title="Encaisser l'examen"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                            >
                              <CreditCard className="w-4 h-4" />
                              Encaisser
                            </button>
                          ) : null;
                        })()}

                        {/* 👉 BOUTON TÉLÉCHARGER LE CARNET MÉDICAL */}
                        <button
                          onClick={() => handleDownloadRecord(patient.id)}
                          title="Télécharger le carnet médical"
                          className="p-2 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
                        >
                          <FileDown size={16} />
                        </button>

                        <button
                          onClick={() => handleCreateRequest(patient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          Demande
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePatientModal
        isOpen={isCreatePatientOpen}
        onClose={() => setIsCreatePatientOpen(false)}
        AutoRefreshPage={() => getPatients(1, {}, 50)}
      />

      {isCreateRequestOpen && (
        <CreateLabRequestModal
          isOpen={isCreateRequestOpen}
          onClose={() => {
            setIsCreateRequestOpen(false);
            setSelectedPatientForRequest(null);
          }}
          preselectedPatient={selectedPatientForRequest}
        />
      )}

      {isPaymentModalOpen && selectedInvoice && (
        <CreatePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
            queryClient.invalidateQueries({ queryKey: ['labRequests'] });
          }}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};

export default LabPatients;
