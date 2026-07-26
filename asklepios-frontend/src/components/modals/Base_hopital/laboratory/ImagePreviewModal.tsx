import React, { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, Download, FileText } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  title = "Prévisualisation du cliché / document",
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !imageSrc) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800 text-white">
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">
                Zoom : {Math.round(zoom * 100)}% • Orientation : {rotation}°
              </p>
            </div>
          </div>

          {/* BOUTONS DE CONTRÔLE */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Agrandir"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Réduire"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Pivoter à 90°"
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Réinitialiser la vue"
            >
              Reset
            </button>
            <a
              href={imageSrc}
              download="cliche_laboratoire"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              title="Télécharger l'image"
            >
              <Download size={18} />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- ZONE D'AFFICHAGE DE L'IMAGE --- */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/80 cursor-grab active:cursor-grabbing">
          <img
            src={imageSrc}
            alt="Cliché de laboratoire"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
          />
        </div>

        {/* --- FOOTER --- */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400 shrink-0">
          <span>Appuyez sur Échap ou cliquez sur la croix pour fermer</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
          >
            Fermer la vue
          </button>
        </div>
      </div>
    </div>
  );
};
