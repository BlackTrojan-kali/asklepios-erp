import React, { useEffect, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react'; // Pour afficher un beau spinner pendant l'attente

interface CheckRoleProps {
    roles: string[]; 
    children: ReactNode;
}

const CheckRole = ({ children, roles }: CheckRoleProps) => {
    // 1. On récupère un état de chargement depuis ton contexte
    const { profile, loading } = useAuth(); 
    const navigate = useNavigate();
    
    useEffect(() => {
        // 2. On ne fait la vérification QUE si le chargement est terminé
        if (!loading) {
            if (!profile) {
                // Si après le chargement, il n'y a toujours pas de profil, on le renvoie au login
                navigate("/auth/login", { replace: true });
            } else if (!roles.includes(profile.role)) {
                // S'il est connecté mais n'a pas le bon rôle
                toast.error("Vous n'avez pas le droit d'accéder à cette page.");
                navigate("/countries", { replace: true }); 
            }
        }
    }, [profile, roles, navigate, loading]);

    // 3. Pendant le chargement, on affiche un écran d'attente (évite le clignotement)
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#faf8f1] dark:bg-gray-900">
                <Loader2 size={40} className="animate-spin text-[#00a896]" />
            </div>
        );
    }

    // 4. Sécurité finale avant d'afficher les enfants
    if (!profile || !roles.includes(profile.role)) {
        return null; 
    }

    return <>{children}</>;
}

export default CheckRole;