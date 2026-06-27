import { createBrowserRouter, Outlet } from "react-router-dom";
import Login from "./Pages/Auth/Login";
import AuthMiddleware from "./middlewares/authMiddleware";
import AppLayout from "./Layouts/AppLayout";
import CheckRole from "./middlewares/CheckRole";
import SessionGuard from "./middlewares/SessionGuard";
import NotFound from "./Pages/NotFound";

// Pages Super Admin
import Countries from "./Pages/SUPA/country/Countries";
import Hospitals from "./Pages/SUPA/hospital/Hospital";
import Admins from "./Pages/SUPA/admins/Admins";
import Subscriptions from "./Pages/SUPA/subscriptions/Subscriptions";
import Licences from "./Pages/SUPA/licence/Licences";

// Pages Admin
import Centers from "./Pages/Admin/Centers";
import Departments from "./Pages/Admin/departments/Departments";
import Pharmacies from "./Pages/Admin/Pharmacies/Pharmacies";
import ArticleCategories from "./Pages/Admin/Pharmacies/Articles/ArticleCategories";
import Articles from "./Pages/Admin/Pharmacies/Articles/Articles";
import Batches from "./Pages/Admin/Pharmacies/Articles/Batches";
import Pharmaciens from "./Pages/Admin/Pharmacies/Pharmaciens";
import Stocks from "./Pages/Admin/Pharmacies/Stock/Stocks";
import Providers from "./Pages/Admin/Pharmacies/Providers";
import AdminPurchaseOrders from "./Pages/Admin/Pharmacies/Stock/AdminPurchaseOrders";
import AdminPurchaseReturns from "./Pages/Admin/Pharmacies/AdminPurchaseReturns";
import AdminStockMovements from "./Pages/Admin/Pharmacies/Magasin/AdminStockMovements";
import AdminInventories from "./Pages/Admin/Pharmacies/Stock/AdminInventories";

// Pages Pharmacie
import MagasinHome from "./Pages/Admin/Pharmacies/Magasin/MagasinHome";
import StorageLocations from "./Pages/Admin/Pharmacies/Stock/StorageLocations";
import PurchaseOrders from "./Pages/PHARMACY/PurchaseOrders";
import PurchaseReturns from "./Pages/PHARMACY/PurchaseReturns";
import StockMovements from "./Pages/Admin/Pharmacies/Stock/StockMovements";
import Inventories from "./Pages/Admin/Pharmacies/Stock/Inventories";
import Vehicules from "./Pages/Admin/Pharmacies/Logistics/Vehicules";
import Drivers from "./Pages/Admin/Pharmacies/Logistics/Drivers";
import StockTransfers from "./Pages/PHARMACY/StockTransfers";
import StockTransfersAdmin from "./Pages/Admin/Pharmacies/Logistics/StockTransfersAdmin";
import Receptionists from "./Pages/Admin/Base_hospital/receptionist/Receptionist";
import Patients from "./Pages/Admin/Base_hospital/receptionist/Patients";
import Doctors from "./Pages/Admin/Base_hospital/doctor/Doctors";
import RoomCategories from "./Pages/Admin/Base_hospital/room_category/RoomCategories";
import ManageDepartment from "./Pages/Admin/Base_hospital/ManageDepartment";
import FacilityRoomsExplorer from "./Pages/Admin/Base_hospital/FacilityRoomsExplorer";
import BedsExplorer from "./Pages/Admin/Base_hospital/BedsExplorer";

import SalesHistory from "./Pages/PHARMACY/SalesHistory";
import DepositsHistory from "./Pages/PHARMACY/DepositsHistory";
import CashHome from "./Pages/PHARMACY/CashHome";
import ArticlePricing from "./Pages/Admin/Pharmacies/Sale/ArticlePricing";
import CashRegister from "./Pages/Admin/Pharmacies/Sale/CashRegister";
import CloseSession from "./Pages/PHARMACY/CloseSession";
import OpenSession from "./Pages/PHARMACY/OpenSession";
import CashSessionHistory from "./Pages/PHARMACY/CashSessionHistory";
import PosSalesHistory from "./Pages/Admin/Pharmacies/Sale/PosSalesHistory";
import PosSessionsHistory from "./Pages/Admin/Pharmacies/Sale/PosSessionsHistory";

const routes = createBrowserRouter([
  // ==========================================
  // 1. ROUTES D'AUTHENTIFICATION (Publiques)
  // ==========================================
  {
    path: "/auth/login",
    element: <Login />,
  },

  // ==========================================
  // 2. APPLICATION PRINCIPALE (Protégée + Layout)
  // ==========================================
  {
    path: "/",
    element: (
      <AuthMiddleware>
        <AppLayout>
          <Outlet /> {/* <-- Le layout global est rendu UNE seule fois ici */}
        </AppLayout>
      </AuthMiddleware>
    ),
    children: [
      // ----------------------------------------------------
      // A. ROUTES SUPER ADMIN
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // B. ROUTES ADMIN (/admin/...)
      // ----------------------------------------------------
      {
        path: "admin",
        element: (
          <CheckRole roles={["admin"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          //receptioniste
          { path: "receptionists", element: <Receptionists /> },
          //docteurs
          { path: "doctors", element: <Doctors /> },
          //
          { path: "centers", element: <Centers /> },
          { path: "departments", element: <Departments /> },
          { path: "pharmacies", element: <Pharmacies /> },
          { path: "pharmaciens", element: <Pharmaciens /> },
          { path: "inventory", element: <AdminInventories /> },
          { path: "movements", element: <AdminStockMovements /> },
          { path: "orders", element: <AdminPurchaseOrders /> },
          { path: "returns", element: <AdminPurchaseReturns /> },
          { path: "room_categories", element: <RoomCategories /> },
          {
            path: "departments/:id/manage_department",
            element: <ManageDepartment />,
          },
          { path: "departments/:id/rooms", element: <FacilityRoomsExplorer /> },
          { path: "rooms/:id/beds", element: <BedsExplorer /> },

          // Sous-dossier Pharmacie côté Admin
          {
            path: "pharmacy/acticles-categories",
            element: <ArticleCategories />,
          },
          { path: "pharmacy/articles", element: <Articles /> },
          { path: "pharmacy/batch", element: <Batches /> },
          { path: "pharmacy/stocks", element: <Stocks /> },
          { path: "pharmacy/providers", element: <Providers /> },
          // POINT DE VENTE

          { path: "/admin/pharmacy/cash-register", element: <CashRegister /> },
          { path: "pharmacy/articles/pricing", element: <ArticlePricing /> },
          {
            path: "/admin/pharmacy/pos-sales-history",
            element: <PosSalesHistory />,
          },
          {
            path: "/admin/pharmacy/pos-sessions-history",
            element: <PosSessionsHistory />,
          },

          //logistique
          { path: "vehicules", element: <Vehicules /> },
          { path: "drivers", element: <Drivers /> },
          { path: "transfers", element: <StockTransfersAdmin /> },
        ],
      },

      // ----------------------------------------------------
      // C. ROUTES PARTAGÉES (ADMIN & PHARMACIE)
      // ----------------------------------------------------
      {
        element: (
          <CheckRole roles={["admin", "pharmacy"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          { path: "pharmacy/orders", element: <PurchaseOrders /> },
          { path: "pharmacy/returns", element: <PurchaseReturns /> },
        ],
      },

      // ----------------------------------------------------
      // D. ROUTES PHARMACIEN (Rôle : "pharmacy")
      // ----------------------------------------------------
      {
        element: (
          <CheckRole roles={["pharmacy"]}>
            <Outlet />
          </CheckRole>
        ),
        children: [
          // MAGASINIER
          // Si un jour CheckRole supporte les positions, on mettra ici :
          // <CheckRole roles={["pharmacy"]} positions={["magasin"]}>
          { path: "pharmacy", element: <MagasinHome /> },
          { path: "pharmacy/inventory", element: <Inventories /> },
          { path: "pharmacy/movements", element: <StockMovements /> },
          { path: "pharmacy/storage_location", element: <StorageLocations /> },
          { path: "pharmacy/stock_transfers", element: <StockTransfers /> },
          // VENDEUR / CAISSIER
          {
            element: (
              <SessionGuard>
                <Outlet />
              </SessionGuard>
            ),
            children: [
              { path: "pharmacy/cash", element: <CashHome /> },

              {
                path: "pharmacy/cash/deposits-history",
                element: <DepositsHistory />,
              },

              {
                path: "pharmacy/cash/session/close",
                element: <CloseSession />,
              },
              { path: "pharmacy/cash/session/open", element: <OpenSession /> },
              {
                path: "pharmacy/cash/session/history",
                element: <CashSessionHistory />,
              },
              {
                path: "pharmacy/cash/sales/history",
                element: <SalesHistory />,
              },
            ],
          },
        ],
      },
      {
        element: (
          <CheckRole roles={["reception", "admin"]}>
            <Outlet />
          </CheckRole>
        ),

        children: [{ path: "reception/patients", element: <Patients /> }],
      },
    ],
  },

  // ==========================================
  // 3. PAGE 404 (Introuvable)
  // ==========================================
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;
