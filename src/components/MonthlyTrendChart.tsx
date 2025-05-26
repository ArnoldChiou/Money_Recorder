// src/components/MonthlyTrendChart.tsx
import React, { useMemo, FC } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartData,
    ChartOptions,
    TooltipItem
} from 'chart.js';
import { useAppContext } from '../contexts/AppContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MonthlyTrendChart: FC = () => {
    const { state } = useAppContext();
    const { transactions } = state;

    const dataForChart: ChartData<'line'> | null = useMemo(() => {
        const monthly: { income: { [key: string]: number }; expense: { [key: string]: number } } = { income: {}, expense: {} };
        transactions.forEach(t => {
            const month = t.date.substring(0, 7); // YYYY-MM
            if (!monthly[t.type][month]) monthly[t.type][month] = 0;
            monthly[t.type][month] += t.amount;
        });

        const allMonths = new Set([...Object.keys(monthly.income), ...Object.keys(monthly.expense)]);
        const sortedLabels = Array.from(allMonths).sort();

        if (sortedLabels.length === 0) return null;

        const incomeValues = sortedLabels.map(month => monthly.income[month] || 0);
        const expenseValues = sortedLabels.map(month => monthly.expense[month] || 0);

        return {
            labels: sortedLabels,
            datasets: [
                {
                    label: '總收入',
                    data: incomeValues,
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    fill: true,
                    tension: 0.1
                },
                {
                    label: '總支出',
                    data: expenseValues,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: true,
                    tension: 0.1
                }
            ]
        };
    }, [transactions]);

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context: TooltipItem<'line'>) => {
                        return `${context.dataset.label || ''}: $${context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => '$' + (typeof value === 'number' ? value.toLocaleString() : value)
                }
            }
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-3 text-center">每月收支趨勢</h3>
            <div className="line-chart-container" style={{ height: '300px', margin: 'auto' }}>
                {dataForChart ? (
                    <Line data={dataForChart} options={options} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">尚無數據顯示</div>
                )}
            </div>
        </div>
    );
}

export default MonthlyTrendChart;