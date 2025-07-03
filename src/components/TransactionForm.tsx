// src/components/TransactionForm.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType, Account, AssetCategory, LiabilityCategory } from '../types';
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
    const [accountTypeFilter, setAccountTypeFilter] = useState<'asset' | 'liability'>('asset');
    const [accountCategoryFilter, setAccountCategoryFilter] = useState<AssetCategory | LiabilityCategory | ''>('');

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

    const availableAccountCategories = React.useMemo(() => {
        const categories = accounts
            .filter(acc => acc.type === accountTypeFilter)
            .map(acc => acc.category);
        return [...new Set(categories)];
    }, [accounts, accountTypeFilter]);

    useEffect(() => {
        if (availableAccountCategories.length > 0) {
            if (!accountCategoryFilter || !availableAccountCategories.includes(accountCategoryFilter)) {
                setAccountCategoryFilter(availableAccountCategories[0]);
            }
        } else {
            setAccountCategoryFilter('');
        }
    }, [accountTypeFilter, availableAccountCategories, accountCategoryFilter]);

    useEffect(() => {
        const filteredAccounts = accounts.filter(acc => acc.type === accountTypeFilter && acc.category === accountCategoryFilter);

        if (filteredAccounts.length > 0) {
            const isAccountSelectedInList = filteredAccounts.some(acc => acc.id === accountId);
            if (!isAccountSelectedInList) {
                setAccountId(filteredAccounts[0].id);
            }
        } else {
            setAccountId('');
        }
    }, [accounts, accountId, accountTypeFilter, accountCategoryFilter]);

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
        if (!accountId || !category || !description || description === "" || !amount || isNaN(parsedAmount) || parsedAmount <= 0) {
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
                    <div className="glider"></div>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-6 items-start">
                <div className="md:col-span-2">
                    <label htmlFor="date-form" className="block text-sm font-medium text-gray-700">日期</label>
                    <input type="date" id="date-form" value={date} onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="amount-form" className="block text-sm font-medium text-gray-700">金額</label>
                    <input type="number" id="amount-form" value={amount} onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} placeholder="150" required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="md:col-span-2 self-end">
                    <button type="submit" className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentFormType === 'expense' ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-600' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}>
                        {currentFormType === 'expense' ? '新增支出' : '新增收入'}
                    </button>
                </div>

                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">帳戶類型</label>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setAccountTypeFilter('asset')}
                                className={`px-3 py-1.5 text-sm rounded-md border ${accountTypeFilter === 'asset' ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                            資產
                        </button>
                        <button type="button" onClick={() => setAccountTypeFilter('liability')}
                                className={`px-3 py-1.5 text-sm rounded-md border ${accountTypeFilter === 'liability' ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                            負債
                        </button>
                    </div>
                </div>

                {availableAccountCategories.length > 1 && (
                    <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">帳戶分類</label>
                        <div className="flex flex-wrap gap-2">
                            {availableAccountCategories.map(cat => (
                                <button type="button" key={cat} onClick={() => setAccountCategoryFilter(cat)}
                                        className={`px-3 py-1.5 text-sm rounded-md border ${accountCategoryFilter === cat ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">帳戶</label>
                    <div className="flex flex-wrap gap-2">
                        {accounts
                            .filter(acc => acc.type === accountTypeFilter && acc.category === accountCategoryFilter)
                            .map(acc => (
                                <button type="button" key={acc.id} onClick={() => setAccountId(acc.id)}
                                        className={`px-3 py-1.5 text-sm rounded-md border ${accountId === acc.id ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                                     {acc.name}
                                </button>
                            ))}
                    </div>
                </div>

                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button type="button" key={cat} onClick={() => setCategory(cat)}
                                    className={`px-3 py-1.5 text-sm rounded-md border ${category === cat ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                                {cat}
                            </button>
                        ))}
                        <button type="button" onClick={() => openModal('category', currentFormType, '', null)}
                                className="px-3 py-1.5 text-sm rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100">
                            ＋ 新增分類
                        </button>
                    </div>
                </div>

                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">項目</label>
                    <div className="flex flex-wrap gap-2">
                        {category ? (
                            items.length > 0 ? (
                                items.map(item => (
                                    <button type="button" key={item} onClick={() => setDescription(item)}
                                            className={`px-3 py-1.5 text-sm rounded-md border ${description === item ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                                        {item}
                                    </button>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500">此分類尚無項目</span>
                            )
                        ) : (
                            <span className="text-sm text-gray-500">請先選擇分類</span>
                        )}
                        {category && (
                            <button type="button" onClick={() => openModal('item', currentFormType, category, null)}
                                    className="px-3 py-1.5 text-sm rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100">
                                 ＋ 新增項目
                             </button>
                         )}
                     </div>
                 </div>
            </form>
        </div>
    );
}
export default TransactionForm;