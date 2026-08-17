import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  CreditCard,
  Image as ImageIcon,
  Users,
  Car,
  ShoppingBag,
  CircleParking,
  Utensils,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  ArrowRight,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { CorporateCard, ExpenseCategory, ExpenseItem, InvoiceStatementLine, UserProfile } from '../types';
import { InvoiceReconciler } from './InvoiceReconciler';
import { CardManager } from './CardManager';
import { ReportImageModal } from './ReportImageModal';

interface AdminDashboardProps {
  expenses: ExpenseItem[];
  cards: CorporateCard[];
  users: UserProfile[];
  statements: InvoiceStatementLine[];
  onSaveExpense: (expense: ExpenseItem) => void;
  onUpdateCard: (card: CorporateCard) => void;
  onCreateCard: (card: CorporateCard) => void;
  onReconcileMatch: (statementId: string, expenseId: string) => void;
  onAddStatementLine: (line: Omit<InvoiceStatementLine, 'id'>) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  expenses,
  cards,
  users,
  statements,
  onSaveExpense,
  onUpdateCard,
  onCreateCard,
  onReconcileMatch,
  onAddStatementLine,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reconciler' | 'cards'>('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Metrics
  const totalSpent = expenses.reduce((acc, e) => acc + e.totalAmount, 0);
  const totalStatement = statements.reduce((acc, s) => acc + s.amount, 0);
  const totalReconciled = expenses
    .filter((e) => e.status === 'reconciled' || e.invoiceMatch)
    .reduce((acc, e) => acc + e.totalAmount, 0);
  const openCount = expenses.filter((e) => e.status === 'open').length;
  const lockedCount = expenses.filter((e) => e.status === 'locked').length;
  const reconciledCount = expenses.filter((e) => e.status === 'reconciled' || e.invoiceMatch).length;

