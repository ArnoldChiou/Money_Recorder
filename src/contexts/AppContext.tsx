// src/contexts/AppContext.tsx
import * as React from 'react';
import { createContext, useReducer, useEffect, useContext, ReactNode, FC } from 'react';
import { AppState, AppAction, Transaction, UserDefinedData, TransactionType, AppContextType } from '../types';
import { db } from '../firebaseConfig'; // 引入 Firestore 實例
import {
    collection,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    getDoc,
    setDoc,
    DocumentData, // 引入 DocumentData 類型
    QueryDocumentSnapshot // 引入 QueryDocumentSnapshot 類型
} from "firebase/firestore";

const TRANSACTIONS_COLLECTION = 'transactions';
const USER_DATA_DOC_PATH = 'userData/main';

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

// Reducer 現在主要負責根據 Firestore 的更新來設定狀態
const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };
        case 'SET_USER_DATA':
             return { ...state, userDefinedData: action.payload };
        // 保留這些 case 但不做任何事，或印出警告，因為操作已移至非同步函式
        case 'ADD_TRANSACTION':
        case 'DELETE_TRANSACTION':
        case 'UPDATE_TRANSACTION':
        case 'ADD_CATEGORY':
        case 'ADD_ITEM':
             console.warn(`Action ${action.type} should be handled via async Firebase calls and onSnapshot updates.`);
             return state;
        default:
            return state;
    }
};

// --- 非同步 Firebase 函式 (匯出供組件使用) ---

export const addTransactionToFirebase = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
        await addDoc(collection(db, TRANSACTIONS_COLLECTION), transactionData);
    } catch (error) {
        console.error("Error adding transaction: ", error);
        alert("新增失敗，請檢查網路連線或稍後再試。");
    }
};

export const deleteTransactionFromFirebase = async (id: string) => {
    try {
        await deleteDoc(doc(db, TRANSACTIONS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting transaction: ", error);
        alert("刪除失敗！");
    }
};

export const updateTransactionInFirebase = async (transaction: Transaction) => {
    try {
        const { id, ...dataToUpdate } = transaction;
        await updateDoc(doc(db, TRANSACTIONS_COLLECTION, id), dataToUpdate);
    } catch (error) {
        console.error("Error updating transaction: ", error);
        alert("更新失敗！");
    }
};

export const updateUserDataInFirebase = async (newUserData: UserDefinedData) => {
     try {
        await setDoc(doc(db, USER_DATA_DOC_PATH), newUserData);
    } catch (error) {
        console.error("Error updating user data: ", error);
        alert("更新分類/項目失敗！");
    }
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // 監聽 Transactions 集合的變化
    useEffect(() => {
        const q = query(collection(db, TRANSACTIONS_COLLECTION), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transactionsFromDb: Transaction[] = [];
            querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                transactionsFromDb.push({ id: doc.id, ...doc.data() } as Transaction);
            });
            dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsFromDb });
        }, (error) => {
            console.error("Error listening to transactions: ", error);
            alert("無法載入交易紀錄！");
        });

        return () => unsubscribe();
    }, []);

    // 監聽 UserData 文件的變化
    useEffect(() => {
        const docRef = doc(db, USER_DATA_DOC_PATH);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                dispatch({ type: 'SET_USER_DATA', payload: docSnap.data() as UserDefinedData });
            } else {
                console.log("No UserData found, using initial state and trying to save it.");
                updateUserDataInFirebase(initialState.userDefinedData);
            }
        }, (error) => {
            console.error("Error listening to user data: ", error);
             alert("無法載入分類/項目資料！");
        });

        return () => unsubscribe();
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => useContext(AppContext);