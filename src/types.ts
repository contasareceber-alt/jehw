export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  email: string;
  avatar: string;
  allowedCardIds: string[];
}

export type ExpenseCategory = 
  | 'uber_99' 
  | 'parking' 
  | 'toll' 
  | 'purchase' 
  | 'meal_event' 
  | 'other';

export interface TripLeg {
  id: string;
  title: string; // e.g. "Ida", "Volta", "Destino Intermediário"
  origin: string;
  destination: string;
  amount: number;
  date: string;
  notes?: string;
}

export type ExpenseStatus = 'open' | 'locked' | 'reconciled' | 'flagged';

export interface ExpenseItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDept: string;
  cardId: string;
  category: ExpenseCategory;
  title: string;
  authorizationBy: string; // Quem autorizou
  date: string;
  totalAmount: number;
  legs: TripLeg[]; // Permite ida, volta, paradas adicionais
  details: {
    origin?: string;
    destination?: string;
    returnOrigin?: string;
    returnDestination?: string;
    vehiclePlate?: string;
    parkingLocation?: string;
    merchantName?: string;
    expectedInvoiceDesc?: string;
    itemsSummary?: string;
    purposeEvent?: string;
    notes?: string;
    receiptUrl?: string;
    receiptName?: string;
  };
  status: ExpenseStatus;
  lockedAt?: string;
  lockedBy?: string;
  invoiceMatch?: {
    statementLineId?: string;
    invoiceDesc: string;
    invoiceDate: string;
    invoiceAmount: number;
    difference: number;
    reconciledAt: string;
    reconciledBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CorporateCard {
  id: string;
  name: string; // e.g. "Cartão Executivo Black #1", "Cartão Frota & Eventos"
  last4: string;
  fullNumberMasked: string;
  fullNumberReal: string;
  holderName: string;
  bank: string;
  brand: 'mastercard' | 'visa' | 'elo';
  expiry: string;
  cvv: string;
  limitMonthly: number;
  currentSpent: number;
  status: 'active' | 'blocked';
  colorTheme: 'neon-lime' | 'neon-cyan' | 'neon-emerald' | 'cyber-purple';
  assignedUserIds: string[];
  description: string;
}

export interface InvoiceStatementLine {
  id: string;
  date: string;
  rawDescription: string; // Ex: "UBR*TRIP SAO PAULO BR", "ESTAPAR ESTAC AEROP", "99APP*BR TECH"
  amount: number;
  cardLast4: string;
  cardId: string;
  matchedExpenseId?: string;
  matchStatus: 'unmatched' | 'exact' | 'partial' | 'manual';
  potentialMatches?: {
    expenseId: string;
    score: number; // 0 to 100
    reason: string;
  }[];
}

export interface MonthlySummary {
  monthYear: string; // "Agosto / 2026"
  totalStatement: number;
  totalLogged: number;
  totalReconciled: number;
  totalPending: number;
  unidentifiedCount: number;
  openCount: number;
  lockedCount: number;
}
