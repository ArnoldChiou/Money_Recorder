// src/components/TransactionItem.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Transaction, TransactionType } from '../types';

interface TransactionItemProps {
    transaction: Transaction;
    openModal: (mode: 'category' | 'item', transactionType: TransactionType, categoryName?: string, activeSelectElement?: HTMLSelectElement | null) => void;
    index: number;
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

const TransactionItem: FC<TransactionItemProps> = ({ transaction, openModal, index }) => {
    const { state, dispatch } = useAppContext();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editData, setEditData] = useState<Transaction>({ ...transaction });

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
            newAmount = isNaN(parsedValue) ? 0 : parsedValue; // Handle NaN, default to 0 or keep old?
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
        const fieldName = e.target.name;

        if (value.startsWith('__add_new_')) {
            const type = value.includes('_category_') ? 'category' : 'item';
            const categoryForNewItem = type === 'item' ? editData.category : '';
            openModal(type, editData.type, categoryForNewItem, e.target);
        } else {
             handleChange(e);
        }
    };

    const handleSave = () => {
        if (!editData.category || editData.category.startsWith('__add_new_') ||
            !editData.description || editData.description.startsWith('__add_new_') || editData.description === "" ||
            isNaN(editData.amount) || editData.amount <= 0) {
            alert("請填寫所有有效欄位並選擇有效的項目。");
            return;
        }
        dispatch({ type: 'UPDATE_TRANSACTION', payload: editData });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('您確定要刪除這筆紀錄嗎？')) {
            dispatch({ type: 'DELETE_TRANSACTION', payload: transaction.id });
        }
    };

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
export default TransactionItem;