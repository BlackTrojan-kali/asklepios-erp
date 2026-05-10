import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router'
import routes from "./routes.tsx"
import { AuthContextProvider } from './contexts/AuthContext.tsx';
createRoot(document.getElementById('root')!).render(

<StrictMode>
  <Toaster  position="top-right"/>
  <AuthContextProvider>
    <RouterProvider router={routes}>

    </RouterProvider>  
    </AuthContextProvider>
  </StrictMode>,
)
