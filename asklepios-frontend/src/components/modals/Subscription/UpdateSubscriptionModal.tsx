// UpdateSubscriptionModal.tsx
import React, { useState, useEffect } from 'react';
import useSubscriptionStore from '../../../functions/subscriptions/useSubscriptionStore';
import { SubscriptionForm } from './SubscriptionForm';

export const UpdateSubscriptionModal = ({ isOpen, onClose, subscription, dataSources }: any) => {
    const { updateSubscription, actionLoading } = useSubscriptionStore();
    const [payload, setPayload] = useState({
        hospital_id: 0,
        country_id: 0,
        starting_date: '',
        ending_date: '',
        items: []
    });

    // On remplit le formulaire avec les données existantes au chargement
    useEffect(() => {
        if (subscription) {
            setPayload({
                hospital_id: subscription.hospital_id,
                country_id: subscription.country_id,
                starting_date: subscription.starting_date,
                ending_date: subscription.ending_date,
                items: subscription.items?.map((i: any) => ({
                    licence_id: i.licence_id,
                    unit_price: i.unit_price
                })) || []
            });
        }
    }, [subscription]);

    const handleSubmit = async () => {
        const success = await updateSubscription(subscription.id, payload);
        if (success) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 transition-opacity">
            <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl p-6 shadow-xl border border-transparent dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier la Souscription #{subscription?.id}</h2>
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-medium">Édition</span>
                </div>
                
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
                        Fermer
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={actionLoading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {actionLoading ? "Mise à jour..." : "Enregistrer les modifications"}
                    </button>
                </div>
            </div>
        </div>
    );
};