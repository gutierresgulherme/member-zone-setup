
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, UploadCloud, Star, Layers } from 'lucide-react';
import { getDB, saveDB } from '../supabaseStore';
import { Course, Category } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Course>>({
    title: '',
    description: '',
    coverUrl: '',
    coverPosition: 'center',
    categoryId: '',
    isFeatured: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('display_order');

    if (coursesData) setCourses(coursesData.map(c => ({
      id: c.id,
      categoryId: c.category_id || '',
      title: c.title,
      description: c.description || '',
      coverUrl: c.cover_url || '',
      coverPosition: (c.cover_position as any) || 'center',
      isFeatured: c.is_featured || false,
      createdBy: c.created_by || ''
    })));
    if (categoriesData) setCategories(categoriesData);
  };

  const openModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData(course);
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        coverUrl: '',
        coverPosition: 'center',
        categoryId: categories.length > 0 ? categories[0].id : '',
        isFeatured: false
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

  const handleSave = async () => {
    if (!formData.title) {
      alert("O título do curso é obrigatório.");
      return;
    }

    setIsUploading(true);

    const courseData = {
      title: formData.title,
      description: formData.description,
      cover_url: formData.coverUrl,
      cover_position: formData.coverPosition,
      category_id: formData.categoryId || null,
      is_featured: formData.isFeatured,
      created_by: '1' // Fallback or use auth user id
    };

    try {
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', editingCourse.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('courses')
          .insert(courseData);
        if (error) throw error;
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving course:', err);
      alert('Erro ao salvar o curso.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este treinamento? Esta ação é permanente.')) {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting course:', error);
        alert('Erro ao excluir o curso.');
      } else {
        await fetchData();
      }
    }
  };

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Treinamentos</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Curadoria Estilo Streaming</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 shrink-0"
        >
          <Plus size={18} strokeWidth={3} />
          Cadastrar Treinamento
        </button>
      </div>

      <div className="bg-[#0f0f13] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-4 bg-white/5">
          <Search size={20} className="text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar títulos, categorias ou descrições..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-slate-600 font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0a0a0f] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
              <tr>
                <th className="px-8 py-6">Identidade Visual</th>
                <th className="px-8 py-6">Especificações</th>
                <th className="px-8 py-6">Categoria</th>
                <th className="px-8 py-6 text-right">Operações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCourses.map(course => (
                <tr key={course.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="w-16 h-24 rounded-lg overflow-hidden border border-white/10 shadow-lg relative">
                      <img src={course.coverUrl} className={`w-full h-full object-cover object-${course.coverPosition}`} />
                      {course.isFeatured && (
                        <div className="absolute top-1 right-1 bg-yellow-500 text-black p-1 rounded-full shadow-lg">
                          <Star size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                        {course.title}
                        {course.isFeatured && <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-500/20">DESTAQUE</span>}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1">{course.description}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded-lg uppercase tracking-[0.15em] border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)] whitespace-nowrap">
                        {categories.find(cat => cat.id === course.categoryId)?.name || 'Geral'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openModal(course)}
                        className="p-3 text-slate-500 hover:text-indigo-400 transition-all rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-3 text-slate-500 hover:text-red-400 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f0f13] w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingCourse ? 'Editar Treinamento' : 'Novo Treinamento'}</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Configuração de Interface Netflix</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">

                {/* Feature Toggle */}
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                      <Star size={24} fill={formData.isFeatured ? "currentColor" : "none"} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white uppercase tracking-tight">Destaque na Galeria</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exibir como Banner Principal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                    className={`w-14 h-8 rounded-full transition-all relative ${formData.isFeatured ? 'bg-indigo-600' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all ${formData.isFeatured ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Layers size={12} />
                    Categoria (Prateleira)
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                  >
                    {categories.map(cat => <option key={cat.id} value={cat.id} className="bg-[#0f0f13]">{cat.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Poster Vertical (2:3)</label>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">RECOMENDADO: 600x900</span>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-[2/3] w-48 mx-auto rounded-[2rem] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 group transition-all hover:border-indigo-500/40 cursor-pointer flex flex-col items-center justify-center"
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
                          className={`w-full h-full object-cover object-${formData.coverPosition}`}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <UploadCloud size={32} className="text-white mb-2" />
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Trocar Poster</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors px-6 text-center">
                        <ImageIcon size={32} strokeWidth={1.5} className="mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">Upload do Poster</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Título do Curso</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Formação Fullstack Infinity"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Sinopse da Formação</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a jornada que o aluno irá trilhar..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all resize-none text-white text-sm font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0a0a0f]/50 backdrop-blur-md">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Descartar</button>
                <button onClick={handleSave} className="flex-[2] py-4 px-10 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95">Publicar Formação</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCourses;
