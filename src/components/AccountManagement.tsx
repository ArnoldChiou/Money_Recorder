import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext'; // Import useAppContext
import { addAccountToFirebase, updateAccountInFirebase, deleteAccountFromFirebase } from '../contexts/AppContext'; // Import Firebase functions
import { Account, AssetCategory, LiabilityCategory } from '../types';
import { useAuthUser } from '../hooks/useAuthUser';

const AccountManagement: React.FC = () => {
  const { state } = useAppContext(); // Use global state, dispatch is not directly used here for setting accounts
  const { accounts } = state; // Get accounts from global state
  const { user } = useAuthUser();
  const userId = user?.uid;

  const [showModal, setShowModal] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'asset' | 'liability'>('asset');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('銀行存款');
  const [liabilityCategory, setLiabilityCategory] = useState<LiabilityCategory>('信用卡');
  const [balance, setBalance] = useState(0);

  const assetCategories: AssetCategory[] = ['銀行存款', '錢包', '投資', '加密貨幣', '電子票證'];
  const liabilityCategories: LiabilityCategory[] = ['信用卡', '信用卡分期付款', '貸款'];

  const handleAddAccountClick = () => { // Renamed to avoid conflict if any
    setCurrentAccount(null);
    setAccountName('');
    setAccountType('asset');
    setAssetCategory('銀行存款');
    setLiabilityCategory('信用卡');
    setBalance(0);
    setShowModal(true);
  };

  const handleEditAccountClick = (account: Account) => { // Renamed to avoid conflict if any
    setCurrentAccount(account);
    setAccountName(account.name);
    setAccountType(account.type);
    if (account.type === 'asset') {
      setAssetCategory(account.category as AssetCategory);
    } else {
      setLiabilityCategory(account.category as LiabilityCategory);
    }
    setBalance(account.balance);
    setShowModal(true);
  };

  const handleDeleteAccountClick = async (accountId: string) => { // Renamed to avoid conflict if any
    if (!userId) {
      alert('請先登入');
      return;
    }
    if (window.confirm('確定要刪除此帳戶嗎？')) {
      await deleteAccountFromFirebase(accountId, userId);
      // Firestore listener in AppContext will update the state
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = accountType === 'asset' ? assetCategory : liabilityCategory;
    if (!userId) {
      alert('請先登入');
      return;
    }
    if (currentAccount) {
      const updatedAccount: Account = {
        ...currentAccount,
        name: accountName,
        type: accountType,
        category,
        balance
      };
      await updateAccountInFirebase(updatedAccount, userId);
    } else {
      const newAccountData: Omit<Account, 'id'> = {
        name: accountName,
        type: accountType,
        category,
        balance
      };
      await addAccountToFirebase(newAccountData, userId);
    }
    setShowModal(false);
    // Firestore listener in AppContext will update the state
  };

  const assetAccounts = accounts.filter(account => account.type === 'asset');
  const liabilityAccounts = accounts.filter(account => account.type === 'liability');

  const groupAccountsByCategory = (accounts: Account[]) => {
    return accounts.reduce((acc, account) => {
      const { category } = account;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(account);
      return acc;
    }, {} as Record<string, Account[]>);
  };

  const groupedAssetAccounts = groupAccountsByCategory(assetAccounts);
  const groupedLiabilityAccounts = groupAccountsByCategory(liabilityAccounts);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">帳戶管理</h2>
      <button
        onClick={handleAddAccountClick} // Updated handler name
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        新增帳戶
      </button>

      {/* Accounts List */}
      <div className="space-y-8">
        <div>
          <h3 className="text-2xl font-bold mb-4">資產</h3>
          <div className="space-y-4">
            {Object.entries(groupedAssetAccounts).map(([category, accountsInCategory]) => (
              <div key={category} className="bg-gray-50 p-4 rounded-lg shadow-inner">
                <h4 className="text-xl font-semibold text-gray-800 mb-3">{category}</h4>
                <div className="space-y-2">
                  {accountsInCategory.map(account => (
                    <div key={account.id} className="bg-white p-3 border rounded shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{account.name}</p>
                        <p className="text-sm text-gray-600">餘額: {account.balance.toLocaleString()}</p>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEditAccountClick(account)}
                          className="text-sm bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-2 rounded"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteAccountClick(account.id)}
                          className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-4">負債</h3>
          <div className="space-y-4">
            {Object.entries(groupedLiabilityAccounts).map(([category, accountsInCategory]) => (
              <div key={category} className="bg-gray-50 p-4 rounded-lg shadow-inner">
                <h4 className="text-xl font-semibold text-gray-800 mb-3">{category}</h4>
                <div className="space-y-2">
                  {accountsInCategory.map(account => (
                    <div key={account.id} className="bg-white p-3 border rounded shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{account.name}</p>
                        <p className="text-sm text-gray-600">餘額: {account.balance.toLocaleString()}</p>
                      </div>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEditAccountClick(account)}
                          className="text-sm bg-yellow-500 hover:bg-yellow-700 text-white py-1 px-2 rounded"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleDeleteAccountClick(account.id)}
                          className="text-sm bg-red-500 hover:bg-red-700 text-white py-1 px-2 rounded"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">{currentAccount ? '編輯帳戶' : '新增帳戶'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">帳戶名稱</label>
                <input
                  type="text"
                  id="accountName"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">帳戶類型</label>
                <select
                  id="accountType"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as 'asset' | 'liability')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="asset">資產</option>
                  <option value="liability">負債</option>
                </select>
              </div>

              {accountType === 'asset' && (
                <div className="mb-4">
                  <label htmlFor="assetCategory" className="block text-sm font-medium text-gray-700">資產類別</label>
                  <select
                    id="assetCategory"
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {assetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}

              {accountType === 'liability' && (
                <div className="mb-4">
                  <label htmlFor="liabilityCategory" className="block text-sm font-medium text-gray-700">負債類別</label>
                  <select
                    id="liabilityCategory"
                    value={liabilityCategory}
                    onChange={(e) => setLiabilityCategory(e.target.value as LiabilityCategory)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {liabilityCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="balance" className="block text-sm font-medium text-gray-700">目前餘額</label>
                <input
                  type="number"
                  id="balance"
                  value={balance}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)} // Ensure balance is a number
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {currentAccount ? '儲存變更' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
