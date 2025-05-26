// src/App.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import SummaryReport from './components/SummaryReport';
import CategoryPieChart from './components/CategoryPieChart';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import AddNewModal from './components/AddNewModal';
import { useAppContext } from './contexts/AppContext';

function App() {
    const { state, dispatch } = useAppContext();
    const [currentFormType, setCurrentFormType] = useState('expense');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        mode: '',
        transactionType: 'expense',
        categoryName: '',
        activeSelectElement: null
    });

    const handleOpenModal = (mode, transactionType, categoryName = '', activeSelectElement) => {
        setModalConfig({ mode, transactionType, categoryName, activeSelectElement });
        setIsModalOpen(true);
    };
    const handleCloseModalAndRefresh = (newlyAddedValue = null) => {
        setIsModalOpen(false);
        const { activeSelectElement } = modalConfig;
        if (activeSelectElement) {
            let shouldTriggerChange = false;
            if (newlyAddedValue) {
                let foundAndSelected = false;
                for (let i = 0; i < activeSelectElement.options.length; i++) {
                    if (activeSelectElement.options[i].value === newlyAddedValue) {
                        activeSelectElement.value = newlyAddedValue;
                        foundAndSelected = true;
                        break;
                    }
                }
                if (!foundAndSelected) {
                    if (activeSelectElement.closest('#transaction-form')) {
                        setTimeout(() => {
                            if (activeSelectElement.querySelector(`option[value="${newlyAddedValue}"]`)) {
                                activeSelectElement.value = newlyAddedValue;
                                const event = new Event('change', { bubbles: true });
                                activeSelectElement.dispatchEvent(event);
                            }
                        }, 0);
                    }
                } else {
                    shouldTriggerChange = true;
                }
            } else if (activeSelectElement.value.startsWith('__add_new_')) {
                if (activeSelectElement.options.length > 1) {
                    const firstValidOption = Array.from(activeSelectElement.options).find(opt => !opt.value.startsWith('__add_new_'));
                    activeSelectElement.value = firstValidOption ? firstValidOption.value : "";
                } else {
                    activeSelectElement.value = "";
                }
                shouldTriggerChange = true;
            }
            if (shouldTriggerChange) {
                const event = new Event('change', { bubbles: true });
                activeSelectElement.dispatchEvent(event);
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
            <Sidebar />
            <main id="main-content-area" className="flex-1 md:ml-64 px-2 py-4 sm:px-4 lg:px-6 transition-all duration-300">
                <div className="w-full flex flex-col gap-6 md:gap-10">
                    <header className="flex flex-col items-center gap-2 py-4">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm text-center">
                            錢錢追蹤器 <img src="/icon.png" alt="chart icon" className="inline w-11 h-11 align-text-bottom" />
                        </h1>
                        <p className="text-slate-500 text-base md:text-lg text-center max-w-xl">
                            快速記錄、分析你的日常收支，讓財務一目了然。
                        </p>
                    </header>
                    <section id="form-section-target" className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                        <h2 className="text-lg md:text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <span className="inline-block bg-blue-100 text-blue-600 rounded px-2 py-0.5 text-sm">新增記錄</span>
                        </h2>
                        <TransactionForm
                            currentFormType={currentFormType}
                            setCurrentFormType={setCurrentFormType}
                            openModal={handleOpenModal}
                        />
                    </section>
                    <section id="list-section-target" className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                        <h2 className="text-lg md:text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <span className="inline-block bg-green-100 text-green-600 rounded px-2 py-0.5 text-sm">收支列表</span>
                            <span className="text-xs text-gray-400">(可直接編輯)</span>
                        </h2>
                        <TransactionList openModal={handleOpenModal} />
                    </section>
                    <section id="report-section-target" className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
                        <h2 className="text-lg md:text-xl font-semibold text-slate-700 mb-6 text-center flex items-center justify-center gap-2">
                            <span className="inline-block bg-purple-100 text-purple-600 rounded px-2 py-0.5 text-sm">財務總覽與分析</span>
                        </h2>
                        <SummaryReport />
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10 items-start mt-6">
                            <div className="bg-slate-50 rounded-xl shadow p-4 md:p-6 border border-slate-100">
                                <CategoryPieChart />
                            </div>
                            <div className="bg-slate-50 rounded-xl shadow p-4 md:p-6 border border-slate-100">
                                <MonthlyTrendChart />
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            {isModalOpen && (
                <AddNewModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModalAndRefresh}
                    config={modalConfig}
                />
            )}
        </div>
    );
}

export default App;