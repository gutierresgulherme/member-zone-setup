
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Award, User, TrendingUp } from 'lucide-react';

const SidebarFooter: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
    const [mounted, setMounted] = useState(false);

    // NEW: Detect if we're in admin preview mode
    const isAdminPreview = location.pathname.includes('/admin/preview/student');

    useEffect(() => {
        setMounted(true);
        console.log('SidebarFooter mounted successfully');
        console.log('Admin preview mode:', isAdminPreview);
    }, [isAdminPreview]);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // NEW: Navigation items adapt to preview mode
    const navItems = [
        {
            icon: Home,
            label: 'Início',
            path: isAdminPreview ? '/admin/preview/student/dashboard' : '/student/dashboard'
        },
        {
            icon: TrendingUp,
            label: 'Feed',
            path: isAdminPreview ? '/admin/preview/student/feed' : '/student/feed'
        },
        {
            icon: BarChart3,
            label: 'Progresso',
            path: isAdminPreview ? '/admin/preview/student/progress' : '/student/progress'
        },
        {
            icon: Award,
            label: 'Certificados',
            path: isAdminPreview ? '/admin/preview/student/certificates' : '/student/certificates'
        },
        {
            icon: User,
            label: 'Perfil',
            path: isAdminPreview ? '/admin/preview/student/profile' : '/student/profile'
        },
    ];

    const isActive = (path: string) => {
        return location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));
    };

    const handleNavigation = (path: string) => {
        console.log('Navigating to:', path);
        navigate(path);
    };

    // CRITICAL: Inline styles with maximum specificity
    const footerStyle: React.CSSProperties = isDesktop ? {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: '110px',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        borderRight: '2px solid #333',
        zIndex: 999999,
        padding: '24px 0',
        boxShadow: '4px 0 30px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        visibility: 'visible',
        opacity: 1,
    } : {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderTop: '2px solid #333',
        zIndex: 999999,
        padding: '12px 0',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        visibility: 'visible',
        opacity: 1,
    };

    const navStyle: React.CSSProperties = isDesktop ? {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        height: '100%',
    } : {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        maxWidth: '600px',
        gap: '4px',
        padding: '0 8px',
    };

    const buttonBaseStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        background: 'transparent',
        border: 'none',
        borderRadius: '12px',
        padding: isDesktop ? '16px 12px' : '10px 12px',
        minWidth: isDesktop ? '90px' : '60px',
        minHeight: isDesktop ? '80px' : '60px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        WebkitTapHighlightColor: 'transparent',
        fontSize: '11px',
        fontWeight: 500,
        textAlign: 'center',
        outline: 'none',
    };

    if (!mounted) return null;

    return (
        <footer
            style={footerStyle}
            className="sidebar-footer-component"
            data-testid="sidebar-footer"
            data-preview-mode={isAdminPreview ? 'true' : 'false'}
        >
            {/* Logo on Desktop */}
            {isDesktop && (
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#E50914',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 15px rgba(229, 9, 20, 0.4)'
                    }}>
                        <span style={{ color: '#fff', fontSize: '24px', fontWeight: '900' }}>∞</span>
                    </div>
                </div>
            )}

            <nav style={navStyle}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            style={{
                                ...buttonBaseStyle,
                                backgroundColor: active ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                                color: active ? '#E50914' : '#999',
                            }}
                            aria-label={item.label}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon size={isDesktop ? 28 : 24} strokeWidth={active ? 2.5 : 2} />
                            <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Debug indicator - REMOVE AFTER TESTING */}
            <div style={{
                position: 'absolute',
                top: isDesktop ? '10px' : 'auto',
                bottom: isDesktop ? 'auto' : '100%',
                right: '10px',
                background: isAdminPreview ? 'orange' : 'lime',
                color: 'black',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                zIndex: 1,
                fontWeight: 'bold',
            }}>
                {isAdminPreview ? '👁️ PREVIEW' : isDesktop ? 'DESKTOP' : 'MOBILE'}
            </div>
        </footer>
    );
};

export default SidebarFooter;
