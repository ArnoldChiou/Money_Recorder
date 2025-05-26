// src/components/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

function TransactionForm({ currentFormType, setCurrentFormType, openModal }) {
    const { state, dispatch } = useAppContext();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');

    const categories = state.userDefinedData.categories[currentFormType] || [];
    const items = (category && state.userDefinedData.items[currentFormType] && state.userDefinedData.items[currentFormType][category]) || [];

    useEffect(() => { // Update category when form type changes
        const currentCategories = state.userDefinedData.categories[currentFormType] || [];
        setCategory(currentCategories.length > 0 ? currentCategories[0] : '');
    }, [currentFormType, state.userDefinedData.categories]);

    useEffect(() => { // Update items when category changes
        const currentItems = (category && state.userDefinedData.items[currentFormType] && state.userDefinedData.items[currentFormType][category]) || [];
        setDescription(currentItems.length > 0 ? currentItems[0] : '');
    }, [category, currentFormType, state.userDefinedData.items]);


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!category || category.startsWith('__add_new_') || !description || description.startsWith('__add_new_') || description === "" || !amount || parseFloat(amount) <= 0) {
            alert("請填寫所有有效欄位並選擇有效的項目。");
            return;
        }
        dispatch({
            type: 'ADD_TRANSACTION',
            payload: { id: Date.now(), type: currentFormType, date, category, description, amount: parseFloat(amount) }
        });
        setDate(new Date().toISOString().split('T')[0]);
        // category and description will be reset by useEffects based on currentFormType
        setAmount('');
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value.startsWith('__add_new_category_')) {
            openModal('category', currentFormType, '', e.target);
        } else {
            setCategory(value);
        }
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        if (value.startsWith('__add_new_item_')) {
            if (category && !category.startsWith('__add_new_')) {
                openModal('item', currentFormType, category, e.target);
            } else {
                alert("請先選擇一個有效的分類。");
                e.target.value = description; // Revert selection
            }
        } else {
            setDescription(value);
        }
    };

    return (
        <div className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-700">
                    {currentFormType === 'expense' ? '新增一筆支出' : '新增一筆收入'}
                </h2>
                <div className="transaction-type-toggle">
                    <input type="radio" id="type-expense-form" name="transaction-type-form" value="expense" 
                           checked={currentFormType === 'expense'} onChange={() => setCurrentFormType('expense')} />
                    <label htmlFor="type-expense-form">支出</label>
                    <input type="radio" id="type-income-form" name="transaction-type-form" value="income" 
                           checked={currentFormType === 'income'} onChange={() => setCurrentFormType('income')} />
                    <label htmlFor="type-income-form">收入</label>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                    <label htmlFor="date-form" className="block text-sm font-medium text-gray-700">日期</label>
                    <input type="date" id="date-form" value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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
                    <input type="number" id="amount-form" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150" required min="0" step="0.01" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
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