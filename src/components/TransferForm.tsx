import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { addTransferToFirebase } from '../contexts/AppContext';
import { useAuthUser } from '../hooks/useAuthUser';
import { Account, AssetCategory, LiabilityCategory } from '../types';

interface TransferFormProps {
  onSuccess?: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSuccess }) => {
  const { state } = useAppContext();
  const { user } = useAuthUser();
  const userId = user?.uid;
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Account type/category filter for from/to
  const [fromType, setFromType] = useState<'asset' | 'liability'>('asset');
  const [toType, setToType] = useState<'asset' | 'liability'>('asset');
  const [fromCategory, setFromCategory] = useState<AssetCategory | LiabilityCategory | ''>('');
  const [toCategory, setToCategory] = useState<AssetCategory | LiabilityCategory | ''>('');

  const accounts = state.accounts;

  // Get available categories for each type
  const fromCategories = useMemo(() => {
    return [...new Set(accounts.filter(acc => acc.type === fromType).map(acc => acc.category))];
  }, [accounts, fromType]);
  const toCategories = useMemo(() => {
    return [...new Set(accounts.filter(acc => acc.type === toType).map(acc => acc.category))];
  }, [accounts, toType]);

  // Set default category when type changes
  React.useEffect(() => {
    if (fromCategories.length > 0 && (!fromCategory || !fromCategories.includes(fromCategory))) {
      setFromCategory(fromCategories[0]);
    }
  }, [fromType, fromCategories, fromCategory]);
  React.useEffect(() => {
    if (toCategories.length > 0 && (!toCategory || !toCategories.includes(toCategory))) {
      setToCategory(toCategories[0]);
    }
  }, [toType, toCategories, toCategory]);

  // Filtered account lists
  const fromAccounts = accounts.filter(acc => acc.type === fromType && acc.category === fromCategory);
  const toAccounts = accounts.filter(acc => acc.type === toType && acc.category === toCategory);

  // Auto-select first available account if none selected
  React.useEffect(() => {
    if (fromAccounts.length > 0 && !fromAccounts.some(acc => acc.id === fromAccountId)) {
      setFromAccountId(fromAccounts[0].id);
    }
  }, [fromAccounts, fromAccountId]);
  React.useEffect(() => {
    if (toAccounts.length > 0 && !toAccounts.some(acc => acc.id === toAccountId)) {
      setToAccountId(toAccounts[0].id);
    }
  }, [toAccounts, toAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('請先登入');
      return;
    }
    if (!fromAccountId || !toAccountId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('請選擇帳戶並輸入有效金額');
      return;
    }
    if (fromAccountId === toAccountId) {
      alert('來源與目標帳戶不可相同');
      return;
    }
    setLoading(true);
    await addTransferToFirebase({
      fromAccountId,
      toAccountId,
      amount: Number(amount),
      date,
      note,
    }, userId);
    setLoading(false);
    setFromAccountId('');
    setToAccountId('');
    setAmount('');
    setNote('');
    if (onSuccess) onSuccess();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* 來源帳戶分類選擇 */}
      <div>
        <label className="block text-sm font-semibold text-blue-700 mb-1">來源帳戶分類</label>
        <div className="flex flex-wrap gap-3 md:gap-4 mb-2">
          <button type="button" onClick={() => setFromType('asset')} className={`px-4 py-2 text-sm rounded-lg border transition-all duration-150 shadow-sm ${fromType === 'asset' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}>資產</button>
          <button type="button" onClick={() => setFromType('liability')} className={`px-4 py-2 text-sm rounded-lg border transition-all duration-150 shadow-sm ${fromType === 'liability' ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}>負債</button>
        </div>
        <div className="mb-2">
          <span className="text-xs text-blue-600 font-medium">
            {fromType === 'asset' ? '資產類別' : '負債類別'}
          </span>
        </div>
        {fromCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 md:gap-3 mb-2">
            {fromCategories.map(cat => (
              <button type="button" key={cat} onClick={() => setFromCategory(cat)} className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-150 ${fromCategory === cat ? 'bg-blue-500 text-white border-blue-500 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}>{cat}</button>
            ))}
          </div>
        )}
      </div>
      {/* 來源帳戶選擇 */}
      <div>
        <label className="block text-sm font-semibold text-blue-700 mb-1">來源帳戶</label>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {fromAccounts.map(acc => (
            <button
              type="button"
              key={acc.id}
              onClick={() => setFromAccountId(acc.id)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-150 shadow-sm ${fromAccountId === acc.id ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
            >
              {acc.name}（{acc.category}）
            </button>
          ))}
        </div>
      </div>
      {/* 目標帳戶分類選擇 */}
      <div>
        <label className="block text-sm font-semibold text-green-700 mb-1">目標帳戶分類</label>
        <div className="flex flex-wrap gap-3 md:gap-4 mb-2">
          <button type="button" onClick={() => setToType('asset')} className={`px-4 py-2 text-sm rounded-lg border transition-all duration-150 shadow-sm ${toType === 'asset' ? 'bg-green-600 text-white border-green-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}>資產</button>
          <button type="button" onClick={() => setToType('liability')} className={`px-4 py-2 text-sm rounded-lg border transition-all duration-150 shadow-sm ${toType === 'liability' ? 'bg-green-600 text-white border-green-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}>負債</button>
        </div>
        <div className="mb-2">
          <span className="text-xs text-green-600 font-medium">
            {toType === 'asset' ? '資產類別' : '負債類別'}
          </span>
        </div>
        {toCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 md:gap-3 mb-2">
            {toCategories.map(cat => (
              <button type="button" key={cat} onClick={() => setToCategory(cat)} className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-150 ${toCategory === cat ? 'bg-green-500 text-white border-green-500 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}>{cat}</button>
            ))}
          </div>
        )}
      </div>
      {/* 目標帳戶選擇 */}
      <div>
        <label className="block text-sm font-semibold text-green-700 mb-1">目標帳戶</label>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {toAccounts.map(acc => (
            <button
              type="button"
              key={acc.id}
              onClick={() => setToAccountId(acc.id)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-150 shadow-sm ${toAccountId === acc.id ? 'bg-green-600 text-white border-green-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}
            >
              {acc.name}（{acc.category}）
            </button>
          ))}
        </div>
      </div>
      {/* 金額、日期、備註 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">金額</label>
        <input type="number" className="editing-input" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">日期</label>
        <input type="date" className="editing-input" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">備註</label>
        <input type="text" className="editing-input" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700" disabled={loading}>
          {loading ? '處理中...' : '轉帳'}
        </button>
      </div>
    </form>
  );
};

export default TransferForm;
