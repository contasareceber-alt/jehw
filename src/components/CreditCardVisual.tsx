import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Eye, EyeOff, Copy, Check, Wifi, Sparkles, AlertTriangle, CreditCard as CardIcon } from 'lucide-react';
import { CorporateCard } from '../types';

interface CreditCardVisualProps {
  card: CorporateCard;
  isInteractive?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  card,
  isInteractive = true,
  onSelect,
  isSelected = false,
}) => {
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const percentUsed = Math.min(100, Math.round((card.currentSpent / card.limitMonthly) * 100));
  const available = Math.max(0, card.limitMonthly - card.currentSpent);

  // Theme styles based on card
  const themeGradients = {
    'neon-lime': 'from-zinc-950 via-zinc-900 to-[#042611] border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.15)]',
    'neon-cyan': 'from-zinc-950 via-zinc-900 to-[#032030] border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.15)]',
    'neon-emerald': 'from-zinc-950 via-zinc-900 to-[#062c1e] border-teal-500/40 shadow-[0_0_35px_rgba(20,184,166,0.15)]',
    'cyber-purple': 'from-zinc-950 via-zinc-900 to-[#1f0a35] border-purple-500/40 shadow-[0_0_35px_rgba(168,85,247,0.15)]',
  };

  const glowAccent = {
    'neon-lime': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    'neon-cyan': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    'neon-emerald': 'text-teal-400 border-teal-500/30 bg-teal-500/10',
    'cyber-purple': 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  };

  return (
    <div className="w-full max-w-lg mx-auto select-none" id={`card-container-${card.id}`}>
      {/* 3D Modern Physical Card */}
      <motion.div
        whileHover={{ scale: isInteractive ? 1.015 : 1, y: isInteractive ? -3 : 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        onClick={onSelect}
        className={`relative overflow-hidden rounded-2xl border p-6 bg-gradient-to-br transition-all duration-300 ${
          themeGradients[card.colorTheme] || themeGradients['neon-lime']
        } ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950' : ''} ${
          card.status === 'blocked' ? 'opacity-70 grayscale-[50%]' : ''
        }`}
      >
        {/* Ambient Mesh Glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#22c55e08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cartão Corporativo</span>
                {card.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-2.5 h-2.5" /> Bloqueado
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-zinc-100 tracking-wide">{card.bank}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-zinc-400 rotate-90" />
            {card.brand === 'mastercard' && (
              <div className="flex items-center -space-x-2">
                <div className="w-6 h-6 rounded-full bg-rose-500/90 shadow" />
                <div className="w-6 h-6 rounded-full bg-amber-400/90 shadow" />
              </div>
            )}
            {card.brand === 'visa' && (
              <span className="text-lg font-black tracking-widest italic text-zinc-100">VISA</span>
            )}
            {card.brand === 'elo' && (
              <span className="text-sm font-extrabold tracking-tight px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-yellow-400">elo</span>
            )}
          </div>
        </div>

        {/* EMV Chip & Contactless */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-500 border border-amber-400/80 shadow-md flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-800/40" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-amber-800/40" />
            <div className="w-6 h-5 border border-amber-700/40 rounded-sm" />
          </div>

          {/* Quick Actions (Reveal / Copy) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id={`btn-toggle-sensitive-${card.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowSensitive(!showSensitive);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {showSensitive ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
              {showSensitive ? 'Ocultar Dados' : 'Exibir Dados'}
            </button>
          </div>
        </div>

        {/* Card Number */}
        <div className="relative z-10 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Número do Cartão</span>
            <button
              type="button"
              id={`btn-copy-card-${card.id}`}
              onClick={(e) => handleCopy(showSensitive ? card.fullNumberReal.replace(/\s/g, '') : card.last4, 'card', e)}
              className="text-zinc-400 hover:text-emerald-400 text-xs flex items-center gap-1 transition-colors"
            >
              {copiedField === 'card' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.2em] text-zinc-100 mt-1 flex items-center gap-2">
            {showSensitive ? card.fullNumberReal : card.fullNumberMasked}
          </div>
        </div>

        {/* Card Details: Holder Name, Expiry, CVV */}
        <div className="relative z-10 grid grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          <div>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Titular</span>
            <span className="font-semibold text-zinc-200 truncate block mt-0.5">{card.holderName}</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Validade</span>
            <span className="font-mono font-bold text-zinc-200 mt-0.5 block">{card.expiry}</span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">CVV</span>
              {showSensitive && (
                <button
                  type="button"
                  id={`btn-copy-cvv-${card.id}`}
                  onClick={(e) => handleCopy(card.cvv, 'cvv', e)}
                  className="text-zinc-400 hover:text-emerald-400 text-[10px]"
                >
                  {copiedField === 'cvv' ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              )}
            </div>
            <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
              {showSensitive ? card.cvv : '•••'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Limit & Security Bar Info */}
      <div className="mt-3 bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between text-zinc-300">
          <span className="font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Limite Mensal
          </span>
          <span className="font-mono font-semibold text-zinc-100">
            R$ {card.currentSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {card.limitMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentUsed > 85
                ? 'bg-rose-500'
                : percentUsed > 60
                ? 'bg-amber-400'
                : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>Disponível: <strong className="text-emerald-400 font-mono">R$ {available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
          <span>{percentUsed}% utilizado</span>
        </div>

        {card.description && (
          <div className="pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{card.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};
