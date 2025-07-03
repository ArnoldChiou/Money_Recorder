import React, { useEffect, useState } from 'react';

// 假設有一個 fetchCloudCarrierData 函式可以取得雲端載具資料
// 這裡先用 mock 資料模擬
const mockFetchCloudCarrierData = async () => {
  // 模擬 API 延遲
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    { id: '1', date: '2025-07-01', amount: 120, store: '7-11', details: '飲料' },
    { id: '2', date: '2025-07-02', amount: 250, store: '全家', details: '午餐' },
  ];
};

const CloudCarrierPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await mockFetchCloudCarrierData();
      setData(result);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">雲端載具自動抓取</h1>
      {loading ? (
        <div>載入中...</div>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-4 py-2">日期</th>
              <th className="border px-4 py-2">商店</th>
              <th className="border px-4 py-2">金額</th>
              <th className="border px-4 py-2">明細</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="border px-4 py-2">{item.date}</td>
                <td className="border px-4 py-2">{item.store}</td>
                <td className="border px-4 py-2">{item.amount}</td>
                <td className="border px-4 py-2">{item.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CloudCarrierPage;
