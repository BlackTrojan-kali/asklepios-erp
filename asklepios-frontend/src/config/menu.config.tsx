import React from "react";
import {
  Globe,
  Hospital,
  Shield,
  NotebookText,
  Settings,
  HospitalIcon,
  Pill,
  ListOrdered,
  Layers,
  ShoppingCart,
  Truck,
  Stethoscope,
  Computer,
  Users,
  List,
  Calendar,
  BriefcaseMedical,
  Tags,
  Wallet,
  Building2,
  Activity,
  Workflow
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
  // MENUS SUPER ADMIN (SaaS)
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
  // MENUS ADMIN (BASE HÔPITAL)
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
  // MENUS ADMIN (MODULE PHARMACIE)
  // ==========================================
  // 1. Réseau & Personnel
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
  // 2. Catalogue
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
  // 3. Stocks
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
  // 4. Achats
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
  // 5. Logistique
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
  // 6. Finances
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
  // MENUS PHARMACIEN (MAGASIN / STOCK)
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
    path: "/pharmacy/stock_transfers", // Correction du slash manquant
  },

  // ==========================================
  // MENUS PHARMACIEN (VENTE / CAISSE)
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
      { title: "Clôturer la caisse", path: "/pharmacy/cash/session/close" }, // Correction du slash
    ],
  },
  {
    title: "Rapports & Historiques",
    icon: <Activity size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Historique des Ventes", path: "/pharmacy/sales-history" },
      { title: "Mes Versements", path: "/pharmacy/deposits-history" },
      { title: "Mouvements de Caisse", path: "/pharmacy/movements-history" },
    ],
  },

  // ==========================================
  // MENUS RÉCEPTIONNISTE / ACCUEIL
  // ==========================================
  {
    title: "Accueil & Patients",
    icon: <Users size={20} />,
    roles: ["reception", "admin"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Dossiers Patients", path: "/reception/patients" }, // Correction du slash
    ]
  },

  // ==========================================
  // MENUS DOCTEUR
  // ==========================================
  {
    title:"Acceuil",
    icon:<Computer size={20}/>,
    roles:["doctor"],
    requiredLicence:"base_hospital",
    path:"/doctor/home"
  },
  {
    title: "Mes Consultations",
    icon: <Calendar size={20} />,
    roles: ["doctor"],
    requiredLicence: "base_hospital",
    subItems: [
      { title: "Agenda des RDV", path: "/doctor/appointments/calendar" }, // Correction du slash
    ]
  },
  {
    title:"Cabinet / Departement",
    icon:<Workflow/>,
    roles:["doctor"],
    requiredLicence:"base_hospital",
    subItems:[
      {title:"Act Medicaux",path:"/doctor/medical_act"}
    ]
  }
];