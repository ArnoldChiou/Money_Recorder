// src/components/TransactionItem.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Transaction, TransactionType } from '../types';
import { deleteTransactionFromFirebase, updateTransactionInFirebase } from '../contexts/AppContext';
import { useAuthUser } from '../hooks/useAuthUser';

interface TransactionItemProps {
    transaction: Transaction;
    openModal: (mode: 'category' | 'item', transactionType: TransactionType, categoryName?: string, activeSelectElement?: HTMLSelectElement | null) => void;
    index: number;
    view: 'desktop' | 'mobile'; // 新增 view prop
}

const getCategoryColorClass = (category: string, type: TransactionType): string => {
    if (type === 'income') return 'bg-green-100 text-green-800';
    switch (category) {
        case '餐飲': return 'bg-yellow-100 text-yellow-800';
        case '交通': return 'bg-blue-100 text-blue-800';
        case '購物': return 'bg-green-100 text-green-800';
        case '娛樂': return 'bg-purple-100 text-purple-800';
        case '居家': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const TransactionItem: FC<TransactionItemProps> = ({ transaction, openModal, index, view }) => {
    const { state } = useAppContext();
    const { user } = useAuthUser();
    const userId = user?.uid;
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editData, setEditData] = useState<Transaction>({ ...transaction });

    const account = state.accounts.find(acc => acc.id === transaction.accountId);

    const availableCategories = state.userDefinedData.categories[editData.type] || [];
    const availableItems = (editData.category && state.userDefinedData.items[editData.type]?.[editData.category]) || [];

    useEffect(() => {
        setEditData({ ...transaction });
    }, [transaction]);

    useEffect(() => {
        if (isEditing) {
            const currentItems = (editData.category && state.userDefinedData.items[editData.type]?.[editData.category]) || [];
            if (!currentItems.includes(editData.description) && currentItems.length > 0) {
                setEditData(prev => ({ ...prev, description: currentItems[0] }));
            } else if (currentItems.length === 0 || !currentItems.includes(editData.description)) {
                setEditData(prev => ({ ...prev, description: "" }));
            }
        }
    }, [editData.category, editData.type, isEditing, state.userDefinedData.items, editData.description]);


    const handleEditToggle = () => {
        if (isEditing) {
            setEditData({ ...transaction });
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let newAmount = editData.amount;

        if (name === 'amount') {
            const parsedValue = parseFloat(value);
            newAmount = isNaN(parsedValue) ? 0 : parsedValue;
        }

        const updatedData = {
            ...editData,
            [name]: name === 'amount' ? newAmount : value
        };

        if (name === 'category') {
             const itemsForNewCategory = (state.userDefinedData.items[editData.type]?.[value]) || [];
             updatedData.description = itemsForNewCategory.length > 0 ? itemsForNewCategory[0] : '';
        }

         setEditData(updatedData);
    };

    const handleSelectChangeWithAddNew = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value.startsWith('__add_new_')) {
            const type = value.includes('_category_') ? 'category' : 'item';
            const categoryForNewItem = type === 'item' ? editData.category : '';
            openModal(type, editData.type, categoryForNewItem, e.target);
        } else {
             handleChange(e);
        }
    };

    const handleSave = async () => {
        if (!userId) {
            alert('請先登入');
            return;
        }
        if (!editData.category || !editData.description || !editData.amount || isNaN(Number(editData.amount))) {
            alert("請填寫所有有效欄位並選擇有效的項目。");
            return;
        }
        await updateTransactionInFirebase(editData, userId);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!userId) {
            alert('請先登入');
            return;
        }
        if (window.confirm('您確定要刪除這筆紀錄嗎？')) {
            await deleteTransactionFromFirebase(transaction.id, userId);
        }
    };

    // 桌面版視圖
    if (view === 'desktop') {
        return (
            <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
            {isEditing ? (
                <>
                    <td className="px-4 py-2"><input type="date" name="date" value={editData.date} onChange={handleChange} className="editing-input text-sm" /></td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}>
                            {transaction.type === 'income' ? '收入' : '支出'}
                        </span>
                    </td>
                    <td className="px-4 py-2">
                        <select name="category" value={editData.category} onChange={handleSelectChangeWithAddNew} className="editing-input text-sm">
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value={`__add_new_category_${editData.type}__`}>＋ 新增分類...</option>
                        </select>
                    </td>
                    <td className="px-4 py-2">
                        <select name="description" value={editData.description} onChange={handleSelectChangeWithAddNew} className="editing-input text-sm">
                             {editData.category && !editData.category.startsWith('__add_new_') ? (
                                availableItems.length > 0 ? (
                                    availableItems.map(item => <option key={item} value={item}>{item}</option>)
                                ) : (
                                    <option value="">此分類尚無項目</option>
                                )
                            ) : (
                                <option value="">請先選分類</option>
                            )}
                            {editData.category && !editData.category.startsWith('__add_new_') && <option value={`__add_new_item_${editData.type}__`}>＋ 新增項目...</option>}
                        </select>
                    </td>
                    <td className="px-4 py-2">
                        <select name="accountId" value={editData.accountId} onChange={handleChange} className="editing-input text-sm">
                            {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </td>
                    <td className="px-4 py-2"><input type="number" name="amount" value={editData.amount} onChange={handleChange} className="editing-input text-sm" min="0" step="0.01"/></td>
                    <td className="px-4 py-2 text-center action-buttons whitespace-nowrap">
                        <button onClick={handleSave} className="px-3 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded shadow-sm">儲存</button>
                        <button onClick={handleEditToggle} className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded shadow-sm">取消</button>
                    </td>
                </>
            ) : (
                <>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.date}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{transaction.type === 'income' ? '收入' : '支出'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColorClass(transaction.category, transaction.type)}`}>{transaction.category}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{transaction.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{account ? account.name : 'N/A'}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'amount-income' : 'amount-expense'}`}>${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-center action-buttons whitespace-nowrap">
                        <button onClick={handleEditToggle} className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 rounded hover:bg-indigo-100">編輯</button>
                        <button onClick={handleDelete} className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 rounded hover:bg-red-100">刪除</button>
                    </td>
                </>
            )}
            </tr>
        );
    }

    // 手機版卡片視圖
    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
            {isEditing ? (
                // 編輯模式的卡片
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">日期</span>
                        <input type="date" name="date" value={editData.date} onChange={handleChange} className="editing-input text-sm w-2/3 border-gray-300 rounded-md" />
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-500">類型</span>
                         <span className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                             {transaction.type === 'income' ? '收入' : '支出'}
                         </span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-500">帳戶</span>
                         <select name="accountId" value={editData.accountId} onChange={handleChange} className="editing-input text-sm w-2/3 border-gray-300 rounded-md">
                            {state.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                     <div className="flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-500">分類</span>
                         <select name="category" value={editData.category} onChange={handleSelectChangeWithAddNew} className="editing-input text-sm w-2/3 border-gray-300 rounded-md">
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value={`__add_new_category_${editData.type}__`}>＋ 新增分類...</option>
                        </select>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-sm font-medium text-gray-500">項目</span>
                         <select name="description" value={editData.description} onChange={handleSelectChangeWithAddNew} className="editing-input text-sm w-2/3 border-gray-300 rounded-md">
                             {editData.category && !editData.category.startsWith('__add_new_') ? (
                                availableItems.length > 0 ? (
                                    availableItems.map(item => <option key={item} value={item}>{item}</option>)
                                ) : (
                                    <option value="">此分類尚無項目</option>
                                )
                            ) : (
                                <option value="">請先選分類</option>
                            )}
                            {editData.category && !editData.category.startsWith('__add_new_') && <option value={`__add_new_item_${editData.type}__`}>＋ 新增項目...</option>}
                        </select>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">金額</span>
                        <input type="number" name="amount" value={editData.amount} onChange={handleChange} className="editing-input text-sm w-2/3 border-gray-300 rounded-md" min="0" step="0.01"/>
                    </div>
                     <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded shadow-sm">儲存</button>
                        <button onClick={handleEditToggle} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded shadow-sm">取消</button>
                    </div>
                </div>
            ) : (
                // 顯示模式的卡片
                <div className="space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-gray-800">{transaction.description}</p>
                            <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                        <p className={`text-xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                           {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </p>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryColorClass(transaction.category, transaction.type)}`}>
                            {transaction.category}
                        </span>
                        <span className="text-gray-600">{account ? account.name : 'N/A'}</span>
                    </div>
                     <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={handleEditToggle} className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 rounded hover:bg-indigo-100">編輯</button>
                        <button onClick={handleDelete} className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 rounded hover:bg-red-100">刪除</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionItem;