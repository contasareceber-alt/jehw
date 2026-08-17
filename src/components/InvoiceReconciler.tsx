import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Plus,
  Search,
  Lock,
  DollarSign,
  Check,
  Filter,
  CreditCard,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { CorporateCard, ExpenseItem, InvoiceStatementLine } from '../types';

interface InvoiceReconcilerProps {
  statements: InvoiceStatementLine[];
  expenses: ExpenseItem[];
  cards: CorporateCard[];
  onReconcileMatch: (statementId: string, expenseId: string) => void;
  onAddStatementLine: (line: Omit<InvoiceStatementLine, 'id'>) => void;
}

export const InvoiceReconciler: React.FC<InvoiceReconcilerProps> = ({
  statements,
  expenses,
  cards,
  onReconcileMatch,
  onAddStatementLine,
}) => {
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [filterCard, setFilterCard] = useState<string>('all');
  const [showAddLineModal, setShowAddLineModal] = useState(false);

  // New statement form state
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCardId, setNewCardId] = useState(cards[0]?.id || '');

  // Stats
  const totalStatement = statements.reduce((acc, s) => acc + s.amount, 0);
  const totalMatched = statements
    .filter((s) => s.matchedExpenseId)
    .reduce((acc, s) => acc + s.amount, 0);
  const unmatchedStatements = statements.filter((s) => !s.matchedExpenseId);
  const matchRate = statements.length > 0 ? Math.round(((statements.length - unmatchedStatements.length) / statements.length) * 100) : 100;

  // Filtered lists
  const filteredStatements = statements.filter((s) => {
    if (filterCard === 'all') return true;
    return s.cardId === filterCard;
  });

  const availableExpenses = expenses.filter((e) => {
    if (filterCard !== 'all' && e.cardId !== filterCard) return false;
    return true;
  });

  // Calculate potential matches dynamically
  const getSuggestionsForStatement = (stmt: InvoiceStatementLine) => {
    return availableExpenses
      .filter((exp) => !exp.invoiceMatch || exp.invoiceMatch.statementLineId === stmt.id)
      .map((exp) => {
        let score = 0;
        const reasons: string[] = [];

        // Exact amount
        if (Math.abs(exp.totalAmount - stmt.amount) < 0.01) {
          score += 55;
          reasons.push('Valor idêntico (R$ ' + exp.totalAmount.toFixed(2) + ')');
        } else if (Math.abs(exp.totalAmount - stmt.amount) <= 5.0) {
          score += 35;
          reasons.push(`Diferença pequena de R$ ${Math.abs(exp.totalAmount - stmt.amount).toFixed(2)} (tarifa dinâmica/gorjeta)`);
        }

        // Same card
        if (exp.cardId === stmt.cardId) {
          score += 25;
          reasons.push('Mesmo cartão de crédito');
        }

        // Same or close date (+/- 1 day)
        const stmtDate = new Date(stmt.date).getTime();
        const expDate = new Date(exp.date).getTime();
        const dayDiff = Math.abs(stmtDate - expDate) / (1000 * 3600 * 24);
        if (dayDiff <= 1) {
          score += 20;
          reasons.push('Mesma data ou 24h de tolerância');
        }

        return {
          expense: exp,
          score,
          reasons,
        };
      })
      .filter((m) => m.score >= 35)
      .sort((a, b) => b.score - a.score);
  };

  const handleManualPair = () => {
    if (!selectedStatementId || !selectedExpenseId) return;
    onReconcileMatch(selectedStatementId, selectedExpenseId);
    setSelectedStatementId(null);
    setSelectedExpenseId(null);
  };

  const handleAutoReconcileAll = () => {
    let count = 0;
    unmatchedStatements.forEach((stmt) => {
      const suggestions = getSuggestionsForStatement(stmt);
      if (suggestions.length > 0 && suggestions[0].score >= 70) {
        onReconcileMatch(stmt.id, suggestions[0].expense.id);
        count++;
      }
    });
    alert(`Conciliação Automática: ${count} transações foram correspondidas com sucesso!`);
  };

  const handleCreateStatementLine = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newAmount.replace(',', '.')) || 0;
    if (num <= 0 || !newDesc.trim()) return;

    const selectedCard = cards.find((c) => c.id === newCardId) || cards[0];

    onAddStatementLine({
      date: newDate,
      rawDescription: newDesc.trim().toUpperCase(),
      amount: num,
      cardId: selectedCard.id,
      cardLast4: selectedCard.last4,
      matchStatus: 'unmatched',
    });

    setNewDesc('');
    setNewAmount('');
    setShowAddLineModal(false);
  };

  return (
    <div className="space-y-6" id="invoice-reconciler-container">
      {/* Header & KPI Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Solução para Razão Social & Valores Diferentes
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-zinc-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Conciliador Inteligente de Fatura de Cartão
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Compare as linhas brutas que vêm no extrato do banco (ex: <em>UBR* TRIP PENDING</em>, <em>99APP</em>, <em>ESTAPAR</em>) com as corridas e compras cadastradas pela equipe com trajeto e autorizador.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              id="btn-auto-reconcile-all"
              onClick={handleAutoReconcileAll}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
            >
              <Zap className="w-4 h-4" />
              Auto-Conciliar Tudo ({matchRate}% pronto)
            </button>

            <button
              type="button"
              id="btn-open-add-statement"
              onClick={() => setShowAddLineModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Inserir Linha da Fatura
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Total da Fatura</span>
            <span className="font-mono text-base font-bold text-zinc-100">
              R$ {totalStatement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Conciliado com Sucesso</span>
            <span className="font-mono text-base font-bold text-emerald-400">
              R$ {totalMatched.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Linhas Não Identificadas</span>
            <span className="font-mono text-base font-bold text-amber-400">
              {unmatchedStatements.length} transação(ões)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Taxa de Conciliação</span>
            <span className="font-mono text-base font-bold text-cyan-400">
              {matchRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Card Filter Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300">Filtrar por Cartão:</span>
          <button
            type="button"
            onClick={() => setFilterCard('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterCard === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            Todos os Cartões
          </button>
          {cards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCard(c.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterCard === c.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              •••• {c.last4} ({c.bank.split(' ')[0]})
            </button>
          ))}
        </div>

        {selectedStatementId && selectedExpenseId && (
          <button
            type="button"
            onClick={handleManualPair}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-bounce"
          >
            <Check className="w-3.5 h-3.5" />
            Vincular Seleção Manual
          </button>
        )}
      </div>

      {/* Two-Column Reconciliation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Invoice Statement Lines (Bank side) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Extrato do Banco / Fatura ({filteredStatements.length})
            </h4>
            <span className="text-[11px] text-zinc-400">Nomes Brutos de Maquininha</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredStatements.map((stmt) => {
              const matchedExp = expenses.find((e) => e.id === stmt.matchedExpenseId);
              const isSelected = selectedStatementId === stmt.id;
              const suggestions = getSuggestionsForStatement(stmt);

              return (
                <div
                  key={stmt.id}
                  id={`statement-row-${stmt.id}`}
                  onClick={() => setSelectedStatementId(stmt.id === selectedStatementId ? null : stmt.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/30'
                      : stmt.matchedExpenseId
                      ? 'bg-zinc-900/60 border-emerald-500/30'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-400">
                          {new Date(stmt.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          •••• {stmt.cardLast4}
                        </span>
                        {stmt.matchedExpenseId ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Conciliado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                            <HelpCircle className="w-3 h-3" /> Não Identificado
                          </span>
                        )}
                      </div>
                      <h5 className="font-mono text-sm font-bold text-zinc-100 mt-1">
                        {stmt.rawDescription}
                      </h5>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-extrabold text-emerald-400 block">
                        R$ {stmt.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Matched Preview */}
                  {matchedExp ? (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-zinc-400">Gasto de:</span>
                        <strong className="text-zinc-200">{matchedExp.employeeName}</strong>
                        <span className="text-zinc-400">({matchedExp.title.slice(0, 24)}...)</span>
                      </div>
                      <span className="text-emerald-400 text-[11px] font-mono">100% OK</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1">
                      <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Sugestão de correspondência automática:
                      </div>
                      <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg text-xs">
                        <div>
                          <span className="font-semibold text-zinc-200">{suggestions[0].expense.employeeName}</span>
                          <span className="text-zinc-400 block text-[11px]">{suggestions[0].reasons.join(' • ')}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReconcileMatch(stmt.id, suggestions[0].expense.id);
                          }}
                          className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] shrink-0"
                        >
                          Confirmar Par
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-amber-300/80 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Nenhum funcionário lançou este valor exato ainda.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Employee Registered Expenses */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Lançamentos dos Funcionários ({availableExpenses.length})
            </h4>
            <span className="text-[11px] text-zinc-400">Com Trajetos e Autorizações</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {availableExpenses.map((exp) => {
              const isSelected = selectedExpenseId === exp.id;
              const isReconciled = exp.status === 'reconciled' || exp.invoiceMatch;

              return (
                <div
                  key={exp.id}
                  id={`expense-row-${exp.id}`}
                  onClick={() => setSelectedExpenseId(exp.id === selectedExpenseId ? null : exp.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30'
                      : isReconciled
                      ? 'bg-zinc-900/60 border-emerald-500/30'
                      : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-zinc-400">
                          {new Date(exp.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs font-bold text-zinc-200">{exp.employeeName}</span>
                        <span className="text-[10px] text-zinc-400">({exp.employeeDept.split(' ')[0]})</span>
                      </div>
                      <h5 className="text-sm font-semibold text-zinc-100 mt-1">{exp.title}</h5>

                      {exp.details.origin && (
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{exp.details.origin} → {exp.details.destination}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-400 mt-1">
                        Autorizado por: <strong className="text-zinc-300">{exp.authorizationBy}</strong>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-base font-extrabold text-cyan-400 block">
                        R$ {exp.totalAmount.toFixed(2)}
                      </span>
                      {isReconciled ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Conciliado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {exp.status === 'open' ? 'Em Aberto' : 'Travado'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Statement Line Modal */}
      {showAddLineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Lançar Linha da Fatura do Cartão
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLineModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStatementLine} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                  Cartão Correspondente
                </label>
                <select
                  value={newCardId}
                  onChange={(e) => setNewCardId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      •••• {c.last4} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                  Descrição Exata do Extrato do Banco (Razão Social)
                </label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: UBR* TRIP 90812 SAO PAULO BR"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Data da Fatura
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLineModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md"
                >
                  Adicionar Linha
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
