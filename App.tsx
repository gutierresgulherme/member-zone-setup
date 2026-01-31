
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { getLoggedUser, initializeStore } from './supabaseStore';

// Components
import SidebarFooter from './Area-de-Membros---Produto-Lovable-Infinito/components/SidebarFooter'; // Keeping for reference if needed, but unused
import PreviewModeHeader from './Area-de-Membros---Produto-Lovable-Infinito/components/PreviewModeHeader';
import ProtectedRoute from './Area-de-Membros---Produto-Lovable-Infinito/components/ProtectedRoute';
import StudentNavbar from './Area-de-Membros---Produto-Lovable-Infinito/components/StudentNavbar';


// Pages
import Login from './Area-de-Membros---Produto-Lovable-Infinito/pages/Login';
import StudentDashboard from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentDashboard';
import StudentCourses from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentCourses';
import StudentProgress from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentProgress';
import StudentCertificates from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentCertificates';
import StudentProfile from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentProfile';
import StudentFeed from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentFeed';
import StudentCommunity from './Area-de-Membros---Produto-Lovable-Infinito/pages/StudentCommunity';
import AdminPanel from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminPanel';
import AdminCourses from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminCourses';
import AdminCategories from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminCategories';
import AdminModules from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminModules';
import AdminLessons from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminLessons';
import AdminOffers from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminOffers';
import AdminUsers from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminUsers';
import AdminFeed from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminFeed';
import AdminCourseOffers from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminCourseOffers';
import AdminSupport from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminSupport';
import AdminVSL from './Area-de-Membros---Produto-Lovable-Infinito/pages/AdminVSL';

// Layouts
import AdminLayout from './Area-de-Membros---Produto-Lovable-Infinito/components/layouts/AdminLayout';
import StudentLayout from './Area-de-Membros---Produto-Lovable-Infinito/components/layouts/StudentLayout';

function AppContent() {
  const location = useLocation();
  const [user, setUser] = useState(getLoggedUser());
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const init = async () => {
      await initializeStore();
      setUser(getLoggedUser());
    };
    init();
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CRITICAL: Detect if we're in student area OR admin preview mode
  const isStudentRoute =
    location.pathname.includes('/student') ||
    location.pathname.includes('/dashboard') ||
    location.pathname.includes('/courses') ||
    location.pathname.includes('/cursos') ||
    location.pathname.includes('/progresso') ||
    location.pathname.includes('/progress') ||
    location.pathname.includes('/certificados') ||
    location.pathname.includes('/certificates') ||
    location.pathname.includes('/perfil') ||
    location.pathname.includes('/profile') ||
    location.pathname.includes('/feed') ||
    location.pathname.includes('/community');

  const isAdminPreview = location.pathname.includes('/admin/preview/student');
  const isRealAdminPage = location.pathname.startsWith('/admin') && !isAdminPreview;
  // Only show sidebar if it's a student route OR preview mode, AND not a real admin page (unless preview)
  const shouldShowSidebar = (isStudentRoute || isAdminPreview) && !location.pathname.includes('/login') && !isRealAdminPage;

  const mainStyle: React.CSSProperties = {
    paddingTop: isAdminPreview ? '50px' : '0',
    paddingBottom: shouldShowSidebar ? '80px' : '0', // Space for bottom navbar
    paddingLeft: '0', // Removed sidebar padding
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    transition: 'padding 0.3s ease',
    backgroundColor: '#050507',
  };

  return (
    <>
      <PreviewModeHeader />
      {shouldShowSidebar && <StudentNavbar />}

      <div style={mainStyle}>
        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<Login onLogin={() => setUser(getLoggedUser())} />} />

              {/* Compatibility redirects */}
              <Route path="/dashboard" element={<Navigate to="/student/courses" replace />} />
              <Route path="/cursos" element={<Navigate to="/student/courses" replace />} />
              <Route path="/progresso" element={<Navigate to="/student/progress" replace />} />
              <Route path="/certificados" element={<Navigate to="/student/certificates" replace />} />
              <Route path="/perfil" element={<Navigate to="/student/profile" replace />} />

              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute>
                  <StudentLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="courses" replace />} />
                {/* <Route path="dashboard" element={<StudentDashboard />} /> - Removed as requested */}
                <Route path="courses" element={<StudentCourses />} />
                <Route path="feed" element={<StudentFeed />} />
                <Route path="community" element={<StudentCommunity />} />
                <Route path="progress" element={<StudentProgress />} />
                <Route path="certificates" element={<StudentCertificates />} />
                <Route path="profile" element={<StudentProfile />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminPanel />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="modules" element={<AdminModules />} />
                <Route path="lessons" element={<AdminLessons />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="feed" element={<AdminFeed />} />
                <Route path="course-offers" element={<AdminCourseOffers />} />
                <Route path="support" element={<AdminSupport />} />
                <Route path="vsl" element={<AdminVSL />} />

                {/* Admin Preview Routes */}
                {/* <Route path="preview/student/dashboard" element={<StudentDashboard />} /> */}
                <Route path="preview/student/courses" element={<StudentCourses />} />
                <Route path="preview/student/feed" element={<StudentFeed />} />
                <Route path="preview/student/community" element={<StudentCommunity />} />
                <Route path="preview/student/progress" element={<StudentProgress />} />
                <Route path="preview/student/certificates" element={<StudentCertificates />} />
                <Route path="preview/student/profile" element={<StudentProfile />} />
              </Route>

              <Route path="/" element={<Navigate to="/student/courses" replace />} />
              <Route path="*" element={<Navigate to="/student/courses" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

      </div>


    </>
  );
}

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
