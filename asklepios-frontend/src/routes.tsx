import { createBrowserRouter, Outlet } from "react-router-dom";

// ============================================================================
// IMPORTS : CŒUR & LAYOUTS
// ============================================================================
import Login from "./Pages/Auth/Login";
import AuthMiddleware from "./middlewares/authMiddleware";
import AppLayout from "./Layouts/AppLayout";
import CheckRole from "./middlewares/CheckRole";
import SessionGuard from "./middlewares/SessionGuard";
import NotFound from "./Pages/NotFound";

// ============================================================================
// IMPORTS : SUPER ADMIN (Plateforme globale)
// ============================================================================
import Countries from "./Pages/SUPA/country/Countries";
import Hospitals from "./Pages/SUPA/hospital/Hospital";
import Admins from "./Pages/SUPA/admins/Admins";
import Subscriptions from "./Pages/SUPA/subscriptions/Subscriptions";
import Licences from "./Pages/SUPA/licence/Licences";

// ============================================================================
// IMPORTS : ADMIN (Gestion Hôpital)
// ============================================================================
import Centers from "./Pages/Admin/Centers";
import Departments from "./Pages/Admin/departments/Departments";
import ManageDepartment from './Pages/Admin/Base_hospital/ManageDepartment';
import RoomCategories from "./Pages/Admin/Base_hospital/room_category/RoomCategories";
import FacilityRoomsExplorer from "./Pages/Admin/Base_hospital/FacilityRoomsExplorer";
import BedsExplorer from "./Pages/Admin/Base_hospital/BedsExplorer";
import EquipmentExplorer from "./Pages/Admin/Base_hospital/EquipmentExplorer";
import MedicalActExplorer from "./Pages/Admin/Base_hospital/MedicalActExplorer";

// Ressources Humaines
import Receptionists from "./Pages/Admin/Base_hospital/receptionist/Receptionist";
import Doctors from "./Pages/Admin/Base_hospital/doctor/Doctors";
import Pharmaciens from "./Pages/Admin/Pharmacies/Pharmaciens";

// ============================================================================
// IMPORTS : ADMIN & PHARMACIE (Stock, Ventes, Logistique)
// ============================================================================
import Pharmacies from "./Pages/Admin/Pharmacies/Pharmacies";
import ArticleCategories from "./Pages/Admin/Pharmacies/Articles/ArticleCategories";
import Articles from "./Pages/Admin/Pharmacies/Articles/Articles";
import Batches from "./Pages/Admin/Pharmacies/Articles/Batches";
import Stocks from "./Pages/Admin/Pharmacies/Stock/Stocks";
import Providers from "./Pages/Admin/Pharmacies/Providers";
import AdminPurchaseOrders from "./Pages/Admin/Pharmacies/Stock/AdminPurchaseOrders";
import AdminPurchaseReturns from "./Pages/Admin/Pharmacies/AdminPurchaseReturns";
import AdminStockMovements from "./Pages/Admin/Pharmacies/Magasin/AdminStockMovements";
import AdminInventories from "./Pages/Admin/Pharmacies/Stock/AdminInventories";
import Vehicules from "./Pages/Admin/Pharmacies/Logistics/Vehicules";
import Drivers from "./Pages/Admin/Pharmacies/Logistics/Drivers";
import StockTransfersAdmin from "./Pages/Admin/Pharmacies/Logistics/StockTransfersAdmin";
import ArticlePricing from "./Pages/Admin/Pharmacies/Sale/ArticlePricing";
import CashRegister from "./Pages/Admin/Pharmacies/Sale/CashRegister";

