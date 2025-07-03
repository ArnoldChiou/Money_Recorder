import * as React from 'react';
import TransactionList from '../components/TransactionList';
import { TransactionType } from '../types';

interface TransactionListPageProps {
    openModal: (mode: 'category' | 'item', transactionType: TransactionType, categoryName?: string, activeSelectElement?: HTMLSelectElement | null) => void;
}

const TransactionListPage: React.FC<TransactionListPageProps> = ({ openModal }) => {
    return (
        <div className="w-full flex flex-col gap-6 md:gap-10">
            <header className="flex flex-col items-center gap-2 py-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm text-center">
                    收支列表
                </h1>
                <p className="text-slate-500 text-base md:text-lg text-center max-w-xl">
                    查看並管理您的所有交易紀錄。
                </p>
            </header>
            <section className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                <TransactionList openModal={openModal} />
            </section>
        </div>
    );
};

export default TransactionListPage;
