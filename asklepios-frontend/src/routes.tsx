import { createBrowserRouter } from "react-router";
import Login from "./Pages/Auth/Login"
const routes =  createBrowserRouter([
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