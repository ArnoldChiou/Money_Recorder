// src/components/AddNewModal.tsx
import * as React from 'react';
import { useState, useEffect, FC, ChangeEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ModalConfig } from '../types'; // Correct path, types.ts exists in src

interface AddNewModalProps {
    isOpen: boolean;
    onClose: (newValue: string | null) => void;
    config: ModalConfig;
}

const AddNewModal: FC<AddNewModalProps> = ({ isOpen, onClose, config }) => {
    const { dispatch, state } = useAppContext();
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

    const handleSave = () => {
        setMessage('');
        const trimmedName = name.trim();
        if (!trimmedName) {
            setMessage(`${modeLabel}名稱不能為空！`);
            return;
        }

        if (mode === 'category') {
            if (state.userDefinedData.categories[transactionType]?.includes(trimmedName)) {
                setMessage(`分類 "${trimmedName}" 已存在！`);
                return;
            }
            dispatch({ type: 'ADD_CATEGORY', payload: { type: transactionType, categoryName: trimmedName } });
            onClose(trimmedName);
        } else if (mode === 'item') {
            if (!categoryName || !state.userDefinedData.items[transactionType]?.[categoryName]) {
                 setMessage(`無法新增項目：分類 "${categoryName}" 不存在或無效。`);
                 return;
            }
            if (state.userDefinedData.items[transactionType]?.[categoryName]?.includes(trimmedName)) {
                setMessage(`項目 "${trimmedName}" 在分類 "${categoryName}" 中已存在！`);
                return;
            }
            dispatch({ type: 'ADD_ITEM', payload: { type: transactionType, categoryName, itemName: trimmedName } });
            onClose(trimmedName);
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content">
                <span className="modal-close-btn" onClick={() => onClose(null)}>&times;</span>
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
