
import React from 'react';
import { Link } from 'react-router-dom';

export const StudentFooter = () => (
    <footer className="flex flex-col md:flex-row items-center justify-between w-full px-8 py-6 text-sm text-slate-500 bg-[#1a1a1a] border-t border-white/10 mt-auto">
        <p>© 2024 Lovable Infinito. Todos os direitos reservados.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="#" className="hover:text-white transition-colors hover:underline">Privacidade</Link>
            <Link to="#" className="hover:text-white transition-colors hover:underline">Termos de Uso</Link>
            <Link to="#" className="hover:text-white transition-colors hover:underline">Suporte</Link>
        </div>
    </footer>
)

export default StudentFooter;
