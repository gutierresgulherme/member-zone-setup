
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Layers, LogOut, PlayCircle, Users, ExternalLink, Zap, ShoppingBag, Grid, Eye, MessageCircle, Video } from 'lucide-react';
import { logout } from '../../../supabaseStore';

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Painel Geral', path: '/admin', icon: Grid },
    { label: 'Cross-sell de Cursos', path: '/admin/course-offers', icon: ShoppingBag },
    { label: 'Cursos', path: '/admin/courses', icon: BookOpen },
    { label: 'Categorias', path: '/admin/categories', icon: Grid },
    { label: 'Módulos', path: '/admin/modules', icon: Layers },
    { label: 'Aulas', path: '/admin/lessons', icon: PlayCircle },
    { label: 'Feed', path: '/admin/feed', icon: Zap },
    { label: 'Cross-sell de comunidade', path: '/admin/offers', icon: ShoppingBag },
    { label: 'Usuários', path: '/admin/users', icon: Users },
    { label: 'Suporte', path: '/admin/support', icon: MessageCircle },
    { label: 'Vídeos Login (VSL)', path: '/admin/vsl', icon: Video },
  ];

  const location = useLocation();
  const isAdminPreview = location.pathname.includes('/admin/preview/student');

  if (isAdminPreview) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-[#050507] overflow-hidden text-slate-200">
      {/* Sidebar */}
      <aside className={`
        bg-[#0a0a0f] border-r border-white/5 flex flex-col transition-all duration-500 relative z-50
        ${collapsed ? 'w-20' : 'w-72'}
      `}>
        <div className="h-24 flex flex-col items-center justify-center px-6 shrink-0 border-b border-white/5 bg-black/20">
          <img
            src="https://qozsqbmertgivtsgugwv.supabase.co/storage/v1/object/public/branding/logo.png?v=1"
            alt="Logo"
            className={`transition-all duration-500 object-contain ${collapsed ? 'h-10' : 'h-16'}`}
          />
          {!collapsed && (
            <span className="mt-2 font-black tracking-[0.3em] text-[8px] text-indigo-400 uppercase neon-text">Operational Panel</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-8 space-y-2 px-4 no-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 relative group
                ${isActive
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'}
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className="shrink-0" />
                  {!collapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,1)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-[#08080c]">
          <button
            onClick={logout}
            className={`
              flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 w-full
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={22} />
            {!collapsed && <span className="font-bold text-sm">Desconectar</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-24 bg-[#0a0a0f] p-2 rounded-xl border border-white/10 text-indigo-400 shadow-xl hover:bg-indigo-600 hover:text-white transition-all z-[60]"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

        <header className="h-20 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10 shrink-0 z-10">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Gestão Operacional</h2>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-0.5">Lovable Infinito Dashboard</p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/admin/preview/student/dashboard')}
              className="flex items-center gap-3 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 px-6 py-3.5 rounded-2xl transition-all shadow-[0_0_25px_-5px_rgba(99,102,241,0.5)] uppercase tracking-widest active:scale-95"
            >
              <Eye size={14} strokeWidth={3} />
              Preview Aluno
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-[#050507] relative z-10 no-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
