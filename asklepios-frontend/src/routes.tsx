import { createBrowserRouter, Outlet } from "react-router-dom"; // N'oublie pas d'importer Outlet
import Login from "./Pages/Auth/Login"
// import App from "./App"; // Si tu ne l'utilises plus, tu peux l'enlever
import AuthMiddleware from './middlewares/authMiddleware';
import AppLayout from "./Layouts/AppLayout";
import CheckRole from "./middlewares/CheckRole";
import Countries from "./Pages/SUPA/country/Countries";
import Hospitals from "./Pages/SUPA/hospital/Hospital";
import Admins from "./Pages/SUPA/admins/Admins";
import Subscriptions from "./Pages/SUPA/subscriptions/Subscriptions";
import Centers from "./Pages/Admin/Centers";
import Departments from "./Pages/Admin/departments/Departments";
import Pharmacies from "./Pages/Admin/Pharmacies/Pharmacies";
import ArticleCategories from "./Pages/Admin/Pharmacies/Articles/ArticleCategories";
import Articles from "./Pages/Admin/Pharmacies/Articles/Articles";
import Batches from "./Pages/Admin/Pharmacies/Articles/Batches";
import Pharmaciens from "./Pages/Admin/Pharmacies/Pharmaciens";
import Stocks from "./Pages/Admin/Pharmacies/Stock/Stocks";
import Licences from "./Pages/SUPA/licence/Licences";
import NotFound from "./Pages/NotFound";
import Providers from "./Pages/Admin/Pharmacies/Providers";
import MagasinHome from "./Pages/Admin/Pharmacies/Magasin/MagasinHome";
import StorageLocations from "./Pages/Admin/Pharmacies/Stock/StorageLocations";

const routes = createBrowserRouter([
   {
    path: "/",
    // L'ordre est important : 
    // 1. Est-il connecté ? (AuthMiddleware)
    // 2. A-t-il le bon rôle ? (CheckRole)
    // 3. On affiche la structure (AppLayout)
    // 4. On injecte la page demandée (Outlet)
    element: (
        <AuthMiddleware>
            <CheckRole roles={["super_admin"]}>
                <AppLayout>
                    <Outlet /> {/* <-- C'est ICI que le composant <Countries /> va s'insérer */}
                </AppLayout>
            </CheckRole>
        </AuthMiddleware>
    ),
    
    children: [
        {
            path: "countries", // L'URL sera "/countries"
            element: <Countries />
        },
        {
            path:"hospitals",
            element:<Hospitals/>
        },
        {
            path:"admins",
            element:<Admins/>
        },
        {
            path:"licences",
            element:<Licences/>
        },
        {
            path:"subscriptions",
            element:<Subscriptions/>
        }
        // Tu pourras ajouter d'autres routes Super Admin ici !
    ]
   },
   {
    path: "/admin",
    element: (
        <AuthMiddleware>
            <CheckRole roles={["admin"]}>
                <AppLayout>
                    <Outlet /> {/* <-- C'est ICI que le composant <Countries /> va s'insérer */}
                </AppLayout>
            </CheckRole>
        </AuthMiddleware>
    ),
    children: [
        {
            path:"centers",
            element:<Centers/>
        },
        {
            path:"departments",
            element:<Departments/>
        },
        {
            path:"pharmacies",
            element:<Pharmacies/>
        },
        {
            path:"pharmacy/acticles-categories",
            element:<ArticleCategories/>
        },
        {
            path:"pharmacy/articles",
            element:<Articles/>
        },
        {
            path:"pharmacy/batch",
            element:<Batches/>
        },
        {
            path:"pharmacy/stocks",
            element:<Stocks/>
        },
      
        {
            path:"pharmaciens",
            element:<Pharmaciens/>
        },{
            path:"pharmacy/providers",
            element:<Providers/>
        }
        // Tu pourras ajouter d'autres routes Super Admin ici !
    ]
   },
   //pharmacien
      {
    path: "/pharmacy",
    element: (
        <AuthMiddleware>
            <CheckRole roles={["pharmacy"]}>
                <AppLayout>
                    <Outlet /> {/* <-- C'est ICI que le composant <Countries /> va s'insérer */}
                </AppLayout>
            </CheckRole>
        </AuthMiddleware>
    ),
    children: [
        {
            path:"",
            element:<MagasinHome/>
        },
        {
            path:"storage_location",
            element:<StorageLocations/>
        }
        // Tu pourras ajouter d'autres routes Super Admin ici !
    ]
   },
   
   {
        path: "/auth",
        children: [
            {
                path: "login",
                element: <Login />
            }
        ]
   },
     {
            path:"*",
            element:<NotFound/>
        },
]);

export default routes;