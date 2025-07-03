// src/types.ts
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string; // <-- 從 number 改為 string
  type: TransactionType;
  date: string;
  category: string;
  description: string;
  amount: number;
  accountId: string; // 新增帳戶ID
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
  accounts: Account[]; // <-- 新增
}

export type AppAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] } // <-- 新增
  | { type: 'SET_USER_DATA'; payload: UserDefinedData } // <-- 新增
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string } // <-- 從 number 改為 string
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'ADD_CATEGORY'; payload: { type: TransactionType; categoryName: string } }
  | { type: 'ADD_ITEM'; payload: { type: TransactionType; categoryName: string; itemName: string } }
  | { type: 'SET_ACCOUNTS'; payload: Account[] } // <-- 新增
  | { type: 'ADD_ACCOUNT'; payload: Account } // <-- 新增 (用於本地更新，實際操作通過Firebase)
  | { type: 'UPDATE_ACCOUNT'; payload: Account } // <-- 新增 (用於本地更新，實際操作通過Firebase)
  | { type: 'DELETE_ACCOUNT'; payload: string }; // <-- 新增 (用於本地更新，實際操作通過Firebase)

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

export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  category: AssetCategory | LiabilityCategory;
  balance: number;
}

export type AssetCategory = '銀行存款' | '錢包' | '投資' | '加密貨幣' | '電子票證';
export type LiabilityCategory = '信用卡' | '信用卡分期付款' | '貸款';

export type LoanType = '房貸' | '信貸' | '車貸'; // Optional: if you want to specify loan types

// If you have specific properties for different account types,
// you might want to create more specific interfaces, for example:
// export interface LoanAccount extends Account {
//   category: '貸款';
//   loanType: LoanType;
//   interestRate?: number;
//   dueDate?: string;
// }