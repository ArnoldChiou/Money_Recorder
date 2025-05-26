// src/types.ts
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: number;
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
  | { type: 'SET_INITIAL_DATA'; payload: { transactions: Transaction[]; userDefinedData: UserDefinedData } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
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