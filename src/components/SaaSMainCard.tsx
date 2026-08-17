import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Car,
  CircleParking,
  ShoppingBag,
  Utensils,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Image as ImageIcon,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  PlusCircle,
  Paperclip,
  X,
  FileText,
  UploadCloud,
  Building2,
  User,
  Users,
  Edit3,
  Sliders,
  Search,
  Filter,
  Trash2,
  Calendar,
  CalendarDays,
  KeyRound,
  Save,
  Plus,
  DollarSign
} from 'lucide-react';
import {
  CorporateCard,
  ExpenseCategory,
  ExpenseItem,
  InvoiceStatementLine,
  UserProfile,
} from '../types';
import { AdminEditExpenseModal } from './AdminEditExpenseModal';
import { AdminPasswordModal } from './AdminPasswordModal';
import {
  getStoredAdminPassword,
  saveAdminPassword,
  checkAdminPassword,
} from '../services/storage';

export type SectorType = 'COMERCIAL' | 'MARKETING' | 'ATENDIMENTO' | 'DIRETORES';

export const extractMonthFromDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  // Try YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length >= 2) {
      return parts[1].padStart(2, '0');
    }
  }
  // Try DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length <= 2 && parts[1].length <= 2) {
        return parts[1].padStart(2, '0');
      }
      if (parts[0].length === 4) {
        return parts[1].padStart(2, '0');
      }
    }
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return String(d.getMonth() + 1).padStart(2, '0');
    }
  } catch {}
  return '';
};

export const MONTHS_OPTIONS = [
  { id: 'all', name: 'Todos os Meses', short: 'Todos' },
  { id: '01', name: 'Janeiro', short: 'Jan' },
  { id: '02', name: 'Fevereiro', short: 'Fev' },
  { id: '03', name: 'Março', short: 'Mar' },
  { id: '04', name: 'Abril', short: 'Abr' },
  { id: '05', name: 'Maio', short: 'Mai' },
  { id: '06', name: 'Junho', short: 'Jun' },
  { id: '07', name: 'Julho', short: 'Jul' },
  { id: '08', name: 'Agosto', short: 'Ago' },
  { id: '09', name: 'Setembro', short: 'Set' },
  { id: '10', name: 'Outubro', short: 'Out' },
  { id: '11', name: 'Novembro', short: 'Nov' },
  { id: '12', name: 'Dezembro', short: 'Dez' },
];

interface SaaSMainCardProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  cards: CorporateCard[];
  allowedCards: CorporateCard[];
  expenses: ExpenseItem[];
  statements: InvoiceStatementLine[];
  onSelectUser: (user: UserProfile) => void;
  onSaveExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expenseId: string) => void;
  onLockExpense: (expenseId: string) => void;
  onOpenReportModal: () => void;
  onOpenInvoiceReconciler: () => void;
  onOpenCardManager: () => void;
  onUpdateCard?: (updatedCard: CorporateCard) => void;
  onCreateCard?: (newCard: CorporateCard) => void;
  onResetData?: () => void;
  onClearAllForProduction?: () => void;
}

