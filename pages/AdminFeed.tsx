
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Zap, Image as ImageIcon, UploadCloud, X, LayoutGrid, CheckCircle2, Clock, MessageCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { getDB, createPost, updatePost, deletePost } from '../supabaseStore';
import { Post } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const AdminFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Post>>({
    title: '',
    content: '',
    imageUrl: '',
    status: 'published',
    allowComments: true
  });

  useEffect(() => {
    const db = getDB();
    setPosts(db.posts);
  }, []);

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData(post);
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        content: '',
        imageUrl: '',
        status: 'published',
        allowComments: true
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
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.content) {
      alert("O conteúdo da publicação é obrigatório.");
      return;
    }

    try {
      if (editingPost) {
        await updatePost(editingPost.id, formData);
        // Updating local state optimistically
        setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...formData } as Post : p));
      } else {
        const newPostData = await createPost({
          title: formData.title,
          content: formData.content || '',
          imageUrl: formData.imageUrl,
          status: formData.status as any,
          allowComments: formData.allowComments
        });
        // We need to fetch the full object or construct it. The createPost returns the DB row.
        // We'll optimistically add it or reload. Let's construct it.
        // Actually createPost returns the data row.
        if (newPostData) {
          const newPost: Post = {
            id: newPostData.id,
            userId: newPostData.user_id,
            userName: 'Admin', // Placeholder, ideally fetch profile
            userAvatar: '',
            title: newPostData.title,
            content: newPostData.content,
            imageUrl: newPostData.image_url,
            likesCount: 0,
            status: newPostData.status as 'published' | 'draft',
            createdAt: newPostData.created_at,
            allowComments: (newPostData as any).allow_comments
          };
          setPosts(prev => [newPost, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Erro ao salvar publicação.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta publicação permanentemente?')) {
      try {
        await deletePost(id);
        setPosts(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Erro ao excluir publicação.");
      }
    }
  };

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    totalLikes: posts.reduce((acc, curr) => acc + curr.likesCount, 0)
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Gerenciar Feed</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Timeline de Novidades e Comunicação</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 shrink-0"
          >
            <Plus size={18} strokeWidth={3} />
            Nova Publicação
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total de Posts', value: stats.total, icon: LayoutGrid, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Publicados', value: stats.published, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Total de Curtidas', value: stats.totalLikes, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f0f13] border border-white/5 rounded-[2rem] p-8 flex items-center gap-6 shadow-xl">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0 border border-white/5`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0f0f13] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0a0a0f] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
              <tr>
                <th className="px-8 py-6">Mídia</th>
                <th className="px-8 py-6">Conteúdo</th>
                <th className="px-8 py-6">Métricas</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Operações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      {post.imageUrl ? (
                        <img src={post.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="max-w-xs">
                      <p className="font-extrabold text-sm text-white truncate">{post.title || 'Sem Título'}</p>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-1">{post.content}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs">
                      <Zap size={14} fill="currentColor" />
                      {post.likesCount} curtidas
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${post.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openModal(post)}
                        className="p-3 text-slate-500 hover:text-indigo-400 transition-all rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
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
          {posts.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">A timeline ainda está vazia.</p>
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
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingPost ? 'Editar Post' : 'Nova Publicação'}</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Engajamento Social</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Imagem do Post (Opcional)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative aspect-video rounded-[2rem] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 group transition-all hover:border-indigo-500/40 cursor-pointer flex flex-col items-center justify-center"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Processando...</p>
                      </div>
                    ) : formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <UploadCloud size={32} className="text-white mb-2" />
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Trocar Imagem</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600 group-hover:text-indigo-400 transition-colors">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5 group-hover:border-indigo-500/20 shadow-xl">
                          <ImageIcon size={32} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">Upload da Imagem</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Título (Opcional)</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Grande Novidade!"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold placeholder:text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Conteúdo (Obrigatório)</label>
                    <textarea
                      rows={4}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="O que você quer compartilhar com a comunidade?"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-medium leading-relaxed resize-none placeholder:text-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Status da Publicação</label>
                      <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                        {[
                          { id: 'published', label: 'Publicar', icon: CheckCircle2 },
                          { id: 'draft', label: 'Rascunho', icon: Clock },
                        ].map(type => (
                          <button
                            key={type.id}
                            onClick={() => setFormData({ ...formData, status: type.id as any })}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all flex items-center justify-center gap-2 ${formData.status === type.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                          >
                            <type.icon size={14} />
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Interação</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, allowComments: !formData.allowComments })}
                        className={`w-full h-[52px] rounded-2xl border transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest ${formData.allowComments ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                      >
                        <MessageCircle size={16} strokeWidth={2.5} />
                        {formData.allowComments ? 'Comentários Permitidos' : 'Comentários Desativados'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0a0a0f]/50 backdrop-blur-md">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95">
                  {editingPost ? 'Atualizar Post' : 'Publicar no Feed'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminFeed;
