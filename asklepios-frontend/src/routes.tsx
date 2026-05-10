import { createBrowserRouter, Outlet } from "react-router-dom"; // N'oublie pas d'importer Outlet
import Login from "./Pages/Auth/Login"
// import App from "./App"; // Si tu ne l'utilises plus, tu peux l'enlever
import AuthMiddleware from './middlewares/authMiddleware';
import AppLayout from "./Layouts/AppLayout";
import CheckRole from "./middlewares/CheckRole";
import Countries from "./Pages/SUPA/country/Countries";

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
   }
]);

export default routes;