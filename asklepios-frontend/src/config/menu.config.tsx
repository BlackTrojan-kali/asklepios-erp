import React from "react";
import {
  Globe,
  Hospital,
  Shield,
  NotebookText,
  Settings,
  HospitalIcon,
  Tags,
  Layers,
  ListOrdered,
  Truck,
  Wallet,
  ShoppingCart,
  Activity,
  Users,
  Computer,
  Calendar,
  BriefcaseMedical,
  Building2,
  BedDouble,
  Coins,
  Microscope,
  TestTubes,
  Database,
  Star,
  ShieldPlus,
  PieChart // 👉 NOUVEAU: Icône pour la BI
} from "lucide-react";

export type MenuItemType = {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  roles?: string[];
  positions?: ("magasin" | "vente")[];
  labRoles?: string[];
  requiredLicence?: string;
  excludedLicence?: string;
  subItems?: MenuItemType[];
};

export const MENU_CONFIG: MenuItemType[] = [
  // ==========================================
  // A. MENUS SUPER ADMIN (Gestion SaaS globale)
  // ==========================================
  {
    title: "Pays",
    icon: <Globe size={20} />,
    path: "/countries",
    roles: ["super_admin"],
  },
  {
    title: "Hôpitaux",
    icon: <Hospital size={20} />,
    path: "/hospitals",
    roles: ["super_admin"],
  },
  {
    title: "Administrateurs",
    icon: <Shield size={20} />,
    path: "/admins",
    roles: ["super_admin","admin"],
    globalAdminOnly: true, // 👉 NOUVEAU: Seuls les super_admin et admin globaux le verront
  },
  {
    title: "Ceos",
    icon: <Star size={20} />,
    path: "/ceos",
    roles: ["super_admin"],
  },
  {
    title: "Abonnements",
    icon: <NotebookText size={20} />,
    roles: ["super_admin"],
    subItems: [
      { title: "Licences", path: "/licences" },
      { title: "Souscriptions", path: "/subscriptions" },
    ],
  },
  {
    title: "Paramètres",
    icon: <Settings size={20} />,
    path: "/settings",
    roles: ["super_admin"],
  },

  // ==========================================
  // 👉 NOUVEAU : I. ESPACE DIRECTION (BI)
  // ==========================================
  {
    title: "(BI) Pharmacies",
    icon: <PieChart size={20} />,
    roles: ["ceo"], // Accessible au CEO et à l'Admin
    requiredLicence: "pharmacy", // Ou "base_hospital" si vous avez d'autres dashboards
    subItems: [
      { title: "Rapport Financier Pharmacie", path: "/bi/finance" },
      { title: "Rapport Pharmacie Stock", path: "/bi/stock" },
      // Vous pourrez ajouter d'autres dashboards ici (Ex: /bi/hospital-dashboard)
    ],
  },
{
    title: "(BI) Hopital",
    icon: <PieChart size={20} />,
    roles: ["ceo"], // Accessible au CEO et à l'Admin
    requiredLicence: "base_hospital", // Ou "base_hospital" si vous avez d'autres dashboards
    subItems: [
      { title: "Activité Hôpital", path: "/bi/hospital" },
      { title: "Finance Hôpital", path: "/bi/hospital-finance" }, // 👉 NOUVEAU MENU
      // Vous pourrez ajouter d'autres dashboards ici (Ex: /bi/hospital-dashboard)
    ],
  },{
    title: "(BI) Laboratoires",
    icon: <PieChart size={20} />,
    roles: ["ceo"], // Accessible au CEO et à l'Admin
    requiredLicence: "laboratory", // Ou "base_hospital" si vous avez d'autres dashboards
    subItems: [
   { title: "Activité Laboratoire", path: "/bi/laboratory" }, // 👉 NOUVEAU MENU 
   ],
  },
  // ==========================================
  // B. MENUS ADMIN (Base Hôpital & RH)
  // ==========================================
  {
    title: "Infrastructure",
    icon: <Building2 size={20} />,
    roles: ["admin"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Centres", path: "/admin/centers", },
      { title: "Départements", path: "/admin/departments" },
      { title: "Catégories Chambres", path: "/admin/room_categories" },
    ],
  },
  {
    title: "Assurances",
    icon: <ShieldPlus size={20} />,
    roles: ["admin"],
    subItems: [
      { title: "Assurances", path: "/admin/insurances" },
      { title: "Demande de Paiement", path: "/admin/guarantor_claims" },
    ],
  },
  {
    title: "Équipe Médicale",
    icon: <BriefcaseMedical size={20} />,
    roles: ["admin"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Docteurs", path: "/admin/doctors" },
      { title: "Réceptionnistes", path: "/admin/receptionists" },
    ],
  },

  // ==========================================
  // C. MENUS ADMIN (Supervision Pharmacie)
  // ==========================================
  {
    title: "Réseau Pharmacies",
    icon: <HospitalIcon size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Succursales", path: "/admin/pharmacies" },
      { title: "Pharmaciens", path: "/admin/pharmaciens" },
    ],
  },
  {
    title: "Catalogue Médicaments",
    icon: <Tags size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Catégories", path: "/admin/pharmacy/acticles-categories" },
      { title: "Articles", path: "/admin/pharmacy/articles" },
      { title: "Lots", path: "/admin/pharmacy/batch" },
      { title: "Grille Tarifaire", path: "/admin/pharmacy/articles/pricing" },
    ],
  },
  {
    title: "Supervision Stocks",
    icon: <Layers size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "État des stocks", path: "/admin/pharmacy/stocks" },
      { title: "Mouvements", path: "/admin/movements" },
      { title: "Inventaires", path: "/admin/inventory" },
    ],
  },
  {
    title: "Achats & Fournisseurs",
    icon: <ListOrdered size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Fournisseurs", path: "/admin/pharmacy/providers" },
      { title: "Bons de Commande", path: "/admin/orders" },
      { title: "Retours", path: "/admin/returns" },
    ],
  },
  {
    title: "Flotte & Logistique",
    icon: <Truck size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Véhicules", path: "/admin/vehicules" },
      { title: "Chauffeurs", path: "/admin/drivers" },
      { title: "Transferts inter-sites", path: "/admin/transfers" },
    ],
  },
  {
    title: "Finances & Caisses",
    icon: <Wallet size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Comptes de Trésorerie", path: "/admin/pharmacy/accounts" },
      { title: "Caisses Enregistreuses", path: "/admin/pharmacy/cash-register" },
      { title: "Mouvements Trésorerie", path: "/admin/pharmacy/treasury-transactions" },
      { title: "Versements en attente", path: "/admin/pharmacy/versements" },
    ],
  },
  {
    title: "Rapports Ventes",
    icon: <Activity size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Historiques des ventes", path: "/admin/pharmacy/pos-sales-history" },
      { title: "Historique des sessions", path: "/admin/pharmacy/pos-sessions-history" },
    ],
  },

  // ==========================================
  // D. MENUS PHARMACIEN (Opérations Magasin)
  // ==========================================
  {
    title: "Mon Stock",
    icon: <Layers size={20} />,
    roles: ["pharmacy"],
    positions: ["magasin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "État des stocks", path: "/pharmacy" },
      { title: "Mouvements", path: "/pharmacy/movements" },
      { title: "Emplacements", path: "/pharmacy/storage_location" },
      { title: "Inventaires", path: "/pharmacy/inventory" },
    ],
  },
  {
    title: "Commandes",
    icon: <ListOrdered size={20} />,
    roles: ["pharmacy"],
    positions: ["magasin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Bons de commande", path: "/pharmacy/orders" },
      { title: "Retours", path: "/pharmacy/returns" },
    ],
  },
  {
    title: "Logistique (Transferts)",
    icon: <Truck size={20} />,
    roles: ["pharmacy"],
    positions: ["magasin"],
    requiredLicence: "pharmacy",
    path: "/pharmacy/stock_transfers",
  },

  // ==========================================
  // E. MENUS PHARMACIEN (Opérations Caisse/Vente)
  // ==========================================
  {
    title: "Point de Vente",
    icon: <ShoppingCart size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    path: "/pharmacy/cash",
  },
  {
    title: "Session de Caisse",
    icon: <Wallet size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Ouvrir la caisse", path: "/pharmacy/cash/session/open" },
      { title: "Clôturer la caisse", path: "/pharmacy/cash/session/close" },
    ],
  },
  {
    title: "Suivi & Historiques",
    icon: <Activity size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Historique des Ventes", path: "/pharmacy/cash/sales-history" },
      { title: "Historique des Sessions", path: "/pharmacy/cash/session/history" },
      { title: "Mouvements de Caisse", path: "/pharmacy/cash/movements-history" },
    ],
  },

  // ==========================================
  // F. MENUS RÉCEPTIONNISTE / ACCUEIL
  // ==========================================
  {
    title: "Accueil & Patients",
    icon: <Users size={20} />,
    roles: ["reception", "admin"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Dossiers Patients", path: "/reception/patients" },
      { title: "Gestion des RDV", path: "/reception/rdv" },
      { title: "Historique des RDV", path: "/historique_rdv" },
    ],
  },
  {
    title: "Facturation et Paiement",
    icon: <Coins size={20} />,
    roles: ["reception", "admin"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Gestion Factures", path: "/reception/facturation" },
      { title: "Paiements", path: "/reception/payments" },
    ],
  },

  // ==========================================
  // G. MENUS DOCTEUR
  // ==========================================
  {
    title: "Tableau de bord",
    icon: <Computer size={20} />,
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    path: "/doctor/home",
  },
  {
    title: "Mon Planning",
    icon: <Calendar size={20} />,
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Agenda des RDV", path: "/doctor/appointments/calendar" },
      { title: "Historique des RDV", path: "/historique_rdv" },
    ],
  },
  {
    title: "Mon Service",
    icon: <BedDouble size={20} />,
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Chambres & Lits", path: "/doctor/wards" },
      { title: "Actes Médicaux", path: "/doctor/medical_act" },
    ],
  },

  // ==========================================
  // H. MENUS LABORATOIRE (SIL)
  // ==========================================
  {
    title: "Laboratoires",
    icon: <Database size={20} />,
    roles: ["admin"],
    requiredLicence: "laboratory",
    subItems: [
      { title: "Laboratoires", path: "/admin/laboratories" },
      { title: "Personnels de Laboratoire", path: "/admin/lab-personnel" },
    ],
  },
  {
    title: "Mon Équipe",
    icon: <Users size={20} />,
    roles: ["laboratory"],
    requiredLicence: "laboratory",
    labRoles: ["lab_manager"],
    path: "/laboratory/personnel",
  },
  {
    title: "Comptoir Labo",
    icon: <Users size={20} />,
    roles: ["admin", "laboratory"],
    requiredLicence: "laboratory",
    labRoles: ["lab_receptionist", "lab_manager"],
    subItems: [
      { title: "Dossiers Patients", path: "/laboratory/patients" },
      { title: "Facturation", path: "/laboratory/invoices" },
      { title: "Registre de Caisse", path: "/laboratory/payments" },
    ],
  },
  {
    title: "Configuration Labo",
    icon: <Database size={20} />,
    roles: ["admin", "laboratory"],
    requiredLicence: "laboratory",
    labRoles: ["lab_manager", "lab_biologist"],
    subItems: [
      { title: "Catégories", path: "/laboratory/catalogue/categories" },
      { title: "Examens & Paramètres", path: "/laboratory/catalogue/tests" },
    ],
  },
  {
    title: "Prélèvements",
    icon: <TestTubes size={20} />,
    roles: ["laboratory"],
    requiredLicence: "laboratory",
    labRoles: ["lab_manager", "lab_technician", "lab_biologist"],
    path: "/laboratory/sampling",
  },
  {
    title: "Analyses & Résultats",
    icon: <Microscope size={20} />,
    roles: ["laboratory"],
    requiredLicence: "laboratory",
    labRoles: ["lab_manager", "lab_technician", "lab_biologist"],
    subItems: [
      { title: "Saisie des Résultats", path: "/laboratory/results" },
      { title: "Validation Biologiste", path: "/laboratory/validation" },
      { title: "Archives", path: "/laboratory/archives" },
    ],
  },
];