import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Save,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Car,
  CircleParking,
  ShoppingBag,
  Utensils,
  Paperclip,
  DollarSign,
  Calendar,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { CorporateCard, ExpenseCategory, ExpenseItem } from '../types';
import { SectorType } from './SaaSMainCard';

interface AdminEditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseItem | null;
  cards: CorporateCard[];
  onSaveExpense: (updated: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export const AdminEditExpenseModal: React.FC<AdminEditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  cards,
  onSaveExpense,
  onDeleteExpense,
}) => {
  if (!isOpen || !expense) return null;

  const formatDateForInput = (d?: string) => {
    if (!d) return new Date().toISOString().split('T')[0];
    if (d.includes('T')) return d.split('T')[0];
    return d;
  };

  const parseNumericAmount = (val: string | number): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val).trim();
    if (!str) return 0;
    if (str.includes(',')) {
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(str) || 0;
  };

  const [sector, setSector] = useState<SectorType>((expense.employeeDept as SectorType) || 'COMERCIAL');
  const [employeeName, setEmployeeName] = useState(expense.employeeName || '');
  const [category, setCategory] = useState<ExpenseCategory>(expense.category || 'uber_99');
  const [cardId, setCardId] = useState(expense.cardId || cards[0]?.id || '');
  const [totalAmount, setTotalAmount] = useState(expense.totalAmount ? String(expense.totalAmount) : '');
  const [date, setDate] = useState(formatDateForInput(expense.date));
  const [authorizer, setAuthorizer] = useState(expense.authorizationBy || '');
  const [title, setTitle] = useState(expense.title || '');
  const [status, setStatus] = useState<ExpenseItem['status']>(expense.status || 'open');

  // Category specifics
  const [origin, setOrigin] = useState(expense.details.origin || '');
  const [destination, setDestination] = useState(expense.details.destination || '');
  const [returnOrigin, setReturnOrigin] = useState(expense.details.returnOrigin || '');
  const [returnDestination, setReturnDestination] = useState(expense.details.returnDestination || '');
  const [parkingLocation, setParkingLocation] = useState(expense.details.parkingLocation || '');
  const [vehiclePlate, setVehiclePlate] = useState(expense.details.vehiclePlate || '');
  const [merchantName, setMerchantName] = useState(expense.details.merchantName || '');
  const [itemsSummary, setItemsSummary] = useState(expense.details.itemsSummary || '');
  const [notes, setNotes] = useState(expense.details.notes || '');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(expense.details.receiptUrl);
  const [receiptName, setReceiptName] = useState<string | undefined>(expense.details.receiptName);

  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state whenever selected expense changes
  useEffect(() => {
    if (!expense) return;
    setSector((expense.employeeDept as SectorType) || 'COMERCIAL');
    setEmployeeName(expense.employeeName || '');
    setCategory(expense.category || 'uber_99');
    setCardId(expense.cardId || cards[0]?.id || '');
    setTotalAmount(expense.totalAmount ? String(expense.totalAmount) : '');
    setDate(formatDateForInput(expense.date));
    setAuthorizer(expense.authorizationBy || '');
    setTitle(expense.title || '');
    setStatus(expense.status || 'open');

    setOrigin(expense.details.origin || '');
    setDestination(expense.details.destination || '');
    setReturnOrigin(expense.details.returnOrigin || '');
    setReturnDestination(expense.details.returnDestination || '');
    setParkingLocation(expense.details.parkingLocation || '');
    setVehiclePlate(expense.details.vehiclePlate || '');
    setMerchantName(expense.details.merchantName || '');
    setItemsSummary(expense.details.itemsSummary || '');
    setNotes(expense.details.notes || '');
    setReceiptUrl(expense.details.receiptUrl);
    setReceiptName(expense.details.receiptName);
    setConfirmDelete(false);
  }, [expense, cards]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseNumericAmount(totalAmount);

    let updatedTitle = title.trim();
    if (!updatedTitle) {
      if (category === 'uber_99') updatedTitle = `Uber/99: ${origin || 'Origem'} ➔ ${destination || 'Destino'}`;
      else if (category === 'parking') updatedTitle = `Estacionamento: ${parkingLocation || 'Local'}`;
      else if (category === 'purchase') updatedTitle = `Compra: ${merchantName || 'Loja'} - ${itemsSummary || 'Suprimentos'}`;
      else updatedTitle = `Almoço: ${merchantName || 'Restaurante'}`;
    }

    const updated: ExpenseItem = {
      ...expense,
      employeeName: employeeName.trim(),
      employeeDept: sector,
      category,
      cardId,
      totalAmount: cleanAmount,
      date: date || formatDateForInput(expense.date),
      authorizationBy: authorizer.trim() || 'Diretoria CEO Travel',
      title: updatedTitle,
      status,
      details: {
        ...expense.details,
        origin: origin.trim(),
        destination: destination.trim(),
        returnOrigin: returnOrigin.trim() || undefined,
        returnDestination: returnDestination.trim() || undefined,
        parkingLocation: parkingLocation.trim() || undefined,
        vehiclePlate: vehiclePlate.trim() || undefined,
        merchantName: merchantName.trim() || undefined,
        itemsSummary: itemsSummary.trim() || undefined,
        notes: notes.trim(),
        receiptUrl,
        receiptName,
      },
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(updated);
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDeleteExpense(expense.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-[#111217] border border-[#00FF41]/40 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-[0_0_50px_rgba(0,255,65,0.15)] space-y-5 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-100 flex items-center gap-2">
                Painel do Administrador • Editar Informações
              </h3>
              <p className="text-xs text-zinc-400">
                Altere qualquer campo da movimentação: colaborador, setor, valor, datas ou status.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Status and Card Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Status da Despesa</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExpenseItem['status'])}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-[#00FF41] font-bold focus:outline-none focus:border-[#00FF41]"
              >
                <option value="open">Em Aberto (Pendente retorno/volta)</option>
                <option value="locked">Travado / Finalizado</option>
                <option value="reconciled">Conciliado no Extrato do Banco</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 block">Cartão Corporativo</label>
              <select
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00FF41]"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (•••• {c.last4})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sector & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#00FF41]" />
                Setor da Empresa
              </label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorType)}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-200 font-bold focus:outline-none focus:border-[#00FF41]"
              >
                <option value="COMERCIAL">COMERCIAL</option>
                <option value="MARKETING">MARKETING</option>
                <option value="ATENDIMENTO">ATENDIMENTO</option>
                <option value="DIRETORES">DIRETORES</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                <User className="w-3 h-3 text-[#00FF41]" />
                Nome do Colaborador
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 block">Tipo de Lançamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#090a0d] border border-zinc-800 rounded-xl">
              {[
                { id: 'uber_99', label: 'Uber / 99', icon: Car },
                { id: 'parking', label: 'Estacionam.', icon: CircleParking },
                { id: 'purchase', label: 'Compras', icon: ShoppingBag },
                { id: 'meal_event', label: 'Almoço', icon: Utensils },
              ].map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as ExpenseCategory)}
                    className={`py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1 font-bold ${
                      isSelected ? 'bg-zinc-800 text-[#00FF41] border border-[#00FF41]/40' : 'text-zinc-400'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Category specifics */}
          {category === 'uber_99' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Origem (Ida)</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Destino (Ida)</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Origem (Volta)</label>
                  <input
                    type="text"
                    value={returnOrigin}
                    onChange={(e) => setReturnOrigin(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Destino (Volta)</label>
                  <input
                    type="text"
                    value={returnDestination}
                    onChange={(e) => setReturnDestination(e.target.value)}
                    placeholder="Opcional"
                    className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'parking' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Local do Estacionamento</label>
                <input
                  type="text"
                  value={parkingLocation}
                  onChange={(e) => setParkingLocation(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Placa do Veículo</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                />
              </div>
            </div>
          )}

          {category === 'purchase' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Fornecedor / Loja</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Resumo dos Itens</label>
                <input
                  type="text"
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                />
              </div>
            </div>
          )}

          {category === 'meal_event' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Restaurante / Local</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-0.5">Participantes / Clientes</label>
                <input
                  type="text"
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                />
              </div>
            </div>
          )}

          {/* Amount, Date, Authorizer */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-[#00FF41] font-bold block mb-0.5">Valor Total (R$)</label>
              <input
                type="text"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-[#00FF41] font-black focus:outline-none focus:border-[#00FF41]"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-0.5">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-0.5">Quem Aprovou</label>
              <input
                type="text"
                required
                value={authorizer}
                onChange={(e) => setAuthorizer(e.target.value)}
                className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-zinc-400 block mb-0.5">Observação / Finalidade</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#090a0d] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41] resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleDelete}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                confirmDelete
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmDelete ? 'Confirmar Exclusão?' : 'Excluir Lançamento'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-admin-save-expense"
                className="px-5 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#10ff55] text-black font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.4)]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
