import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Le style par défaut de Quill

interface RichTextNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (htmlContent: string) => void;
    initialContent: string;
    title?: string;
}

// Configuration des options de la barre d'outils de React Quill
const modules = {
    toolbar: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['clean']
    ],
};

export const RichTextNoteModal: React.FC<RichTextNoteModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialContent,
    title = "Éditeur de texte clinique"
}) => {
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            setContent(initialContent || '');
        }
    }, [isOpen, initialContent]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(content);
        onClose();
    };

    return (
        // z-[70] : Ultra haute priorité de superposition
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            {/* Utilisation de la couleur de marque Asclépios */}
            <div className="bg-[#faf8f1] dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-800 overflow-hidden h-[80vh]">
                
                {/* HEADER */}
                <div className="flex items-center justify-between p-5 bg-[#003366] text-white">
                    <div className="flex items-center gap-3">
                        <FileText size={24} className="text-[#00a896]" />
                        <h2 className="text-xl font-bold font-brand">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY (Éditeur de texte) */}
                {/* Le style custom permet d'adapter ReactQuill au Dark Mode */}
                <div className="flex-1 p-4 overflow-hidden flex flex-col custom-quill-container dark:text-white">
                    <ReactQuill 
                        theme="snow" 
                        value={content} 
                        onChange={setContent} 
                        modules={modules}
                        className="flex-1 h-full flex flex-col"
                    />
                </div>

                {/* FOOTER */}
                <div className="p-5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-gray-900">
                    <button onClick={onClose} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        Annuler
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-md"
                    >
                        <Save size={18} /> Enregistrer les notes
                    </button>
                </div>
            </div>
        </div>
    );
};