  // Breakdown by Category
  const categoryTotals: Record<ExpenseCategory, number> = {
    uber_99: 0,
    parking: 0,
    purchase: 0,
    meal_event: 0,
    toll: 0,
    other: 0,
  };
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.totalAmount;
  });

  // Breakdown by Employee
  const employeeSpending: { user: UserProfile; total: number; count: number }[] = users
    .filter((u) => u.role !== 'admin')
    .map((u) => {
      const userExps = expenses.filter((e) => e.employeeId === u.id);
      const total = userExps.reduce((acc, e) => acc + e.totalAmount, 0);
      return { user: u, total, count: userExps.length };
    })
    .sort((a, b) => b.total - a.total);

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.authorizationBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.details.origin && e.details.origin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.details.destination && e.details.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.details.merchantName && e.details.merchantName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesUser = selectedUserFilter === 'all' || e.employeeId === selectedUserFilter;
    const matchesCat = selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;
    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (selectedStatusFilter === 'reconciled' ? e.status === 'reconciled' || !!e.invoiceMatch : e.status === selectedStatusFilter);

    return matchesSearch && matchesUser && matchesCat && matchesStatus;
  });

  const handleAdminToggleLock = (expense: ExpenseItem) => {
    const updated: ExpenseItem = {
      ...expense,
      status: expense.status === 'locked' ? 'open' : 'locked',
      lockedAt: expense.status === 'locked' ? undefined : new Date().toISOString(),
      lockedBy: expense.status === 'locked' ? undefined : 'usr_admin',
      updatedAt: new Date().toISOString(),
    };
    onSaveExpense(updated);
  };

  return (
    <div className="space-y-8" id="admin-dashboard-container">
      {/* Top Banner with Month Selector & Generate PNG Button */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-[#042611] border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Painel do Administrador & Controladoria
              </span>
              <span className="text-xs text-zinc-400 font-mono">Agosto / 2026</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">
              Conciliação Executiva de Cartões
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
              Audite quem colocou cada despesa, datas, quem autorizou, trajetos de Uber/99 e compras, e concilie com as faturas reais do banco.
            </p>
          </div>

          {/* User Requested: "Cria uma imagem das coisas que aconteceram aquele mês" */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              id="btn-generate-report-image"
              onClick={() => setIsReportModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] active:scale-95"
            >
              <ImageIcon className="w-5 h-5 text-zinc-950" />
              <span>Gerar Imagem do Relatório do Mês (PNG)</span>
              <Sparkles className="w-4 h-4 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Executive KPI Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Total Lançado Equipe</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-zinc-100 mt-0.5 block">
              R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1 block">{expenses.length} lançamentos totais</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-emerald-500/30">
            <span className="text-[10px] uppercase font-semibold text-emerald-400 block">Conciliado no Banco</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block">
              R$ {totalReconciled.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-emerald-300/80 mt-1 block">{reconciledCount} registros verificados</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-amber-500/30">
            <span className="text-[10px] uppercase font-semibold text-amber-400 block">Em Aberto (Falta Volta)</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block">
              {openCount}
            </span>
            <span className="text-[11px] text-amber-300/80 mt-1 block">Aguardando retorno colaborador</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-cyan-500/30">
            <span className="text-[10px] uppercase font-semibold text-cyan-400 block">Total Fatura Bancária</span>
            <span className="font-mono text-xl sm:text-2xl font-black text-cyan-400 mt-0.5 block">
              R$ {totalStatement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-cyan-300/80 mt-1 block">{statements.length} linhas de fatura</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Todos os Lançamentos & Auditoria', icon: LayoutDashboard, count: expenses.length },
          { id: 'reconciler', label: 'Conciliador Inteligente de Fatura', icon: FileSpreadsheet, badge: 'Solução Faturas' },
          { id: 'cards', label: 'Gestão de Cartões & Permissões', icon: CreditCard, count: cards.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isCurrent = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`admin-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap border ${
                isCurrent
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {tab.badge}
                </span>
              ) : tab.count !== undefined ? (
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] flex items-center justify-center">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Audit Ledger */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Visual Breakdown Widgets: Employees & Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Spenders by Employee */}
            <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Gastos por Colaborador no Mês
              </h4>

              <div className="space-y-3">
                {employeeSpending.map(({ user, total, count }) => {
                  const percent = totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0;
                  return (
                    <div key={user.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                          />
                          <span className="font-semibold text-zinc-200">{user.name}</span>
                          <span className="text-[10px] text-zinc-400">({count} gastos)</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="lg:col-span-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h4 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Distribuição por Categoria de Despesa
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Uber / 99</span>
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      R$ {categoryTotals.uber_99.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <CircleParking className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Estacionamento</span>
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      R$ {categoryTotals.parking.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Compras Rápidas</span>
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      R$ {categoryTotals.purchase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Almoço & Eventos</span>
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      R$ {categoryTotals.meal_event.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                id="input-admin-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por colaborador, destino, autorizador..."
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <select
                id="select-user-filter"
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">Todos Colaboradores</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                id="select-category-filter"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">Todas Categorias</option>
                <option value="uber_99">Uber / 99</option>
                <option value="parking">Estacionamento</option>
                <option value="purchase">Compras</option>
                <option value="meal_event">Almoço / Eventos</option>
              </select>

              <select
                id="select-status-filter"
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="all">Todos Status</option>
                <option value="open">Em Aberto</option>
                <option value="locked">Travado / Enviado</option>
                <option value="reconciled">Conciliado no Banco</option>
              </select>
            </div>
          </div>

          {/* Master Expenses Table */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="font-bold text-zinc-100 text-sm">
                Lista Completa de Lançamentos ({filteredExpenses.length})
              </h4>
              <span className="text-xs text-zinc-400">
                Total Filtrado: <strong className="text-emerald-400 font-mono">
                  R$ {filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/60 border-b border-zinc-800 text-[11px] uppercase font-semibold text-zinc-400">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Cartão</th>
                    <th className="py-3 px-4">Destino / Finalidade / Fornecedor</th>
                    <th className="py-3 px-4">Autorizador</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Ações Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-400">
                        Nenhum registro corresponde aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const card = cards.find((c) => c.id === exp.cardId);
                      const isReconciled = exp.status === 'reconciled' || exp.invoiceMatch;
                      const isOpen = exp.status === 'open';

                      return (
                        <tr key={exp.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                            {new Date(exp.date).toLocaleDateString('pt-BR')}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-zinc-100 whitespace-nowrap">
                            {exp.employeeName}
                            <span className="block text-[10px] font-normal text-zinc-400">{exp.employeeDept}</span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px]">
                              •••• {card?.last4 || '----'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="font-semibold text-zinc-200 block truncate">{exp.title}</span>
                            {exp.details.origin && (
                              <span className="text-[11px] text-zinc-400 block truncate mt-0.5">
                                {exp.details.origin} → {exp.details.destination}
                              </span>
                            )}
                            {exp.details.returnDestination && (
                              <span className="text-[10px] text-cyan-400 block truncate">
                                Volta: {exp.details.returnOrigin} → {exp.details.returnDestination}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                            <span className="font-medium">{exp.authorizationBy}</span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                            R$ {exp.totalAmount.toFixed(2)}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isReconciled ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Conciliado
                              </span>
                            ) : isOpen ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                                <Unlock className="w-3 h-3" /> Em Aberto
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                <Lock className="w-3 h-3 text-emerald-400" /> Travado
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              id={`btn-admin-toggle-lock-${exp.id}`}
                              onClick={() => handleAdminToggleLock(exp)}
                              title={isOpen ? 'Travar Registro' : 'Reabrir para Colaborador'}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs transition-colors"
                            >
                              {isOpen ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-zinc-400" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Intelligent Bank Invoice Reconciler */}
      {activeTab === 'reconciler' && (
        <InvoiceReconciler
          statements={statements}
          expenses={expenses}
          cards={cards}
          onReconcileMatch={onReconcileMatch}
          onAddStatementLine={onAddStatementLine}
        />
      )}

      {/* Tab 3: Corporate Cards & Access Management */}
      {activeTab === 'cards' && (
        <CardManager
          cards={cards}
          users={users}
          onUpdateCard={onUpdateCard}
          onCreateCard={onCreateCard}
        />
      )}

      {/* Monthly Visual Report Modal (Generated Canvas Image) */}
      <ReportImageModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        expenses={expenses}
        cards={cards}
        users={users}
        statements={statements}
        monthYear="Agosto / 2026"
      />
    </div>
  );
};