export const SaaSMainCard: React.FC<SaaSMainCardProps> = ({
  currentUser,
  allUsers,
  cards,
  allowedCards,
  expenses,
  statements,
  onSelectUser,
  onSaveExpense,
  onDeleteExpense,
  onLockExpense,
  onOpenReportModal,
  onOpenInvoiceReconciler,
  onOpenCardManager,
  onUpdateCard,
  onCreateCard,
  onResetData,
  onClearAllForProduction,
}) => {
  // Navigation Mode (Lançamentos vs Aba do Administrador)
  const [activeTab, setActiveTab] = useState<'expenses' | 'admin'>('expenses');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordActionType, setPasswordActionType] = useState<'enter_admin' | 'clean_form' | null>(null);
  const [showConfirmWipeModal, setShowConfirmWipeModal] = useState(false);

  // Admin Sub Tabs: 'movements' | 'cards' | 'password'
  const [adminSubTab, setAdminSubTab] = useState<'movements' | 'cards' | 'password'>('movements');

  // Month Navigation Filter ('all', '01'..'12')
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Sector & Employee Name state
  const [selectedSector, setSelectedSector] = useState<SectorType>('COMERCIAL');
  const [employeeNameInput, setEmployeeNameInput] = useState('');

  // Category state
  const [category, setCategory] = useState<ExpenseCategory>('uber_99');

  // Specific Dynamic Form Fields
  // 1. Uber / 99
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // 2. Estacionamento
  const [parkingLocation, setParkingLocation] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // 3. Compras
  const [merchantName, setMerchantName] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');

  // 4. Almoço
  const [restaurantName, setRestaurantName] = useState('');
  const [mealGuests, setMealGuests] = useState('');

  // Common fields
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [authorizer, setAuthorizer] = useState('');
  const [notes, setNotes] = useState('');

  // Attachment (Doc / Photo / Receipt)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Card & Options
  const [selectedCardId, setSelectedCardId] = useState<string>(() => cards[0]?.id || '');
  const [saveAsOpenTrip, setSaveAsOpenTrip] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);

  // Return trip inline expansion for 'Em Aberto' items
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [returnDestination, setReturnDestination] = useState('');
  const [returnAmountStr, setReturnAmountStr] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Admin Modal for Editing ANY expense field
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Filters
  const [listSectorFilter, setListSectorFilter] = useState<string>('all');
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');

  // Form Reset Toast Feedback
  const [formCleanToast, setFormCleanToast] = useState(false);

  const handleResetFormFields = () => {
    // Limpa apenas o que está visível na tela no formulário ativo
    setEmployeeNameInput('');
    setOrigin('');
    setDestination('');
    setParkingLocation('');
    setVehiclePlate('');
    setMerchantName('');
    setItemsSummary('');
    setRestaurantName('');
    setMealGuests('');
    setAmountStr('');
    setNotes('');
    setAuthorizer('');
    setReceiptUrl(null);
    setReceiptName('');
    setSaveAsOpenTrip(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormCleanToast(true);
    setTimeout(() => setFormCleanToast(false), 3500);
  };

  // Admin Card Management States (Clean initial state when no cards exist)
  const [editingCardId, setEditingCardId] = useState<string>(() => cards[0]?.id || 'new');
  const [cardFormName, setCardFormName] = useState(() => cards[0]?.name || '');
  const [cardFormBank, setCardFormBank] = useState(() => cards[0]?.bank || '');
  const [cardFormBrand, setCardFormBrand] = useState<'mastercard' | 'visa' | 'elo'>(() => cards[0]?.brand || 'mastercard');
  const [cardFormLast4, setCardFormLast4] = useState(() => cards[0]?.last4 || '');
  const [cardFormFullNumber, setCardFormFullNumber] = useState(() => cards[0]?.fullNumberReal || '');
  const [cardFormHolderName, setCardFormHolderName] = useState(() => cards[0]?.holderName || 'CEO TRAVEL CORP');
  const [cardFormExpiry, setCardFormExpiry] = useState(() => cards[0]?.expiry || '');
  const [cardFormCvv, setCardFormCvv] = useState(() => cards[0]?.cvv || '');
  const [cardFormLimitMonthly, setCardFormLimitMonthly] = useState(() => cards[0]?.limitMonthly ? String(cards[0].limitMonthly) : '');
  const [cardFormStatus, setCardFormStatus] = useState<'active' | 'blocked'>(() => cards[0]?.status || 'active');
  const [cardFormTheme, setCardFormTheme] = useState<'neon-lime' | 'neon-cyan' | 'neon-emerald' | 'cyber-purple'>(() => cards[0]?.colorTheme || 'neon-lime');
  const [cardFormDesc, setCardFormDesc] = useState(() => cards[0]?.description || '');
  const [cardSaveToast, setCardSaveToast] = useState<string | null>(null);

  // Admin Change Password States
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  const loadCardToForm = (c: CorporateCard | null) => {
    if (c) {
      setEditingCardId(c.id);
      setCardFormName(c.name);
      setCardFormBank(c.bank || '');
      setCardFormBrand(c.brand || 'mastercard');
      setCardFormLast4(c.last4);
      setCardFormFullNumber(c.fullNumberReal || `•••• •••• •••• ${c.last4}`);
      setCardFormHolderName(c.holderName || 'CEO TRAVEL CORP');
      setCardFormExpiry(c.expiry || '');
      setCardFormCvv(c.cvv || '');
      setCardFormLimitMonthly(c.limitMonthly ? String(c.limitMonthly) : '');
      setCardFormStatus(c.status || 'active');
      setCardFormTheme(c.colorTheme || 'neon-lime');
      setCardFormDesc(c.description || '');
    } else {
      setEditingCardId('new');
      setCardFormName('');
      setCardFormBank('');
      setCardFormBrand('mastercard');
      setCardFormLast4('');
      setCardFormFullNumber('');
      setCardFormHolderName('CEO TRAVEL CORP');
      setCardFormExpiry('');
      setCardFormCvv('');
      setCardFormLimitMonthly('');
      setCardFormStatus('active');
      setCardFormTheme('neon-lime');
      setCardFormDesc('');
    }
  };

  const handleSaveCard = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanLast4 = cardFormLast4.trim() || (cardFormFullNumber.replace(/\s/g, '').slice(-4)) || '9911';
    const cleanFull = cardFormFullNumber.trim() || `5424 8812 9900 ${cleanLast4}`;
    const limitNum = parseFloat(cardFormLimitMonthly.replace(/[^\d.,]/g, '').replace(',', '.')) || 10000;

    if (editingCardId === 'new') {
      const newCard: CorporateCard = {
        id: `card_${Date.now()}`,
        name: cardFormName.trim() || `Cartão •••• ${cleanLast4}`,
        bank: cardFormBank.trim() || 'Banco Itaú',
        brand: cardFormBrand,
        last4: cleanLast4,
        fullNumberMasked: `•••• •••• •••• ${cleanLast4}`,
        fullNumberReal: cleanFull,
        holderName: cardFormHolderName.trim() || 'CEO TRAVEL CORP',
        expiry: cardFormExpiry.trim() || '12/30',
        cvv: cardFormCvv.trim() || '456',
        limitMonthly: limitNum,
        currentSpent: 0,
        status: cardFormStatus,
        colorTheme: cardFormTheme,
        assignedUserIds: allUsers.map((u) => u.id),
        description: cardFormDesc.trim() || 'Cartão corporativo liberado para despesas operacionais.',
      };
      if (onCreateCard) onCreateCard(newCard);
      setSelectedCardId(newCard.id);
      setEditingCardId(newCard.id);
    } else {
      const existing = cards.find((c) => c.id === editingCardId);
      const updatedCard: CorporateCard = {
        ...(existing || { id: editingCardId, currentSpent: 0 }),
        name: cardFormName.trim() || `Cartão •••• ${cleanLast4}`,
        bank: cardFormBank.trim() || 'Banco Itaú',
        brand: cardFormBrand,
        last4: cleanLast4,
        fullNumberMasked: `•••• •••• •••• ${cleanLast4}`,
        fullNumberReal: cleanFull,
        holderName: cardFormHolderName.trim() || 'CEO TRAVEL CORP',
        expiry: cardFormExpiry.trim() || '12/30',
        cvv: cardFormCvv.trim() || '456',
        limitMonthly: limitNum,
        status: cardFormStatus,
        colorTheme: cardFormTheme,
        assignedUserIds: existing?.assignedUserIds || allUsers.map((u) => u.id),
        description: cardFormDesc.trim() || existing?.description || '',
      };
      if (onUpdateCard) onUpdateCard(updatedCard);
      setSelectedCardId(updatedCard.id);
    }

    setCardSaveToast('Cartão salvo com sucesso! Os dados foram atualizados e já estão disponíveis na aba de Lançamentos.');
    setTimeout(() => setCardSaveToast(null), 4000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!checkAdminPassword(oldPass)) {
      setPassError('A senha anterior digitada está incorreta.');
      return;
    }

    if (!newPass || newPass.trim().length < 3) {
      setPassError('A nova senha deve ter no mínimo 3 caracteres.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('A confirmação não coincide com a nova senha digitada.');
      return;
    }

    saveAdminPassword(newPass.trim());
    setPassSuccess('Senha de Administrador alterada com sucesso! Use a nova senha nos próximos acessos.');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassSuccess(null), 5000);
  };

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  // Month-Aware Expenses & Calculated Metrics
  const openLegsExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.status === 'open' && (e.category === 'uber_99' || e.details.isMultiLeg)
    );
  }, [expenses]);

  const monthFilteredExpenses = useMemo(() => {
    if (selectedMonth === 'all') return expenses;
    return expenses.filter((e) => {
      const expMonth = extractMonthFromDate(e.date);
      return expMonth === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const totalSpent = monthFilteredExpenses.reduce((acc, e) => acc + e.totalAmount, 0);
  const openCount = monthFilteredExpenses.filter((e) => e.status === 'open').length;
  const reconciledCount = monthFilteredExpenses.filter((e) => e.status === 'reconciled' || e.invoiceMatch).length;

  const getMonthCount = (mId: string) => {
    if (mId === 'all') return expenses.length;
    return expenses.filter((e) => extractMonthFromDate(e.date) === mId).length;
  };

  const getMonthSpent = (mId: string) => {
    if (mId === 'all') return expenses.reduce((acc, e) => acc + e.totalAmount, 0);
    return expenses
      .filter((e) => extractMonthFromDate(e.date) === mId)
      .reduce((acc, e) => acc + e.totalAmount, 0);
  };

  const selectedMonthObj = MONTHS_OPTIONS.find((m) => m.id === selectedMonth) || MONTHS_OPTIONS[0];

  const handleCopyCard = () => {
    if (!activeCard) return;
    navigator.clipboard.writeText(activeCard.fullNumberReal.replace(/\s/g, ''));
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl(null);
    setReceiptName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.')) || 0;
    if (cleanAmount <= 0) {
      alert('Por favor informe o valor cobrado.');
      return;
    }

    if (!employeeNameInput.trim()) {
      alert('Por favor digite o nome do colaborador / solicitante.');
      return;
    }

    let generatedTitle = '';
    let detailsPayload: ExpenseItem['details'] = {
      notes: notes.trim(),
      receiptUrl: receiptUrl || undefined,
      receiptName: receiptName || undefined,
    };

    if (category === 'uber_99') {
      generatedTitle = `Uber/99: ${origin || 'Origem'} ➔ ${destination || 'Destino'}`;
      detailsPayload = {
        ...detailsPayload,
        origin: origin.trim(),
        destination: destination.trim(),
        merchantName: 'UBER / 99 APP',
      };
    } else if (category === 'parking') {
      generatedTitle = `Estacionamento: ${parkingLocation || 'Local'} ${vehiclePlate ? `(${vehiclePlate})` : ''}`;
      detailsPayload = {
        ...detailsPayload,
        parkingLocation: parkingLocation.trim(),
        vehiclePlate: vehiclePlate.trim(),
        origin: parkingLocation.trim(),
        merchantName: parkingLocation.trim() || 'ESTACIONAMENTO',
      };
    } else if (category === 'purchase') {
      generatedTitle = `Compra: ${merchantName || 'Loja'} - ${itemsSummary || 'Suprimentos'}`;
      detailsPayload = {
        ...detailsPayload,
        merchantName: merchantName.trim(),
        itemsSummary: itemsSummary.trim(),
        destination: merchantName.trim(),
      };
    } else {
      // meal_event
      generatedTitle = `Almoço: ${restaurantName || 'Restaurante'} ${mealGuests ? `(${mealGuests})` : ''}`;
      detailsPayload = {
        ...detailsPayload,
        merchantName: restaurantName.trim(),
        itemsSummary: mealGuests.trim(),
        destination: restaurantName.trim(),
      };
    }

    const newExpense: ExpenseItem = {
      id: `exp_ceo_${Date.now()}`,
      employeeId: `usr_${Date.now()}`,
      employeeName: employeeNameInput.trim(),
      employeeDept: selectedSector,
      cardId: selectedCardId || activeCard?.id || (cards[0]?.id || 'card_ceo_principal'),
      category: category,
      title: generatedTitle,
      authorizationBy: authorizer.trim() || 'Diretoria CEO Travel',
      date: date || new Date().toISOString().split('T')[0],
      totalAmount: cleanAmount,
      legs: [
        {
          id: `leg_${Date.now()}_1`,
          title: category === 'uber_99' && saveAsOpenTrip ? 'Ida' : 'Registro de Despesa',
          origin: origin.trim() || parkingLocation.trim() || merchantName.trim() || restaurantName.trim(),
          destination: destination.trim() || 'CEO Travel',
          amount: cleanAmount,
          date: `${date} ${time}`,
          notes: notes.trim(),
        },
      ],
      details: detailsPayload,
      status: category === 'uber_99' && saveAsOpenTrip ? 'open' : 'locked',
      lockedAt: category === 'uber_99' && saveAsOpenTrip ? undefined : new Date().toISOString(),
      lockedBy: category === 'uber_99' && saveAsOpenTrip ? undefined : 'Administrador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(newExpense);

    // Reset Form fields
    setOrigin('');
    setDestination('');
    setParkingLocation('');
    setVehiclePlate('');
    setMerchantName('');
    setItemsSummary('');
    setRestaurantName('');
    setMealGuests('');
    setAmountStr('');
    setAuthorizer('');
    setNotes('');
    setReceiptUrl(null);
    setReceiptName('');
    setSaveAsOpenTrip(false);

    // Flash Toast
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleSaveReturnAndLock = (expense: ExpenseItem) => {
    const returnVal = parseFloat(returnAmountStr.replace(/\./g, '').replace(',', '.')) || 0;
    const initialVal = expense.legs[0]?.amount || expense.totalAmount;
    const combinedTotal = initialVal + returnVal;

    const updatedLegs = [
      ...expense.legs,
      {
        id: `leg_${Date.now()}_return`,
        title: 'Volta',
        origin: expense.details.destination || 'Evento',
        destination: returnDestination.trim() || expense.details.origin || 'Sede CEO Travel',
        amount: returnVal,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        notes: returnNotes.trim(),
      },
    ];

    const updatedExpense: ExpenseItem = {
      ...expense,
      totalAmount: combinedTotal,
      legs: updatedLegs,
      details: {
        ...expense.details,
        returnOrigin: expense.details.destination || 'Evento',
        returnDestination: returnDestination.trim() || expense.details.origin || 'Sede CEO Travel',
        notes: returnNotes ? `${expense.details.notes || ''} | Volta: ${returnNotes}` : expense.details.notes,
      },
      status: 'locked',
      lockedAt: new Date().toISOString(),
      lockedBy: 'Administrador',
      updatedAt: new Date().toISOString(),
    };

    onSaveExpense(updatedExpense);
    setEditingReturnId(null);
    setReturnDestination('');
    setReturnAmountStr('');
    setReturnNotes('');
  };

  // Filtered list for Admin & Table views
  const filteredExpensesList = expenses.filter((e) => {
    if (selectedMonth !== 'all' && e.date?.substring(5, 7) !== selectedMonth) return false;
    if (listSectorFilter !== 'all' && e.employeeDept !== listSectorFilter) return false;
    if (adminSearchTerm.trim()) {
      const term = adminSearchTerm.toLowerCase();
      const matchName = (e.employeeName || '').toLowerCase().includes(term);
      const matchDept = (e.employeeDept || '').toLowerCase().includes(term);
      const matchTitle = (e.title || '').toLowerCase().includes(term);
      const matchNotes = (e.details?.notes || '').toLowerCase().includes(term);
      const matchAuth = (e.authorizationBy || '').toLowerCase().includes(term);
      return matchName || matchDept || matchTitle || matchNotes || matchAuth;
    }
    return true;
  });

  return (
    <div className="w-full max-w-[680px] mx-auto space-y-5">
      {/* ========================================================================= */}
      {/* TOP NAVIGATION BAR: HIGH Z-INDEX, PERFECT FRAMING, NO OVERFLOW           */}
      {/* ========================================================================= */}
      <div className="relative z-30 w-full bg-[#0e0f14] border border-zinc-800 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Left Segment: Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
            <button
              type="button"
              id="tab-btn-registrar"
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 sm:flex-initial h-10 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'expenses'
                  ? 'bg-[#00FF41] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Lançamentos</span>
            </button>

            <button
              type="button"
              id="tab-btn-admin"
              onClick={() => {
                if (!isAdminUnlocked) {
                  setPasswordActionType('enter_admin');
                  setIsPasswordModalOpen(true);
                } else {
                  setActiveTab('admin');
                }
              }}
              className={`flex-1 sm:flex-initial h-10 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-[#00FF41] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isAdminUnlocked ? (
                <ShieldCheck className="w-4 h-4 text-current" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-400" />
              )}
              <span>Administrador</span>
              {!isAdminUnlocked && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-bold">
                  Senha
                </span>
              )}
            </button>
          </div>

          {/* Right Segment: Action Buttons (Fully within frame bounds, z-index 10) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-quick-generate-report"
              onClick={onOpenReportModal}
              className="flex-1 sm:flex-initial h-10 px-3.5 rounded-xl bg-zinc-900 border border-[#00FF41]/40 text-[#00FF41] hover:bg-[#00FF41]/15 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,255,65,0.15)] whitespace-nowrap cursor-pointer relative z-10"
              title="Gerar Imagem PNG em Alta Resolução"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#00FF41]" />
              <span>Gerar Imagem</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORPORATE CARD WIDGET - SLEEK AND EXPANDABLE (NO SCROLLBARS)             */}
      {/* ========================================================================= */}
      {cards.length === 0 ? (
        <div className="bg-[#0c0d12] border border-dashed border-zinc-800 hover:border-[#00FF41]/40 rounded-3xl p-4 transition-all">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[#00FF41]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-200 block">
                  Nenhum Cartão Corporativo Cadastrado
                </span>
                <span className="text-[11px] text-zinc-400">
                  Cadastre o primeiro cartão corporativo no Painel do Administrador.
                </span>
              </div>
            </div>
            <button
              type="button"
              id="btn-shortcut-add-card"
              onClick={() => {
                if (!isAdminUnlocked) {
                  setPasswordActionType('enter_admin');
                  setIsPasswordModalOpen(true);
                } else {
                  setActiveTab('admin');
                  setAdminSubTab('cards');
                  loadCardToForm(null);
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-[#00FF41]/15 hover:bg-[#00FF41] text-[#00FF41] hover:text-black border border-[#00FF41]/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Cartão</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* CARD SELECTOR PILLS IF MULTIPLE CARDS EXIST (WRAPPED, NO SCROLLBAR) */}
          {cards.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#090a0d] border border-zinc-800 rounded-2xl">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 pl-1">
                <CreditCard className="w-3.5 h-3.5 text-[#00FF41]" />
                Cartão Selecionado:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {cards.map((c) => {
                  const isSelected = activeCard?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      id={`btn-select-card-${c.id}`}
                      onClick={() => setSelectedCardId(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[#00FF41] text-black shadow-[0_0_12px_rgba(0,255,65,0.4)]'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{c.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-black/20 text-black font-black' : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        •••• {c.last4}
                      </span>
                      {c.status === 'blocked' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/30 text-red-300 font-normal">
                          Bloqueado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeCard && (
            <div className="bg-gradient-to-b from-[#14171f] to-[#0c0d12] border border-zinc-800/90 hover:border-[#00FF41]/40 rounded-3xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                      Cartão Corporativo • {activeCard.bank || 'CEO Travel'}
                    </span>
                    <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      {activeCard.name}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                        •••• {activeCard.last4}
                      </span>
                      {activeCard.status === 'blocked' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                          BLOQUEADO
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowCardDetails(!showCardDetails)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors text-xs"
                    title={showCardDetails ? 'Ocultar Detalhes' : 'Ver Número Completo & CVV'}
                  >
                    {showCardDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCard}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-[#00FF41]/40 text-zinc-300 hover:text-[#00FF41] transition-colors text-xs flex items-center gap-1 font-mono font-semibold"
                    title="Copiar número do cartão"
                  >
                    {copiedCard ? <Check className="w-3.5 h-3.5 text-[#00FF41]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCard ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {showCardDetails ? (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 font-mono text-xs text-zinc-300">
                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/60">
                    <span className="text-[9px] uppercase text-zinc-500 block">Número</span>
                    <span className="text-zinc-100 font-bold">{activeCard.fullNumberReal}</span>
                  </div>
                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/60">
                    <span className="text-[9px] uppercase text-zinc-500 block">Validade</span>
                    <span className="text-zinc-100 font-bold">{activeCard.expiry}</span>
                  </div>
                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/60">
                    <span className="text-[9px] uppercase text-zinc-500 block">CVV</span>
                    <span className="text-[#00FF41] font-bold">{activeCard.cvv}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-800/60">
                  <span>
                    Limite: <strong className="text-zinc-200 font-mono">R$ {activeCard.limitMonthly.toLocaleString('pt-BR')}</strong>
                  </span>
                  <span>
                    Gasto no Mês: <strong className="text-[#00FF41] font-mono">R$ {activeCard.currentSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FORMULÁRIO PRINCIPAL DE LANÇAMENTO (SETORES, NOMES, ANEXOS)        */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="bg-[#111217] border border-zinc-800/80 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-5 relative overflow-hidden">
          {/* Glowing accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF41]/5 rounded-full blur-3xl pointer-events-none" />

          {/* 1. SECTOR SELECTOR (COMERCIAL, MARKETING, ATENDIMENTO, DIRETORES) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#00FF41]" />
              Selecione o Setor da CEO Travel:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#090a0d] border border-zinc-800/70 rounded-2xl">
              {(['COMERCIAL', 'MARKETING', 'ATENDIMENTO', 'DIRETORES'] as SectorType[]).map((sec) => {
                const isSelected = selectedSector === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    id={`btn-sector-${sec.toLowerCase()}`}
                    onClick={() => setSelectedSector(sec)}
                    className={`py-2 px-1 rounded-xl font-black text-[10px] sm:text-[11px] uppercase tracking-wider transition-all text-center ${
                      isSelected
                        ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/40 shadow-[0_0_12px_rgba(0,255,65,0.25)]'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DYNAMIC EMPLOYEE NAME INPUT BASED ON CHOSEN SECTOR */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#00FF41]" />
              Nome do Colaborador / Solicitante ({selectedSector}):
            </label>
            <input
              type="text"
              id="input-nome-colaborador"
              required
              value={employeeNameInput}
              onChange={(e) => setEmployeeNameInput(e.target.value)}
              placeholder={`Digite o nome do colaborador do setor ${selectedSector}`}
              className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
            />
          </div>

          {/* 3. CATEGORY PILLS SELECTOR */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Tipo de Despesa / Lançamento:
            </label>
            <div className="flex items-center justify-between gap-1.5 p-1 bg-[#090a0d] border border-zinc-800/70 rounded-2xl">
              {[
                { id: 'uber_99', label: 'Uber / 99', icon: Car },
                { id: 'parking', label: 'Estacionam.', icon: CircleParking },
                { id: 'purchase', label: 'Compras', icon: ShoppingBag },
                { id: 'meal_event', label: 'Almoço', icon: Utensils },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`btn-cat-${cat.id}`}
                    onClick={() => setCategory(cat.id as ExpenseCategory)}
                    className={`flex-1 py-2 px-1.5 rounded-xl font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/40 shadow-[0_0_12px_rgba(0,255,65,0.2)]'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#00FF41]' : 'text-zinc-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORM WITH SPECIFIC FIELDS PER CATEGORY */}
          <form onSubmit={handleRegisterMovement} className="space-y-3.5 pt-1">
            {/* CATEGORY 1: UBER / 99 */}
            {category === 'uber_99' && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  id="input-origem"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Origem (ex: Sede CEO Travel)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
                <input
                  type="text"
                  id="input-destino"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destino (ex: Aeroporto, Hotel X)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
              </div>
            )}

            {/* CATEGORY 2: ESTACIONAMENTO */}
            {category === 'parking' && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  id="input-parking-location"
                  required
                  value={parkingLocation}
                  onChange={(e) => setParkingLocation(e.target.value)}
                  placeholder="Local / Estacionamento (ex: Estapar Aeroporto)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
                <input
                  type="text"
                  id="input-vehicle-plate"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="Placa do Veículo (ex: ABC-1234)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
              </div>
            )}

            {/* CATEGORY 3: COMPRAS */}
            {category === 'purchase' && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  id="input-merchant-name"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Fornecedor / Loja (ex: Kalunga, Leroy)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
                <input
                  type="text"
                  id="input-items-summary"
                  required
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  placeholder="O que foi comprado? (Resumo dos itens)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
              </div>
            )}

            {/* CATEGORY 4: ALMOÇO */}
            {category === 'meal_event' && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  id="input-restaurant-name"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Restaurante / Local (ex: Fogo de Chão)"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
                <input
                  type="text"
                  id="input-meal-guests"
                  value={mealGuests}
                  onChange={(e) => setMealGuests(e.target.value)}
                  placeholder="Participantes / Clientes convidados"
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
                />
              </div>
            )}

            {/* VALOR COBRADO (VIBRANT NEON STYLING) */}
            <div className="relative">
              <input
                type="text"
                id="input-valor-cobrado"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Valor Cobrado (ex: 45,90)"
                className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3.5 text-base sm:text-lg font-black text-[#00FF41] placeholder-[#00FF41]/60 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_20px_rgba(0,255,65,0.35)] transition-all"
              />
            </div>

            {/* DATA E HORA COM COMPETÊNCIA MENSAL INTELIGENTE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Data & Hora da Despesa:</span>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/30 font-mono text-[10px] font-bold">
                  Mês de Competência: {
                    MONTHS_OPTIONS.find((m) => m.id === extractMonthFromDate(date))?.name || 'Mês Atual'
                  }
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  id="input-data"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] transition-all font-mono"
                />
                <input
                  type="time"
                  id="input-hora"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] transition-all font-mono"
                />
              </div>
            </div>

            {/* QUEM APROVOU */}
            <input
              type="text"
              id="input-quem-aprovou"
              required
              value={authorizer}
              onChange={(e) => setAuthorizer(e.target.value)}
              placeholder="Quem aprovou? (ex: Diretoria CEO Travel / Gestor)"
              className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-all font-medium"
            />

            {/* OBSERVAÇÃO / SOBRE O QUE SE TRATA */}
            <textarea
              id="input-observacao"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observação: sobre o que se trata (ex: Visita a cliente X, Reunião de fechamento, Material urgente...)"
              className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] transition-all resize-none font-medium"
            />

            {/* BOTÃO DE ANEXAR COMPROVANTE / DOCUMENTO / FOTO */}
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="input-file-receipt"
              />

              {!receiptUrl ? (
                <button
                  type="button"
                  id="btn-anexar-documento"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-700/80 hover:border-[#00FF41]/50 text-zinc-300 hover:text-[#00FF41] text-xs font-bold flex items-center justify-center gap-2 transition-all group shadow-sm"
                >
                  <Paperclip className="w-4 h-4 text-[#00FF41] group-hover:scale-110 transition-transform" />
                  <span>Anexar Comprovante / Cupom Fiscal / Foto</span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#00FF41]/10 border border-[#00FF41]/40 text-xs">
                  <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                    {receiptUrl.startsWith('data:image') ? (
                      <img
                        src={receiptUrl}
                        alt="Recibo"
                        onClick={() => setPreviewImageUrl(receiptUrl)}
                        className="w-8 h-8 rounded-lg object-cover border border-[#00FF41]/50 cursor-pointer"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-[#00FF41]" />
                    )}
                    <div className="truncate">
                      <span className="font-bold text-[#00FF41] block truncate">
                        {receiptName || 'Arquivo anexado'}
                      </span>
                      <span className="text-[10px] text-zinc-400">Comprovante pronto para envio</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400"
                    title="Remover anexo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Optional trip mode checkbox for Uber */}
            {category === 'uber_99' && (
              <div className="flex items-center justify-between pt-1 px-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-400 hover:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={saveAsOpenTrip}
                    onChange={(e) => setSaveAsOpenTrip(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-[#00FF41] focus:ring-[#00FF41]"
                  />
                  <span>Ida a evento (deixar em aberto para adicionar a volta depois)</span>
                </label>
              </div>
            )}

            {/* Main Action Buttons (Perfect Y-Axis alignment, high contrast, top layer) */}
            <div className="flex items-center gap-2.5 pt-1 relative z-10">
              <button
                type="submit"
                id="btn-registrar-movimentacao"
                className="flex-1 py-3.5 sm:py-4 rounded-2xl bg-[#00FF41] hover:bg-[#10ff55] text-black font-black text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(0,255,65,0.55)] transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>REGISTRAR MOVIMENTAÇÃO</span>
              </button>

              <button
                type="button"
                id="btn-limpar-campos"
                onClick={() => {
                  if (isAdminUnlocked) {
                    handleResetFormFields();
                  } else {
                    setPasswordActionType('clean_form');
                    setIsPasswordModalOpen(true);
                  }
                }}
                className="px-4 py-3.5 sm:py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer whitespace-nowrap"
                title="Limpar campos preenchidos na tela (Exclusivo para Administrador)"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Limpar</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-bold border border-amber-500/30">
                  Admin
                </span>
              </button>
            </div>
          </form>

          {/* Success Feedback Toast & Form Cleared Toast */}
          <AnimatePresence>
            {showSuccessToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3 rounded-xl bg-[#00FF41]/20 border border-[#00FF41] text-[#00FF41] text-xs font-bold text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00FF41]" />
                <span>Movimentação registrada com sucesso para CEO Travel!</span>
              </motion.div>
            )}
            {formCleanToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-2xl bg-zinc-900/95 border border-[#00FF41]/50 text-zinc-200 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,65,0.2)]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00FF41] shrink-0" />
                <span>Formulário limpo pelo Administrador. Todos os lançamentos salvos continuam guardados em seus respectivos meses.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ABA DO ADMINISTRADOR (CONTROLE TOTAL DE QUALQUER INFORMAÇÃO)       */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="bg-[#111217] border border-[#00FF41]/40 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-5 relative">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-zinc-100">
                    Painel do Administrador
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30 font-mono font-bold">
                    ACESSO LIBERADO
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Gerencie lançamentos, cartões liberados, limites e credenciais de segurança.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={onOpenInvoiceReconciler}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-[#00FF41]/50 text-zinc-200 hover:text-[#00FF41] text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>Faturas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAdminUnlocked(false);
                  setActiveTab('expenses');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Bloquear Área do Administrador"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear</span>
              </button>
            </div>
          </div>

          {/* SUB-TABS NAVIGATION IN ADMIN */}
          <div className="flex items-center gap-1.5 p-1 bg-[#090a0d] border border-zinc-800/80 rounded-2xl">
            <button
              type="button"
              id="btn-admin-subtab-movements"
              onClick={() => setAdminSubTab('movements')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                adminSubTab === 'movements'
                  ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/40 shadow-[0_0_12px_rgba(0,255,65,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Lançamentos & Auditoria</span>
            </button>

            <button
              type="button"
              id="btn-admin-subtab-cards"
              onClick={() => {
                setAdminSubTab('cards');
                const targetCard = cards.find((c) => c.id === editingCardId) || cards[0] || null;
                loadCardToForm(targetCard);
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                adminSubTab === 'cards'
                  ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/40 shadow-[0_0_12px_rgba(0,255,65,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Gestão de Cartões</span>
            </button>

            <button
              type="button"
              id="btn-admin-subtab-password"
              onClick={() => setAdminSubTab('password')}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                adminSubTab === 'password'
                  ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/40 shadow-[0_0_12px_rgba(0,255,65,0.25)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Alterar Senha</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SUBTAB 1: MOVIMENTAÇÕES & AUDITORIA                                       */}
          {/* ========================================================================= */}
          {adminSubTab === 'movements' && (
            <div className="space-y-4">
              {/* Search & Sector Filters in Admin */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    placeholder="Buscar por colaborador, setor, trajeto, autorizador ou observação..."
                    className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00FF41]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {['all', 'COMERCIAL', 'MARKETING', 'ATENDIMENTO', 'DIRETORES'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setListSectorFilter(sec)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                        listSectorFilter === sec
                          ? 'bg-[#00FF41] text-black shadow-[0_0_10px_rgba(0,255,65,0.3)]'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {sec === 'all' ? 'Todos os Setores' : sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Expense Item List with instant "Editar" Button */}
              <div className="space-y-3 pt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Lista de Movimentações ({filteredExpensesList.length} Registros) - Clique em Editar para alterar qualquer dado:
                </span>

                {filteredExpensesList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 bg-[#090a0d] rounded-2xl border border-zinc-800">
                    Nenhum lançamento encontrado para a busca.
                  </div>
                ) : (
                  filteredExpensesList.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-[#090a0d] border border-zinc-800 hover:border-[#00FF41]/40 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#00FF41]/20 text-[#00FF41] font-mono border border-[#00FF41]/30">
                            {exp.employeeDept}
                          </span>
                          <span className="text-xs font-bold text-zinc-100 truncate">
                            {exp.employeeName}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {new Date(exp.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            {exp.category === 'uber_99'
                              ? 'Uber/99'
                              : exp.category === 'parking'
                              ? 'Estacionamento'
                              : exp.category === 'purchase'
                              ? 'Compras'
                              : 'Almoço'}
                          </span>
                        </div>

                        <div className="text-xs text-zinc-300 font-medium truncate">
                          {exp.details.origin ? (
                            <span>{exp.details.origin} ➔ {exp.details.destination}</span>
                          ) : (
                            <span>{exp.title}</span>
                          )}
                        </div>

                        {exp.details.notes && (
                          <p className="text-[11px] text-zinc-400 italic truncate">
                            "{exp.details.notes}"
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                          <span>Aprovado por: <strong className="text-zinc-400">{exp.authorizationBy}</strong></span>
                          <span>Status: <strong className={exp.status === 'open' ? 'text-amber-400' : 'text-[#00FF41]'}>{exp.status.toUpperCase()}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <span className="font-mono font-black text-sm text-[#00FF41] block">
                          R$ {exp.totalAmount.toFixed(2)}
                        </span>

                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            id={`btn-admin-edit-exp-${exp.id}`}
                            onClick={() => setEditingExpense(exp)}
                            className="px-2.5 py-1 rounded-xl bg-[#00FF41]/15 hover:bg-[#00FF41] text-[#00FF41] hover:text-black border border-[#00FF41]/40 font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            id={`btn-admin-del-exp-${exp.id}`}
                            onClick={() => {
                              if (window.confirm(`Deseja excluir permanentemente o lançamento de R$ ${exp.totalAmount.toFixed(2)} de ${exp.employeeName}?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-all shadow-sm"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBTAB 2: GESTÃO DE CARTÕES COM BOTÃO SALVAR                              */}
          {/* ========================================================================= */}
          {adminSubTab === 'cards' && (
            <div className="space-y-4">
              {/* Card Save Toast Alert */}
              <AnimatePresence>
                {cardSaveToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-[#00FF41]/15 border border-[#00FF41]/50 rounded-2xl text-xs font-bold text-[#00FF41] flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#00FF41] shrink-0" />
                    <span>{cardSaveToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card List Selector + New Card Button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    {cards.length === 0
                      ? 'Nenhum Cartão Cadastrado • Preencha para Criar:'
                      : 'Selecione um Cartão para Editar ou Cadastre Novo:'}
                  </label>
                  <button
                    type="button"
                    id="btn-admin-add-new-card"
                    onClick={() => loadCardToForm(null)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                      editingCardId === 'new'
                        ? 'bg-[#00FF41] text-black shadow-[0_0_12px_rgba(0,255,65,0.4)]'
                        : 'bg-zinc-900 text-[#00FF41] border border-[#00FF41]/40 hover:bg-[#00FF41]/10'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Novo Cartão</span>
                  </button>
                </div>

                {cards.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cards.map((c) => {
                      const isEditingThis = editingCardId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          id={`btn-admin-edit-card-${c.id}`}
                          onClick={() => loadCardToForm(c)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            isEditingThis
                              ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/50 shadow-[0_0_12px_rgba(0,255,65,0.2)]'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                            •••• {c.last4}
                          </span>
                          {c.status === 'blocked' && (
                            <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-400">
                              Bloqueado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CARD FORM */}
              <form onSubmit={handleSaveCard} className="space-y-3.5 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Nome / Identificação do Cartão:
                    </label>
                    <input
                      type="text"
                      id="input-card-form-name"
                      required
                      value={cardFormName}
                      onChange={(e) => setCardFormName(e.target.value)}
                      placeholder="ex: Cartão Corporativo Principal"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41] transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Banco Emissor:
                    </label>
                    <input
                      type="text"
                      id="input-card-form-bank"
                      required
                      value={cardFormBank}
                      onChange={(e) => setCardFormBank(e.target.value)}
                      placeholder="ex: Banco Itaú BBA, Bradesco, Santander"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41] transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      4 Últimos Dígitos:
                    </label>
                    <input
                      type="text"
                      id="input-card-form-last4"
                      maxLength={4}
                      required
                      value={cardFormLast4}
                      onChange={(e) => setCardFormLast4(e.target.value)}
                      placeholder="ex: 9911"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#00FF41] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Validade (MM/AA):
                    </label>
                    <input
                      type="text"
                      id="input-card-form-expiry"
                      required
                      value={cardFormExpiry}
                      onChange={(e) => setCardFormExpiry(e.target.value)}
                      placeholder="12/30"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#00FF41] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      CVV (Código):
                    </label>
                    <input
                      type="text"
                      id="input-card-form-cvv"
                      required
                      value={cardFormCvv}
                      onChange={(e) => setCardFormCvv(e.target.value)}
                      placeholder="456"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-[#00FF41] font-mono font-bold focus:outline-none focus:border-[#00FF41] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Limite Mensal (R$):
                    </label>
                    <input
                      type="text"
                      id="input-card-form-limit"
                      required
                      value={cardFormLimitMonthly}
                      onChange={(e) => setCardFormLimitMonthly(e.target.value)}
                      placeholder="10000"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 font-mono font-bold focus:outline-none focus:border-[#00FF41] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Número Completo Real:
                    </label>
                    <input
                      type="text"
                      id="input-card-form-full-number"
                      value={cardFormFullNumber}
                      onChange={(e) => setCardFormFullNumber(e.target.value)}
                      placeholder="ex: 5424 8812 9900 9911"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-[#00FF41] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Nome Impresso no Cartão (Titular):
                    </label>
                    <input
                      type="text"
                      id="input-card-form-holder"
                      value={cardFormHolderName}
                      onChange={(e) => setCardFormHolderName(e.target.value)}
                      placeholder="ex: CEO TRAVEL CORP"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41] transition-all"
                    />
                  </div>
                </div>

                {/* Status and Brand selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Status do Cartão:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id="btn-card-status-active"
                        onClick={() => setCardFormStatus('active')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          cardFormStatus === 'active'
                            ? 'bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]'
                            : 'bg-[#090a0d] text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Liberado para Uso</span>
                      </button>

                      <button
                        type="button"
                        id="btn-card-status-blocked"
                        onClick={() => setCardFormStatus('blocked')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          cardFormStatus === 'blocked'
                            ? 'bg-red-500/20 text-red-400 border border-red-500'
                            : 'bg-[#090a0d] text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bloqueado</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Bandeira:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['mastercard', 'visa', 'elo'] as const).map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setCardFormBrand(brand)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold uppercase transition-all ${
                            cardFormBrand === brand
                              ? 'bg-[#181a22] text-[#00FF41] border border-[#00FF41]/50'
                              : 'bg-[#090a0d] text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PROMINENT SAVE CARD BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-salvar-cartao-admin"
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,65,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Cartão & Atualizar Lançamentos</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUBTAB 3: ALTERAR SENHA DO ADMINISTRADOR                                  */}
          {/* ========================================================================= */}
          {adminSubTab === 'password' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#090a0d] border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-[#00FF41]">
                  <KeyRound className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Alteração de Senha do Administrador
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Informe a senha anterior e defina uma nova senha para proteger o Painel de Administrador.
                </p>
              </div>

              {/* Alert Feedback Messages */}
              <AnimatePresence>
                {passError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-red-500/15 border border-red-500/40 rounded-2xl text-xs font-bold text-red-400 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passError}</span>
                  </motion.div>
                )}

                {passSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-[#00FF41]/15 border border-[#00FF41]/50 rounded-2xl text-xs font-bold text-[#00FF41] flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSavePassword} className="space-y-3.5">
                {/* 1. Senha Anterior */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    1. Senha Anterior / Atual:
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      id="input-admin-senha-anterior"
                      required
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      placeholder="Digite a senha anterior (padrão: 1234)"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                    >
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 2. Nova Senha */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    2. Nova Senha:
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      id="input-admin-nova-senha"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Digite a nova senha desejada"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 3. Confirmar Nova Senha */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    3. Confirmar Nova Senha Novamente:
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      id="input-admin-confirmar-nova-senha"
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Repita a nova senha para confirmar"
                      className="w-full bg-[#090a0d] border border-zinc-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#00FF41] font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-200"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* PROMINENT SAVE PASSWORD BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="btn-salvar-senha-admin"
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,255,65,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Nova Senha</span>
                  </button>
                </div>
              </form>

              {/* DANGER ZONE / PRODUCTION RESET (ADMIN ONLY) */}
              {onClearAllForProduction && (
                <div className="mt-8 pt-6 border-t border-red-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <Trash2 className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      Zona Crítica do Administrador • Zerar Dados de Teste
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Caso queira iniciar o sistema do zero em modo de produção real (removendo lançamentos fictícios de teste), utilize este botão com confirmação de segurança.
                  </p>
                  <button
                    type="button"
                    id="btn-wipe-production-admin"
                    onClick={() => setShowConfirmWipeModal(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(239,68,68,0.15)] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Zerar Lançamentos de Teste para Produção</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA LANÇAMENTOS: WIDGET DE CORRIDAS / DESLOCAMENTOS EM ABERTO (PRECISA VOLTA) */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          {/* Card de Alerta / Status de Corridas em Aberto */}
          {openLegsExpenses.length > 0 ? (
            <div className="bg-[#14120e] border border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-[0_10px_35px_rgba(245,158,11,0.15)] space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Corridas em Aberto (Aguardando Volta)</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px]">
                        {openLegsExpenses.length} PENDENTE{openLegsExpenses.length > 1 ? 'S' : ''}
                      </span>
                    </h4>
                    <span className="text-[11px] text-zinc-400 block">
                      Idas registradas que precisam do lançamento da corrida de volta.
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de viagens em aberto para adicionar a volta facilmente */}
              <div className="space-y-2.5 pt-1">
                {openLegsExpenses.map((exp) => {
                  const isEditingThis = editingReturnId === exp.id;
                  return (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-[#0c0d12] border border-amber-500/30 hover:border-amber-500/60 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00FF41]/15 text-[#00FF41] font-mono border border-[#00FF41]/30">
                              {exp.employeeDept}
                            </span>
                            <span className="text-xs font-black text-zinc-100">
                              {exp.employeeName}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(exp.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5 pt-0.5">
                            <span className="text-zinc-400">Ida:</span>
                            <span className="text-zinc-200">{exp.details.origin || 'Origem'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-amber-300 font-bold">{exp.details.destination || 'Destino'}</span>
                          </div>

                          <div className="text-[11px] text-zinc-400 flex items-center gap-3 pt-0.5">
                            <span>Valor da Ida: <strong className="text-[#00FF41] font-mono">R$ {exp.totalAmount.toFixed(2)}</strong></span>
                            {exp.authorizationBy && (
                              <span>Aprovado por: <strong className="text-zinc-300">{exp.authorizationBy}</strong></span>
                            )}
                          </div>
                        </div>

                        {!isEditingThis && (
                          <button
                            type="button"
                            id={`btn-open-add-return-${exp.id}`}
                            onClick={() => {
                              setEditingReturnId(exp.id);
                              setReturnDestination(exp.details.origin || 'Sede CEO Travel');
                              setReturnAmountStr('');
                              setReturnNotes('');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Lançar Volta</span>
                          </button>
                        )}
                      </div>

                      {/* Formulário integrado para lançar a volta */}
                      {isEditingThis && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-2 border-t border-amber-500/20 space-y-3"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span>Completar Corrida de Retorno (Volta):</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 uppercase font-bold">
                                Destino da Volta:
                              </label>
                              <input
                                type="text"
                                value={returnDestination}
                                onChange={(e) => setReturnDestination(e.target.value)}
                                placeholder="Ex: Sede CEO Travel / Residência"
                                className="w-full bg-[#090a0d] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-zinc-400 uppercase font-bold">
                                Valor da Volta (R$):
                              </label>
                              <input
                                type="text"
                                required
                                value={returnAmountStr}
                                onChange={(e) => setReturnAmountStr(e.target.value)}
                                placeholder="0,00"
                                className="w-full bg-[#090a0d] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-zinc-400 uppercase font-bold">
                              Observações da Volta (Opcional):
                            </label>
                            <input
                              type="text"
                              value={returnNotes}
                              onChange={(e) => setReturnNotes(e.target.value)}
                              placeholder="Ex: Retorno de reunião com cliente"
                              className="w-full bg-[#090a0d] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingReturnId(null)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              id={`btn-salvar-volta-${exp.id}`}
                              onClick={() => handleSaveReturnAndLock(exp)}
                              className="px-4 py-1.5 rounded-xl bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,255,65,0.3)] cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Salvar Volta e Fechar Corrida</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#0c0d12] border border-zinc-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">
                    Nenhuma Corrida Pendente de Retorno
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Todas as idas já foram finalizadas ou são despesas únicas.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                0 em aberto
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESUMO DE CONCILIAÇÃO - DISPONÍVEL SOMENTE NA ABA DO ADMINISTRADOR       */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
      <div className="bg-[#111217] border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black italic tracking-wide text-[#00FF41] drop-shadow-[0_0_12px_rgba(0,255,65,0.7)]">
              RESUMO DE CONCILIAÇÃO
            </h3>
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mt-0.5">
              CARTÕES CEO TRAVEL • NAVEGAÇÃO MENSAL
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-[#00FF41]/40 text-[#00FF41] hover:bg-[#00FF41]/10 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)] whitespace-nowrap"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gerar Imagem PNG</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* NAVEGAÇÃO POR MESES: SCROLLABLE PILLS COM CONTAGEM DE GASTOS               */}
        {/* ========================================================================= */}
        <div className="bg-[#090a0d] border border-zinc-800/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5 text-[#00FF41]" />
              <span>Filtrar por Mês:</span>
              <span className="text-[11px] text-[#00FF41] font-mono font-black">
                {selectedMonthObj.name}
              </span>
            </div>
            {selectedMonth !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className="text-[10px] font-bold text-zinc-400 hover:text-[#00FF41] transition-colors"
              >
                Limpar Filtro (Ver Todos)
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {MONTHS_OPTIONS.map((m) => {
              const isSelected = selectedMonth === m.id;
              const count = getMonthCount(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  id={`btn-month-${m.id}`}
                  onClick={() => setSelectedMonth(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#00FF41] text-black font-black shadow-[0_0_15px_rgba(0,255,65,0.4)]'
                      : count > 0
                      ? 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white border border-zinc-700/80'
                      : 'bg-zinc-950/80 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900 border border-zinc-900'
                  }`}
                >
                  <span>{m.short}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-black/20 text-black'
                        : count > 0
                        ? 'bg-[#00FF41]/20 text-[#00FF41]'
                        : 'bg-zinc-800 text-zinc-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimalist 3-Metric KPIs (Calculated specifically for the selected month) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="p-3 rounded-2xl bg-[#090a0d] border border-zinc-800/80">
            <span className="text-[9px] uppercase font-mono text-zinc-500 block truncate">
              {selectedMonth === 'all' ? 'Total Geral' : `Gasto em ${selectedMonthObj.short}`}
            </span>
            <span className="font-mono font-black text-xs sm:text-base text-zinc-100 mt-0.5 block truncate">
              R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090a0d] border border-amber-500/30">
            <span className="text-[9px] uppercase font-mono text-amber-400 block truncate">Em Aberto</span>
            <span className="font-mono font-black text-xs sm:text-base text-amber-400 mt-0.5 block truncate">
              {openCount} <span className="text-[10px] font-normal text-zinc-500">pend.</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090a0d] border border-[#00FF41]/30">
            <span className="text-[9px] uppercase font-mono text-[#00FF41] block truncate">Conciliados</span>
            <span className="font-mono font-black text-xs sm:text-base text-[#00FF41] mt-0.5 block truncate">
              {reconciledCount} <span className="text-[10px] font-normal text-zinc-500">banco</span>
            </span>
          </div>
        </div>

        {/* Subheader info showing context */}
        <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/60 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-zinc-200">
              Movimentações:
            </span>
            <span className="text-[#00FF41] font-bold">
              {selectedMonthObj.name}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-mono">
              {monthFilteredExpenses.length} registro(s)
            </span>
          </div>
          {monthFilteredExpenses.length > 0 && (
            <span className="font-mono text-[11px] text-zinc-400">
              Soma: <strong className="text-[#00FF41]">R$ {totalSpent.toFixed(2)}</strong>
            </span>
          )}
        </div>

        {/* List of Registered Movements for the selected month */}
        <div className="space-y-3 pt-1">
          {monthFilteredExpenses.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-[#090a0d] border border-dashed border-zinc-800/80 space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20 flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-zinc-200">
                Nenhuma movimentação em {selectedMonthObj.name}
              </h4>
              <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                {selectedMonth === 'all'
                  ? 'Nenhuma movimentação registrada no sistema. Utilize o formulário acima para registrar novos gastos.'
                  : `Não há lançamentos cadastrados para o mês de ${selectedMonthObj.name}. Clique em outro mês na barra acima ou registre um novo lançamento.`}
              </p>
            </div>
          ) : (
            monthFilteredExpenses.slice(0, 20).map((exp) => {
              const isOpen = exp.status === 'open';
              const isReconciled = exp.status === 'reconciled' || !!exp.invoiceMatch;
              const isEditingThisReturn = editingReturnId === exp.id;

              return (
                <div
                  key={exp.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isOpen
                      ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : isReconciled
                      ? 'bg-[#00FF41]/5 border-[#00FF41]/30'
                      : 'bg-[#090a0d] border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-zinc-400">
                          {new Date(exp.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-800 text-zinc-300 font-mono">
                          {exp.employeeDept}
                        </span>
                        <span className="text-xs font-bold text-zinc-100">
                          {exp.employeeName}
                        </span>
                        {isOpen && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            Em Aberto
                          </span>
                        )}
                        {isReconciled && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/40">
                            Conciliado
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-300 font-medium">
                        {exp.details.origin ? (
                          <span>
                            {exp.details.origin} <span className="text-zinc-500">➔</span> {exp.details.destination}
                          </span>
                        ) : (
                          <span>{exp.title}</span>
                        )}
                      </div>

                      {exp.details.returnDestination && (
                        <div className="text-[11px] text-[#00FF41]">
                          Volta: {exp.details.returnOrigin} ➔ {exp.details.returnDestination}
                        </div>
                      )}

                      {exp.details.notes && (
                        <p className="text-[11px] text-zinc-400 italic">
                          "{exp.details.notes}"
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-0.5">
                        <span>Aprovado por: <strong className="text-zinc-400">{exp.authorizationBy}</strong></span>
                        {exp.details.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(exp.details.receiptUrl!)}
                            className="inline-flex items-center gap-1 text-[#00FF41] hover:underline font-bold"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Ver Comprovante</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className="font-mono font-black text-sm text-[#00FF41] block">
                        R$ {exp.totalAmount.toFixed(2)}
                      </span>

                      <div className="flex items-center justify-end gap-1.5">
                        {isOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingReturnId(isEditingThisReturn ? null : exp.id);
                              setReturnDestination(exp.details.origin || 'Sede CEO Travel');
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Volta</span>
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-edit-exp-${exp.id}`}
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-[#00FF41]/20 text-zinc-400 hover:text-[#00FF41] border border-zinc-800 transition-colors"
                          title="Editar movimentação (Admin)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          id={`btn-delete-exp-${exp.id}`}
                          onClick={() => {
                            if (window.confirm(`Deseja excluir o lançamento de R$ ${exp.totalAmount.toFixed(2)} de ${exp.employeeName}?`)) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors"
                          title="Excluir movimentação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Return Form */}
                  {isOpen && isEditingThisReturn && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-amber-500/30 space-y-2 text-xs"
                    >
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">
                        Registrar Retorno do Evento & Travar:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Destino de Volta (ex: Sede CEO Travel)"
                          value={returnDestination}
                          onChange={(e) => setReturnDestination(e.target.value)}
                          className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-[#00FF41]"
                        />
                        <input
                          type="text"
                          placeholder="Valor da Volta (ex: 42,50)"
                          value={returnAmountStr}
                          onChange={(e) => setReturnAmountStr(e.target.value)}
                          className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-[#00FF41] font-bold focus:outline-none focus:border-[#00FF41]"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingReturnId(null)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveReturnAndLock(exp)}
                          className="px-3 py-1.5 rounded-xl bg-[#00FF41] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,255,65,0.4)]"
                        >
                          Salvar & Travar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* ADMIN PASSWORD UNLOCK MODAL */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setPasswordActionType(null);
        }}
        title={
          passwordActionType === 'clean_form'
            ? 'Autorização de Administrador'
            : 'Área do Administrador'
        }
        description={
          passwordActionType === 'clean_form'
            ? 'Apenas o Administrador tem autorização para limpar os campos preenchidos na tela.'
            : 'Acesso exclusivo com senha para controle total de cartões, parâmetros e conciliação.'
        }
        confirmButtonText={
          passwordActionType === 'clean_form' ? 'Autorizar e Limpar' : 'Desbloquear Acesso'
        }
        onSuccess={() => {
          setIsAdminUnlocked(true);
          setIsPasswordModalOpen(false);
          if (passwordActionType === 'clean_form') {
            handleResetFormFields();
          } else {
            setActiveTab('admin');
          }
          setPasswordActionType(null);
        }}
      />

      {/* CONFIRMATION MODAL: WIPE TO PRODUCTION (CRU) */}
      {showConfirmWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="bg-[#111217] border border-red-500/40 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Zerar para Modo Produção
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Limpar todos os dados de teste
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Deseja limpar todos os lançamentos demonstrativos e deixar o sistema <strong className="text-white">100% cru e limpo</strong> pronto para uso real da CEO Travel?
            </p>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF41]" />
                <span>O sistema ficará pronto do zero</span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Você poderá restaurar os dados de teste a qualquer momento com o botão de restauração.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmWipeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-wipe-production"
                onClick={() => {
                  if (onClearAllForProduction) {
                    onClearAllForProduction();
                  }
                  setShowConfirmWipeModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Limpar</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADMIN EDIT EXPENSE MODAL */}
      <AdminEditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        cards={cards}
        onSaveExpense={onSaveExpense}
        onDeleteExpense={onDeleteExpense}
      />

      {/* RECEIPT IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#111217] border border-zinc-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#00FF41]" />
                Comprovante / Cupom Fiscal Anexado
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[60vh]">
              <img
                src={previewImageUrl}
                alt="Comprovante"
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 rounded-xl bg-[#00FF41] text-black font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
