// src/components/AddNewModal.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ModalConfig, TransactionType } from '../types';
import { updateUserDataInFirebase } from '../contexts/AppContext'; // <--- 引入

interface AddNewModalProps {
    isOpen: boolean;
    onClose: (newValue: string | null) => void;
    config: ModalConfig;
}

const AddNewModal: FC<AddNewModalProps> = ({ isOpen, onClose, config }) => {
    const { state } = useAppContext(); // <-- 移除了 dispatch，只保留 state
    const [name, setName] = useState<string>('');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        setName('');
        setMessage('');
    }, [isOpen, config]);

    if (!isOpen) return null;

    const { mode, transactionType, categoryName } = config;
    const typeLabel = transactionType === 'expense' ? '支出' : '收入';
    const modeLabel = mode === 'category' ? '分類' : '項目';

    const handleSave = async () => { // <--- 改為 async
        setMessage('');
        const trimmedName = name.trim();
        if (!trimmedName) {
            setMessage(`${modeLabel}名稱不能為空！`);
            return;
        }

        // 深層複製目前的 userDefinedData，避免直接修改 state
        const newUserData = JSON.parse(JSON.stringify(state.userDefinedData));
        const currentCategories = newUserData.categories[transactionType] || [];
        const currentItems = newUserData.items[transactionType] || {};

        if (mode === 'category') {
            if (currentCategories.includes(trimmedName)) {
                setMessage(`分類 "${trimmedName}" 已存在！`);
                return;
            }
            newUserData.categories[transactionType] = [...currentCategories, trimmedName];
            // 確保新增分類時，items 中也有對應的空陣列
            if (!newUserData.items[transactionType]) {
                 newUserData.items[transactionType] = {};
            }
            newUserData.items[transactionType][trimmedName] = [];

        } else if (mode === 'item') {
            if (!categoryName || !currentItems[categoryName]) {
                 setMessage(`無法新增項目：分類 "${categoryName}" 不存在或無效。`);
                 return;
            }
            if (currentItems[categoryName].includes(trimmedName)) {
                setMessage(`項目 "${trimmedName}" 在分類 "${categoryName}" 中已存在！`);
                return;
            }
            newUserData.items[transactionType][categoryName] = [...currentItems[categoryName], trimmedName];
        }

        await updateUserDataInFirebase(newUserData); // <--- 呼叫 Firebase 函式更新
        onClose(trimmedName); // 關閉 Modal 並傳回新值
    };

    return (
        <div className="modal active fixed inset-0 flex items-center justify-center z-50">
            {/* 背景遮罩 */}
            <div className="fixed inset-0 bg-black bg-opacity-40" onClick={() => onClose(null)} />
            <div className="modal-content relative bg-white rounded-lg shadow-lg p-6 z-10 min-w-[320px] max-w-[90vw]">
                <span className="modal-close-btn absolute top-2 right-3 text-2xl cursor-pointer" onClick={() => onClose(null)}>&times;</span>
                <h3 className="text-xl font-semibold mb-4">
                    {mode === 'category' ? `新增${typeLabel}分類` : `新增項目至 ${typeLabel}分類 "${categoryName}"`}
                </h3>
                <div>
                    <label htmlFor="modal-new-name" className="block text-sm font-medium text-gray-700">
                        新{modeLabel}名稱：
                    </label>
                    <input type="text" id="modal-new-name" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                           className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                </div>
                {message && <div className="text-red-500 text-sm mt-2 mb-3">{message}</div>}
                <button onClick={handleSave} className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    儲存
                </button>
            </div>
        </div>
    );
}
export default AddNewModal;