// ============================================================================
// IMPORTS : PHARMACIE (Magasinier & Caissier)
// ============================================================================
import MagasinHome from "./Pages/Admin/Pharmacies/Magasin/MagasinHome";
import StorageLocations from "./Pages/Admin/Pharmacies/Stock/StorageLocations";
import PurchaseOrders from "./Pages/PHARMACY/PurchaseOrders";
import PurchaseReturns from "./Pages/PHARMACY/PurchaseReturns";
import StockMovements from "./Pages/Admin/Pharmacies/Stock/StockMovements";
import Inventories from "./Pages/Admin/Pharmacies/Stock/Inventories";
import StockTransfers from "./Pages/PHARMACY/StockTransfers";
import CashHome from "./Pages/PHARMACY/CashHome";
import SalesHistory from "./Pages/PHARMACY/SaleHistory";
import DepositsHistory from "./Pages/PHARMACY/DepositsHistory";
import MovementsHistory from "./Pages/PHARMACY/MovementsHistory";
import CloseSession from "./Pages/PHARMACY/CloseSession";
import OpenSession from "./Pages/PHARMACY/OpenSession";

// ============================================================================
// IMPORTS : RÉCEPTIONNISTE
// ============================================================================
import Patients from "./Pages/Admin/Base_hospital/receptionist/Patients";
import ReceptionistAppointments from "./Pages/Reception/ReceptionistAppointments";

// ============================================================================
// IMPORTS : MÉDECIN
// ============================================================================
import DoctorDashboard from "./Pages/Doctor/DoctorDashboard";
import DoctorAppointments from "./Pages/Doctor/DoctorAppointments";
import DoctorWardManager from "./Pages/Doctor/DoctorWardManager"; // <-- NOUVEAU
import DoctorAdmissions from "./Pages/Doctor/DoctorAdmissions";


