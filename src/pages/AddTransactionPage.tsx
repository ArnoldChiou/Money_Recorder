import * as React from 'react';
import { useState } from 'react';
import TransactionForm from '../components/TransactionForm';
import { TransactionType } from '../types';

interface AddTransactionPageProps {
    openModal: (mode: 'category' | 'item', transactionType: TransactionType, categoryName?: string, activeSelectElement?: HTMLSelectElement | null) => void;
    newlyAddedItem?: string | null;
}

const AddTransactionPage: React.FC<AddTransactionPageProps> = ({ openModal, newlyAddedItem }) => {
    const [currentFormType, setCurrentFormType] = useState<TransactionType>('expense');

    return (
        <div className="w-full flex flex-col gap-6 md:gap-10">
            <header className="flex flex-col items-center gap-2 py-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm text-center">
                    新增一筆紀錄
                </h1>
                <p className="text-slate-500 text-base md:text-lg text-center max-w-xl">
                    在這裡詳細記錄您的每一筆收入或支出。
                </p>
            </header>
            <section className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                <TransactionForm
                    currentFormType={currentFormType}
                    setCurrentFormType={setCurrentFormType}
                    openModal={openModal}
                    newlyAddedItem={newlyAddedItem}
                />
            </section>
        </div>
    );
};

export default AddTransactionPage;
