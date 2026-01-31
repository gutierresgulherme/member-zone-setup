
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { logout, getLoggedUser } from '../../../supabaseStore';
import { UserRole } from '../../types';

const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const user = getLoggedUser();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col min-h-screen transition-all duration-300">
      {/* Header - Netflix style sticky transculent */}
      <header className="bg-gradient-to-b from-black/80 to-transparent h-16 md:h-20 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-500">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/student/courses')}>
          <img
            src="https://qozsqbmertgivtsgugwv.supabase.co/storage/v1/object/public/branding/logo.png?v=1"
            alt="Lovable Infinito"
            className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform duration-300"
          />
          {isAdmin && (
            <div className="hidden sm:flex flex-col">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] leading-none">Admin</span>
              <span className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] leading-none mt-0.5">Preview</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/courses')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2 rounded-lg transition-all font-black text-[10px] uppercase tracking-widest backdrop-blur-md"
            >
              <ShieldCheck size={14} />
              Voltar ao Admin
            </button>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <img src={user?.avatar} className="w-8 h-8 rounded-md object-cover border border-white/20" />
            <button
              onClick={logout}
              className="p-2 text-white/60 hover:text-white transition-all"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
