
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Grid, X, ArrowUpDown } from 'lucide-react';
import { getDB, saveDB } from '../supabaseStore';
import { Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    order: 1
  });

  useEffect(() => {
    const db = getDB();
    setCategories(db.categories || []);
  }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        order: categories.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      alert("Nome da categoria é obrigatório.");
      return;
    }

    const db = getDB();
    if (!db.categories) db.categories = [];

    const newCategory: Category = {
      id: editingCategory ? editingCategory.id : Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      order: Number(formData.order) || 1
    };

    if (editingCategory) {
      db.categories = db.categories.map(c => c.id === editingCategory.id ? newCategory : c);
    } else {
      db.categories.push(newCategory);
    }

    // Sort categories by order after change
    db.categories.sort((a, b) => a.order - b.order);

    saveDB(db);
    setCategories(db.categories);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const db = getDB();
    const coursesInCategory = db.courses.filter(c => c.categoryId === id);

    if (coursesInCategory.length > 0) {
      alert(`Não é possível excluir esta categoria pois existem ${coursesInCategory.length} cursos vinculados a ela.`);
      return;
    }

    if (window.confirm('Excluir esta categoria permanentemente?')) {
      db.categories = db.categories.filter(c => c.id !== id);
      saveDB(db);
      setCategories(db.categories);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Categorias</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Organize as prateleiras da galeria</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 shrink-0"
        >
          <Plus size={18} strokeWidth={3} />
          Nova Categoria
        </button>
      </div>

      <div className="bg-[#0f0f13] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0a0a0f] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
              <tr>
                <th className="px-8 py-6">Ordem</th>
                <th className="px-8 py-6">Nome da Prateleira</th>
                <th className="px-8 py-6">Vínculos</th>
                <th className="px-8 py-6 text-right">Operações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.sort((a, b) => a.order - b.order).map(category => {
                const courseCount = getDB().courses.filter(c => c.categoryId === category.id).length;
                return (
                  <tr key={category.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-indigo-400 border border-white/5">
                        {category.order}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">{category.name}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {courseCount} Cursos
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openModal(category)}
                          className="p-3 text-slate-500 hover:text-indigo-400 transition-all rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-3 text-slate-500 hover:text-red-400 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {categories.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Nenhuma prateleira configurada.</p>
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
              className="bg-[#0f0f13] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Organização de Galeria</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Nome da Categoria</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Novos Lançamentos"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Ordem de Exibição</label>
                  <div className="relative">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium ml-1">Define a posição da linha na tela inicial do aluno.</p>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0a0a0f]/50 backdrop-blur-md">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95">
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
