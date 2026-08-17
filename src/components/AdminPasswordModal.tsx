import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, KeyRound, X, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { checkAdminPassword } from '../services/storage';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(password)) {
      setError(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPassword('');
        onSuccess();
      }, 500);
    } else {
      setError(true);
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="bg-[#111217]/95 border border-[#00FF41]/40 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_50px_rgba(0,255,65,0.25)] relative overflow-hidden"
      >
        {/* Neon Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FF41] to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#00FF41]/15 text-[#00FF41] border border-[#00FF41]/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Área Restrita
              </h3>
              <p className="text-[11px] text-zinc-400">
                Acesso exclusivo do Administrador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
              Digite a Senha de Administrador:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Digite a senha..."
                className={`w-full bg-[#090a0d] border rounded-2xl pl-4 pr-11 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-mono ${
                  error
                    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'border-zinc-700 focus:border-[#00FF41] focus:shadow-[0_0_15px_rgba(0,255,65,0.25)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-red-400 font-semibold flex items-center gap-1 mt-1"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Senha incorreta. Tente novamente.</span>
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-[#00FF41] font-semibold flex items-center gap-1 mt-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Senha correta! Liberando acesso...</span>
              </motion.p>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-[10px] text-zinc-400 flex items-center justify-between">
            <span>Dica de senha padrão:</span>
            <span className="font-mono text-[#00FF41] font-bold bg-[#00FF41]/10 px-1.5 py-0.5 rounded border border-[#00FF41]/30">
              1234
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirm-admin-password"
              className="flex-1 py-2.5 rounded-xl bg-[#00FF41] hover:bg-[#10ff55] text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,255,65,0.4)] flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Desbloquear</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
