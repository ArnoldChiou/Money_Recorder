// src/components/CategoryPieChart.tsx
import * as React from 'react';
import { useState, useMemo, FC, ChangeEvent } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { useAppContext } from '../contexts/AppContext';
import { TransactionType } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#4D5360', '#FFCD56', '#36A2EB'];

const CategoryPieChart: FC = () => {
    const { state } = useAppContext();
    const { transactions } = state;
    const [chartType, setChartType] = useState<TransactionType>('expense');

    const categoryData = useMemo(() => {
        const totals: { [key: string]: number } = {};
        transactions
            .filter(t => t.type === chartType)
            .forEach(t => {
                totals[t.category] = (totals[t.category] || 0) + t.amount;
            });
        return totals;
    }, [transactions, chartType]);

    const dataForChart: ChartData<'pie'> | null = useMemo(() => {
        const labels = Object.keys(categoryData);
        const dataValues = Object.values(categoryData);

        if (labels.length === 0) return null;

        return {
            labels: labels,
            datasets: [{
                label: `${chartType === 'expense' ? '支出' : '收入'}金額`,
                data: dataValues,
                backgroundColor: labels.map((_, i) => chartColors[i % chartColors.length]),
                hoverOffset: 4
            }]
        };
    }, [categoryData, chartType]);

    const options: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context: TooltipItem<'pie'>) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const datasetData = context.chart.data.datasets[0].data as number[];
                        const total = datasetData.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                        return `${label}: $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage})`;
                    }
                }
            }
        }
    };

    const noDataMessage = `尚無${chartType === 'expense' ? '支出' : '收入'}分類數據`;

    const handleTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
        setChartType(e.target.value as TransactionType);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg sm:text-xl font-medium text-gray-800">分類佔比圓餅圖</h3>
                <div className="transaction-type-toggle text-sm">
                    <input type="radio" id="pie-type-expense-chart" name="pie-chart-type-selector"
                           value="expense" checked={chartType === 'expense'} onChange={handleTypeChange} />
                    <label htmlFor="pie-type-expense-chart">支出</label>
                    <input type="radio" id="pie-type-income-chart" name="pie-chart-type-selector"
                           value="income" checked={chartType === 'income'} onChange={handleTypeChange} />
                    <label htmlFor="pie-type-income-chart">收入</label>
                </div>
            </div>
            <div className="chart-container" style={{ height: '300px', maxWidth: '400px', margin: 'auto' }}>
                {dataForChart ? (
                    <Pie data={dataForChart} options={options} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">{noDataMessage}</div>
                )}
            </div>
        </div>
    );
}

export default CategoryPieChart;