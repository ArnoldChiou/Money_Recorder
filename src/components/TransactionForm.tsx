// src/components/TransactionForm.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType, Account, AssetCategory, LiabilityCategory } from '../types';
import { addTransactionToFirebase } from '../contexts/AppContext';
import { useAuthUser } from '../hooks/useAuthUser';

// --- 計算機元件 ---
const Calculator: FC<{ onResult: (value: string) => void; onClose: () => void; initialValue?: string }> = ({ onResult, onClose, initialValue = '' }) => {
    const [input, setInput] = useState(initialValue);
    const [error, setError] = useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const handleButton = (val: string) => {
        setInput(prev => prev + val);
        setError('');
    };
    const handleClear = () => {
        setInput('');
        setError('');
    };
    const handleBack = () => {
        setInput(prev => prev.slice(0, -1));
    };
    const handleResult = () => {
        try {
            // eslint-disable-next-line no-eval
            const result = eval(input.replace(/[^-+*/.\d()]/g, ''));
            if (typeof result === 'number' && !isNaN(result)) {
                onResult(result.toString());
                onClose();
            } else {
                setError('格式錯誤');
            }
        } catch {
            setError('格式錯誤');
        }
    };
    // 鍵盤支援
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.match(/[0-9.\-+*/()]/)) {
                setInput(prev => prev + e.key);
                setError('');
                e.preventDefault();
            } else if (e.key === 'Enter' || e.key === '=') {
                handleResult();
                e.preventDefault();
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleBack();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                onClose();
                e.preventDefault();
            }
        };
        // focus 並監聽
        const ref = containerRef.current;
        if (ref) ref.focus();
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input]);

    const btns1 = [7,8,9,'/'];
    const btns2 = [4,5,6,'*'];
    const btns3 = [1,2,3,'-'];
    const btns4 = ['0','.','=','+'];
    return (
        <div ref={containerRef} tabIndex={0} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" style={{outline:'none'}}>
            <div className="bg-white rounded-lg shadow-lg p-4 w-72">
                <div className="mb-2 text-right text-lg font-mono min-h-[2.5rem]">{input || '0'}</div>
                {error && <div className="text-red-500 text-xs mb-1">{error}</div>}
                <div className="grid grid-cols-4 gap-2 mb-2">
                    {btns1.map(v => <button key={v} className="btn-calc" onClick={() => handleButton(String(v))}>{v}</button>)}
                    {btns2.map(v => <button key={v} className="btn-calc" onClick={() => handleButton(String(v))}>{v}</button>)}
                    {btns3.map(v => <button key={v} className="btn-calc" onClick={() => handleButton(String(v))}>{v}</button>)}
                    {btns4.map(v => v === '='
                        ? <button key={v} className="btn-calc col-span-1 bg-green-500 text-white" onClick={handleResult}>=</button>
                        : <button key={v} className="btn-calc" onClick={() => handleButton(String(v))}>{v}</button>
                    )}
                </div>
                <div className="flex justify-between">
                    <button className="btn-calc bg-gray-200" onClick={handleClear}>清除</button>
                    <button className="btn-calc bg-gray-200" onClick={handleBack}>退格</button>
                    <button className="btn-calc bg-gray-300" onClick={onClose}>關閉</button>
                </div>
                <style>{`.btn-calc{padding:0.5rem 0.75rem;border-radius:0.375rem;border:1px solid #e5e7eb;font-size:1rem;transition:background 0.1s;}.btn-calc:active{background:#f3f4f6}`}</style>
            </div>
        </div>
    );
};

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
    const [showCalculator, setShowCalculator] = useState<false | string>(false);
    const [toast, setToast] = useState<string>('');

    const { accounts } = state;

    // 取得目前選擇帳戶的 category
    const selectedAccount = accounts.find(acc => acc.id === accountId);
    const isInvestmentAccount = selectedAccount?.category === '投資';

    // 投資帳戶專用分類與項目
    const investmentCategories = currentFormType === 'expense'
        ? ['損失','買進', '手續費', '其他投資支出']
        : ['收益','賣出', '投資收益', '其他投資收入'];
    const investmentItemsMap = {
        expense: {
            '損失': ['期貨損失', '股票損失'],
            '買進': ['買進股票', '買進基金', '買進ETF'],
            '手續費': ['券商手續費', '交易稅'],
            '其他投資支出': ['其他']
        },
        income: {
            '收益': ['期貨收益', '股票收益'],
            '賣出': ['賣出股票', '賣出基金', '賣出ETF'],
            '投資收益': ['股息', '配息', '利息'],
            '其他投資收入': ['其他']
        }
    };

    // 根據是否為投資帳戶決定分類與項目
    const categories = isInvestmentAccount
        ? investmentCategories
        : state.userDefinedData.categories[currentFormType] || [];

    let items: string[] = [];
    if (isInvestmentAccount && category) {
        if (currentFormType === 'expense' && ['損失','買進', '手續費', '其他投資支出'].includes(category)) {
            items = (investmentItemsMap.expense as Record<string, string[]>)[category] || [];
        } else if (currentFormType === 'income' && ['收益', '賣出', '投資收益', '其他投資收入'].includes(category)) {
            items = (investmentItemsMap.income as Record<string, string[]>)[category] || [];
        }
    } else {
        items = (category && state.userDefinedData.items[currentFormType]?.[category]) || [];
    }

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
        const uniqueCategories = [...new Set(categories)];
        // 自訂排序
        const customOrder = ['銀行存款', '投資', '錢包', '加密貨幣', '電子票證'];
        uniqueCategories.sort((a, b) => {
            const aIdx = customOrder.indexOf(a as string);
            const bIdx = customOrder.indexOf(b as string);
            if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
            if (aIdx === -1) return 1;
            if (bIdx === -1) return -1;
            return aIdx - bIdx;
        });
        return uniqueCategories;
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

    // --- 修正 useEffect，確保投資帳戶分類與項目穩定顯示 ---
    // 只用一個 useEffect 處理 category 預設值，優先處理投資帳戶
    useEffect(() => {
        if (isInvestmentAccount) {
            // 投資帳戶，若目前 category 不在投資分類，設為第一個
            if (!categories.includes(category)) {
                setCategory(categories[0] || '');
            }
        } else {
            // 一般帳戶，若目前 category 不在一般分類，設為第一個
            const normalCategories = state.userDefinedData.categories[currentFormType] || [];
            if (!normalCategories.includes(category)) {
                setCategory(normalCategories[0] || '');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInvestmentAccount, categories, currentFormType, state.userDefinedData.categories]);

    // 只用一個 useEffect 處理 description 預設值，優先處理投資帳戶
    useEffect(() => {
        if (category && items.length > 0) {
            if (!items.includes(description)) {
                setDescription(items[0]);
            }
        } else {
            setDescription('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category, items]);

    // ----------- useEffect 優化區塊 -----------
    // 只用一個 useEffect 控制分類與項目預設值，避免競態
    useEffect(() => {
        if (isInvestmentAccount) {
            // 投資帳戶：分類與項目都強制設為投資預設值
            if (!investmentCategories.includes(category)) {
                setCategory(investmentCategories[0]);
                setDescription((investmentItemsMap[currentFormType] as Record<string, string[]>)[investmentCategories[0]][0]);
            } else if (!items.includes(description)) {
                setDescription(items[0] || '');
            }
        } else {
            // 非投資帳戶：分類與項目都回復一般預設值
            const normalCategories = state.userDefinedData.categories[currentFormType] || [];
            if (!normalCategories.includes(category)) {
                setCategory(normalCategories[0] || '');
                const normalItems = (normalCategories[0] && state.userDefinedData.items[currentFormType]?.[normalCategories[0]]) || [];
                setDescription(normalItems[0] || '');
            } else if (!items.includes(description)) {
                setDescription(items[0] || '');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInvestmentAccount, accountId, currentFormType, category, items]);

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
        // 先立即顯示 toast，提升回饋速度
        setToast('新增成功！');
        setAmount('');
        await addTransactionToFirebase({
            type: currentFormType,
            date,
            category,
            description,
            amount: parsedAmount,
            accountId
        }, userId);
    };

    const handleTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCurrentFormType(e.target.value as TransactionType);
    };

    // 當切換帳戶時，若是投資帳戶，預設選第一個分類與第一個項目
    React.useEffect(() => {
        if (isInvestmentAccount && investmentCategories.length > 0) {
            setCategory(investmentCategories[0]);
        }
    }, [isInvestmentAccount, accountId, currentFormType]);

    // Toast 元件
    const Toast: FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(onClose, 2000);
            return () => clearTimeout(timer);
        }, [onClose]);
        return (
            <div className="fixed left-1/2 z-50 px-4 py-2 rounded shadow-lg"
                style={{
                    bottom: '24px',
                    minWidth: '120px',
                    textAlign: 'center',
                    background: 'linear-gradient(90deg, #34d399 0%, #059669 100%)',
                    color: 'white',
                    animation: 'toast-slide-in 0.5s cubic-bezier(.22,1.5,.36,1) both, toast-slide-out 0.4s 1.6s cubic-bezier(.4,2,.6,1) both',
                    transform: 'translateX(-50%)',
                }}
            >
                {message}
                <style>{`
                    @keyframes toast-slide-in {
                        0% { opacity: 0; transform: translateX(-50%) translateY(60px) scale(0.95); }
                        60% { opacity: 1; transform: translateX(-50%) translateY(-8px) scale(1.04); }
                        80% { transform: translateX(-50%) translateY(4px) scale(0.98); }
                        100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                    }
                    @keyframes toast-slide-out {
                        0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                        100% { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.97); }
                    }
                `}</style>
            </div>
        );
    };

    // 取得最近5筆紀錄（依目前分頁型態）
    const recentRecords = React.useMemo(() => {
        const filtered = state.transactions.filter(t => t.type === currentFormType);
        return filtered.length > 5
            ? filtered.slice(-5).reverse()
            : [...filtered].reverse(); // 最新一筆在最上面
    }, [state.transactions, currentFormType]);

    // 編輯/刪除功能
    const handleDelete = async (id: string) => {
        if (window.confirm('確定要刪除這筆紀錄嗎？')) {
            if (user && user.uid) {
                const { deleteTransactionFromFirebase } = await import('../contexts/AppContext');
                await deleteTransactionFromFirebase(id, user.uid);
                setToast('刪除成功！');
            }
        }
    };
    const [editId, setEditId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const handleEdit = (r: any) => {
        setEditId(r.id);
        setEditAmount(String(r.amount));
        setEditDesc(r.description);
    };
    const handleEditSave = async (r: any) => {
        if (!editAmount || isNaN(Number(editAmount)) || Number(editAmount) <= 0) {
            setToast('金額需為正數');
            return;
        }
        if (user && user.uid) {
            const { updateTransactionInFirebase } = await import('../contexts/AppContext');
            await updateTransactionInFirebase({ ...r, amount: Number(editAmount), description: editDesc }, user.uid);
            setEditId(null);
            setToast('更新成功！');
        }
    };
    const handleEditCancel = () => setEditId(null);

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
                    <div className="relative mt-1">
                        <input
                            type="number"
                            id="amount-form"
                            value={amount}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                            placeholder="150"
                            required
                            min="0"
                            step="0.01"
                            className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <button
                            type="button"
                            aria-label="開啟計算機"
                            onClick={() => {
                                // 只有支出時才自動填入餘額，收入時預設空字串
                                const balance = (currentFormType === 'expense' && selectedAccount && typeof selectedAccount.balance === 'number')
                                    ? String(selectedAccount.balance)
                                    : '';
                                setShowCalculator(balance);
                            }}
                            className="absolute inset-y-0 right-2 flex items-center px-1 text-gray-500 hover:text-indigo-600 focus:outline-none"
                            tabIndex={0}
                        >
                            {/* Calculator SVG icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                                <rect x="8" y="6" width="8" height="2" rx="1" fill="currentColor" />
                                <circle cx="8.5" cy="11.5" r="1" fill="currentColor" />
                                <circle cx="12" cy="11.5" r="1" fill="currentColor" />
                                <circle cx="15.5" cy="11.5" r="1" fill="currentColor" />
                                <circle cx="8.5" cy="15" r="1" fill="currentColor" />
                                <circle cx="12" cy="15" r="1" fill="currentColor" />
                                <circle cx="15.5" cy="15" r="1" fill="currentColor" />
                            </svg>
                        </button>
                        {showCalculator !== false && (
                            <Calculator
                                onResult={val => setAmount(val)}
                                onClose={() => setShowCalculator(false)}
                                initialValue={showCalculator}
                            />
                        )}
                    </div>
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
                            <button
                                type="button"
                                key={cat}
                                onClick={() => {
                                    setCategory(cat);
                                    if (isInvestmentAccount && (investmentItemsMap[currentFormType] as Record<string, string[]>)[cat]?.length > 0) {
                                        setDescription((investmentItemsMap[currentFormType] as Record<string, string[]>)[cat][0]);
                                    }
                                }}
                                className={`px-3 py-1.5 text-sm rounded-md border ${category === cat ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}
                            >
                                {cat}
                            </button>
                        ))}
                        {!isInvestmentAccount && (
                            <button type="button" onClick={() => openModal('category', currentFormType, '', null)}
                                    className="px-3 py-1.5 text-sm rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100">
                                ＋ 新增分類
                            </button>
                        )}
                    </div>
                </div>

                <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">項目</label>
                    <div className="flex flex-wrap gap-2">
                        <>
                            {category && items.length > 0 ? (
                                items.map((item: string) => (
                                    <button type="button" key={item} onClick={() => setDescription(item)}
                                            className={`px-3 py-1.5 text-sm rounded-md border ${description === item ? (currentFormType === 'expense' ? 'bg-orange-600 text-white border-orange-600' : 'bg-green-600 text-white border-green-600') : 'bg-white text-gray-700 border-gray-300'}`}>
                                        {item}
                                    </button>
                                ))
                            ) : category ? (
                                <span className="text-sm text-gray-500">此分類尚無項目</span>
                            ) : (
                                <span className="text-sm text-gray-500">請先選擇分類</span>
                            )}
                            {!isInvestmentAccount && category && (
                                <button type="button" onClick={() => openModal('item', currentFormType, category, null)}
                                        className="px-3 py-1.5 text-sm rounded-md border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100">
                                     ＋ 新增項目
                                 </button>
                             )}
                        </>
                    </div>
                </div>
            </form>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            {/* 最近5筆新增紀錄 */}
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">最近5筆{currentFormType === 'expense' ? '支出' : '收入'}紀錄</h3>
                <ul className="divide-y divide-gray-200 bg-white rounded shadow-sm">
                    {recentRecords.length === 0 && (
                        <li className="py-3 text-gray-400 text-center">尚無紀錄</li>
                    )}
                    {recentRecords.map(r => (
                        <li key={r.id} className="flex justify-between items-center py-2 px-4 gap-2">
                            {editId === r.id ? (
                                <>
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <input className="border rounded px-2 py-1 text-sm mb-1" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                        <input className="border rounded px-2 py-1 text-sm" value={editAmount} onChange={e => setEditAmount(e.target.value.replace(/[^\d.]/g, ''))} />
                                        <div className="text-xs text-gray-400">{r.date}</div>
                                    </div>
                                    <button className="text-green-600 font-bold px-2" onClick={() => handleEditSave(r)}>儲存</button>
                                    <button className="text-gray-500 px-2" onClick={handleEditCancel}>取消</button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-800 truncate">{r.category}｜{r.description}</div>
                                        <div className="text-xs text-gray-500">{r.date}</div>
                                    </div>
                                    <div className={`ml-4 font-bold ${currentFormType === 'expense' ? 'text-orange-600' : 'text-green-600'}`}>{r.amount}</div>
                                    <button className="ml-2 text-blue-500 hover:underline text-xs" onClick={() => handleEdit(r)}>編輯</button>
                                    <button className="ml-1 text-red-500 hover:underline text-xs" onClick={() => handleDelete(r.id)}>刪除</button>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
export default TransactionForm;