// ============================================================================
// CONFIGURATION DES ROUTES
// ============================================================================
const routes = createBrowserRouter([
  // --------------------------------------------------------------------------
  // 1. ROUTES D'AUTHENTIFICATION (Publiques)
  // --------------------------------------------------------------------------
  {
    path: "/auth/login",
    element: <Login />,
  },

  // --------------------------------------------------------------------------
  // 2. APPLICATION PRINCIPALE (Protégée + AppLayout Global)
  // --------------------------------------------------------------------------
  {
    path: "/",
    element: (
      <AuthMiddleware>
        <AppLayout>
          <Outlet /> {/* Le Layout global est rendu une seule fois ici */}
        </AppLayout>
      </AuthMiddleware>
    ),
    children: [
      
      // ====================================================
      // A. ESPACE SUPER ADMIN
      // ====================================================
      {
        element: (
          <CheckRole roles={["super_admin"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          { path: "countries", element: <Countries /> },
          { path: "hospitals", element: <Hospitals /> },
          { path: "admins", element: <Admins /> },
          { path: "licences", element: <Licences /> },
          { path: "subscriptions", element: <Subscriptions /> },
        ],
      },

      // ====================================================
      // B. ESPACE ADMINISTRATEUR (Base Hôpital & Paramétrages)
      // ====================================================
      {
        path: "admin", // Préfixe appliqué à tous les enfants : /admin/...
        element: (
          <CheckRole roles={["admin"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          // -- Ressources Humaines --
          { path: "receptionists", element: <Receptionists /> },
          { path: "doctors", element: <Doctors /> },
          { path: "pharmaciens", element: <Pharmaciens /> },

          // -- Structure de l'Hôpital --
          { path: "centers", element: <Centers /> },
          { path: "departments", element: <Departments /> },
          { path: "departments/:id/manage_department", element: <ManageDepartment /> },
          { path: "departments/:id/rooms", element: <FacilityRoomsExplorer /> },
          { path: "departments/:id/equipments", element: <EquipmentExplorer /> },
          { path: "departments/:id/medical-acts", element: <MedicalActExplorer /> },
          { path: "rooms/:id/beds", element: <BedsExplorer /> },
          { path: "room_categories", element: <RoomCategories /> },

          // -- Pharmacie (Supervision Admin) --
          { path: "pharmacies", element: <Pharmacies /> },
          { path: "pharmacy/acticles-categories", element: <ArticleCategories /> },
          { path: "pharmacy/articles", element: <Articles /> },
          { path: "pharmacy/articles/pricing", element: <ArticlePricing /> },
          { path: "pharmacy/batch", element: <Batches /> },
          { path: "pharmacy/providers", element: <Providers /> },
          { path: "pharmacy/stocks", element: <Stocks /> },
          { path: "pharmacy/inventory", element: <AdminInventories /> }, // Attention au doublon de nommage possible avec le magasinier
          { path: "pharmacy/movements", element: <AdminStockMovements /> },
          { path: "pharmacy/orders", element: <AdminPurchaseOrders /> },
          { path: "pharmacy/returns", element: <AdminPurchaseReturns /> },
          { path: "pharmacy/cash-register", element: <CashRegister /> }, // <-- CORRECTION: Retrait du "/" initial

          // -- Logistique --
          { path: "vehicules", element: <Vehicules /> },
          { path: "drivers", element: <Drivers /> },
          { path: "transfers", element: <StockTransfersAdmin /> },
        ],
      },

      // ====================================================
      // C. ESPACE PARTAGÉ (Admin & Pharmacie)
      // ====================================================
      {
        element: (
          <CheckRole roles={["admin", "pharmacy"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          { path: "pharmacy/orders", element: <PurchaseOrders /> },
          { path: "pharmacy/returns", element: <PurchaseReturns /> },
          
          { path: "admin/inventory", element: <AdminInventories /> }, // Attention au doublon de nommage possible avec le magasinier
          { path: "admin/movements", element: <AdminStockMovements /> },
        ],
      },

      // ====================================================
      // D. ESPACE PHARMACIE (Magasinier & Caissier)
      // ====================================================
      {
        element: (
          <CheckRole roles={["pharmacy"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          // -- Opérations Magasinier --
          { path: "pharmacy", element: <MagasinHome /> },
          { path: "pharmacy/storage_location", element: <StorageLocations /> },
          { path: "pharmacy/inventory", element: <Inventories /> },
          { path: "pharmacy/movements", element: <StockMovements /> },
          { path: "pharmacy/stock_transfers", element: <StockTransfers /> },

          // -- Opérations Caissier (Protégé par Session) --
          {
            element: (
              <SessionGuard>
                <Outlet />
              </SessionGuard>
            ),
            children: [
              { path: "pharmacy/cash", element: <CashHome /> },
              { path: "pharmacy/cash/sales-history", element: <SalesHistory /> },
              { path: "pharmacy/cash/deposits-history", element: <DepositsHistory /> },
              { path: "pharmacy/cash/movements-history", element: <MovementsHistory /> },
              { path: "pharmacy/cash/session/open", element: <OpenSession /> },
              { path: "pharmacy/cash/session/close", element: <CloseSession /> },
            ],
          },
        ],
      },

      // ====================================================
      // E. ESPACE RÉCEPTIONNISTE (Partagé avec Admin)
      // ====================================================
      {
        element: (
          <CheckRole roles={["reception", "admin"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          { path: "reception/patients", element: <Patients /> },
          { path: "reception/rdv", element: <ReceptionistAppointments /> }
        ]
      },
      
      // ====================================================
      // F. ESPACE MÉDECIN
      // ====================================================
      {
        path: "doctor", // Préfixe appliqué à tous les enfants : /doctor/...
        element: (
          <CheckRole roles={["doctor"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          { path: "home", element: <DoctorDashboard /> },
          { path: "appointments/calendar", element: <DoctorAppointments /> },
          { path: "admissions", element: <DoctorAdmissions /> }, // Vue récapitulative des lits occupés
          { path: "wards", element: <DoctorWardManager /> }, // <-- NOUVEAU: Explorateur interactif des chambres & lits
          { path: "medical_act", element: <MedicalActExplorer /> },
        ]
      },
    ],
  },

  // --------------------------------------------------------------------------
  // 3. PAGE 404 (Route Introuvable)
  // --------------------------------------------------------------------------
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;