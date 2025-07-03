import * as React from 'react';
import { Suspense } from 'react';

const SummaryReport = React.lazy(() => import('../components/SummaryReport'));
const CategoryPieChart = React.lazy(() => import('../components/CategoryPieChart'));
const MonthlyTrendChart = React.lazy(() => import('../components/MonthlyTrendChart'));

const ReportPage: React.FC = () => {
    return (
        <div className="w-full flex flex-col gap-6 md:gap-10">
            <header className="flex flex-col items-center gap-2 py-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm text-center">
                    財務總覽與分析
                </h1>
                <p className="text-slate-500 text-base md:text-lg text-center max-w-xl">
                    深入分析您的財務狀況，掌握金錢流向。
                </p>
            </header>
            <section className="bg-white/90 rounded-2xl shadow-xl p-4 md:p-6 border border-slate-200">
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
    );
};

export default ReportPage;
