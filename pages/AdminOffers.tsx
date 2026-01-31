
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, ShoppingBag, X, Image as ImageIcon, UploadCloud, Link as LinkIcon, DollarSign, Calendar, Clock, LayoutGrid } from 'lucide-react';
import { getDB, initializeStore, saveOffer, deleteOffer, subscribeToChanges } from '../supabaseStore';
import { Offer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle, HelpCircle } from 'lucide-react';

const AdminOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Offer>>({
    title: '',
    shortDescription: '',
    urlDestino: '',
    imageUrl: '',
    precoOriginal: 0,
    precoPromocional: 0,
    dataInicio: new Date().toISOString().split('T')[0],
    dataExpiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'active',
    priority: 1
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadData();
    const unsub = subscribeToChanges('offers', () => loadData());
    return () => unsub();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await initializeStore();
      setOffers(db.offers || []);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (offer?: Offer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        ...offer,
        dataInicio: offer.dataInicio.split('T')[0],
        dataExpiracao: offer.dataExpiracao.split('T')[0]
      });
    } else {
      setEditingOffer(null);
      setFormData({
        title: '',
        shortDescription: '',
        urlDestino: '',
        imageUrl: '',
        precoOriginal: 0,
        precoPromocional: 0,
        dataInicio: new Date().toISOString().split('T')[0],
        dataExpiracao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        priority: 1
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
    if (!formData.title || !formData.urlDestino || !formData.precoPromocional) {
      alert("Título, URL de destino e Preço Promocional são obrigatórios.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const newOffer: Partial<Offer> & { id?: string } = {
        id: editingOffer?.id,
        title: formData.title || '',
        shortDescription: formData.shortDescription || '',
        urlDestino: formData.urlDestino || '',
        imageUrl: formData.imageUrl || 'https://picsum.photos/seed/offer/800/600',
        precoOriginal: Number(formData.precoOriginal) || 0,
        precoPromocional: Number(formData.precoPromocional) || 0,
        dataInicio: new Date(formData.dataInicio || '').toISOString(),
        dataExpiracao: new Date(formData.dataExpiracao || '').toISOString(),
        status: formData.status as any || 'active',
        priority: Number(formData.priority) || 1
      };

      await saveOffer(newOffer);
      setMessage({ type: 'success', text: `Oferta "${newOffer.title}" salva com sucesso!` });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving offer:', err);
      setMessage({ type: 'error', text: 'Erro ao salvar oferta.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta oferta permanentemente?')) {
      try {
        await deleteOffer(id);
        setOffers(prev => prev.filter(o => o.id !== id));
        setMessage({ type: 'success', text: 'Oferta excluída com sucesso.' });
      } catch (err) {
        console.error('Error deleting offer:', err);
        setMessage({ type: 'error', text: 'Erro ao excluir oferta.' });
      }
    }
  };

  const stats = {
    total: offers.length,
    active: offers.filter(o => o.status === 'active').length,
    highPriority: offers.filter(o => o.priority > 5).length
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Crossel de comunidade</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Monetização e Marketplace de Produtos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 shrink-0"
        >
          <Plus size={18} strokeWidth={3} />
          Cadastrar Oferta
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total de Ofertas', value: stats.total, icon: LayoutGrid, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Ofertas Ativas', value: stats.active, icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Alta Prioridade', value: stats.highPriority, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
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
                <th className="px-8 py-6">Produto</th>
                <th className="px-8 py-6">Precificação</th>
                <th className="px-8 py-6">Validade</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {offers.map(offer => (
                <tr key={offer.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                        <img src={offer.imageUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="max-w-[180px]">
                        <p className="font-extrabold text-sm text-white truncate">{offer.title}</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest truncate">Pri: {offer.priority}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-600 line-through font-bold">R$ {offer.precoOriginal.toFixed(2)}</span>
                      <span className="text-sm text-emerald-400 font-black">R$ {offer.precoPromocional.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <Calendar size={14} />
                      {new Date(offer.dataExpiracao).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${offer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {offer.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openModal(offer)}
                        className="p-3 text-slate-500 hover:text-indigo-400 transition-all rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(offer.id)}
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
          {offers.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">A vitrine de ofertas está vazia.</p>
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
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingOffer ? 'Editar Oferta' : 'Nova Oferta'}</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Estratégia de Monetização</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                {/* Image Upload Area */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Imagem do Produto</label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Título da Oferta</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Formação Vitalícia"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold placeholder:text-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">URL de Destino</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input
                        type="url"
                        value={formData.urlDestino}
                        onChange={(e) => setFormData({ ...formData, urlDestino: e.target.value })}
                        placeholder="Link da página de checkout..."
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold placeholder:text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Preço de Tabela (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input
                        type="number"
                        value={formData.precoOriginal}
                        onChange={(e) => setFormData({ ...formData, precoOriginal: parseFloat(e.target.value) })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Preço de Oferta (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={16} />
                      <input
                        type="number"
                        value={formData.precoPromocional}
                        onChange={(e) => setFormData({ ...formData, precoPromocional: parseFloat(e.target.value) })}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold border-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Data de Expiração</label>
                    <input
                      type="date"
                      value={formData.dataExpiracao}
                      onChange={(e) => setFormData({ ...formData, dataExpiracao: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Prioridade (Peso)</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Descrição Curta</label>
                  <textarea
                    rows={2}
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Resumo atraente para o card (máx 150 caracteres)..."
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-medium leading-relaxed resize-none placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Status do Produto</label>
                  <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                    {[
                      { id: 'active', label: 'Disponível Agora', icon: ShoppingBag },
                      { id: 'inactive', label: 'Rascunho / Inativo', icon: X },
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
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0a0a0f]/50 backdrop-blur-md">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95">
                  {editingOffer ? 'Atualizar Oferta' : 'Lançar Oferta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOffers;
