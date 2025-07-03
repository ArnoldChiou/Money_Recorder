// src/pages/CloudCarrierPage.tsx
import React, { useState } from 'react';

interface Invoice {
    id: string;
    date: string;
    store: string;
    amount: number;
    details: string;
}

const CloudCarrierPage: React.FC = () => {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [password, setPassword] = useState('');

  const handleFetchData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData([]);

    try {
      // 呼叫我們在 /api 資料夾下建立的後端函式
      const response = await fetch('/api/getCarrierInvoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '發生未知錯誤');
      }

      setData(result.data);

    } catch (err: any) {
      console.error("呼叫 API 失敗:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">雲端載具消費明細</h1>
      <p className="text-gray-600 mb-6">請輸入您的手機條碼與驗證碼 (密碼) 來查詢。資料將透過安全的後端通道向財政部平台請求。</p>

      <form onSubmit={handleFetchData} className="mb-6 p-4 border rounded-lg bg-slate-50 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow w-full">
          <label className="block text-sm font-medium text-gray-700">手機條碼</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="例如 /ABC+123"
            required
          />
        </div>
        <div className="flex-grow w-full">
          <label className="block text-sm font-medium text-gray-700">驗證碼 (密碼)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-indigo-300">
          {loading ? '查詢中...' : '安全查詢'}
        </button>
      </form>

      {error && <div className="text-red-600 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

      {loading && <div className="text-center text-gray-500">正在透過後端安全連線，請稍候...</div>}

      {!loading && data.length > 0 && (
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-400">
            <thead className="bg-slate-100">
                <tr>
                <th className="border border-slate-300 px-4 py-2 text-left">日期</th>
                <th className="border border-slate-300 px-4 py-2 text-left">商店</th>
                <th className="border border-slate-300 px-4 py-2 text-right">金額</th>
                <th className="border border-slate-300 px-4 py-2 text-left">明細</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-4 py-2">{item.date}</td>
                    <td className="border border-slate-300 px-4 py-2">{item.store}</td>
                    <td className="border border-slate-300 px-4 py-2 text-right font-mono">{item.amount.toLocaleString()}</td>
                    <td className="border border-slate-300 px-4 py-2">{item.details}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default CloudCarrierPage;