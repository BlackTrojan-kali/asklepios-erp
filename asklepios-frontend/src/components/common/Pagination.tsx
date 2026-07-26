import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-gray-900/50 rounded-b-xl text-sm">
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <span>
                    Affichage de <span className="font-semibold text-slate-800 dark:text-gray-200">{startItem}</span> à{' '}
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{endItem}</span> sur{' '}
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{totalItems}</span> enregistrements
                </span>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="itemsPerPageSelect" className="text-xs">Par page :</label>
                        <select
                            id="itemsPerPageSelect"
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-slate-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-[#00a896]"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    title="Page précédente"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                        .map((page, index, array) => {
                            const showEllipsis = index > 0 && page - array[index - 1] > 1;
                            return (
                                <React.Fragment key={page}>
                                    {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                    <button
                                        onClick={() => onPageChange(page)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                            currentPage === page
                                                ? 'bg-[#00a896] text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    title="Page suivante"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};
