
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, BarChart3, Award, User, BookOpen, ShoppingBag } from 'lucide-react';

const StudentNavbar = () => {
    const location = useLocation();
    const isAdminPreview = location.pathname.includes('/admin/preview/student');

    // Mapped links to match previous Sidebar functionality
    const links = [
        { label: 'Cursos', path: isAdminPreview ? '/admin/preview/student/courses' : '/student/courses', icon: BookOpen },
        { label: 'Feed', path: isAdminPreview ? '/admin/preview/student/feed' : '/student/feed', icon: TrendingUp },
        { label: 'Comunidade', path: isAdminPreview ? '/admin/preview/student/community' : '/student/community', icon: ShoppingBag },
        { label: 'Perfil', path: isAdminPreview ? '/admin/preview/student/profile' : '/student/profile', icon: User },
    ];

    const isActive = (path: string) => {
        return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
    };

    return (
        <nav className={`
            flex items-center justify-center w-full px-6 py-4 
            bg-[#1a1a1a] border-t border-white/10 
            text-slate-200 fixed bottom-0 z-50 transition-all duration-300
        `}>


            <div className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar">
                {links.map((link) => {
                    const active = isActive(link.path);
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`
                                text-sm font-medium transition-all px-3 py-2 rounded-lg flex items-center gap-2
                                ${active ? 'text-white bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <link.icon size={16} />
                            <span className="hidden md:inline">{link.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    );
}

export default StudentNavbar;
