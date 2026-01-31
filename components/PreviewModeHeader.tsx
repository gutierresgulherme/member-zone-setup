
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';

const PreviewModeHeader: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isAdminPreview = location.pathname.includes('/admin/preview/student');

    if (!isAdminPreview) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '50px',
            background: 'linear-gradient(90deg, #FF6B00 0%, #FF8C00 100%)',
            zIndex: 999998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '600',
            }}>
                <Eye size={20} />
                <span>MODO PREVIEW - Visualizando como Aluno</span>
            </div>
            <button
                onClick={() => navigate('/admin/courses')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                }}
            >
                <ArrowLeft size={16} />
                Voltar ao Admin
            </button>
        </div>
    );
};

export default PreviewModeHeader;
