import { createBrowserRouter } from "react-router";
import Login from "./Pages/Auth/Login"
import App from "./App";
import AuthMiddleware from './middlewares/authMiddleware';
import AppLayout from "./Layouts/AppLayout";
const routes =  createBrowserRouter([
   {
    path:"/",
    element: <AuthMiddleware><AppLayout> <App/></AppLayout></AuthMiddleware>
   },
    {
        path:"/auth",
        children:[
            {
                path:"login",
                element:<Login/>
            }
        ]
    }
])

export default routes;