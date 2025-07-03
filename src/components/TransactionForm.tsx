// src/components/TransactionForm.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType, Account } from '../types';
import { addTransactionToFirebase } from '../contexts/AppContext';
import { useAuthUser } from '../hooks/useAuthUser';

interface TransactionFormProps {
    currentFormType: TransactionType;
    setCurrentFormType: (type: TransactionType) => void;
    openModal: (mode: 'category' | 'item', transactionType: TransactionType, categoryName?: string, activeSelectElement?: HTMLSelectElement | null) => void;
    newlyAddedItem?: string | null;
}

const TransactionForm: FC<TransactionFormProps> = ({ currentFormType, setCurrentFormType, openModal, newlyAddedItem }) => {
    const { state } = useAppContext();
    const { user } = useAuthUser();
    const userId = user?.uid;
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [accountId, setAccountId] = useState<string>('');

    const { accounts } = state;
    const categories = state.userDefinedData.categories[currentFormType] || [];
    const items = (category && state.userDefinedData.items[currentFormType]?.[category]) || [];

    const groupedAccounts = accounts.reduce((acc, account) => {
        const groupLabel = account.type === 'asset' ? '資產' : '負債';
        if (!acc[groupLabel]) {
            acc[groupLabel] = [];
        }
        acc[groupLabel].push(account);
        return acc;
    }, {} as Record<string, Account[]>);

    useEffect(() => {
        if (accounts && accounts.length > 0 && !accountId) {
            setAccountId(accounts[0].id);
        }
    }, [accounts, accountId]);

    useEffect(() => {
        const currentCategories = state.userDefinedData.categories[currentFormType] || [];
        if (!category || !currentCategories.includes(category)) {
            setCategory(currentCategories.length > 0 ? currentCategories[0] : '');
        }
    }, [currentFormType, state.userDefinedData.categories, category]);

    useEffect(() => {
        if (newlyAddedItem && items.includes(newlyAddedItem)) {
            setDescription(newlyAddedItem);
        } else {
            if (!description || !items.includes(description)) {
                setDescription(items.length > 0 ? items[0] : '');
            }
        }
    }, [items, newlyAddedItem, description]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!accountId || !category || category.startsWith('__add_new_') || !description || description.startsWith('__add_new_') || description === "" || !amount || isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("請填寫所有有效欄位並選擇有效的項目。");
            return;
        }
        if (!userId) {
            alert('請先登入');
            return;
        }
        await addTransactionToFirebase({
            type: currentFormType,
            date,
            category,
            description,
            amount: parsedAmount,
            accountId
        }, userId);
        setAmount('');
    };

    const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value.startsWith('__add_new_category_')) {
            openModal('category', currentFormType, '', e.target);
        } else {
            setCategory(value);
        }
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value.startsWith('__add_new_item_')) {
            if (category && !category.startsWith('__add_new_')) {
                openModal('item', currentFormType, category, e.target);
            } else {
                alert("請先選擇一個有效的分類。");
                e.target.value = description;
            }
        } else {
            setDescription(value);
        }
    };

    const handleTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentFormType(e.target.value as TransactionType);
    };

    return (
        <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">
                    {currentFormType === 'expense' ? '新增一筆支出' : '新增一筆收入'}
                </h2>
                <div className="transaction-type-toggle">
                    <input type="radio" id="type-expense-form" name="transaction-type-form" value="expense"
                           checked={currentFormType === 'expense'} onChange={handleTypeChange} />
                    <label htmlFor="type-expense-form">支出</label>
                    <input type="radio" id="type-income-form" name="transaction-type-form" value="income"
                           checked={currentFormType === 'income'} onChange={handleTypeChange} />
                    <label htmlFor="type-income-form">收入</label>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-4 items-end">
                <div>
                    <label htmlFor="date-form" className="block text-sm font-medium text-gray-700">日期</label>
                    <input type="date" id="date-form" value={date} onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="account-form" className="block text-sm font-medium text-gray-700">帳戶</label>
                    <select id="account-form" value={accountId} onChange={(e) => setAccountId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {Object.entries(groupedAccounts).map(([groupName, groupAccounts]) => (
                            <optgroup label={groupName} key={groupName}>
                                {(groupAccounts as Account[]).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.category})</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="category-form" className="block text-sm font-medium text-gray-700">分類</label>
                    <select id="category-form" value={category} onChange={handleCategoryChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value={`__add_new_category_${currentFormType}__`}>＋ 新增{currentFormType === 'expense' ? '支出' : '收入'}分類...</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="description-form" className="block text-sm font-medium text-gray-700">項目</label>
                    <select id="description-form" value={description} onChange={handleDescriptionChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        {category && !category.startsWith('__add_new_') ? (
                            items.length > 0 ? (
                                items.map(item => <option key={item} value={item}>{item}</option>)
                            ) : (
                                <option value="">此分類尚無項目</option>
                            )
                        ) : (
                            <option value="">請先選擇分類</option>
                        )}
                        {category && !category.startsWith('__add_new_') && <option value={`__add_new_item_${currentFormType}__`}>＋ 新增{currentFormType === 'expense' ? '支出' : '收入'}項目...</option>}
                    </select>
                </div>
                <div>
                    <label htmlFor="amount-form" className="block text-sm font-medium text-gray-700">金額</label>
                    <input type="number" id="amount-form" value={amount} onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="150" required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <button type="submit" className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentFormType === 'expense' ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}>
                        {currentFormType === 'expense' ? '新增支出' : '新增收入'}
                    </button>
                </div>
            </form>
        </div>
    );
}
export default TransactionForm;