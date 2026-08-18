import { CorporateCard, ExpenseItem, InvoiceStatementLine, UserProfile } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    name: 'Financeiro / Controladoria',
    role: 'admin',
    department: 'DIRETORES',
    email: 'contasareceber@ceotravel.com.br',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    allowedCardIds: ['card_ceo_1', 'card_ceo_2', 'card_ceo_3'],
  },
  {
    id: 'usr_comercial',
    name: 'Executivo Comercial',
    role: 'employee',
    department: 'COMERCIAL',
    email: 'comercial@ceotravel.com.br',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    allowedCardIds: ['card_ceo_1', 'card_ceo_2'],
  },
  {
    id: 'usr_mkt',
    name: 'Equipe Marketing',
    role: 'employee',
    department: 'MARKETING',
    email: 'marketing@ceotravel.com.br',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    allowedCardIds: ['card_ceo_1', 'card_ceo_3'],
  },
  {
    id: 'usr_atendimento',
    name: 'Suporte & Atendimento VIP',
    role: 'employee',
    department: 'ATENDIMENTO',
    email: 'atendimento@ceotravel.com.br',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    allowedCardIds: ['card_ceo_1'],
  },
];

export const INITIAL_CARDS: CorporateCard[] = [];

export const INITIAL_EXPENSES: ExpenseItem[] = [];

export const INITIAL_INVOICE_STATEMENTS: InvoiceStatementLine[] = [];

