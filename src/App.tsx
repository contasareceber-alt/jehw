import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CorporateCard,
  ExpenseItem,
  InvoiceStatementLine,
  UserProfile,
} from './types';
import {
  getStoredCards,
  getStoredCurrentUserId,
  getStoredExpenses,
  getStoredStatements,
  getStoredUsers,
  resetAllData,
  clearAllExpensesForCleanProduction,
  saveCards,
  saveCurrentUserId,
  saveExpenses,
  saveStatements,
  saveUsers,
  subscribeToCloudState,
  syncStateToCloud,
} from './services/storage';
import { SaaSMainCard } from './components/SaaSMainCard';
import { ReportImageModal } from './components/ReportImageModal';
import { InvoiceReconciler } from './components/InvoiceReconciler';
import { CardManager } from './components/CardManager';
import {
  CreditCard,
  FileSpreadsheet,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Image as ImageIcon,
  Car,
  Building,
  Plane,
  ShoppingBag
} from 'lucide-react';

const ROTATING_BACKGROUNDS = [
  {
    id: 'cars_fleet',
    title: 'Mobilidade & Frotas Executivas',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2500&q=85',
  },
  {
    id: 'aviation_vip',
    title: 'Aviação Executiva & Viagens VIP',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2500&q=85',
  },
  {
    id: 'city_skyline',
    title: 'Skyline & Metrópole Corporativa',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2500&q=85',
  },
  {
    id: 'airport_terminal',
    title: 'Aeroportos & Conexões Globais',
    url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2500&q=85',
  },
  {
    id: 'business_travel',
    title: 'Viagens Corporativas & Negócios',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2500&q=85',
  },
];

