import * as React from 'react';
import { useState } from 'react';
import TransactionForm from '../components/TransactionForm';
import TransferForm from '../components/TransferForm';
import { TransactionType } from '../types';

interface AddTransactionPageProps {
    openModal: (mode: 'category' | 'item', transactionType: TransactionType, categoryName?: string, activeSelectElement?: HTMLSelectElement | null) => void;
    newlyAddedItem?: string | null;
}

const AddTransactionPage: React.FC<AddTransactionPageProps> = ({ openModal, newlyAddedItem }) => {
    const [currentTab, setCurrentTab] = useState<'transaction' | 'transfer'>('transaction');
    const [currentFormType, setCurrentFormType] = useState<TransactionType>('expense');

    return (
        <div className="w-full flex flex-col gap-6 md:gap-10">
            <header className="flex flex-col items-center gap-2 py-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm text-center">
                    新增一筆紀錄
                </h1>
                <p className="text-slate-500 text-base md:text-lg text-center max-w-xl">
                    在這裡詳細記錄您的每一筆收入、支出或帳戶間轉帳。
                </p>
                <div className="flex gap-2 mt-4">
                    <button
                        className={`px-4 py-2 rounded-l-lg border border-slate-300 ${currentTab === 'transaction' ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'}`}
                        onClick={() => setCurrentTab('transaction')}
                    >
                        收支紀錄
                    </button>
                    <button
                        className={`px-4 py-2 rounded-r-lg border border-slate-300 ${currentTab === 'transfer' ? 'bg-slate-700 text-white' : 'bg-white text-slate-700'}`}
                        onClick={() => setCurrentTab('transfer')}
                    >
                        轉帳
                    </button>
                </div>
            </header>
            <section className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                {currentTab === 'transaction' ? (
                    <TransactionForm
                        currentFormType={currentFormType}
                        setCurrentFormType={setCurrentFormType}
                        openModal={openModal}
                        newlyAddedItem={newlyAddedItem}
                    />
                ) : (
                    <TransferForm />
                )}
            </section>
        </div>
    );
};

export default AddTransactionPage;
