import React, { useState } from 'react';
import { PurchaseOrdersList } from './PurchaseOrdersList';
import { PurchaseOrderForm } from './PurchaseOrderForm';

export const PurchaseOrderManager: React.FC = () => {
    const [view, setView] = useState<'list' | 'create'>('list');

    return view === 'list'
        ? <PurchaseOrdersList onCreateNew={() => setView('create')} />
        : <PurchaseOrderForm />; // Add onCancel prop if Form supports it, currently it doesn't have props
};
