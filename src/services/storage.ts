import { CorporateCard, ExpenseItem, InvoiceStatementLine, UserProfile } from '../types';
import { INITIAL_CARDS, INITIAL_EXPENSES, INITIAL_INVOICE_STATEMENTS, INITIAL_USERS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'ceotravel_prod_v1_users',
  CARDS: 'ceotravel_prod_v1_cards',
  EXPENSES: 'ceotravel_prod_v1_expenses',
  INVOICE_STATEMENTS: 'ceotravel_prod_v1_statements',
  CURRENT_USER_ID: 'ceotravel_prod_v1_current_user_id',
};

export const getStoredUsers = (): UserProfile[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : INITIAL_USERS;
  } catch (e) {
    console.error('Error reading users from storage:', e);
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
  } catch (e) {
    console.error('Error reading cards from storage:', e);
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
  } catch (e) {
    console.error('Error reading expenses from storage:', e);
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
  } catch (e) {
    console.error('Error reading statements from storage:', e);
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
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return id || 'usr_joao'; // Start as Joao (Employee) to showcase the interactive card & expense flow
  } catch (e) {
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
    const pass = localStorage.getItem('cardmatch_admin_password_v2') || localStorage.getItem('cardmatch_admin_password_v1');
    return pass !== null ? pass : '1234';
  } catch {
    return '1234';
  }
};

export const saveAdminPassword = (newPassword: string): void => {
  try {
    const clean = newPassword.trim();
    localStorage.setItem('cardmatch_admin_password_v2', clean);
    localStorage.setItem('cardmatch_admin_password_v1', clean);
  } catch (e) {
    console.error('Error saving admin password:', e);
  }
};

export const checkAdminPassword = (enteredPassword: string): boolean => {
  const clean = enteredPassword.trim();
  const current = getStoredAdminPassword().trim();
  // Strictly only allow the exact current password
  return clean === current;
};

export const resetAllData = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(INITIAL_CARDS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.INVOICE_STATEMENTS, JSON.stringify(INITIAL_INVOICE_STATEMENTS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_joao');
  } catch (e) {
    console.error('Error resetting data:', e);
  }
};

export const clearAllExpensesForCleanProduction = (): void => {
  try {
    const cleanCards = INITIAL_CARDS.map((c) => ({ ...c, currentSpent: 0 }));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cleanCards));
    localStorage.setItem(STORAGE_KEYS.INVOICE_STATEMENTS, JSON.stringify([]));
  } catch (e) {
    console.error('Error clearing data for production:', e);
  }
};
