// src/components/TransactionList.jsx
import React from 'react';
import TransactionItem from './TransactionItem';
import { useAppContext } from '../contexts/AppContext';

function TransactionList({ openModal }) {
    const { state } = useAppContext();
    const { transactions } = state;

    if (transactions.length === 0) {
        return <div className="text-center text-gray-500 py-8">目前沒有任何紀錄。</div>; // 增加上下間距
    }

    return (
        <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg"> {/* 添加陰影和圓角 */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {/* 表頭樣式微調 */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">日期</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">類型</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">分類</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">項目</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">金額</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {/* *** 修改：傳遞 index *** */}
                    {transactions.map((transaction, index) => (
                        <TransactionItem key={transaction.id} transaction={transaction} openModal={openModal} index={index} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default TransactionList;