// src/contexts/AppContext.tsx
import * as React from 'react';
import { createContext, useReducer, useEffect, useContext, ReactNode, Dispatch, FC } from 'react';
import { AppState, AppAction, Transaction, UserDefinedData, TransactionType, AppContextType } from '../types'; // Path relative to this file

const initialState: AppState = {
    transactions: [],
    userDefinedData: {
        categories: {
            expense: ["餐飲", "交通", "購物", "娛樂", "居家", "其他支出"],
            income: ["薪資", "投資", "副業", "獎金", "其他收入"]
        },
        items: {
            expense: {"餐飲": ["早餐", "午餐", "晚餐", "飲料", "零食"], "交通": ["捷運/公車"]},
            income: {"薪資": ["月薪"], "投資": ["股息"]}
        }
    }
};

const AppContext = createContext<AppContextType>({
    state: initialState,
    dispatch: () => null
});

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                transactions: action.payload.transactions || [],
                userDefinedData: action.payload.userDefinedData || initialState.userDefinedData
            };
        case 'ADD_TRANSACTION':
            const newTransactions = [action.payload, ...state.transactions].sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { ...state, transactions: newTransactions };
        case 'DELETE_TRANSACTION':
            return { ...state, transactions: state.transactions.filter((t: Transaction) => t.id !== action.payload) };
        case 'UPDATE_TRANSACTION':
            return {
                ...state,
                transactions: state.transactions.map((t: Transaction) => t.id === action.payload.id ? action.payload : t)
                                           .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };
        case 'ADD_CATEGORY': {
            const { type: transactionType, categoryName } = action.payload;
            if (!categoryName || state.userDefinedData.categories[transactionType]?.includes(categoryName)) return state;

            const updatedCategories = {
                ...state.userDefinedData.categories,
                [transactionType]: [...(state.userDefinedData.categories[transactionType] || []), categoryName]
            };

            const updatedItemsForType = state.userDefinedData.items[transactionType] || {};
            const updatedItems = {
                ...state.userDefinedData.items,
                [transactionType]: {
                    ...updatedItemsForType,
                    [categoryName]: []
                }
            };

            return { ...state, userDefinedData: { categories: updatedCategories, items: updatedItems } };
        }
        case 'ADD_ITEM': {
            const { type: transactionType, categoryName, itemName } = action.payload;
            if (!itemName || !categoryName || !state.userDefinedData.items[transactionType]?.[categoryName]) return state;
            if (state.userDefinedData.items[transactionType]?.[categoryName]?.includes(itemName)) return state;

            const updatedItemsForType = state.userDefinedData.items[transactionType] || {};
            const updatedItemsForCategory = updatedItemsForType[categoryName] || [];

            const updatedItems = {
                ...state.userDefinedData.items,
                [transactionType]: {
                    ...updatedItemsForType,
                    [categoryName]: [...updatedItemsForCategory, itemName]
                }
            };
            return { ...state, userDefinedData: { ...state.userDefinedData, items: updatedItems } };
        }
        default:
            // For exhaustive check, though not strictly necessary with default return
            // const _exhaustiveCheck: never = action;
            return state;
    }
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        try {
            const storedTransactionsRaw = localStorage.getItem('transactionsV2');
            const storedUserDefinedDataRaw = localStorage.getItem('userDefinedDataV2');

            const storedTransactions: Transaction[] = storedTransactionsRaw ? JSON.parse(storedTransactionsRaw) : [];
            const storedUserDefinedData: UserDefinedData = storedUserDefinedDataRaw ? JSON.parse(storedUserDefinedDataRaw) : initialState.userDefinedData;

            dispatch({ type: 'SET_INITIAL_DATA', payload: { transactions: storedTransactions, userDefinedData: storedUserDefinedData }});
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
             dispatch({ type: 'SET_INITIAL_DATA', payload: { transactions: [], userDefinedData: initialState.userDefinedData }});
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('transactionsV2', JSON.stringify(state.transactions));
        } catch (error) {
             console.error("Failed to save transactions to localStorage:", error);
        }
    }, [state.transactions]);

    useEffect(() => {
         try {
            localStorage.setItem('userDefinedDataV2', JSON.stringify(state.userDefinedData));
        } catch (error) {
             console.error("Failed to save user data to localStorage:", error);
        }
    }, [state.userDefinedData]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => useContext(AppContext);
