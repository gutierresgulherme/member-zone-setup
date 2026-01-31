
import React, { useState, useEffect } from 'react';
import { Search, UserCircle, Shield, ShieldAlert, MoreVertical, Users as UsersIcon, UserCheck, UserMinus, X, Camera, Loader2, Pencil } from 'lucide-react';
import { getDB, saveDB, getLoggedUser, updateProfile, uploadAvatar } from '../supabaseStore';
import { User, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, user: User | null }>({ isOpen: false, user: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean, user: User | null }>({ isOpen: false, user: null });
  const [editingData, setEditingData] = useState({ name: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const currentUser = getLoggedUser();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (data) {
      const sorted = (data as User[]).sort((a, b) => {
        // Priority 1: Specific Admin Email
        if (a.email === 'developerslimitada@gmail.com') return -1;
        if (b.email === 'developerslimitada@gmail.com') return 1;

        // Priority 2: Admin Role
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;

        // Priority 3: Name
        return a.name.localeCompare(b.name);
      });
      setUsers(sorted);
    }
  };

  const handleToggleRole = async () => {
    if (!confirmModal.user) return;

    const newRole = confirmModal.user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;

    // Optimistic update
    setUsers(prev => prev.map(u =>
      u.id === confirmModal.user!.id ? { ...u, role: newRole } : u
    ));
    setConfirmModal({ isOpen: false, user: null });

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', confirmModal.user.id);

    if (error) {
      console.error("Error updating role:", error);
      // Revert on error could be added here
      fetchUsers();
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditModal({ isOpen: true, user });
    setEditingData({ name: user.name, avatar: user.avatar || '' });
  };

  const handleUpdateProfile = async () => {
    if (!editModal.user) return;

    try {
      setSaving(true);
      await updateProfile(editModal.user.id, {
        name: editingData.name,
        avatar: editingData.avatar
      });

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === editModal.user!.id ? { ...u, name: editingData.name, avatar: editingData.avatar } : u
      ));

      setEditModal({ isOpen: false, user: null });
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Erro ao atualizar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadAvatar(file);
      setEditingData(prev => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === UserRole.ADMIN).length,
    students: users.filter(u => u.role === UserRole.USER).length
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Usuários</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Controle de Privilégios da Rede</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total', value: stats.total, icon: UsersIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Admins', value: stats.admins, icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { label: 'Alunos', value: stats.students, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0f0f13] border border-white/5 rounded-2xl px-6 py-4 min-w-[120px]">
              <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-2`}>
                <stat.icon size={16} />
              </div>
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0f0f13] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <Search size={20} className="text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar por nome, email ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-700 font-bold"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0a0a0f] text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black">
              <tr>
                <th className="px-8 py-6">Perfil</th>
                <th className="px-8 py-6">Credenciais</th>
                <th className="px-8 py-6">Nível de Acesso</th>
                <th className="px-8 py-6 text-center">Logins</th>
                <th className="px-8 py-6 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-indigo-500/30 transition-all">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <UserCircle size={20} className="text-slate-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">{user.name}</span>
                          {(user.id === currentUser?.id || user.email === 'developerslimitada@gmail.com') && (
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all"
                              title="Editar meu perfil"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                        {user.id === currentUser?.id && (
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            Você
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-300 transition-colors">{user.email}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 w-fit border
                      ${user.role === UserRole.ADMIN
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/10'}
                    `}>
                      {user.role === UserRole.ADMIN ? <Shield size={12} /> : <UserCircle size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                      {(user as any).login_count || 0}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.id === currentUser?.id && (
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-white bg-emerald-500/5 hover:bg-emerald-600 px-5 py-2.5 rounded-xl border border-emerald-500/20 transition-all active:scale-95"
                        >
                          Editar Perfil
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, user })}
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-white bg-indigo-500/5 hover:bg-indigo-600 px-5 py-2.5 rounded-xl border border-indigo-500/20 transition-all active:scale-95"
                      >
                        Alterar Cargo
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && confirmModal.user && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f0f13] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 p-8 space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/20 shadow-lg">
                  <ShieldAlert size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Confirmar Alteração</h3>
                  <p className="text-xs font-medium text-slate-500 mt-2">
                    Você está prestes a tornar <span className="text-white font-bold">{confirmModal.user.name}</span> um
                    <span className="text-indigo-400 font-bold"> {confirmModal.user.role === UserRole.ADMIN ? 'Estudante' : 'Administrador'}</span>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmModal({ isOpen: false, user: null })}
                  className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleToggleRole}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95"
                >
                  Sim, Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editModal.isOpen && editModal.user && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f0f13] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 p-8 space-y-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Editar Perfil</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ajuste seu nome e avatar</p>
                </div>
                <button
                  onClick={() => setEditModal({ isOpen: false, user: null })}
                  className="p-2 hover:bg-white/5 rounded-xl text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Seu Nome no Feed</label>
                  <input
                    type="text"
                    value={editingData.name}
                    onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm font-bold text-white transition-all"
                    placeholder="Ex: Developers Limitada"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Imagem de Perfil</label>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white/10 group-hover:border-indigo-500/50 transition-all bg-white/5 flex items-center justify-center">
                        {uploading ? (
                          <Loader2 size={24} className="text-indigo-400 animate-spin" />
                        ) : editingData.avatar ? (
                          <img src={editingData.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle size={32} className="text-slate-600" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2rem]">
                        <Camera size={20} className="text-white" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={editingData.avatar}
                        onChange={(e) => setEditingData(prev => ({ ...prev, avatar: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 text-[10px] font-bold text-white transition-all placeholder:text-slate-700"
                        placeholder="URL da imagem ou faça upload..."
                      />
                      <p className="text-[9px] font-medium text-slate-600 px-1 italic">Clique na foto para subir arquivo</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditModal({ isOpen: false, user: null })}
                  className="flex-1 py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Salvando...' : 'Salvar Perfil'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default AdminUsers;
