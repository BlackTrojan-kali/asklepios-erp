import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMyActiveSession } from "../hooks/pharmacy/useCashRegisterSession";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface SessionGuardProps {
  children: React.ReactNode;
}

const SessionGuard = ({ children }: SessionGuardProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: myActiveSession, isLoading } = useMyActiveSession();

  const isPharmacy = profile?.role === "pharmacy";

  useEffect(() => {
    if (isPharmacy && !isLoading) {
      const currentPath = location.pathname;

      if (!myActiveSession || !myActiveSession.id) {
        // Aucune session active : rediriger vers l'ouverture de session si l'utilisateur essaie d'accéder au POS ou à la clôture
        if (
          currentPath !== "/pharmacy/cash/session/open" &&
          currentPath !== "/pharmacy/cash/session/history"
        ) {
          toast.error(
            "Aucune session de caisse active. Veuillez d'abord en ouvrir une.",
          );
          navigate("/pharmacy/cash/session/open", { replace: true });
        }
      } else {
        // Session active existante : si l'utilisateur est sur la page d'ouverture, le rediriger vers le Point de Vente (/pharmacy/cash)
        if (currentPath === "/pharmacy/cash/session/open") {
          toast.success("Vous avez déjà une session active.");
          navigate("/pharmacy/cash", { replace: true });
        }
      }
    }
  }, [myActiveSession, isLoading, isPharmacy, location.pathname, navigate]);

  return <>{children}</>;
};

export default SessionGuard;
