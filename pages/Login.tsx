
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, User as UserIcon, ArrowRight, Smartphone, Apple, Video as VideoIcon } from 'lucide-react';
import { signIn, signUp } from '../supabaseStore';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import HeartBurst, { HeartBurstRef } from '../components/effects/HeartBurst';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [vslIds, setVslIds] = useState<{ iphone: string, android: string }>({ iphone: '', android: '' });
  const [selectedDevice, setSelectedDevice] = useState<'iphone' | 'android'>('iphone');
  const heartBurstRef = React.useRef<HeartBurstRef>(null);

  const handleBurst = () => {
    heartBurstRef.current?.burst();
  };

  React.useEffect(() => {
    fetchVslSettings();
  }, []);

  const fetchVslSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'login_vsl')
        .single();

      if (data?.value) {
        const val = data.value as any;
        setVslIds({ iphone: val.iphone_id || '', android: val.android_id || '' });
      }
    } catch (err) {
      console.error('Error fetching VSL:', err);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('embed/')) videoId = url.split('embed/')[1].split('?')[0];
    else videoId = url;
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await signIn(email, password);
        onLogin();
        navigate(user.role === UserRole.ADMIN ? '/admin/courses' : '/student/courses');
      } else {
        if (password.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }
        const user = await signUp(email, password, name);
        onLogin();
        navigate(user.role === UserRole.ADMIN ? '/admin/courses' : '/student/courses');
      }
    } catch (err: any) {
      console.error('Auth error:', err);

      // Handle common Supabase errors
      if (err.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (err.message?.includes('User already registered')) {
        setError('Este e-mail já está cadastrado.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Por favor, confirme seu e-mail antes de fazer login.');
      } else if (err.message?.includes('Password should be')) {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError(err.message || 'Erro ao processar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center selection:bg-indigo-500 selection:text-white">
      <HeartBurst ref={heartBurstRef} />
      {/* Auth Header */}
      <header className="w-full h-20 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-[#050507]/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <img
            src="https://qozsqbmertgivtsgugwv.supabase.co/storage/v1/object/public/branding/logo.png?v=1"
            alt="Lovable Infinito"
            className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          />
        </div>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            handleBurst();
          }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500 active:scale-95 shadow-[0_0_15px_-5px_rgba(79,70,229,0.3)]"
        >
          {mode === 'signup' ? 'Já tenho conta' : 'Criar minha conta'}
          <ArrowRight size={16} />
        </button>
      </header>

      {/* Auth Container */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4">
        {/* VSL Video Section - Moved Above Card */}
        <AnimatePresence mode="wait">
          {vslIds && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-[#0f0f13] rounded-[2.5rem] border border-white/5 p-6 mb-6 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full blur-[60px] -mr-20 -mt-20 pointer-events-none" />

              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <VideoIcon size={16} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Guia de Instalação</h4>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Salve como App na Tela Inicial</p>
                </div>
              </div>

              <div className="aspect-video w-full bg-black/40 rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
                {selectedDevice === 'iphone' ? (
                  vslIds.iphone ? (
                    <iframe
                      src={getYouTubeEmbedUrl(vslIds.iphone) || ''}
                      className="w-full h-full border-none"
                      allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
                      allowFullScreen={true}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                      <Apple size={40} className="mb-2 opacity-20" />
                      <span className="text-[10px] uppercase font-black">Vídeo em breve</span>
                    </div>
                  )
                ) : (
                  vslIds.android ? (
                    <iframe
                      src={getYouTubeEmbedUrl(vslIds.android) || ''}
                      className="w-full h-full border-none"
                      allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
                      allowFullScreen={true}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                      <Smartphone size={40} className="mb-2 opacity-20" />
                      <span className="text-[10px] uppercase font-black">Vídeo em breve</span>
                    </div>
                  )
                )}
              </div>

              {/* Device Buttons BELOW Video */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setSelectedDevice('iphone');
                    handleBurst();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedDevice === 'iphone'
                    ? 'bg-indigo-600/10 text-white border-indigo-500/40 shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]'
                    : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'
                    }`}
                >
                  <Apple size={14} className={selectedDevice === 'iphone' ? 'text-indigo-400' : ''} />
                  Uso iPhone
                </button>
                <button
                  onClick={() => {
                    setSelectedDevice('android');
                    handleBurst();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${selectedDevice === 'android'
                    ? 'bg-indigo-600/10 text-white border-indigo-500/40 shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]'
                    : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'
                    }`}
                >
                  <Smartphone size={14} className={selectedDevice === 'android' ? 'text-indigo-400' : ''} />
                  Uso Android
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f13] w-full max-w-md rounded-[2.5rem] border border-white/5 p-8 md:p-12 flex flex-col shadow-2xl relative overflow-hidden"
        >

          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

          <div className="mb-10 relative z-10">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {mode === 'signup' ? 'Comece sua jornada' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-slate-400 mt-2 font-medium">
              {mode === 'signup'
                ? 'Crie sua conta e entre no infinito.'
                : 'Acesse seu painel e continue evoluindo.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border border-red-500/20"
                >
                  <AlertCircle size={20} className="shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Nome Completo</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como você quer ser chamado?"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 focus:border-indigo-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 focus:border-indigo-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha</label>
                {mode === 'login' && (
                  <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">Esqueceu?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="No mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 focus:border-indigo-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              onClick={handleBurst}
              className="w-full py-4 px-6 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-[0_0_25px_-5px_rgba(79,70,229,0.4)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center mt-6"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                mode === 'signup' ? "Criar conta agora" : "Entrar na plataforma"
              )}
            </button>
          </form>

          <div className="mt-10 text-center relative z-10">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Ao continuar, você concorda com nossos <button className="text-slate-300 underline underline-offset-4">Termos</button> e <button className="text-slate-300 underline underline-offset-4">Privacidade</button>.
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="w-full py-8 text-center text-slate-600 text-[10px] font-bold tracking-[0.2em] border-t border-white/5">
        &copy; 2026 LOVABLE INFINITO - DIREITOS RESERVADOS
      </footer>
    </div>
  );
};

export default Login;
