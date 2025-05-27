// src/contexts/AppContext.tsx
import * as React from 'react';
import { createContext, useReducer, useEffect, useContext, ReactNode, FC } from 'react';
import { AppState, AppAction, Transaction, UserDefinedData, TransactionType, AppContextType, Account } from '../types';
import { db } from '../firebaseConfig_example';
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
    DocumentData,
    QueryDocumentSnapshot
} from "firebase/firestore";

const TRANSACTIONS_COLLECTION = 'transactions';
const USER_DATA_DOC_PATH = 'userData/main';
const ACCOUNTS_COLLECTION = 'accounts';

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
    },
    accounts: []
};

const AppContext = createContext<AppContextType>({
    state: initialState,
    dispatch: () => null
});

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_TRANSACTIONS':
            return { ...state, transactions: action.payload };
        case 'SET_USER_DATA':
             return { ...state, userDefinedData: action.payload };
        case 'SET_ACCOUNTS':
             return { ...state, accounts: action.payload };
        case 'ADD_TRANSACTION':
        case 'DELETE_TRANSACTION':
        case 'UPDATE_TRANSACTION':
        case 'ADD_CATEGORY':
        case 'ADD_ITEM':
        case 'ADD_ACCOUNT':
        case 'UPDATE_ACCOUNT':
        case 'DELETE_ACCOUNT':
             console.warn(`Action ${action.type} should be handled via async Firebase calls and onSnapshot updates.`);
             return state;
        default:
            return state;
    }
};

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

export const addAccountToFirebase = async (accountData: Omit<Account, 'id'>) => {
    try {
        await addDoc(collection(db, ACCOUNTS_COLLECTION), accountData);
    } catch (error) {
        console.error("Error adding account: ", error);
        alert("新增帳戶失敗，請檢查網路連線或稍後再試。");
    }
};

export const updateAccountInFirebase = async (account: Account) => {
    try {
        const { id, ...dataToUpdate } = account;
        if (!id) {
            console.error("Account ID is missing for update");
            alert("更新帳戶失敗：帳戶ID缺失。");
            return;
        }
        await updateDoc(doc(db, ACCOUNTS_COLLECTION, id), dataToUpdate);
    } catch (error) {
        console.error("Error updating account: ", error);
        alert("更新帳戶失敗！");
    }
};

export const deleteAccountFromFirebase = async (id: string) => {
    try {
        await deleteDoc(doc(db, ACCOUNTS_COLLECTION, id));
    } catch (error) {
        console.error("Error deleting account: ", error);
        alert("刪除帳戶失敗！");
    }
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

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
        });
        return () => unsubscribe();
    }, []);

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
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(db, ACCOUNTS_COLLECTION), orderBy("name"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const accountsFromDb: Account[] = [];
            querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                accountsFromDb.push({ id: doc.id, ...doc.data() } as Account);
            });
            dispatch({ type: 'SET_ACCOUNTS', payload: accountsFromDb });
        }, (error) => {
            console.error("Error listening to accounts: ", error);
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