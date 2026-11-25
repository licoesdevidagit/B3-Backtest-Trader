import React, { useState } from 'react';
import { X, Lock, CreditCard, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCPF = (value: string) => {
  const nums = value.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [cpf, setCpf] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      setError('CPF inválido. Digite os 11 números do CPF.');
      setLoading(false);
      return;
    }

    const internalEmail = `${cleanCpf}@b3trader.local`;

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
        if (name.trim() && userCredential.user) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, internalEmail, password);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Ocorreu um erro na autenticação.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'CPF ou senha incorretos.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este CPF já está cadastrado.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        msg = 'O login por E-mail/Senha não está ativado no console do Firebase (Authentication > Sign-in method).';
      } else {
        msg = `Erro: ${err.message || 'Ocorreu um erro na autenticação.'}`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                {isSignUp ? 'Criar Conta com CPF' : 'Entrar com CPF'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSignUp ? 'Salve seus trades e setups na nuvem com segurança' : 'Acesse seus dados de qualquer dispositivo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              !isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              isSignUp ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome do Trader
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu Nome"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              CPF
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                required
                maxLength={14}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
                minLength={6}
              />
            </div>
            {isSignUp && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Mínimo de 6 caracteres.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Processando...</span>
            ) : isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Criar Conta com CPF</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Entrar com CPF</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
