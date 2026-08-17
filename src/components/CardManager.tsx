import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  Plus,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Check,
  Sparkles,
  DollarSign,
  Users
} from 'lucide-react';
import { CorporateCard, UserProfile } from '../types';
import { CreditCardVisual } from './CreditCardVisual';

interface CardManagerProps {
  cards: CorporateCard[];
  users: UserProfile[];
  onUpdateCard: (updatedCard: CorporateCard) => void;
  onCreateCard: (newCard: CorporateCard) => void;
}

export const CardManager: React.FC<CardManagerProps> = ({
  cards,
  users,
  onUpdateCard,
  onCreateCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [showNewCardModal, setShowNewCardModal] = useState(false);

  // New Card Form
  const [name, setName] = useState('');
  const [bank, setBank] = useState('Banco Itaú BBA');
  const [brand, setBrand] = useState<'mastercard' | 'visa' | 'elo'>('mastercard');
  const [last4, setLast4] = useState('9911');
  const [fullNumber, setFullNumber] = useState('5424 8812 9900 9911');
  const [holderName, setHolderName] = useState('EMPRESA CORP SA');
  const [expiry, setExpiry] = useState('12/30');
  const [cvv, setCvv] = useState('456');
  const [limitMonthly, setLimitMonthly] = useState('10000');
  const [colorTheme, setColorTheme] = useState<'neon-lime' | 'neon-cyan' | 'neon-emerald' | 'cyber-purple'>('neon-lime');
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const handleToggleUserAccess = (userId: string) => {
    if (!selectedCard) return;
    const currentList = selectedCard.assignedUserIds || [];
    const updated = currentList.includes(userId)
      ? currentList.filter((id) => id !== userId)
      : [...currentList, userId];

    onUpdateCard({
      ...selectedCard,
      assignedUserIds: updated,
    });
  };

  const handleToggleCardStatus = () => {
    if (!selectedCard) return;
    onUpdateCard({
      ...selectedCard,
      status: selectedCard.status === 'active' ? 'blocked' : 'active',
    });
  };

  const handleUpdateLimit = (newLimitStr: string) => {
    if (!selectedCard) return;
    const limit = parseFloat(newLimitStr) || selectedCard.limitMonthly;
    onUpdateCard({
      ...selectedCard,
      limitMonthly: limit,
    });
  };

  const handleCreateNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: CorporateCard = {
      id: `card_${Date.now()}`,
      name: name || `Cartão Corporativo •••• ${last4}`,
      last4,
      fullNumberMasked: `•••• •••• •••• ${last4}`,
      fullNumberReal: fullNumber,
      holderName: holderName.toUpperCase(),
      bank,
      brand,
      expiry,
      cvv,
      limitMonthly: parseFloat(limitMonthly) || 5000,
      currentSpent: 0,
      status: 'active',
      colorTheme,
      assignedUserIds: assignedUsers,
      description,
    };

    onCreateCard(newCard);
    setShowNewCardModal(false);
    setSelectedCardId(newCard.id);
  };

  return (
    <div className="space-y-6" id="card-manager-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Gestão & Liberação de Cartões Corporativos
          </h3>
          <p className="text-xs text-zinc-400">
            Controle quais funcionários têm permissão para usar cada cartão e gerencie limites mensais.
          </p>
        </div>

        <button
          type="button"
          id="btn-open-create-card"
          onClick={() => setShowNewCardModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Cartão
        </button>
      </div>

      {/* Main Grid: Card Selector & Detail Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cards List & Big Visual Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cards.map((c) => (
              <button
                key={c.id}
                id={`btn-select-manage-card-${c.id}`}
                onClick={() => setSelectedCardId(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  selectedCard?.id === c.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{c.brand.toUpperCase()} •••• {c.last4}</span>
                {c.status === 'blocked' && (
                  <span className="text-[10px] text-rose-400 bg-rose-500/20 px-1 rounded">Bloqueado</span>
                )}
              </button>
            ))}
          </div>

          {selectedCard && (
            <div className="space-y-4">
              <CreditCardVisual card={selectedCard} isInteractive={true} />

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Status Operacional</span>
                  <span className={`text-sm font-bold ${selectedCard.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedCard.status === 'active' ? 'Liberado para Uso' : 'Bloqueado Temporariamente'}
                  </span>
                </div>

                <button
                  type="button"
                  id={`btn-toggle-status-${selectedCard.id}`}
                  onClick={handleToggleCardStatus}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCard.status === 'active'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {selectedCard.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  {selectedCard.status === 'active' ? 'Bloquear Cartão' : 'Desbloquear Cartão'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Employee Authorization Matrix & Limit Controller */}
        <div className="lg:col-span-6 space-y-6">
          {selectedCard ? (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
              <div>
                <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Colaboradores com Acesso a este Cartão
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Marque quem pode visualizar os dados do cartão <strong>•••• {selectedCard.last4}</strong> no app para lançar Uber/99 e compras.
                </p>
              </div>

              {/* Employee Checkboxes */}
              <div className="space-y-2.5">
                {users
                  .filter((u) => u.role !== 'admin')
                  .map((u) => {
                    const hasAccess = (selectedCard.assignedUserIds || []).includes(u.id);

                    return (
                      <div
                        key={u.id}
                        id={`user-auth-row-${u.id}`}
                        onClick={() => handleToggleUserAccess(u.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          hasAccess
                            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.08)]'
                            : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                          />
                          <div>
                            <h5 className="font-bold text-xs text-zinc-100">{u.name}</h5>
                            <span className="text-[11px] text-zinc-400">{u.department}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasAccess ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" /> Liberado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full">
                              Sem Acesso
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Limit Adjustment */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Ajuste Rápido de Limite Mensal
                </h5>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">R$</span>
                  <input
                    type="number"
                    defaultValue={selectedCard.limitMonthly}
                    onBlur={(e) => handleUpdateLimit(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 w-44"
                  />
                  <span className="text-xs text-zinc-400">Limite mensal em reais</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-400 bg-zinc-900/50 rounded-2xl border border-zinc-800">
              Selecione um cartão para gerenciar permissões.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create New Card */}
      {showNewCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Cadastrar Novo Cartão Corporativo
              </h3>
              <button
                type="button"
                onClick={() => setShowNewCardModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewCard} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                  Nome do Cartão / Finalidade
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cartão Diretoria Comercial #02"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Banco Emissor
                  </label>
                  <input
                    type="text"
                    required
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="Ex: Itaú BBA / Bradesco / BTG"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Bandeira
                  </label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="mastercard">Mastercard</option>
                    <option value="visa">Visa</option>
                    <option value="elo">Elo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Número Completo (Para exibição no app)
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNumber}
                    onChange={(e) => {
                      setFullNumber(e.target.value);
                      const clean = e.target.value.replace(/\s/g, '');
                      if (clean.length >= 4) {
                        setLast4(clean.slice(-4));
                      }
                    }}
                    placeholder="5424 8812 3901 8842"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Últimos 4
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={last4}
                    onChange={(e) => setLast4(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    required
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="12/30"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                    Limite (R$)
                  </label>
                  <input
                    type="number"
                    required
                    value={limitMonthly}
                    onChange={(e) => setLimitMonthly(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-zinc-400 mb-1">
                  Tema Visual Neon do Cartão
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'neon-lime', label: 'Neon Verde' },
                    { id: 'neon-cyan', label: 'Neon Ciano' },
                    { id: 'neon-emerald', label: 'Esmeralda' },
                    { id: 'cyber-purple', label: 'Cyber Roxo' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setColorTheme(t.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        colorTheme === t.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
