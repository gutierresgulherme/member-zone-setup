
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Headphones, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getLoggedUser } from '../../supabaseStore';

interface Message {
    id: string;
    content: string;
    is_bot: boolean;
    is_admin: boolean;
    created_at: string;
}

const FAQ_OPTIONS = [
    { id: 'acesso', label: 'Dificuldade de Acesso', response: 'Para problemas de acesso, verifique se seu e-mail e senha estão corretos. Caso tenha esquecido a senha, use a opção "Esqueci minha senha" na tela de login.' },
    { id: 'pagamento', label: 'Dúvidas sobre Pagamento', response: 'Nossos pagamentos são processados via Stripe/Hotmart. Você receberá um e-mail de confirmação assim que a transação for aprovada.' },
    { id: 'certificados', label: 'Meus Certificados', response: 'Os certificados ficam disponíveis automaticamente na aba "Certificados" assim que você concluir 100% das aulas de um curso.' },
    { id: 'suporte_humano', label: 'Falar com Atendente', response: 'Entendi. Vou encaminhar sua solicitação para um de nossos especialistas. Por favor, descreva seu problema abaixo.', handoff: true },
];

const SupportFloatingButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isHandoffRequested, setIsHandoffRequested] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const user = getLoggedUser();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isBotTyping]);

    const addMessage = (content: string, isBot: boolean = false, isAdmin: boolean = false) => {
        const newMessage: Message = {
            id: Math.random().toString(36).substr(2, 9),
            content,
            is_bot: isBot,
            is_admin: isAdmin,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSend = async (text: string = inputValue) => {
        if (!text.trim() || !user) return;

        // Add user message
        addMessage(text, false);
        setInputValue('');

        // If handoff requested, save to Supabase
        if (isHandoffRequested) {
            try {
                await supabase.from('support_messages').insert({
                    user_id: user.id,
                    content: text,
                    is_bot: false,
                    is_admin: false
                });
            } catch (err) {
                console.error('Error saving support message:', err);
            }
            return;
        }

        // Bot Response Logic
        setIsBotTyping(true);
        setTimeout(() => {
            setIsBotTyping(false);
            addMessage("Sinto muito, não entendi. Você gostaria de falar com um atendente humano?", true);
        }, 1000);
    };

    const handleFAQ = (option: typeof FAQ_OPTIONS[0]) => {
        addMessage(option.label, false);
        setIsBotTyping(true);

        setTimeout(() => {
            setIsBotTyping(false);
            addMessage(option.response, true);
            if (option.handoff) {
                setIsHandoffRequested(true);
            }
        }, 800);
    };

    return (
        <>
            {/* Assistive Touch Button */}
            <motion.div
                drag
                dragConstraints={{ left: -window.innerWidth + 80, right: 0, top: -window.innerHeight + 80, bottom: 0 }}
                className="fixed bottom-24 right-6 z-[9999] cursor-grab active:cursor-grabbing"
                whileTap={{ scale: 0.9 }}
            >
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 bg-yellow-400/10 backdrop-blur-2xl border-2 border-yellow-400/20 rounded-[2rem] flex items-center justify-center shadow-[0_10px_40px_rgba(234,179,8,0.2)] hover:bg-yellow-400/20 transition-all group relative"
                >
                    <div className="absolute inset-0 bg-yellow-400/5 rounded-[1.9rem] animate-pulse group-hover:animate-none" />
                    <MessageCircle className="text-yellow-400/60 group-hover:text-yellow-400 group-hover:scale-110 transition-all drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" size={32} />

                    {/* Tooltip */}
                    <div className="absolute right-full mr-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Suporte Lovable</p>
                    </div>
                </button>
            </motion.div>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        className="fixed bottom-24 right-6 z-[1000] w-[380px] h-[550px] bg-[#0f0f13] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden max-w-[calc(100vw-3rem)]"
                    >
                        {/* Header */}
                        <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                                    <Bot size={22} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Suporte Infinito</h3>
                                    <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-1">
                                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                        Agente Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-black/20">
                            {messages.length === 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-slate-300 leading-relaxed font-medium">
                                        Olá, 2h! Eu sou o assistente virtual do Lovable Infinito. Como posso te ajudar hoje?
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {FAQ_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleFAQ(opt)}
                                                className="flex items-center justify-between p-3.5 bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all group"
                                            >
                                                <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">{opt.label}</span>
                                                <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.is_bot || msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-medium ${msg.is_bot || msg.is_admin
                                        ? 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                                        : 'bg-indigo-600 text-white rounded-tr-none'
                                        }`}>
                                        {msg.content}
                                        <p className="text-[8px] opacity-40 mt-1 uppercase font-black text-right">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {isBotTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 bg-white/5 border-t border-white/5 shrink-0">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative group"
                            >
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={isHandoffRequested ? "Descreva seu problema..." : "Digite sua mensagem..."}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-6 pr-14 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/30 transition-all text-sm font-medium text-white placeholder:text-slate-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:scale-100"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <p className="text-center text-[8px] font-black text-slate-600 uppercase tracking-widest mt-4">
                                {isHandoffRequested ? "Suporte Humano Solicitado" : "Lovable AI Assistance System"}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default SupportFloatingButton;
