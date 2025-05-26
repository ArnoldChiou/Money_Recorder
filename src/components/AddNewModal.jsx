// 彈窗組件
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';

function AddNewModal({ isOpen, onClose, config }) {
    const { dispatch, state } = useAppContext();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        setName(''); // Reset name when modal config changes (e.g., opens)
        setMessage('');
    }, [isOpen, config]);

    if (!isOpen) return null;

    const { mode, transactionType, categoryName } = config;
    const typeLabel = transactionType === 'expense' ? '支出' : '收入';

    const handleSave = () => {
        setMessage('');
        if (!name.trim()) {
            setMessage(`${mode === 'category' ? '分類' : '項目'}名稱不能為空！`);
            return;
        }

        if (mode === 'category') {
            if (state.userDefinedData.categories[transactionType].includes(name.trim())) {
                setMessage(`分類 "${name.trim()}" 已存在！`);
                return;
            }
            dispatch({ type: 'ADD_CATEGORY', payload: { type: transactionType, categoryName: name.trim() } });
            onClose(name.trim()); // Pass new category name back
        } else if (mode === 'item') {
            if (state.userDefinedData.items[transactionType]?.[categoryName]?.includes(name.trim())) {
                setMessage(`項目 "${name.trim()}" 在分類 "${categoryName}" 中已存在！`);
                return;
            }
            dispatch({ type: 'ADD_ITEM', payload: { type: transactionType, categoryName, itemName: name.trim() } });
            onClose(name.trim()); // Pass new item name back
        }
    };

    return (
        <div className="modal active">
            <div className="modal-content">
                <span className="modal-close-btn" onClick={() => onClose(null)}>&times;</span>
                <h3 className="text-xl font-semibold mb-4">
                    {mode === 'category' ? `新增${typeLabel}分類` : `新增項目至 ${typeLabel}分類 "${categoryName}"`}
                </h3>
                {mode === 'category' && (
                    <div>
                        <label htmlFor="modal-new-name" className="block text-sm font-medium text-gray-700">新{typeLabel}分類名稱：</label>
                        <input type="text" id="modal-new-name" value={name} onChange={(e) => setName(e.target.value)}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                )}
                {mode === 'item' && (
                    <div>
                        <label htmlFor="modal-new-name" className="block text-sm font-medium text-gray-700">新項目名稱：</label>
                        <input type="text" id="modal-new-name" value={name} onChange={(e) => setName(e.target.value)}
                               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" />
                    </div>
                )}
                {message && <div className="text-red-500 text-sm mt-2 mb-3">{message}</div>}
                <button onClick={handleSave} className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    儲存
                </button>
            </div>
        </div>
    );
}
export default AddNewModal;