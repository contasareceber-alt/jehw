import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  User,
  Users,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Check,
  ChevronDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onResetData: () => void;
  onOpenReportModal: () => void;
  openCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onResetData,
  onOpenReportModal,
  openCount,
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <div className="w-full h-full bg-zinc-950 rounded-[15px] flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
                  CARDMATCH
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 -mt-0.5 hidden sm:block">
                Conciliação Ágil de Cartões Corporativos & Deslocamento
              </p>
            </div>
          </div>

          {/* Center / User Switcher Simulator */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                type="button"
                id="btn-user-switcher-dropdown"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all text-xs"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500/50"
                />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-100">{currentUser.name}</span>
                    {currentUser.role === 'admin' ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Admin
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                        Funcionário
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block">{currentUser.department}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
              </button>

              {/* Dropdown menu to switch perspectives */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800/80 mb-1">
                    Alternar Usuário para Demonstração:
                  </div>

                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        id={`select-user-${u.id}`}
                        onClick={() => {
                          onSelectUser(u);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : 'hover:bg-zinc-800/60 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                          />
                          <div>
                            <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === 'admin' && (
                                <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-400 rounded">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400">{u.department}</span>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Help Button */}
            <button
              type="button"
              id="btn-open-help"
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-400 border border-zinc-800 transition-colors"
              title="Como Funciona o SaaS"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Reset Data Button */}
            <button
              type="button"
              id="btn-reset-demo-data"
              onClick={() => {
                if (confirm('Deseja recarregar os dados padrão de demonstração?')) {
                  onResetData();
                }
              }}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition-colors"
              title="Restaurar Dados Padrão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Help / Guide Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-zinc-100">
                  Guia do SaaS CardMatch Pro
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  🚗 1. Fluxo do Funcionário (Uber / 99 / Estacionamento / Compras)
                </h4>
                <p>
                  • O funcionário vê em destaque o <strong>Cartão de Crédito Corporativo 3D</strong> liberado para ele com número, validade e CVV.
                </p>
                <p>
                  • Para <strong>corridas de ida a eventos</strong>, o funcionário lança a origem e o valor da ida. O registro fica em <strong>"Em Aberto"</strong>.
                </p>
                <p>
                  • Quando for embora do evento, ele entra no app, insere o <strong>valor da volta e observações</strong> e clica em <strong>"Salvar & Travar Registro"</strong>. Depois de travado, só o Administrador pode reabrir!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  📊 2. Fluxo do Administrador & Fatura do Banco
                </h4>
                <p>
                  • O Admin tem o <strong>Dashboard Completo</strong> para ver quem colocou o quê, datas, quem autorizou e destinos.
                </p>
                <p>
                  • Na aba <strong>"Conciliador Inteligente"</strong>, o Admin compara as linhas reais da fatura bancária (nomes estranhos como <em>UBR*TRIP</em>, <em>99APP</em>) com os gastos cadastrados pelos funcionários e faz a conciliação com 1 clique!
                </p>
                <p>
                  • Na aba <strong>"Gestão de Cartões"</strong>, o Admin libera/bloqueia cartões para pessoas específicas e altera limites.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-purple-400 flex items-center gap-1.5">
                  🖼️ 3. Gerador de Imagem do Mês (PNG)
                </h4>
                <p>
                  • Ao final do mês, basta clicar no botão <strong>"Gerar Imagem do Relatório do Mês"</strong> no topo do painel para obter uma imagem pronta para download com o resumo de tudo o que aconteceu!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md"
              >
                Entendi, vamos começar!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
