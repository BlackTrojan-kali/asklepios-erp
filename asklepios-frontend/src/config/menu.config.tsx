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
  List,
} from "lucide-react";

// --- 1. DÉFINITION DES TYPES ---
export type MenuItemType = {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  roles?: string[];
  positions?: ("magasin" | "vente")[];
  requiredLicence?: string; // <-- NOUVEAU: Le module requis pour afficher ce menu
  subItems?: MenuItemType[];
};

// --- 2. CONFIGURATION GLOBALE DES MENUS ---
export const MENU_CONFIG: MenuItemType[] = [
  // ==========================================
  // MENUS SUPER ADMIN (Ignorent les licences)
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
    title: "Admins",
    icon: <Shield size={20} />,
    path: "/admins",
    roles: ["super_admin"],
  },
  {
    title: "Licences & Souscriptions",
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
  // MENUS ADMIN HÔPITAL
  // ==========================================
  {
    title: "Centres",
    icon: <HospitalIcon size={20} />,
    roles: ["admin"],
    subItems: [
      { title: "Centres", path: "/admin/centers" },
      { title: "Départements", path: "/admin/departments" },
    ],
  },
  {
    title: "Pharmacies",
    icon: <Pill size={20} />,
    roles: ["admin"],
    requiredLicence: "pharmacy", // <-- CACHÉ SI PAS DE LICENCE
    subItems: [
      { title: "Pharmacies", path: "/admin/pharmacies" },
      {
        title: "Articles",
        subItems: [
          { title: "Catégories", path: "/admin/pharmacy/acticles-categories" },
          { title: "Articles", path: "/admin/pharmacy/articles" },
          { title: "Lots", path: "/admin/pharmacy/batch" },
        ],
      },
      {
        title: "Logistique",
        subItems: [
          { title: "Vehicules", path: "/admin/vehicules" },
          { title: "Transfers", path: "/admin/transfers" },
          { title: "Chauffeurs", path: "/admin/drivers" },
        ],
      },
      { title: "Pharmaciens", path: "/admin/pharmaciens" },
      { title: "Versements", path: "/admin/pharmacy/versements" },
      { title: "Mouvements", path: "/admin/movements" },
      {
        title: "Stocks",
        subItems: [
          { title: "État des stocks", path: "/admin/pharmacy/stocks" },
          { title: "Inventaires", path: "/admin/inventory" },
        ],
      },
      { title: "Fournisseurs", path: "/admin/pharmacy/providers" },
    ],
  },
  {
    title: "Commandes",
    icon: <ListOrdered />,
    roles: ["admin"],
    requiredLicence: "pharmacy", // <-- CACHÉ SI PAS DE LICENCE
    subItems: [
      { title: "Commandes effectuées", path: "/admin/orders" },
      { title: "Retours Commandes", path: "/admin/returns" },
    ],
  },

  // ==========================================
  // MENUS PHARMACIEN (MAGASIN)
  // ==========================================
  {
    title: "Gestion des Stocks",
    icon: <Layers size={20} />,
    roles: ["pharmacy"],
    positions: ["magasin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "État des stocks", path: "/pharmacy" },
      { title: "Mouvements", path: "/pharmacy/movements" },
      { title: "Inventaires", path: "/pharmacy/inventory" },
      { title: "Emplacements", path: "/pharmacy/storage_location" },
    ],
  },
  {
    title: "Commandes",
    icon: <ListOrdered size={20} />,
    roles: ["pharmacy"],
    positions: ["magasin"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Commandes effectuées", path: "/pharmacy/orders" },
      { title: "Retours Commandes", path: "/pharmacy/returns" },
    ],
  },
  {
    title: "Logistique",
    icon: <Truck size={20} />,
    roles: ["pharmacy"],
    positions: ["magasin"],
    requiredLicence: "pharmacy",
    path: "pharmacy/stock_transfers",
  },

  // ==========================================
  // MENUS PHARMACIEN (COMMERCIAL / VENTE)
  // ==========================================
  {
    title: "Point de Vente",
    icon: <ShoppingCart size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    path: "/pharmacy/pos",
  },
  {
    title: "Historiques",
    icon: <List size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Ventes", path: "/pharmacy/sales-history" },
      { title: "Versements", path: "/pharmacy/deposits-history" },
      { title: "Mouvements", path: "/pharmacy/movements-history" },
    ],
  },
  {
    title: "Gestion des sessions",
    icon: <List size={20} />,
    roles: ["pharmacy"],
    positions: ["vente"],
    requiredLicence: "pharmacy",
    subItems: [
      { title: "Ouverture de caisse", path: "/pharmacy/cash-sessions/open" },
      { title: "Cloture de caisse", path: "/pharmacy/cash-sessions/close" },
    ],
  },
];
