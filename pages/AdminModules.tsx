
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, ChevronDown, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { getDB, saveDB } from '../supabaseStore';
import { Course, Module } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const AdminModules: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Module>>({
    title: '',
    description: '',
    orderNumber: 1,
    coverUrl: '',
    coverPosition: 'center'
  });

  useEffect(() => {
    const db = getDB();
    setCourses(db.courses);
    if (db.courses.length > 0) {
      setSelectedCourseId(db.courses[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      const db = getDB();
      setModules(db.modules.filter(m => m.courseId === selectedCourseId).sort((a, b) => a.orderNumber - b.orderNumber));
    }
  }, [selectedCourseId]);

  const openModal = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod);
      setFormData(mod);
    } else {
      setEditingModule(null);
      setFormData({
        title: '',
        description: '',
        orderNumber: modules.length + 1,
        coverUrl: '',
        coverPosition: 'center'
      });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande! O limite é 5MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, coverUrl: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!formData.title) {
      alert("Título obrigatório.");
      return;
    }

    const db = getDB();
    if (editingModule) {
      db.modules = db.modules.map(m => m.id === editingModule.id ? { ...m, ...formData } as Module : m);
    } else {
      const newModule: Module = {
        id: Math.random().toString(36).substr(2, 9),
        courseId: selectedCourseId,
        title: formData.title || 'Novo Módulo',
        description: formData.description || '',
        orderNumber: formData.orderNumber || 1,
        coverUrl: formData.coverUrl || '',
        coverPosition: formData.coverPosition || 'center'
      };
      db.modules.push(newModule);
    }
    saveDB(db);
    setModules(db.modules.filter(m => m.courseId === selectedCourseId).sort((a, b) => a.orderNumber - b.orderNumber));
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Excluir este módulo?')) {
      const db = getDB();
      db.modules = db.modules.filter(m => m.id !== id);
      db.lessons = db.lessons.filter(l => l.moduleId !== id);
      saveDB(db);
      setModules(db.modules.filter(m => m.courseId === selectedCourseId).sort((a, b) => a.orderNumber - b.orderNumber));
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Módulos</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Organize o Fluxo de Aprendizado</p>
        </div>
        <button
          onClick={() => openModal()}
          disabled={!selectedCourseId}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 shrink-0 disabled:opacity-50"
        >
          <Plus size={18} strokeWidth={3} />
          Novo Módulo
        </button>
      </div>

      <div className="bg-[#0f0f13] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden p-8">
        <div className="max-w-xs mb-10">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 block ml-1">Selecionar Treinamento</label>
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all cursor-pointer text-sm font-bold text-white"
            >
              {courses.map(c => <option key={c.id} value={c.id} className="bg-[#0f0f13]">{c.title}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
          </div>
        </div>

        <div className="space-y-4">
          {modules.map(mod => (
            <div key={mod.id} className="group flex items-center gap-6 p-6 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
              <div className="w-20 h-12 bg-[#1c1c24] border border-white/5 rounded-xl overflow-hidden shadow-lg shrink-0 relative">
                {mod.coverUrl ? (
                  <img src={mod.coverUrl} className={`w-full h-full object-cover object-${mod.coverPosition || 'center'}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-indigo-400 font-black text-xs">
                    {mod.orderNumber}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">{mod.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-1 mt-1">{mod.description || 'Sem descrição definida.'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(mod)}
                  className="p-3 text-slate-500 hover:text-indigo-400 transition-all rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(mod.id)}
                  className="p-3 text-slate-500 hover:text-red-400 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Nenhum módulo encontrado para este treinamento.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f0f13] w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Estrutura de Conteúdo</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                {/* Image Upload Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capa do Módulo (Opcional)</label>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">RECOMENDADO: 16:9</span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-video rounded-[2rem] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 group transition-all hover:border-indigo-500/40 cursor-pointer flex flex-col items-center justify-center"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Processando...</p>
                      </div>
                    ) : formData.coverUrl ? (
                      <>
                        <img
                          src={formData.coverUrl}
                          className={`w-full h-full object-cover object-${formData.coverPosition || 'center'}`}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <UploadCloud size={32} className="text-white mb-2" />
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Trocar Capa</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5 group-hover:border-indigo-500/20 shadow-xl">
                          <ImageIcon size={32} strokeWidth={1.5} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">Upload da Capa</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {formData.coverUrl && (
                    <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                      {['top', 'center', 'bottom'].map(pos => (
                        <button
                          key={pos}
                          onClick={() => setFormData({ ...formData, coverPosition: pos as any })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.coverPosition === pos ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                          {pos === 'top' ? 'Topo' : pos === 'center' ? 'Centro' : 'Base'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Título</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Introdução ao Módulo"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Ordem</label>
                    <input
                      type="number"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve resumo do que será ensinado..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all resize-none text-white text-sm font-medium leading-relaxed"
                    rows={4}
                  />
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0a0a0f]/50 backdrop-blur-md">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95">Salvar Módulo</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminModules;
