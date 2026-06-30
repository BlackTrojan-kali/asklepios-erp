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
  Workflow,
  BriefcaseMedical,
  Building2,
  BedDouble // <-- NOUVEL IMPORT
} from "lucide-react";

// --- 1. DÉFINITION DES TYPES ---
export type MenuItemType = {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  roles?: string[];
  positions?: ("magasin" | "vente")[];
  requiredLicence?: string;
  subItems?: MenuItemType[];
};

// --- 2. CONFIGURATION GLOBALE DES MENUS ---
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
  // B. MENUS ADMIN (Base Hôpital & RH)
  // ==========================================
  {
    title: "Infrastructure",
    icon: <Building2 size={20} />,
    roles: ["admin"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Centres", path: "/admin/centers" },
      { title: "Départements", path: "/admin/departments" },
      { title: "Catégories Chambres", path: "/admin/room_categories" },
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
      { title: "Caisses Enregistreuses", path: "/admin/pharmacy/cash-register" },
      { title: "Versements", path: "/admin/pharmacy/versements" },
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
    title: "Rapports & Historiques",
    icon: <Activity size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Historique des Ventes", path: "/pharmacy/cash/sales-history" }, // Corrigé
      { title: "Mes Versements", path: "/pharmacy/cash/deposits-history" }, // Corrigé
      { title: "Mouvements de Caisse", path: "/pharmacy/cash/movements-history" }, // Corrigé
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
      { title: "Gestion des RDV", path: "/reception/rdv" }
    ]
  },

  // ==========================================
  // G. MENUS DOCTEUR
  // ==========================================
  {
    title: "Tableau de bord",
    icon: <Computer size={20} />,
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    path: "/doctor/home"
  },
  {
    title: "Mon Planning",
    icon: <Calendar size={20} />,
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Agenda des RDV", path: "/doctor/appointments/calendar" },
    ]
  },
  {
    title: "Mon Service",
    icon: <BedDouble size={20} />, // Icône plus adaptée à l'hospitalisation
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Chambres & Lits", path: "/doctor/wards" }, // <-- NOUVEAU LIEN (Explorateur)
      { title: "Actes Médicaux", path: "/doctor/medical_act" },
    ]
  }
];