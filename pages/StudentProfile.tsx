
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Award, Clock, BookOpen, ChevronRight, Play, Zap, LogOut, X, Lock, Check, Camera } from 'lucide-react';
import { getDB, getLoggedUser, logout, updateProfile, updateUserPassword, uploadAvatar } from '../supabaseStore';
import { Course, Progress, Lesson } from '../types';
import { useNavigate } from 'react-router-dom';
import SupportFloatingButton from '../components/SupportFloatingButton';

const StudentProfile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getLoggedUser());
  const [stats, setStats] = useState({
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    coursesInProgress: [] as { course: Course, progress: number }[]
  });

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const db = getDB();
    const userProgress = db.progress.filter(p => p.userId === user.id && p.completed);
    const inProgress: { course: Course, progress: number }[] = [];

    db.courses.forEach(course => {
      const courseLessons = db.lessons.filter(l => db.modules.some(m => m.courseId === course.id && m.id === l.moduleId));
      const completedInCourse = userProgress.filter(p => courseLessons.some(l => l.id === p.lessonId)).length;

      if (courseLessons.length > 0) {
        const percent = Math.round((completedInCourse / courseLessons.length) * 100);
        inProgress.push({ course, progress: percent });
      }
    });

    setStats({
      completedCourses: inProgress.filter(p => p.progress === 100).length,
      totalLessons: db.lessons.length,
      completedLessons: userProgress.length,
      coursesInProgress: inProgress
    });
  }, [user]);

  useEffect(() => {
    if (isSettingsOpen && user) {
      setNewName(user.name);
      setNewPassword('');
      setSaveMessage(null);
    }
  }, [isSettingsOpen, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAvatarClick = () => {
    if (!isUploadingAvatar) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadAvatar(file);
      await updateProfile(user.id, { avatar: publicUrl });
      setUser(prev => prev ? { ...prev, avatar: publicUrl } : null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (newName && newName !== user.name) {
        await updateProfile(user.id, { name: newName });
        setUser(prev => prev ? { ...prev, name: newName } : null);
      }

      if (newPassword) {
        await updateUserPassword(newPassword);
      }

      setSaveMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setTimeout(() => {
        setIsSettingsOpen(false);
        setSaveMessage(null);
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setSaveMessage({ type: 'error', text: 'Erro ao atualizar. Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-700 space-y-10">
      {/* Profile Header */}
      <section className="bg-[#0f0f13] rounded-[3rem] p-10 md:p-12 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40 z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/5 rounded-full blur-[80px] -ml-32 -mb-32 z-0 pointer-events-none" />

        <div className="relative z-10 group cursor-pointer" onClick={handleAvatarClick} title="Alterar foto de perfil">
          <div className="w-32 h-32 p-1 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-[2.5rem] shadow-[0_0_30px_rgba(99,102,241,0.3)] relative overflow-hidden">
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-[2.2rem] object-cover bg-[#0a0a0f] transition-transform duration-500 group-hover:scale-105" />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Camera className="text-white mb-1" size={24} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Alterar</span>
            </div>

            {/* Loading Overlay */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-2xl border-4 border-[#0f0f13] shadow-[0_0_15px_rgba(34,197,94,0.5)] group-hover:scale-110 transition-transform flex items-center justify-center">
            {isUploadingAvatar ? (
              <div className="w-3 h-3 border-2 border-transparent border-t-white rounded-full animate-spin" />
            ) : (
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/webp"
          />
        </div>

        <div className="text-center md:text-left flex-1 z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{user.name}</h1>
          <p className="text-slate-500 font-medium mt-1">{user.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
            <span className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold rounded-full uppercase tracking-widest shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]">
              {user.role} ACCESS
            </span>
            <span className="px-5 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-extrabold rounded-full flex items-center gap-2 uppercase tracking-widest shadow-[0_0_15px_-5px_rgba(234,179,8,0.2)]">
              <Award size={14} />
              Membro Elite
            </span>
          </div>
        </div>

        <div className="flex gap-3 shrink-0 z-10">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-4 bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5"
          >
            <Settings size={22} />
          </button>
          <button
            onClick={handleLogout}
            className="px-8 py-4 bg-red-500/10 text-red-400 border border-red-500/20 font-extrabold text-sm rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.2)]"
          >
            Encerrar Sessão
          </button>
        </div>
      </section>

      {/* Minhas Compras / Ofertas Adquiridas */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 px-1">Minhas Compras</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mock data for purchased offers */}
          {[
            { title: 'Mentoria Individual', date: '15/01/2026', price: 'R$ 997,00', status: 'Ativo' },
            { title: 'Pack de Ebooks Elite', date: '10/12/2025', price: 'R$ 197,00', status: 'Concluído' }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0f0f13] p-6 rounded-[2.5rem] border border-white/5 shadow-xl flex items-center justify-between group hover:border-indigo-500/30 transition-all">
              <div>
                <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">{item.title}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Adquirido em {item.date}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-sm text-white">{item.price}</p>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0f0f13] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h2 className="text-2xl font-black text-white tracking-tight">Configurações</h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Como quer ser chamado</label>
                  <div className="relative group">
                    <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 focus:border-indigo-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Nova Senha (Opcional)</label>
                  <div className="relative group">
                    <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 focus:border-indigo-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600"
                      placeholder="Digite para alterar"
                      minLength={6}
                    />
                  </div>
                </div>

                {saveMessage && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {saveMessage.type === 'success' && <Check size={18} />}
                    {saveMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Salvar Alterações'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SupportFloatingButton />
    </div>
  );
};

export default StudentProfile;