export default function App() {
  const [users, setUsers] = useState<UserProfile[]>(getStoredUsers);
  const [cards, setCards] = useState<CorporateCard[]>(getStoredCards);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(getStoredExpenses);
  const [statements, setStatements] = useState<InvoiceStatementLine[]>(getStoredStatements);
  const [currentUserId, setCurrentUserId] = useState<string>(getStoredCurrentUserId);
  const [currentBgIndex, setCurrentBgIndex] = useState<number>(0);

  // Auto-rotate background every 7 seconds seamlessly
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % ROTATING_BACKGROUNDS.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReconcilerOpen, setIsReconcilerOpen] = useState(false);
  const [isCardManagerOpen, setIsCardManagerOpen] = useState(false);

  // Real-time Firestore Synchronization across all users/browsers
  useEffect(() => {
    const unsubscribe = subscribeToCloudState((remote) => {
      if (remote.users) setUsers(remote.users);
      if (remote.cards) setCards(remote.cards);
      if (remote.expenses) setExpenses(remote.expenses);
      if (remote.statements) setStatements(remote.statements);
    });
    return () => unsubscribe();
  }, []);

  // Storage & Cloud Sync
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveStatements(statements);
  }, [statements]);

  useEffect(() => {
    saveCurrentUserId(currentUserId);
  }, [currentUserId]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[1]; // default Joao

  // Filter cards allowed for the current logged-in user
  const allowedCards = cards.filter(
    (c) =>
      currentUser.role === 'admin' ||
      (c.assignedUserIds && c.assignedUserIds.includes(currentUser.id))
  );

  // Handlers
  const handleSaveExpense = (newOrUpdated: ExpenseItem) => {
    let nextExpenses: ExpenseItem[] = [];
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === newOrUpdated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newOrUpdated;
        nextExpenses = next;
        return next;
      }
      nextExpenses = [newOrUpdated, ...prev];
      return nextExpenses;
    });

    // Update card spent
    const card = cards.find((c) => c.id === newOrUpdated.cardId);
    let nextCards = cards;
    if (card) {
      const cardExpenses = [...expenses.filter((e) => e.id !== newOrUpdated.id), newOrUpdated].filter(
        (e) => e.cardId === card.id
      );
      const total = cardExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
      const updatedCard = { ...card, currentSpent: total };
      nextCards = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      setCards(nextCards);
    }

    syncStateToCloud({
      expenses: nextExpenses.length ? nextExpenses : [newOrUpdated, ...expenses],
      cards: nextCards,
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updated = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updated);
    syncStateToCloud({ expenses: updated });
  };

  const handleLockExpense = (expenseId: string) => {
    const updated = expenses.map((e) =>
      e.id === expenseId
        ? {
            ...e,
            status: 'locked' as const,
            lockedAt: new Date().toISOString(),
            lockedBy: currentUser.id,
            updatedAt: new Date().toISOString(),
          }
        : e
    );
    setExpenses(updated);
    syncStateToCloud({ expenses: updated });
  };

  const handleUpdateCard = (updatedCard: CorporateCard) => {
    const updated = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    setCards(updated);
    syncStateToCloud({ cards: updated });
  };

  const handleCreateCard = (newCard: CorporateCard) => {
    const updated = [...cards, newCard];
    setCards(updated);
    syncStateToCloud({ cards: updated });
  };

  const handleDeleteCard = (cardId: string) => {
    const updated = cards.filter((c) => c.id !== cardId);
    setCards(updated);
    syncStateToCloud({ cards: updated });
  };

  const handleReconcileMatch = (statementId: string, expenseId: string) => {
    const targetStatement = statements.find((s) => s.id === statementId);
    const targetExpense = expenses.find((e) => e.id === expenseId);
    if (!targetStatement || !targetExpense) return;

    // Update statement
    const updatedStatements: InvoiceStatementLine[] = statements.map((s) =>
      s.id === statementId
        ? {
            ...s,
            matchedExpenseId: expenseId,
            matchStatus: 'exact' as const,
          }
        : s
    );
    setStatements(updatedStatements);

    // Update expense
    const updatedExpenses: ExpenseItem[] = expenses.map((e) =>
      e.id === expenseId
        ? {
            ...e,
            status: 'reconciled' as const,
            invoiceMatch: {
              statementLineId: statementId,
              invoiceDesc: targetStatement.rawDescription,
              invoiceDate: targetStatement.date,
              invoiceAmount: targetStatement.amount,
              difference: Math.abs(targetStatement.amount - e.totalAmount),
              reconciledAt: new Date().toISOString(),
              reconciledBy: `${currentUser.name} (${currentUser.role})`,
            },
          }
        : e
    );
    setExpenses(updatedExpenses);

    syncStateToCloud({
      statements: updatedStatements,
      expenses: updatedExpenses,
    });
  };

  const handleAddStatementLine = (line: Omit<InvoiceStatementLine, 'id'>) => {
    const newLine: InvoiceStatementLine = {
      ...line,
      id: `inv_${Date.now()}`,
    };
    const updated = [newLine, ...statements];
    setStatements(updated);
    syncStateToCloud({ statements: updated });
  };

  const handleResetData = () => {
    resetAllData();
    setUsers(getStoredUsers());
    setCards(getStoredCards());
    setExpenses(getStoredExpenses());
    setStatements(getStoredStatements());
    setCurrentUserId('usr_comercial');
  };

  const handleClearAllForProduction = () => {
    clearAllExpensesForCleanProduction();
    setExpenses([]);
    setStatements([]);
    setCards((prev) => prev.map((c) => ({ ...c, currentSpent: 0 })));
  };

  const activeBg = ROTATING_BACKGROUNDS[currentBgIndex];

  return (
    <div className="relative min-h-screen bg-[#07080b] text-zinc-100 font-sans selection:bg-[#00FF41] selection:text-black flex flex-col items-center justify-start overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 7-SECOND ROTATING LUXURY BACKGROUND WALLPAPERS (CLEAR & SHARP)            */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {ROTATING_BACKGROUNDS.map((bg, idx) => (
          <div
            key={bg.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out transform scale-105 ${
              idx === currentBgIndex ? 'opacity-85' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${bg.url}')`,
            }}
          />
        ))}
      </div>

      {/* Dark elegant gradient overlay for perfect contrast & readability (Less blurred as requested) */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-black/65 via-black/50 to-[#07080b]/95" />

      {/* Top Subtle Ambient Neon Emerald Light */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00FF41]/15 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* ========================================================================= */}
      {/* CENTERED SAAS LANDING PAGE CONTENT (SINGLE CENTRAL FOCUSED VIEW)          */}
      {/* ========================================================================= */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900/90 border border-[#00FF41]/30 shadow-[0_0_18px_rgba(0,255,65,0.2)] backdrop-blur-md mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00FF41] shadow-[0_0_8px_#00FF41] animate-pulse" />
            <span className="text-[11px] font-mono font-black tracking-widest text-[#00FF41]">
              CEO TRAVEL
            </span>
            <span className="text-[10px] text-zinc-400 font-semibold">| GESTÃO DE CARTÕES</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]">
            CARTÕES CEO TRAVEL
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Conciliação corporativa de despesas por setor (Comercial, Marketing, Atendimento e Diretores).
          </p>
        </div>

        {/* The Clean Central Card Layout matching the user screenshot */}
        <SaaSMainCard
          currentUser={currentUser}
          allUsers={users}
          cards={cards}
          allowedCards={allowedCards}
          expenses={expenses}
          statements={statements}
          onSelectUser={(u) => setCurrentUserId(u.id)}
          onSaveExpense={handleSaveExpense}
          onDeleteExpense={handleDeleteExpense}
          onLockExpense={handleLockExpense}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenInvoiceReconciler={() => setIsReconcilerOpen(true)}
          onOpenCardManager={() => setIsCardManagerOpen(true)}
          onUpdateCard={handleUpdateCard}
          onCreateCard={handleCreateCard}
          onDeleteCard={handleDeleteCard}
          onResetData={handleResetData}
          onClearAllForProduction={handleClearAllForProduction}
        />

        {/* Sleek Minimalist Footer */}
        <div className="text-center text-[11px] text-zinc-600 mt-10 space-y-1">
          <p>Cartões CEO Travel • Sistema de Conciliação Financeira Corporativa</p>
          <p className="text-[10px] text-zinc-700">Desenvolvido com alta performance e auditoria de gastos.</p>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: MONTHLY REPORT IMAGE GENERATOR (PNG DOWNLOAD / COPY)            */}
      {/* ========================================================================= */}
      <ReportImageModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        expenses={expenses}
        cards={cards}
        users={users}
        statements={statements}
        monthYear="Agosto / 2026"
      />

      {/* ========================================================================= */}
      {/* MODAL 2: INVOICE RECONCILER MODAL (ADMIN ONLY)                           */}
      {/* ========================================================================= */}
      {isReconcilerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="bg-[#111217] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Conciliador Inteligente de Fatura Bancária
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Cruze as linhas da fatura do banco com os lançamentos dos colaboradores com 1 clique.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReconcilerOpen(false)}
                className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <InvoiceReconciler
              statements={statements}
              expenses={expenses}
              cards={cards}
              onReconcileMatch={handleReconcileMatch}
              onAddStatementLine={handleAddStatementLine}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CORPORATE CARD MANAGER MODAL (ADMIN ONLY)                       */}
      {/* ========================================================================= */}
      {isCardManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <div className="bg-[#111217] border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Gestão de Cartões Corporativos & Permissões
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Libere cartões específicos para colaboradores e gerencie limites mensais.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCardManagerOpen(false)}
                className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <CardManager
              cards={cards}
              users={users}
              onUpdateCard={handleUpdateCard}
              onCreateCard={handleCreateCard}
            />
          </div>
        </div>
      )}
    </div>
  );
}
