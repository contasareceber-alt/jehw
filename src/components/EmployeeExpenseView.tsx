import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Car,
  ShoppingBag,
  CircleParking,
  Utensils,
  PlusCircle,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Calendar,
  UserCheck,
  FileText,
  DollarSign,
  MapPin,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Receipt,
  Plus,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CorporateCard, ExpenseCategory, ExpenseItem, TripLeg, UserProfile } from '../types';
import { CreditCardVisual } from './CreditCardVisual';

interface EmployeeExpenseViewProps {
  currentUser: UserProfile;
  allowedCards: CorporateCard[];
  expenses: ExpenseItem[];
  onSaveExpense: (expense: ExpenseItem) => void;
  onLockExpense: (expenseId: string) => void;
}

export const EmployeeExpenseView: React.FC<EmployeeExpenseViewProps> = ({
  currentUser,
  allowedCards,
  expenses,
  onSaveExpense,
  onLockExpense,
}) => {
  // Currently selected card for display / spending
  const [selectedCardId, setSelectedCardId] = useState<string>(
    allowedCards.length > 0 ? allowedCards[0].id : ''
  );
  
  // Category tab for new expense
  const [activeCategory, setActiveCategory] = useState<ExpenseCategory>('uber_99');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Editing existing open expense modal (e.g. adding return trip & locking)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [returnOrigin, setReturnOrigin] = useState('');
  const [returnDestination, setReturnDestination] = useState('');
  const [returnAmount, setReturnAmount] = useState<string>('');
  const [extraNotes, setExtraNotes] = useState('');
  const [lockOnSave, setLockOnSave] = useState(true);

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [authorizationBy, setAuthorizationBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [purposeEvent, setPurposeEvent] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [parkingLocation, setParkingLocation] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');
  const [willNeedReturnTrip, setWillNeedReturnTrip] = useState(true); // default to open for uber so they can add return

  // Filter state for my expenses
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'locked' | 'reconciled'>('all');

  const selectedCard = allowedCards.find((c) => c.id === selectedCardId) || allowedCards[0];
  const myExpenses = expenses.filter((e) => e.employeeId === currentUser.id);

  const filteredExpenses = myExpenses.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const openExpensesCount = myExpenses.filter((e) => e.status === 'open').length;

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) {
      alert('Você precisa ter ao menos um cartão corporativo liberado pelo administrador.');
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.')) || 0;
    if (numAmount <= 0) {
      alert('Por favor informe um valor válido.');
      return;
    }

    if (!authorizationBy.trim()) {
      alert('Informe quem autorizou este gasto corporativo (ex: Gerente, Diretoria).');
      return;
    }

    const legs: TripLeg[] = [];
    if (activeCategory === 'uber_99') {
      legs.push({
        id: `leg_${Date.now()}_1`,
        title: 'Corrida de Ida',
        origin: origin || 'Origem inicial',
        destination: destination || 'Destino evento',
        amount: numAmount,
        date: `${date} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        notes: notes,
      });
    }

    const generatedTitle =
      title.trim() ||
      (activeCategory === 'uber_99'
        ? `Uber: ${origin || 'Ida'} → ${destination || 'Evento'}`
        : activeCategory === 'parking'
        ? `Estacionamento: ${parkingLocation || 'Estapar'}`
        : activeCategory === 'purchase'
        ? `Compra: ${merchantName || 'Suprimentos'}`
        : `Despesa: ${purposeEvent || 'Corporativa'}`);

    const newExpense: ExpenseItem = {
      id: `exp_${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      employeeDept: currentUser.department,
      cardId: selectedCard.id,
      category: activeCategory,
      title: generatedTitle,
      authorizationBy: authorizationBy.trim(),
      date: date,
      totalAmount: numAmount,
      legs: legs,
      details: {
        origin,
        destination,
        parkingLocation,
        vehiclePlate,
        merchantName,
        itemsSummary,
        purposeEvent,
        notes,
      },
      status: activeCategory === 'uber_99' && willNeedReturnTrip ? 'open' : 'locked',
      lockedAt: !(activeCategory === 'uber_99' && willNeedReturnTrip) ? new Date().toISOString() : undefined,
      lockedBy: !(activeCategory === 'uber_99' && willNeedReturnTrip) ? currentUser.id : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);

    // Reset Form
    setTitle('');
    setAmount('');
    setOrigin('');
    setDestination('');
    setPurposeEvent('');
    setMerchantName('');
    setItemsSummary('');
    setParkingLocation('');
    setVehiclePlate('');
    setNotes('');
    setIsFormOpen(false);
  };

  const handleOpenEditModal = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setReturnOrigin(expense.details.destination || expense.legs[0]?.destination || '');
    setReturnDestination(expense.details.origin || expense.legs[0]?.origin || 'Sede da Empresa');
    setReturnAmount('');
    setExtraNotes(expense.details.notes || '');
    setLockOnSave(true);
  };

  const handleSaveReturnAndLock = () => {
    if (!editingExpense) return;

    const returnNum = parseFloat(returnAmount.replace(',', '.')) || 0;
    const updatedLegs = [...editingExpense.legs];

    if (returnNum > 0 || returnDestination) {
      updatedLegs.push({
        id: `leg_${Date.now()}_return`,
        title: 'Corrida de Volta / Segundo Trecho',
        origin: returnOrigin || editingExpense.details.destination || 'Local do Evento',
        destination: returnDestination || 'Retorno / Escritório',
        amount: returnNum,
        date: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        notes: extraNotes,
      });
    }

    const newTotal = updatedLegs.reduce((acc, leg) => acc + leg.amount, 0) || editingExpense.totalAmount;

    const updated: ExpenseItem = {
      ...editingExpense,
      totalAmount: newTotal,
      legs: updatedLegs,
      details: {
        ...editingExpense.details,
        returnOrigin,
        returnDestination,
        notes: extraNotes,
      },
      status: lockOnSave ? 'locked' : 'open',
      lockedAt: lockOnSave ? new Date().toISOString() : undefined,
      lockedBy: lockOnSave ? currentUser.id : undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(updated);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto" id="employee-view-container">
      {/* Top Banner Alert for Open Expenses */}
      {openExpensesCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-200 text-sm sm:text-base flex items-center gap-2">
                Você tem {openExpensesCount} despesa(s) em aberto aguardando retorno
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                Ex: Você fez a corrida de ida de Uber para o evento. Quando for voltar, clique em <strong>"Adicionar Volta & Finalizar"</strong> para lançar o retorno e travar o registro.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-filter-open-expenses"
            onClick={() => setStatusFilter('open')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm whitespace-nowrap shadow-md transition-all shrink-0"
          >
            Ver Lançamentos Abertos
          </button>
        </motion.div>
      )}

      {/* Main Grid: Prominent Credit Card Display & Category Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Credit Card Released by Admin */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                Cartão Liberado para Você
              </h3>
            </div>
            {allowedCards.length > 1 && (
              <span className="text-xs text-zinc-400">
                {allowedCards.length} cartões autorizados
              </span>
            )}
          </div>

          {/* Cards selector if employee has multiple cards */}
          {allowedCards.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allowedCards.map((c) => (
                <button
                  key={c.id}
                  id={`btn-select-card-${c.id}`}
                  onClick={() => setSelectedCardId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    selectedCardId === c.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {c.brand.toUpperCase()} •••• {c.last4} ({c.name.split(' ')[1] || 'Corp'})
                </button>
              ))}
            </div>
          )}

          {selectedCard ? (
            <CreditCardVisual card={selectedCard} isInteractive={true} />
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 text-center text-zinc-400">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="font-semibold text-zinc-200">Nenhum cartão liberado</p>
              <p className="text-xs text-zinc-400 mt-1">
                Solicite ao administrador financeiro a liberação de um cartão corporativo para seu usuário.
              </p>
            </div>
          )}

          {/* Quick tips on card usage */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instruções de Uso Rápido:</span>
            </div>
            <p>
              1. Copie o número ou CVV clicando no cartão acima para inserir no <strong>Uber, 99, Estapar ou loja</strong>.
            </p>
            <p>
              2. Imediatamente após a compra/corrida, registre abaixo para que a fatura seja conciliada sem problemas.
            </p>
          </div>
        </div>

        {/* Right Column: New Expense Form (Category tabs for Uber, Parking, Purchases, Events) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-60 h-60 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  Lançar Novo Gasto no Cartão
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Preencha os dados da corrida, estacionamento ou compras realizadas a serviço.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Cartão •••• {selectedCard?.last4 || '---'}
              </span>
            </div>

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {[
                { id: 'uber_99', label: 'Uber / 99', icon: Car, desc: 'Corridas e Viagens' },
                { id: 'parking', label: 'Estacionamento', icon: CircleParking, desc: 'Estapar / Valet / Pedágio' },
                { id: 'purchase', label: 'Compras', icon: ShoppingBag, desc: 'Suprimentos / Materiais' },
                { id: 'meal_event', label: 'Almoço / Evento', icon: Utensils, desc: 'Reunião Comercial' },
              ].map((cat) => {
                const Icon = cat.icon;
                const isCurrent = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`tab-category-${cat.id}`}
                    onClick={() => setActiveCategory(cat.id as ExpenseCategory)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isCurrent
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isCurrent ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <div className="font-bold text-xs leading-tight">{cat.label}</div>
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">{cat.desc}</div>
                    {isCurrent && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Form based on Category */}
            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Category-specific fields */}
              {activeCategory === 'uber_99' && (
                <div className="space-y-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Car className="w-4 h-4" />
                    <span>Detalhes do Deslocamento (Uber / 99)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Origem (Onde pegou a corrida)
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                        <input
                          type="text"
                          id="input-uber-origin"
                          required
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          placeholder="Ex: Escritório Sede (Av. Paulista)"
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Destino (Para onde foi)
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                        <input
                          type="text"
                          id="input-uber-destination"
                          required
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          placeholder="Ex: Expo Center Norte / Cliente Alfa"
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Will need return trip option */}
                  <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="checkbox-return-trip"
                      checked={willNeedReturnTrip}
                      onChange={(e) => setWillNeedReturnTrip(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-500 bg-zinc-800 border-zinc-700 focus:ring-emerald-500 accent-emerald-500"
                    />
                    <label htmlFor="checkbox-return-trip" className="text-xs text-zinc-300 cursor-pointer">
                      <strong className="text-zinc-100 block">Deixar em Aberto para Adicionar a Volta Depois</strong>
                      Marque se você ainda vai retornar do evento/cliente. Assim que terminar a corrida de volta, você entra aqui, insere o valor do retorno e clica em salvar/fechar.
                    </label>
                  </div>
                </div>
              )}

              {activeCategory === 'parking' && (
                <div className="space-y-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <CircleParking className="w-4 h-4" />
                    <span>Detalhes do Estacionamento & Veículo</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Local / Estabelecimento
                      </label>
                      <input
                        type="text"
                        id="input-parking-location"
                        required
                        value={parkingLocation}
                        onChange={(e) => setParkingLocation(e.target.value)}
                        placeholder="Ex: Estapar Edifício Berrini / Aeroporto"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Placa ou Veículo Utilizado
                      </label>
                      <input
                        type="text"
                        id="input-vehicle-plate"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="Ex: ABC-1234 (Carro Frota 01)"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'purchase' && (
                <div className="space-y-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Detalhes da Compra / Suprimentos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Loja / Fornecedor (Razão Social na Maquininha)
                      </label>
                      <input
                        type="text"
                        id="input-merchant-name"
                        required
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        placeholder="Ex: Kalunga / Leroy Merlin / Posto Ipiranga"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Resumo dos Itens Comprados
                      </label>
                      <input
                        type="text"
                        id="input-items-summary"
                        value={itemsSummary}
                        onChange={(e) => setItemsSummary(e.target.value)}
                        placeholder="Ex: Cabos HDMI, fita gaffer, adaptadores"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeCategory === 'meal_event' && (
                <div className="space-y-4 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Utensils className="w-4 h-4" />
                    <span>Almoço de Negócios / Evento</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Restaurante / Estabelecimento
                      </label>
                      <input
                        type="text"
                        id="input-meal-merchant"
                        required
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        placeholder="Ex: Restaurante Figueira / Churrascaria"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                        Objetivo / Pessoas Presentes
                      </label>
                      <input
                        type="text"
                        id="input-meal-purpose"
                        value={purposeEvent}
                        onChange={(e) => setPurposeEvent(e.target.value)}
                        placeholder="Ex: Reunião fechamento com Cliente X"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Universal Core Fields: Amount, Authorization, Date, Event Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-emerald-400">R$</span>
                    <input
                      type="text"
                      id="input-expense-amount"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-emerald-300 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Quem Autorizou? *
                  </label>
                  <div className="relative">
                    <UserCheck className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                    <input
                      type="text"
                      id="input-authorized-by"
                      required
                      value={authorizationBy}
                      onChange={(e) => setAuthorizationBy(e.target.value)}
                      placeholder="Ex: Diretor Rodrigo / Gerente Carlos"
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Data do Gasto
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                    <input
                      type="date"
                      id="input-expense-date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Event purpose & notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Motivo / Evento / Cliente Atendido
                  </label>
                  <input
                    type="text"
                    id="input-purpose-event"
                    value={purposeEvent}
                    onChange={(e) => setPurposeEvent(e.target.value)}
                    placeholder="Ex: Montagem do estande Feira FinTech 2026"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Observações Adicionais (Opcional)
                  </label>
                  <input
                    type="text"
                    id="input-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Corrida rápida por conta da chuva intensa"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  id="btn-submit-expense"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  <Check className="w-4 h-4" />
                  {activeCategory === 'uber_99' && willNeedReturnTrip
                    ? 'Salvar Corrida de Ida (Deixar Aberto para Volta)'
                    : 'Salvar & Finalizar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Section: My Registered Expenses & Interactive Return Trip Flow */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Meus Lançamentos neste Mês
            </h3>
            <p className="text-xs text-zinc-400">
              Gerencie seus gastos, adicione corridas de volta e acompanhe o status de conciliação.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'open', label: 'Em Aberto (Volta)', badge: openExpensesCount },
              { id: 'locked', label: 'Travados / Enviados' },
              { id: 'reconciled', label: 'Conciliados 100%' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                id={`filter-tab-${tab.id}`}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl p-6">
              <Sparkles className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-zinc-300 font-semibold text-sm">Nenhum lançamento encontrado nesta categoria.</p>
              <p className="text-xs text-zinc-400 mt-1">Utilize o formulário acima para registrar sua primeira despesa.</p>
            </div>
          ) : (
            filteredExpenses.map((exp) => {
              const card = allowedCards.find((c) => c.id === exp.cardId) || allowedCards[0];
              const isOpen = exp.status === 'open';
              const isLocked = exp.status === 'locked';
              const isReconciled = exp.status === 'reconciled';

              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border transition-all p-4 sm:p-5 ${
                    isOpen
                      ? 'bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                      : isReconciled
                      ? 'bg-zinc-900/80 border-emerald-500/30'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOpen && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <Unlock className="w-3 h-3" /> Em Aberto (Falta Volta)
                          </span>
                        )}
                        {isLocked && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            <Lock className="w-3 h-3 text-emerald-400" /> Finalizado & Travado
                          </span>
                        )}
                        {isReconciled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Conciliado no Banco
                          </span>
                        )}

                        <span className="text-xs text-zinc-400 font-mono">
                          {new Date(exp.date).toLocaleDateString('pt-BR')}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {card?.brand.toUpperCase()} •••• {card?.last4 || '----'}
                        </span>

                        <span className="text-xs text-zinc-400">
                          Autorizado por: <strong className="text-zinc-200">{exp.authorizationBy}</strong>
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-zinc-100">{exp.title}</h4>

                      {/* Origin & Destination if available */}
                      {exp.details.origin && (
                        <div className="flex items-center gap-2 text-xs text-zinc-300 pt-1">
                          <span className="text-zinc-400">Ida:</span>
                          <span className="text-zinc-200">{exp.details.origin}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">{exp.details.destination}</span>
                        </div>
                      )}

                      {/* Return leg info if exists */}
                      {exp.details.returnOrigin && (
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <span className="text-zinc-400">Volta:</span>
                          <span className="text-zinc-200">{exp.details.returnOrigin}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="text-cyan-300">{exp.details.returnDestination}</span>
                        </div>
                      )}

                      {/* Notes / Reason */}
                      {exp.details.purposeEvent && (
                        <p className="text-xs text-zinc-400 italic">
                          "{exp.details.purposeEvent}"
                        </p>
                      )}
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Valor Total</span>
                        <span className="font-mono text-xl font-extrabold text-emerald-400">
                          R$ {exp.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* If Open -> Show Add Return & Lock Button */}
                      {isOpen ? (
                        <button
                          type="button"
                          id={`btn-add-return-${exp.id}`}
                          onClick={() => handleOpenEditModal(exp)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Volta & Travar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>Registro Fechado (Edição apenas Admin)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* If has multiple legs, show expandable breakdown */}
                  {exp.legs && exp.legs.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {exp.legs.map((leg, idx) => (
                        <div key={leg.id || idx} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-zinc-300 block">{leg.title}</span>
                            <span className="text-[11px] text-zinc-400 truncate block">
                              {leg.origin} → {leg.destination}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            R$ {leg.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Add Return Trip & Final Lock (as requested by user) */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5 mb-1">
                    <Car className="w-4 h-4" /> Complementar Despesa de Transporte
                  </span>
                  <h3 className="text-lg font-bold text-zinc-100">
                    Adicionar Corrida de Retorno & Finalizar
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Insira os dados da viagem de volta e observações para conciliação.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-700"
                >
                  ✕
                </button>
              </div>

              {/* Original Leg Summary */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1">
                <div className="text-zinc-400 font-semibold uppercase text-[10px]">Primeiro Trecho (Ida):</div>
                <div className="flex items-center justify-between text-zinc-200">
                  <span>{editingExpense.details.origin || 'Origem'} → {editingExpense.details.destination || 'Destino'}</span>
                  <strong className="text-emerald-400 font-mono">
                    R$ {editingExpense.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Form for return */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                      Origem do Retorno
                    </label>
                    <input
                      type="text"
                      id="input-modal-return-origin"
                      value={returnOrigin}
                      onChange={(e) => setReturnOrigin(e.target.value)}
                      placeholder="Ex: Expo Center Norte"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                      Destino do Retorno
                    </label>
                    <input
                      type="text"
                      id="input-modal-return-dest"
                      value={returnDestination}
                      onChange={(e) => setReturnDestination(e.target.value)}
                      placeholder="Ex: Sede Empresa / Minha Residência"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Valor da Corrida de Volta (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-amber-400">R$</span>
                    <input
                      type="text"
                      id="input-modal-return-amount"
                      required
                      value={returnAmount}
                      onChange={(e) => setReturnAmount(e.target.value)}
                      placeholder="Ex: 52,40"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Observações Finais do Evento / Despesa
                  </label>
                  <textarea
                    id="input-modal-return-notes"
                    rows={2}
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    placeholder="Ex: Volta realizada após término da feira. Trânsito intenso no trajeto."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Lock Warning */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="block text-amber-200">Travar Registro após Salvar</strong>
                    Ao salvar, o registro será fechado e enviado diretamente para a conciliação do Financeiro. Você não poderá mais editá-lo.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  id="btn-confirm-return-and-lock"
                  onClick={handleSaveReturnAndLock}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Salvar, Fechar & Travar Registro
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
