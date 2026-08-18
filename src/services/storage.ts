import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { CorporateCard, ExpenseItem, InvoiceStatementLine, UserProfile } from '../types';
import { INITIAL_CARDS, INITIAL_EXPENSES, INITIAL_INVOICE_STATEMENTS, INITIAL_USERS } from '../data/initialData';

const COLLECTION_NAME = 'ceotravel_system_data';
const DOC_ID = 'main_state';

const STORAGE_KEYS = {
  USERS: 'ceotravel_prod_v1_users',
  CARDS: 'ceotravel_prod_v1_cards',
  EXPENSES: 'ceotravel_prod_v1_expenses',
  INVOICE_STATEMENTS: 'ceotravel_prod_v1_statements',
  CURRENT_USER_ID: 'ceotravel_prod_v1_current_user_id',
};

export interface RemoteSystemState {
  users: UserProfile[];
  cards: CorporateCard[];
  expenses: ExpenseItem[];
  statements: InvoiceStatementLine[];
  updatedAt?: string;
}

// Subscribe to real-time updates from Firestore across all users
export const subscribeToCloudState = (
  onData: (state: RemoteSystemState) => void,
  onError?: (err: unknown) => void
) => {
  const docRef = doc(db, COLLECTION_NAME, DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as RemoteSystemState;
        if (data.users) saveUsers(data.users);
        if (data.cards) saveCards(data.cards);
        if (data.expenses) saveExpenses(data.expenses);
        if (data.statements) saveStatements(data.statements);
        onData(data);
      } else {
        // Initialize remote database with default data
        const initialState: RemoteSystemState = {
          users: getStoredUsers(),
          cards: getStoredCards(),
          expenses: getStoredExpenses(),
          statements: getStoredStatements(),
          updatedAt: new Date().toISOString(),
        };
        setDoc(docRef, initialState).catch(console.error);
        onData(initialState);
      }
    },
    (err) => {
      console.warn('Firestore snapshot warning (fallback to local):', err);
      if (onError) onError(err);
    }
  );
};

// Sync complete changes to cloud
export const syncStateToCloud = async (state: Partial<RemoteSystemState>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_ID);
    await setDoc(docRef, { ...state, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.error('Error syncing to Firebase Cloud:', e);
  }
};

export const getStoredUsers = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
};

export const saveUsers = (users: UserProfile[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
};

export const getStoredCards = (): CorporateCard[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CARDS);
    return data ? JSON.parse(data) : INITIAL_CARDS;
  } catch {
    return INITIAL_CARDS;
  }
};

export const saveCards = (cards: CorporateCard[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Error saving cards:', e);
  }
};

export const getStoredExpenses = (): ExpenseItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : INITIAL_EXPENSES;
  } catch {
    return INITIAL_EXPENSES;
  }
};

export const saveExpenses = (expenses: ExpenseItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses:', e);
  }
};

export const getStoredStatements = (): InvoiceStatementLine[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INVOICE_STATEMENTS);
    return data ? JSON.parse(data) : INITIAL_INVOICE_STATEMENTS;
  } catch {
    return INITIAL_INVOICE_STATEMENTS;
  }
};

export const saveStatements = (statements: InvoiceStatementLine[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICE_STATEMENTS, JSON.stringify(statements));
  } catch (e) {
    console.error('Error saving statements:', e);
  }
};

export const getStoredCurrentUserId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr_joao';
  } catch {
    return 'usr_joao';
  }
};

export const saveCurrentUserId = (userId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } catch (e) {
    console.error('Error saving user id:', e);
  }
};

export const getStoredAdminPassword = (): string => {
  try {
    return localStorage.getItem('cardmatch_admin_password_v2') || '1234';
  } catch {
    return '1234';
  }
};

export const saveAdminPassword = (newPassword: string): void => {
  try {
    localStorage.setItem('cardmatch_admin_password_v2', newPassword.trim());
  } catch (e) {
    console.error('Error saving admin password:', e);
  }
};

export const checkAdminPassword = (enteredPassword: string): boolean => {
  return enteredPassword.trim() === getStoredAdminPassword().trim();
};

export const resetAllData = (): void => {
  const initial = {
    users: INITIAL_USERS,
    cards: INITIAL_CARDS,
    expenses: INITIAL_EXPENSES,
    statements: INITIAL_INVOICE_STATEMENTS,
  };
  saveUsers(initial.users);
  saveCards(initial.cards);
  saveExpenses(initial.expenses);
  saveStatements(initial.statements);
  syncStateToCloud(initial);
};

export const clearAllExpensesForCleanProduction = (): void => {
  const cleanCards = INITIAL_CARDS.map((c) => ({ ...c, currentSpent: 0 }));
  saveExpenses([]);
  saveCards(cleanCards);
  saveStatements([]);
  syncStateToCloud({
    expenses: [],
    cards: cleanCards,
    statements: [],
  });
};
