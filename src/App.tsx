// src/App.tsx
import * as React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TransactionList from './components/TransactionList';
import { useAuthUser } from './hooks/useAuthUser';
import { signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { TransactionType, ModalConfig } from './types';
import { Suspense } from 'react';
import TransactionForm from './components/TransactionForm';

const SummaryReport = React.lazy(() => import('./components/SummaryReport'));
const CategoryPieChart = React.lazy(() => import('./components/CategoryPieChart'));
const MonthlyTrendChart = React.lazy(() => import('./components/MonthlyTrendChart'));
const AddNewModal = React.lazy(() => import('./components/AddNewModal'));
const AccountManagementPage = React.lazy(() => import('./pages/AccountManagementPage'));
const AuthModal = React.lazy(() => import('./components/AuthModal'));
const AddTransactionPage = React.lazy(() => import('./pages/AddTransactionPage'));
const TransactionListPage = React.lazy(() => import('./pages/TransactionListPage'));
const ReportPage = React.lazy(() => import('./pages/ReportPage'));

const App: React.FC = () => {
    const { user, loading } = useAuthUser();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        mode: '',
        transactionType: 'expense',
        categoryName: '',
        activeSelectElement: null
    });
    const [newlyAddedItem, setNewlyAddedItem] = useState<string | null>(null);
    const [currentFormType, setCurrentFormType] = useState<TransactionType>('expense');

    React.useEffect(() => {
        const handler = () => setNewlyAddedItem(null);
        window.addEventListener('clearNewlyAddedItem', handler);
        return () => window.removeEventListener('clearNewlyAddedItem', handler);
    }, []);

    const handleOpenModal = (
        mode: 'category' | 'item',
        transactionType: TransactionType,
        categoryName: string = '',
        activeSelectElement?: HTMLSelectElement | null
    ) => {
        setModalConfig({ mode, transactionType, categoryName, activeSelectElement: activeSelectElement || null });
        setIsModalOpen(true);
    };

    const handleCloseModalAndRefresh = (newlyAddedValue: string | null = null) => {
        setIsModalOpen(false);
        const { activeSelectElement, mode } = modalConfig;

        if (mode === 'item' && newlyAddedValue) {
            setNewlyAddedItem(newlyAddedValue);
        }

        if (activeSelectElement) {
            if (newlyAddedValue) {
                let attempts = 0;
                const maxAttempts = 10;
                const trySelect = (value: string) => {
                    const optionExists = Array.from(activeSelectElement.options as unknown as HTMLOptionElement[]).some(opt => opt.value === value);
                    if (optionExists) {
                        activeSelectElement.value = value;
                        const event = new Event('change', { bubbles: true });
                        activeSelectElement.dispatchEvent(event);
                        return true;
                    }
                    return false;
                };
                const tryUntilSuccess = () => {
                    if (trySelect(newlyAddedValue!)) return;
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(tryUntilSuccess, 100);
                    }
                };
                tryUntilSuccess();
            } else if (activeSelectElement.value.startsWith('__add_new_')) {
                const firstValidOption = Array.from(activeSelectElement.options as unknown as HTMLOptionElement[]).find(opt => !opt.value.startsWith('__add_new_'));
                activeSelectElement.value = firstValidOption ? firstValidOption.value : "";
                const event = new Event('change', { bubbles: true });
                activeSelectElement.dispatchEvent(event);
            }
        }
        setModalConfig({ mode: '', transactionType: 'expense', categoryName: '', activeSelectElement: null });
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">載入中...</div>;
    }

    if (!user) {
        return (
            <Suspense fallback={<div>載入中...</div>}>
                <AuthModal
                    isOpen={true}
                    onClose={() => {}}
                    onAuthSuccess={() => {}}
                />
            </Suspense>
        );
    }

    return (
        <Router>
            <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
                <Sidebar />
                <main id="main-content-area" className="flex-1 md:ml-64 px-2 py-4 sm:px-4 lg:px-6 transition-all duration-300">
                    <Routes>
                        <Route path="/" element={
                            <div className="w-full flex flex-col gap-6 md:gap-10">
                                <header className="flex flex-col items-center gap-2 py-4">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm text-center">
                                        錢錢追蹤器 <img src="/icon.png" alt="chart icon" className="inline w-11 h-11 align-text-bottom" />
                                    </h1>
                                    <p className="text-slate-500 text-base md:text-lg text-center max-w-xl">
                                        快速記錄、分析你的日常收支，讓財務一目了然。
                                    </p>
                                    <div className="absolute top-4 right-4 hidden md:block">
                                        <span className="mr-2 text-gray-600">{user.email}</span>
                                        <button onClick={() => signOut(auth)} className="text-sm text-indigo-600 hover:underline">登出</button>
                                    </div>
                                </header>
                                <section id="add-new" className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200 scroll-mt-16">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">新增一筆紀錄</h2>
                                    <TransactionForm
                                        currentFormType={currentFormType}
                                        setCurrentFormType={setCurrentFormType}
                                        openModal={handleOpenModal}
                                        newlyAddedItem={newlyAddedItem}
                                    />
                                </section>
                                <section id="report-section-target" className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                                    <h2 className="text-lg md:text-xl font-semibold text-slate-700 mb-6 text-center flex items-center justify-center gap-2">
                                        <span className="inline-block bg-purple-100 text-purple-600 rounded px-2 py-0.5 text-sm">財務總覽與分析</span>
                                    </h2>
                                    <Suspense fallback={<div>載入中...</div>}>
                                        <SummaryReport />
                                    </Suspense>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10 items-start mt-6">
                                        <div className="bg-slate-50 rounded-xl shadow p-4 md:p-6 border border-slate-100">
                                            <Suspense fallback={<div>載入中...</div>}>
                                                <CategoryPieChart />
                                            </Suspense>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl shadow p-4 md:p-6 border border-slate-100">
                                            <Suspense fallback={<div>載入中...</div>}>
                                                <MonthlyTrendChart />
                                            </Suspense>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        } />
                        <Route path="/accounts" element={
                            <Suspense fallback={<div>載入中...</div>}>
                                <AccountManagementPage />
                            </Suspense>
                        } />
                        <Route path="/add-transaction" element={
                            <Suspense fallback={<div>載入中...</div>}>
                                <AddTransactionPage openModal={handleOpenModal} newlyAddedItem={newlyAddedItem} />
                            </Suspense>
                        } />
                        <Route path="/transactions" element={
                            <Suspense fallback={<div>載入中...</div>}>
                                <TransactionListPage openModal={handleOpenModal} />
                            </Suspense>
                        } />
                        <Route path="/reports" element={
                            <Suspense fallback={<div>載入中...</div>}>
                                <ReportPage />
                            </Suspense>
                        } />
                    </Routes>
                </main>
                <Suspense fallback={<div>載入中...</div>}>
                    {isModalOpen && (
                        <AddNewModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModalAndRefresh}
                            config={modalConfig}
                        />
                    )}
                </Suspense>
            </div>
        </Router>
    );
}

export default App;