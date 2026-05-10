import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router'
import routes from "./routes.tsx"
import { AuthContextProvider } from './contexts/AuthContext.tsx';
import { ThemeContextProvider } from './contexts/ThemeContext.tsx';
import { Loader } from 'lucide-react';
createRoot(document.getElementById('root')!).render(

<StrictMode>
  <Toaster  position="top-right"/>
  <AuthContextProvider>
    <ThemeContextProvider>
      {/* 2. LE SUSPENSE (Ce qui s'affiche pendant que le fichier se télécharge) */}
            <Suspense fallback={
                <div className="flex h-full w-full items-center justify-center">
                    <Loader size={40} className="animate-spin text-[#00a896]" />
                </div>
            }></Suspense>
    <RouterProvider router={routes}>

    </RouterProvider>  
    </ThemeContextProvider>
    </AuthContextProvider>
  </StrictMode>,
)
