import { ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import type { MenuItemType } from "./Sidebar"; // Import du type commun

interface SidebarItemProps {
  item: MenuItemType;
  isCollapsed: boolean;
  setExpanded: (val: boolean) => void;
  level?: number; // Niveau d'imbrication (0 par défaut)
}

const SidebarItem = ({
  item,
  isCollapsed,
  setExpanded,
  level = 0,
}: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const navigate = useNavigate();
  const location = useLocation();

  // Normalisation des chemins pour assurer une correspondance robuste
  const normalizePath = (p: string) => {
    return "/" + p.replace(/^\/+|\/+$/g, "");
  };

  // Vérifie si l'onglet courant correspond exactement à cet élément
  const isActive = useMemo(() => {
    if (!item.path) return false;
    return normalizePath(location.pathname) === normalizePath(item.path);
  }, [item.path, location.pathname]);

  // Vérifie de manière récursive si un des enfants ou sous-enfants de cet élément est actif
  const activeChild = useMemo(() => {
    const checkActive = (i: MenuItemType): boolean => {
      if (
        i.path &&
        normalizePath(location.pathname) === normalizePath(i.path)
      ) {
        return true;
      }
      if (i.subItems) {
        return i.subItems.some(checkActive);
      }
      return false;
    };
    return item.subItems ? item.subItems.some(checkActive) : false;
  }, [item.subItems, location.pathname]);

  // Ouvrir automatiquement le sous-menu si un enfant est actif
  useEffect(() => {
    if (activeChild) {
      setIsOpen(true);
    }
  }, [activeChild]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Évite que le clic ne déclenche les éléments parents
    if (hasSubItems) {
      // Si la sidebar est rétractée, on l'ouvre d'abord
      if (isCollapsed) setExpanded(false);
      setIsOpen(!isOpen);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  // Calcul de l'indentation dynamique : +1.5rem à chaque niveau
  const indentPadding = level === 0 ? "0.75rem" : `${level * 1.5 + 0.75}rem`;

  return (
    <div className="mb-1">
      {/* Bouton de menu */}
      <button
        onClick={handleClick}
        style={{ paddingLeft: !isCollapsed ? indentPadding : "0.75rem" }}
        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 
                hover:bg-slate-100 dark:hover:bg-gray-800
                ${
                  isActive
                    ? "bg-brand-blue/10 dark:bg-brand-teal/10 text-brand-blue dark:text-brand-teal font-semibold"
                    : isOpen && !isCollapsed && level === 0
                      ? "bg-slate-50 dark:bg-gray-800/50 text-brand-blue dark:text-brand-teal font-semibold"
                      : "text-slate-700 dark:text-gray-300"
                }`}
        title={isCollapsed ? item.title : ""}
      >
        <div
          className={`flex items-center ${isCollapsed ? "justify-center w-full" : "gap-3"}`}
        >
          {item.icon ? (
            <span className="text-current flex-shrink-0">{item.icon}</span>
          ) : (
            // Petit point pour les sous-menus qui n'ont pas d'icône
            !isCollapsed && (
              <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50"></span>
            )
          )}
          {!isCollapsed && (
            <span className="text-sm whitespace-nowrap text-left">
              {item.title}
            </span>
          )}
        </div>

        {/* Icône Chevron pour les menus déroulants */}
        {hasSubItems && !isCollapsed && (
          <span className="text-gray-400 flex-shrink-0 ml-2">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </button>

      {/* APPEL RÉCURSIF DES SOUS-MENUS */}
      {hasSubItems && isOpen && !isCollapsed && (
        <div className="mt-1 overflow-hidden transition-all duration-300 flex flex-col">
          {item.subItems!.map((sub, idx) => (
            <SidebarItem
              key={idx}
              item={sub}
              isCollapsed={isCollapsed}
              setExpanded={setExpanded}
              level={level + 1} // On incrémente la profondeur
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
