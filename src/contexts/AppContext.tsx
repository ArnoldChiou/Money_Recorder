// src/contexts/AppContext.tsx
import * as React from 'react';
import { createContext, useReducer, useEffect, useContext, ReactNode, FC } from 'react';
import { AppState, AppAction, Transaction, UserDefinedData, TransactionType, AppContextType, Account, Transfer } from '../types';
import { db } from '../firebaseConfig';
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
    QueryDocumentSnapshot,
    runTransaction
} from "firebase/firestore";
import { useAuthUser } from '../hooks/useAuthUser';

const initialState: AppState = {
    transactions: [],
    userDefinedData: {
        categories: {
            expense: ["餐飲", "交通", "購物", "娛樂", "居家", "其他支出", "投資"],
            income: ["薪資", "投資", "副業", "獎金", "其他收入"],
            liability: ["信用卡", "貸款", "應付款"] // 將信用卡放第一個
        },
        items: {
            expense: {
                "餐飲": ["早餐", "午餐", "晚餐", "飲料", "零食"],
                "交通": ["捷運/公車"],
                "投資": ["買進股票", "買進基金", "手續費", "其他投資支出"]
            },
            income: {
                "薪資": ["月薪"],
                "證券": ["股息"],
                "投資": ["賣出股票", "賣出基金", "投資收益", "其他投資收入"]
            }
        }
    },
    accounts: [],
    transfers: [] // 新增轉帳紀錄
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
        case 'SET_TRANSFERS':
            return { ...state, transfers: action.payload };
        case 'ADD_TRANSFER':
            return { ...state, transfers: [action.payload, ...state.transfers] };
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

export const addTransactionToFirebase = async (transactionData: Omit<Transaction, 'id'>, userId: string) => {
    const accountRef = doc(db, `users/${userId}/accounts`, transactionData.accountId);
    const newTransactionRef = doc(collection(db, `users/${userId}/transactions`));

    try {
        await runTransaction(db, async (transaction) => {
            const accountDoc = await transaction.get(accountRef);
            if (!accountDoc.exists()) {
                throw new Error("Account not found!");
            }
            const accountData = accountDoc.data();
            const newBalance = transactionData.type === 'income' 
                ? accountData.balance + transactionData.amount 
                : accountData.balance - transactionData.amount;
            
            transaction.update(accountRef, { balance: newBalance });
            transaction.set(newTransactionRef, transactionData);
        });
    } catch (error) {
        console.error("Error adding transaction: ", error);
        alert("新增失敗，請檢查網路連線或稍後再試。");
    }
};

export const deleteTransactionFromFirebase = async (id: string, userId: string) => {
    const transactionRef = doc(db, `users/${userId}/transactions`, id);
    try {
        await runTransaction(db, async (transaction) => {
            const transactionDoc = await transaction.get(transactionRef);
            if (!transactionDoc.exists()) {
                throw new Error("Transaction not found!");
            }
            const transactionData = transactionDoc.data() as Omit<Transaction, 'id'>;
            const accountRef = doc(db, `users/${userId}/accounts`, transactionData.accountId);
            const accountDoc = await transaction.get(accountRef);

            if (accountDoc.exists()) {
                const accountData = accountDoc.data();
                const newBalance = transactionData.type === 'income'
                    ? accountData.balance - transactionData.amount
                    : accountData.balance + transactionData.amount;
                transaction.update(accountRef, { balance: newBalance });
            }

            transaction.delete(transactionRef);
        });
    } catch (error) {
        console.error("Error deleting transaction: ", error);
        alert("刪除失敗！");
    }
};

export const updateTransactionInFirebase = async (transactionData: Transaction, userId: string) => {
    const transactionRef = doc(db, `users/${userId}/transactions`, transactionData.id);
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Read all necessary documents first.
            const transactionDoc = await transaction.get(transactionRef);
            if (!transactionDoc.exists()) {
                throw new Error("Transaction not found!");
            }
            const originalTransaction = { id: transactionDoc.id, ...transactionDoc.data() } as Transaction;

            const originalAccountRef = doc(db, `users/${userId}/accounts`, originalTransaction.accountId);
            const originalAccountDoc = await transaction.get(originalAccountRef);
            if (!originalAccountDoc.exists()) {
                throw new Error(`Original account with id ${originalTransaction.accountId} not found!`);
            }

            const isSameAccount = originalTransaction.accountId === transactionData.accountId;
            let newAccountDoc = null;
            if (!isSameAccount) {
                const newAccountRef = doc(db, `users/${userId}/accounts`, transactionData.accountId);
                newAccountDoc = await transaction.get(newAccountRef);
                if (!newAccountDoc.exists()) {
                    throw new Error(`New account with id ${transactionData.accountId} not found!`);
                }
            }

            // 2. Perform all calculations locally based on the read data.
            const originalAccountData = originalAccountDoc.data();
            const balanceAfterRevert = originalTransaction.type === 'income'
                ? originalAccountData.balance - originalTransaction.amount
                : originalAccountData.balance + originalTransaction.amount;

            // 3. Perform all writes at the end.
            if (isSameAccount) {
                const finalBalance = transactionData.type === 'income'
                    ? balanceAfterRevert + transactionData.amount
                    : balanceAfterRevert - transactionData.amount;
                transaction.update(originalAccountRef, { balance: finalBalance });
            } else {
                transaction.update(originalAccountRef, { balance: balanceAfterRevert });
                
                const newAccountData = newAccountDoc!.data();
                const newBalanceForNewAccount = transactionData.type === 'income'
                    ? newAccountData.balance + transactionData.amount
                    : newAccountData.balance - transactionData.amount;
                transaction.update(doc(db, `users/${userId}/accounts`, transactionData.accountId), { balance: newBalanceForNewAccount });
            }

            const { id, ...dataToUpdate } = transactionData;
            transaction.update(transactionRef, dataToUpdate);
        });
    } catch (error) {
        console.error("Error updating transaction: ", error);
        alert(`更新失敗！${error instanceof Error ? error.message : ''}`);
    }
};

