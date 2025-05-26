//財務總覽組件
import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';

function SummaryReport() {
    const { state } = useAppContext();
    const { transactions } = state;

    const summary = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
            }
        });
        const netAmount = totalIncome - totalExpense;
        return { totalIncome, totalExpense, netAmount };
    }, [transactions]);

    const formatCurrency = (amount) => {
        return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-4 rounded-lg shadow text-center">
                <h3 className="text-md font-medium text-gray-600 mb-1">總收入</h3>
                <p id="total-income" className="text-2xl font-bold amount-income">
                    {formatCurrency(summary.totalIncome)}
                </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
                <h3 className="text-md font-medium text-gray-600 mb-1">總支出</h3>
                <p id="total-expense" className="text-2xl font-bold amount-expense">
                    {formatCurrency(summary.totalExpense)}
                </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow text-center">
                <h3 className="text-md font-medium text-gray-600 mb-1">淨額</h3>
                <p id="net-amount" className={`text-2xl font-bold ${summary.netAmount >= 0 ? 'amount-income' : 'amount-expense'}`}>
                    {formatCurrency(summary.netAmount)}
                </p>
            </div>
        </div>
    );
}

export default SummaryReport;