import React, { createContext, useReducer, useEffect, useContext } from 'react';

const initialState = {
    transactions: [],
    userDefinedData: {
        categories: {
            expense: ["餐飲", "交通", "購物", "娛樂", "居家", "其他支出"],
            income: ["薪資", "投資", "副業", "獎金", "其他收入"]
        },
        items: {
            expense: {"餐飲": ["早餐", "午餐", "晚餐", "飲料", "零食"], "交通": ["捷運/公車"], /* ...其他預設支出項目 */ },
            income: {"薪資": ["月薪"], "投資": ["股息"], /* ...其他預設收入項目 */ }
        }
    }
};

const AppContext = createContext(initialState);

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                transactions: action.payload.transactions || [],
                userDefinedData: action.payload.userDefinedData || initialState.userDefinedData
            };
        case 'ADD_TRANSACTION':
            const newTransactions = [action.payload, ...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            return { ...state, transactions: newTransactions };
        case 'DELETE_TRANSACTION':
            return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
        case 'UPDATE_TRANSACTION':
            return {
                ...state,
                transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t)
                                           .sort((a, b) => new Date(b.date) - new Date(a.date))
            };
        case 'ADD_CATEGORY': {
            const { type: transactionType, categoryName } = action.payload;
            if (!categoryName || state.userDefinedData.categories[transactionType].includes(categoryName)) return state;
            
            const updatedCategories = {
                ...state.userDefinedData.categories,
                [transactionType]: [...state.userDefinedData.categories[transactionType], categoryName]
            };
            const updatedItems = { ...state.userDefinedData.items };
            if (!updatedItems[transactionType]) updatedItems[transactionType] = {};
            updatedItems[transactionType][categoryName] = [];

            return { ...state, userDefinedData: { categories: updatedCategories, items: updatedItems } };
        }
        case 'ADD_ITEM': {
            const { type: transactionType, categoryName, itemName } = action.payload;
            if (!itemName || !categoryName || !state.userDefinedData.items[transactionType] || !state.userDefinedData.items[transactionType][categoryName]) return state;
            if (state.userDefinedData.items[transactionType][categoryName].includes(itemName)) return state;

            const updatedItems = { ...state.userDefinedData.items };
            updatedItems[transactionType][categoryName] = [...updatedItems[transactionType][categoryName], itemName];
            
            return { ...state, userDefinedData: { ...state.userDefinedData, items: updatedItems } };
        }
        default:
            return state;
    }
};

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        // 載入 localStorage 資料
        const storedTransactions = JSON.parse(localStorage.getItem('transactionsV2')) || [];
        const storedUserDefinedData = JSON.parse(localStorage.getItem('userDefinedDataV2')) || initialState.userDefinedData;
        dispatch({ type: 'SET_INITIAL_DATA', payload: { transactions: storedTransactions, userDefinedData: storedUserDefinedData }});
    }, []);

    useEffect(() => {
        localStorage.setItem('transactionsV2', JSON.stringify(state.transactions));
    }, [state.transactions]);

    useEffect(() => {
        localStorage.setItem('userDefinedDataV2', JSON.stringify(state.userDefinedData));
    }, [state.userDefinedData]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);