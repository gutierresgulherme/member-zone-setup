
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight, Tag, Clock, CheckCircle, Zap } from 'lucide-react';
import { getDB, initializeStore, subscribeToChanges } from '../supabaseStore';
import { Offer } from '../types';

const StudentCommunity: React.FC = () => {
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);

  useEffect(() => {
    loadData();
    const unsub = subscribeToChanges('offers', () => loadData());
    return () => unsub();
  }, []);

  const loadData = async () => {
    try {
      const db = await initializeStore();
      const now = new Date();
      const filtered = (db.offers || []).filter(offer => {
        const start = new Date(offer.dataInicio);
        const end = new Date(offer.dataExpiracao);
        return offer.status === 'active' && now >= start && now <= end;
      }).sort((a, b) => b.priority - a.priority);
      setActiveOffers(filtered);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  };

  const calculateDiscount = (original: number, promo: number) => {
    return Math.round(((original - promo) / original) * 100);
  };

  const getTimeRemaining = (expiryDate: string) => {
    const total = Date.parse(expiryDate) - Date.parse(new Date().toString());
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);

    if (days > 0) return `${days}d ${hours}h restantes`;
    if (hours > 0) return `${hours}h restantes`;
    return 'Expira em breve';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Marketplace <span className="text-indigo-500 neon-text">Infinito</span></h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">Ofertas exclusivas para membros da elite</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-[1.5rem] shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
          <ShoppingBag className="text-indigo-400" size={20} />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{activeOffers.length} OPORTUNIDADES DISPONÍVEIS</span>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeOffers.map((offer, idx) => {
          const discount = calculateDiscount(offer.precoOriginal, offer.precoPromocional);
          return (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0f0f13] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group flex flex-col hover:border-indigo-500/30 transition-all duration-500"
            >
              {/* Image Area */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={offer.imageUrl}
                  alt={offer.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-transparent to-transparent opacity-60" />

                {/* Badge Discount */}
                <div className="absolute top-6 left-6 bg-[#ff6b6b] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,107,107,0.5)]">
                  -{discount}% OFF
                </div>

                {/* Badge Countdown */}
                <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
                  <Clock size={12} className="text-indigo-400" />
                  {getTimeRemaining(offer.dataExpiracao)}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 flex-1 flex flex-col space-y-4">
                <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{offer.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{offer.shortDescription}</p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  {/* Prices */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">De R$ {offer.precoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Por apenas</span>
                        <p className="text-2xl font-black text-white tracking-tighter">R$ {offer.precoPromocional.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500/5 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/10">
                      <Tag size={18} />
                    </div>
                  </div>

                  {/* Action Button */}
                  <a
                    href={offer.urlDestino}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 group/btn"
                  >
                    Quero Aproveitar
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            </motion.div>
          );
        })}

        {activeOffers.length === 0 && (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/2[0.02]">
            <Zap className="mx-auto text-slate-700 mb-6" size={60} />
            <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-sm">Sem ofertas ativas no momento.</p>
            <p className="text-slate-700 text-xs mt-2">Fique atento às notificações para novas oportunidades.</p>
          </div>
        )}
      </div>

      {/* Trust Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
        {[
          { icon: CheckCircle, title: 'Ambiente Seguro', desc: 'Pagamento processado por plataformas líderes' },
          { icon: Zap, title: 'Entrega Imediata', desc: 'Acesso liberado logo após a confirmação' },
          { icon: Tag, title: 'Preço Garantido', desc: 'Melhores condições exclusivas para alunos' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-5 p-6 bg-[#0f0f13] rounded-3xl border border-white/5">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5">
              <item.icon size={24} />
            </div>
            <div>
              <h5 className="font-bold text-sm text-white">{item.title}</h5>
              <p className="text-[10px] text-slate-600 mt-1 uppercase font-bold tracking-widest">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentCommunity;
