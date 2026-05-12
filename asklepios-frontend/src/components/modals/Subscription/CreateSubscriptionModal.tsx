// CreateSubscriptionModal.tsx
import React, { useState } from 'react';
import useSubscriptionStore from '../../../functions/subscriptions/useSubscriptionStore'; 
import { SubscriptionForm } from './SubscriptionForm';

export const CreateSubscriptionModal = ({ isOpen, onClose, dataSources }: any) => {
    const { createSubscription, actionLoading } = useSubscriptionStore();
    const [payload, setPayload] = useState({
        hospital_id: 0,
        country_id: 0,
        starting_date: '',
        ending_date: '',
        items: []
    });

    const handleSubmit = async () => {
        const success = await createSubscription(payload);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Nouvelle Souscription</h2>
                
                <SubscriptionForm 
                    payload={payload} 
                    setPayload={setPayload}
                    hospitals={dataSources.hospitals}
                    countries={dataSources.countries}
                    licences={dataSources.licences}
                />
                
                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Création..." : "Enregistrer le contrat"}
                    </button>
                </div>
            </div>
        </div>
    );
};