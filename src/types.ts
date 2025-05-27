// src/types.ts
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string; // <-- 從 number 改為 string
  type: TransactionType;
  date: string;
  category: string;
  description: string;
  amount: number;
}

export interface UserDefinedData {
  categories: {
    expense: string[];
    income: string[];
  };
  items: {
    expense: { [key: string]: string[] };
    income: { [key: string]: string[] };
  };
}

export interface AppState {
  transactions: Transaction[];
  userDefinedData: UserDefinedData;
}

export type AppAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] } // <-- 新增
  | { type: 'SET_USER_DATA'; payload: UserDefinedData } // <-- 新增
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string } // <-- 從 number 改為 string
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_CATEGORY'; payload: { type: TransactionType; categoryName: string } }
  | { type: 'ADD_ITEM'; payload: { type: TransactionType; categoryName: string; itemName: string } };

export interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

export interface ModalConfig {
    mode: 'category' | 'item' | '';
    transactionType: TransactionType;
    categoryName: string;
    activeSelectElement: HTMLSelectElement | null;
}