export const updateUserDataInFirebase = async (newUserData: UserDefinedData, userId: string) => {
     try {
        await setDoc(doc(db, `users/${userId}/userData/main`), newUserData);
    } catch (error) {
        console.error("Error updating user data: ", error);
        alert("更新分類/項目失敗！");
    }
};

export const addAccountToFirebase = async (accountData: Omit<Account, 'id'>, userId: string) => {
    try {
        await addDoc(collection(db, `users/${userId}/accounts`), accountData);
    } catch (error) {
        console.error("Error adding account: ", error);
        alert(`新增帳戶失敗，請檢查網路連線或稍後再試。\n錯誤訊息：${error instanceof Error ? error.message : String(error)}`);
    }
};

export const updateAccountInFirebase = async (account: Account, userId: string) => {
    try {
        const { id, ...dataToUpdate } = account;
        if (!id) {
            console.error("Account ID is missing for update");
            alert("更新帳戶失敗：帳戶ID缺失。");
            return;
        }
        await updateDoc(doc(db, `users/${userId}/accounts`, id), dataToUpdate);
    } catch (error) {
        console.error("Error updating account: ", error);
        alert("更新帳戶失敗！");
    }
};

export const deleteAccountFromFirebase = async (id: string, userId: string) => {
    try {
        await deleteDoc(doc(db, `users/${userId}/accounts`, id));
    } catch (error) {
        console.error("Error deleting account: ", error);
        alert("刪除帳戶失敗！");
    }
};

export const addTransferToFirebase = async (transferData: Omit<Transfer, 'id'>, userId: string) => {
    const fromAccountRef = doc(db, `users/${userId}/accounts`, transferData.fromAccountId);
    const toAccountRef = doc(db, `users/${userId}/accounts`, transferData.toAccountId);
    const newTransferRef = doc(collection(db, `users/${userId}/transfers`));
    try {
        await runTransaction(db, async (transaction) => {
            const fromAccountDoc = await transaction.get(fromAccountRef);
            const toAccountDoc = await transaction.get(toAccountRef);
            if (!fromAccountDoc.exists() || !toAccountDoc.exists()) {
                throw new Error("Account not found!");
            }
            const fromAccountData = fromAccountDoc.data();
            const toAccountData = toAccountDoc.data();
            // 資產轉到負債時，負債減少
            let fromNewBalance = fromAccountData.balance - transferData.amount;
            let toNewBalance = toAccountData.balance + transferData.amount;
            if (fromAccountData.type === 'asset' && toAccountData.type === 'liability') {
                toNewBalance = toAccountData.balance - transferData.amount;
            } else if (fromAccountData.type === 'liability' && toAccountData.type === 'asset') {
                fromNewBalance = fromAccountData.balance + transferData.amount;
            }
            transaction.update(fromAccountRef, { balance: fromNewBalance });
            transaction.update(toAccountRef, { balance: toNewBalance });
            transaction.set(newTransferRef, transferData);
        });
    } catch (error) {
        console.error("Error transferring money: ", error);
        alert("轉帳失敗，請檢查網路連線或稍後再試。");
    }
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { user } = useAuthUser();

    // 依 user 決定 collection 路徑
    const userId = user?.uid;

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `users/${userId}/transactions`), orderBy("date", "desc"));
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
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const docRef = doc(db, `users/${userId}/userData/main`);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                dispatch({ type: 'SET_USER_DATA', payload: docSnap.data() as UserDefinedData });
            } else {
                updateUserDataInFirebase(initialState.userDefinedData, userId);
            }
        }, (error) => {
            console.error("Error listening to user data: ", error);
        });
        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `users/${userId}/accounts`), orderBy("name"));
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
    }, [userId]);

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `users/${userId}/transfers`), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const transfersFromDb: Transfer[] = [];
            querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                transfersFromDb.push({ id: doc.id, ...doc.data() } as Transfer);
            });
            dispatch({ type: 'SET_TRANSFERS', payload: transfersFromDb });
        }, (error) => {
            console.error("Error listening to transfers: ", error);
        });
        return () => unsubscribe();
    }, [userId]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    return useContext(AppContext);
};