
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Play, Info, ChevronRight, ChevronLeft, Search, CheckCircle, Clock, X, Download, ShoppingCart, MoreVertical, Plus, Bookmark, Crown, Zap } from 'lucide-react';
import { getDB, getLoggedUser, initializeStore, toggleLessonComplete as toggleComplete_async, subscribeToChanges, DB } from '../supabaseStore';
import { Course, Module, Lesson, Progress, Category } from '../types';
import { supabase } from '../lib/supabase';
import PandaPlayer from '../components/PandaPlayer';

// Haptic feedback utility
const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: 10, medium: 25, heavy: 50 };
    navigator.vibrate(patterns[pattern]);
  }
};

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[45vw] md:w-60 aspect-video rounded-xl bg-white/5 animate-pulse">
    <div className="w-full h-full rounded-xl bg-gradient-to-br from-white/5 to-white/10" />
  </div>
);

const SkeletonBanner = () => (
  <div className="relative h-[60vh] md:h-[85vh] w-full bg-gradient-to-b from-white/5 to-[#141414] animate-pulse">
    <div className="absolute bottom-24 left-6 md:left-16 space-y-4">
      <div className="w-20 h-6 bg-white/10 rounded" />
      <div className="w-64 h-12 bg-white/10 rounded" />
      <div className="w-80 h-16 bg-white/10 rounded" />
      <div className="flex gap-4">
        <div className="w-32 h-12 bg-white/20 rounded-lg" />
        <div className="w-40 h-12 bg-white/10 rounded-lg" />
      </div>
    </div>
  </div>
);

// Carousel Dot Indicators
const DotIndicators = ({ total, current, onDotClick }: { total: number, current: number, onDotClick: (i: number) => void }) => (
  <div className="flex justify-center gap-2 mt-4 md:hidden" role="tablist" aria-label="Navegação do carrossel">
    {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
      <button
        key={i}
        onClick={() => { triggerHaptic('light'); onDotClick(i); }}
        className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? 'bg-red-600 w-4' : 'bg-white/30'}`}
        role="tab"
        aria-selected={i === current}
        aria-label={`Ir para slide ${i + 1}`}
      />
    ))}
  </div>
);

// Context Menu Component
const ContextMenu = ({ isOpen, onClose, course }: { isOpen: boolean, onClose: () => void, course: Course }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-0 left-0 right-0 z-[90] bg-[#1a1a1a] rounded-t-3xl p-6 pb-10 safe-bottom border-t border-white/10"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="font-black text-lg mb-6 text-center">{course.title}</h3>
          <div className="space-y-2">
            <button
              onClick={() => { triggerHaptic('medium'); onClose(); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center text-red-500">
                <Plus size={20} />
              </div>
              <span className="font-bold">Adicionar à Minha Lista</span>
            </button>
            <button
              onClick={() => { triggerHaptic('medium'); onClose(); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Bookmark size={20} />
              </div>
              <span className="font-bold">Salvar para Depois</span>
            </button>
            <button
              onClick={() => { triggerHaptic('medium'); onClose(); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Info size={20} />
              </div>
              <span className="font-bold">Ver Detalhes</span>
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// Mobile Search Overlay Component
const SearchOverlay = ({
  isOpen,
  onClose,
  searchTerm,
  setSearchTerm,
  filteredCourses,
  onCourseSelect,
  getCourseProgress
}: {
  isOpen: boolean,
  onClose: () => void,
  searchTerm: string,
  setSearchTerm: (s: string) => void,
  filteredCourses: Course[],
  onCourseSelect: (c: Course) => void,
  getCourseProgress: (id: string) => number
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#141414] flex flex-col"
        >
          {/* Search Header */}
          <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/40 backdrop-blur-xl safe-top">
            <button
              onClick={onClose}
              className="p-3 rounded-full hover:bg-white/10 transition-all active:scale-95"
              aria-label="Fechar busca"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cursos, aulas..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-3 text-base outline-none focus:border-red-600/50 transition-all"
                autoComplete="off"
                autoCapitalize="none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
                  aria-label="Limpar busca"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {searchTerm ? (
              <>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
                  {filteredCourses.length} resultado{filteredCourses.length !== 1 ? 's' : ''} para "{searchTerm}"
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {filteredCourses.map(course => (
                    <motion.button
                      key={course.id}
                      onClick={() => { triggerHaptic('light'); onCourseSelect(course); onClose(); }}
                      className="text-left"
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="aspect-video rounded-xl overflow-hidden mb-2 relative">
                        <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                        {getCourseProgress(course.id) > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                            <div
                              className="h-full bg-red-600"
                              style={{ width: `${getCourseProgress(course.id)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <h4
                        className="font-bold text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: course.title.replace(
                            new RegExp(`(${searchTerm})`, 'gi'),
                            '<span class="text-red-500">$1</span>'
                          )
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
                {filteredCourses.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-slate-500 font-bold">Nenhum curso encontrado</p>
                    <p className="text-slate-600 text-sm mt-2">Tente buscar com outras palavras-chave</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Search size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-bold">Busque por cursos, aulas ou tópicos</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StudentCourses: React.FC = () => {
  const [db, setDb] = useState<DB>(getDB());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenuCourse, setContextMenuCourse] = useState<Course | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [sidebarOffers, setSidebarOffers] = useState<any[]>([]);

  const user = getLoggedUser();
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [carouselPositions, setCarouselPositions] = useState<Record<string, number>>({});

  // Fetch data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [data] = await Promise.all([
          initializeStore(),
          fetchSidebarOffers()
        ]);
        setDb(data as unknown as DB);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Subscribe to real-time changes
    const unsubCourses = subscribeToChanges('courses', () => loadData());
    const unsubProgress = subscribeToChanges('user_progress', () => loadData());
    const unsubOffers = subscribeToChanges('course_sidebar_offers', () => fetchSidebarOffers());

    return () => {
      unsubCourses();
      unsubProgress();
      unsubOffers();
    };
  }, []);

  const fetchSidebarOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('course_sidebar_offers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setSidebarOffers(data || []);
    } catch (err) {
      console.error('Error fetching sidebar offers:', err);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const featuredCourses = db.courses.filter(c => c.isFeatured);
  const featuredCourse = featuredCourses[currentBannerIndex] || db.courses[0];
  const userProgress = db.progress.filter(p => p.userId === user?.id);

  const getCourseProgress = useCallback((courseId: string) => {
    const courseLessons = db.lessons.filter(l =>
      db.modules.some(m => m.courseId === courseId && m.id === l.moduleId)
    );
    if (courseLessons.length === 0) return 0;
    const completedCount = userProgress.filter(p =>
      p.completed && courseLessons.some(l => l.id === p.lessonId)
    ).length;
    return Math.round((completedCount / courseLessons.length) * 100);
  }, [db.lessons, db.modules, userProgress]);

  const isLessonCompleted = (lessonId: string) => userProgress.some(p => p.lessonId === lessonId && p.completed);

  const toggleComplete = async (lessonId: string) => {
    if (!user) return;
    triggerHaptic('medium');
    try {
      await toggleComplete_async(lessonId);
      // Reload data after update
      const data = await initializeStore();
      setDb(data as unknown as DB);
    } catch (error) {
      console.error('Error toggling lesson:', error);
    }
  };

  const handleOpenCourse = (course: Course) => {
    triggerHaptic('light');
    setSelectedCourse(course);
    const courseModules = db.modules.filter(m => m.courseId === course.id).sort((a, b) => a.orderNumber - b.orderNumber);
    if (courseModules.length > 0) setExpandedModule(courseModules[0].id);
  };

  // Double tap handler
  const lastTap = useRef<{ time: number, courseId: string | null }>({ time: 0, courseId: null });
  const handleCardTap = (course: Course) => {
    const now = Date.now();
    if (lastTap.current.courseId === course.id && now - lastTap.current.time < 300) {
      // Double tap - open directly
      triggerHaptic('medium');
      handleOpenCourse(course);
      const courseModules = db.modules.filter(m => m.courseId === course.id).sort((a, b) => a.orderNumber - b.orderNumber);
      if (courseModules.length > 0) {
        const firstLesson = db.lessons.find(l => l.moduleId === courseModules[0].id);
        if (firstLesson) setCurrentLesson(firstLesson);
      }
    } else {
      // Single tap
      handleOpenCourse(course);
    }
    lastTap.current = { time: now, courseId: course.id };
  };

  // Long press handler
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const handleTouchStart = (course: Course) => {
    longPressTimer.current = setTimeout(() => {
      triggerHaptic('heavy');
      setContextMenuCourse(course);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Carousel scroll tracking
  const handleCarouselScroll = (categoryId: string, e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const cardWidth = el.scrollWidth / (el.children.length || 1);
    const position = Math.round(el.scrollLeft / cardWidth);
    setCarouselPositions(prev => ({ ...prev, [categoryId]: position }));
  };

  const scrollToCard = (categoryId: string, index: number) => {
    const carousel = carouselRefs.current[categoryId];
    if (carousel) {
      const cardWidth = carousel.scrollWidth / (carousel.children.length || 1);
      carousel.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    }
  };

  // Banner swipe handler
  const handleBannerSwipe = (direction: number) => {
    if (featuredCourses.length <= 1) return;
    triggerHaptic('light');
    setCurrentBannerIndex(prev => {
      if (direction > 0) return prev === 0 ? featuredCourses.length - 1 : prev - 1;
      return prev === featuredCourses.length - 1 ? 0 : prev + 1;
    });
  };

  const filteredCourses = db.courses.filter(c =>
    c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.description.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#141414] text-white -m-4 md:-m-8 pb-20 selection:bg-red-600 selection:text-white">
      {/* Mobile Search Button */}
      <button
        onClick={() => { triggerHaptic('light'); setIsSearchOpen(true); }}
        className="fixed top-24 right-4 z-30 md:hidden p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/10 active:scale-95 transition-transform"
        aria-label="Abrir busca"
      >
        <Search size={20} />
      </button>

      {/* Desktop Search Header */}
      <div className="fixed top-20 right-8 z-30 hidden md:flex items-center">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors" size={18} />
          <input
            type="text"
            placeholder="Títulos, aulas, tópicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-black/40 border border-white/10 hover:border-white/30 focus:border-red-600 rounded-full pl-12 pr-6 py-2.5 text-sm outline-none w-64 backdrop-blur-md transition-all focus:w-80"
            aria-label="Buscar cursos"
          />
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredCourses={filteredCourses}
        onCourseSelect={handleOpenCourse}
        getCourseProgress={getCourseProgress}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={!!contextMenuCourse}
        onClose={() => setContextMenuCourse(null)}
        course={contextMenuCourse || db.courses[0]}
      />

      {/* Hero Banner */}
      {!debouncedSearch && (
        <section className="relative h-[60vh] md:h-[85vh] w-full overflow-hidden">
          {isLoading ? (
            <SkeletonBanner />
          ) : featuredCourse && (
            <motion.div
              key={featuredCourse.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info: PanInfo) => {
                if (Math.abs(info.offset.x) > 50) {
                  handleBannerSwipe(info.offset.x);
                }
              }}
            >
              <img
                src={featuredCourse.coverUrl}
                alt={featuredCourse.title}
                className={`w-full h-full object-cover object-${featuredCourse.coverPosition || 'center'}`}
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />

              <div className="absolute bottom-20 md:bottom-24 left-6 md:left-16 max-w-2xl space-y-4 md:space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 md:space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Destaque</span>
                    <span className="text-white/60 text-xs font-bold uppercase tracking-[0.2em]">Exclusivo Infinito</span>
                  </div>
                  <h1 className="text-3xl md:text-7xl font-black tracking-tighter drop-shadow-2xl">{featuredCourse.title}</h1>
                  <p className="text-base md:text-lg text-slate-300 font-medium leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-md">
                    {featuredCourse.description}
                  </p>
                </motion.div>

                <div className="flex items-center gap-3 md:gap-4">
                  <button
                    onClick={() => handleOpenCourse(featuredCourse)}
                    className="flex items-center gap-2 md:gap-3 bg-white text-black px-5 md:px-8 py-3 md:py-4 rounded-lg font-black text-xs md:text-sm uppercase transition-all hover:bg-white/80 active:scale-95 shadow-xl min-w-[120px] justify-center"
                    aria-label={`Assistir ${featuredCourse.title}`}
                  >
                    <Play fill="currentColor" size={18} />
                    <span className="hidden sm:inline">Assistir Agora</span>
                    <span className="sm:hidden">Assistir</span>
                  </button>
                  <button
                    onClick={() => handleOpenCourse(featuredCourse)}
                    className="flex items-center gap-2 md:gap-3 bg-white/20 backdrop-blur-md text-white px-5 md:px-8 py-3 md:py-4 rounded-lg font-black text-xs md:text-sm uppercase transition-all hover:bg-white/30 active:scale-95"
                    aria-label={`Mais informações sobre ${featuredCourse.title}`}
                  >
                    <Info size={18} />
                    <span className="hidden sm:inline">Mais Informações</span>
                    <span className="sm:hidden">Info</span>
                  </button>
                </div>
              </div>

              {/* Banner indicators */}
              {featuredCourses.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {featuredCourses.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { triggerHaptic('light'); setCurrentBannerIndex(i); }}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentBannerIndex ? 'bg-white w-6' : 'bg-white/40'}`}
                      aria-label={`Ir para destaque ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </section>
      )}

      {/* Rows Container */}
      <div className={`px-4 md:px-16 space-y-8 md:space-y-12 ${debouncedSearch ? 'pt-28 md:pt-32' : '-mt-16 md:-mt-24 relative z-20'}`}>

        {/* If Search Active */}
        {debouncedSearch ? (
          <section>
            <h2 className="text-lg md:text-xl font-black mb-4 md:mb-6 uppercase tracking-widest text-slate-400">
              Resultados para "{debouncedSearch}"
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
              {filteredCourses.map(course => (
                <div key={course.id}>
                  <CourseCard
                    course={course}
                    onClick={() => handleCardTap(course)}
                    onLongPress={() => setContextMenuCourse(course)}
                    progress={getCourseProgress(course.id)}
                    categoryName={db.categories.find(cat => cat.id === course.categoryId)?.name}
                  />
                </div>
              ))}
            </div>
            {filteredCourses.length === 0 && (
              <div className="py-16 md:py-24 text-center">
                <p className="text-slate-500 font-bold">Nenhum treinamento encontrado com esse nome.</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Continuing Watch Section */}
            {userProgress.length > 0 && (
              <section>
                <h2 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3 uppercase tracking-widest text-slate-200">
                  Continuar Assistindo
                  <ChevronRight size={20} className="text-red-600" />
                </h2>
                {isLoading ? (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : (
                  <>
                    <div
                      ref={(el) => { carouselRefs.current['continue'] = el; }}
                      onScroll={(e) => handleCarouselScroll('continue', e)}
                      className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-6 md:pb-10 snap-x snap-mandatory scroll-smooth"
                      role="region"
                      aria-label="Cursos em andamento"
                    >
                      {db.courses.filter(c => getCourseProgress(c.id) > 0 && getCourseProgress(c.id) < 100).map(course => (
                        <div key={course.id} className="flex-shrink-0 w-[45vw] md:w-60 snap-start">
                          <CourseCard
                            course={course}
                            onClick={() => handleCardTap(course)}
                            onLongPress={() => setContextMenuCourse(course)}
                            progress={getCourseProgress(course.id)}
                            categoryName={db.categories.find(cat => cat.id === course.categoryId)?.name}
                          />
                        </div>
                      ))}
                    </div>
                    <DotIndicators
                      total={db.courses.filter(c => getCourseProgress(c.id) > 0 && getCourseProgress(c.id) < 100).length}
                      current={carouselPositions['continue'] || 0}
                      onDotClick={(i) => scrollToCard('continue', i)}
                    />
                  </>
                )}
              </section>
            )}

            {/* Categories Sections */}
            {db.categories.sort((a, b) => a.order - b.order).map(category => {
              const categoryCourses = db.courses.filter(c => c.categoryId === category.id);
              if (categoryCourses.length === 0) return null;

              return (
                <section key={category.id}>
                  <h2 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3 uppercase tracking-widest text-slate-200">
                    {category.name}
                    <ChevronRight size={20} className="text-red-600" />
                  </h2>
                  {isLoading ? (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-6">
                      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                  ) : (
                    <>
                      <div
                        ref={(el) => { carouselRefs.current[category.id] = el; }}
                        onScroll={(e) => handleCarouselScroll(category.id, e)}
                        className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-6 md:pb-10 snap-x snap-mandatory scroll-smooth"
                        role="region"
                        aria-label={`Cursos de ${category.name}`}
                      >
                        {categoryCourses.map(course => (
                          <div key={course.id} className="flex-shrink-0 w-[45vw] md:w-60 snap-start">
                            <CourseCard
                              course={course}
                              onClick={() => handleCardTap(course)}
                              onLongPress={() => setContextMenuCourse(course)}
                              progress={getCourseProgress(course.id)}
                            />
                          </div>
                        ))}
                      </div>
                      <DotIndicators
                        total={categoryCourses.length}
                        current={carouselPositions[category.id] || 0}
                        onDotClick={(i) => scrollToCard(category.id, i)}
                      />
                    </>
                  )}
                </section>
              );
            })}

            {/* Completed Section */}
            {(() => {
              const completedCourses = db.courses.filter(c => getCourseProgress(c.id) === 100);
              if (completedCourses.length === 0) return null;

              return (
                <section>
                  <h2 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-3 uppercase tracking-widest text-slate-200">
                    <CheckCircle size={20} className="text-emerald-500" />
                    Concluídos
                  </h2>
                  <div
                    ref={(el) => { carouselRefs.current['completed'] = el; }}
                    onScroll={(e) => handleCarouselScroll('completed', e)}
                    className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-6 md:pb-10 snap-x snap-mandatory scroll-smooth"
                    role="region"
                    aria-label="Cursos concluídos"
                  >
                    {completedCourses.map(course => (
                      <div key={course.id} className="flex-shrink-0 w-[45vw] md:w-60 snap-start">
                        <CourseCard
                          course={course}
                          onClick={() => handleCardTap(course)}
                          onLongPress={() => setContextMenuCourse(course)}
                          progress={100}
                          completed
                        />
                      </div>
                    ))}
                  </div>
                  <DotIndicators
                    total={completedCourses.length}
                    current={carouselPositions['completed'] || 0}
                    onDotClick={(i) => scrollToCard('completed', i)}
                  />
                </section>
              );
            })()}
          </>
        )}
      </div>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-[#181818] w-full h-full md:max-w-5xl md:max-h-[90vh] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] relative border-0 md:border md:border-white/5"
            >
              <button
                onClick={() => setSelectedCourse(null)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-3 bg-black/40 hover:bg-white hover:text-black rounded-full transition-all text-white backdrop-blur-md border border-white/10"
                aria-label="Fechar detalhes do curso"
              >
                <X size={24} />
              </button>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Modal Header */}
                <div className="relative h-[250px] md:h-[450px]">
                  <img
                    src={selectedCourse.coverUrl}
                    className={`w-full h-full object-cover object-${selectedCourse.coverPosition || 'center'}`}
                    alt={selectedCourse.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />
                  <div className="absolute bottom-8 md:bottom-12 left-4 md:left-16 space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-red-600 uppercase tracking-widest bg-red-600/10 px-3 py-1 rounded border border-red-600/20">Streaming HD</span>
                    </div>
                    <h2 className="text-2xl md:text-6xl font-black tracking-tighter drop-shadow-2xl">{selectedCourse.title}</h2>
                    <div className="flex items-center gap-4 md:gap-6 pt-2">
                      <div className="w-32 md:w-48 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${getCourseProgress(selectedCourse.id)}%` }} />
                      </div>
                      <span className="text-xs font-black text-red-600 uppercase tracking-widest">{getCourseProgress(selectedCourse.id)}% Concluído</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-16 grid lg:grid-cols-3 gap-8 md:gap-16">
                  <div className="lg:col-span-2 space-y-8 md:space-y-10">
                    <div className="space-y-3 md:space-y-4">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Sinopse da Formação</h3>
                      <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-medium">{selectedCourse.description}</p>
                    </div>

                    {/* Modules/Episodes List */}
                    <div className="space-y-4 md:space-y-6">
                      <h3 className="text-xl md:text-2xl font-black tracking-tight">Grade Curricular</h3>
                      <div className="space-y-3 md:space-y-4">
                        {db.modules.filter(m => m.courseId === selectedCourse.id).sort((a, b) => a.orderNumber - b.orderNumber).map(module => (
                          <div key={module.id} className="bg-white/5 rounded-2xl md:rounded-3xl overflow-hidden border border-white/5 group/mod">
                            <button
                              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                              className="w-full flex items-center justify-between p-4 md:p-8 hover:bg-white/5 transition-all text-left"
                              aria-expanded={expandedModule === module.id}
                              aria-controls={`module-${module.id}`}
                            >
                              <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-black/40 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-red-600 border border-white/10 group-hover/mod:border-red-600/30 group-hover/mod:bg-red-600/10 transition-all">
                                  {module.orderNumber}
                                </div>
                                <span className="font-black text-base md:text-lg text-slate-100 group-hover/mod:text-white transition-colors">{module.title}</span>
                              </div>
                              <ChevronRight className={`transition-transform duration-500 ${expandedModule === module.id ? 'rotate-90 text-red-600' : 'text-slate-600'}`} size={24} />
                            </button>

                            <AnimatePresence>
                              {expandedModule === module.id && (
                                <motion.div
                                  id={`module-${module.id}`}
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden bg-black/20"
                                >
                                  <div className="p-3 md:p-4 space-y-2 border-t border-white/5">
                                    {db.lessons.filter(l => l.moduleId === module.id).sort((a, b) => a.orderNumber - b.orderNumber).map(lesson => (
                                      <button
                                        key={lesson.id}
                                        onClick={() => { triggerHaptic('light'); setCurrentLesson(lesson); }}
                                        className="w-full group/lesson flex items-center justify-between p-4 md:p-5 rounded-xl md:rounded-2xl hover:bg-white/5 transition-all text-left active:scale-[0.98]"
                                        aria-label={`Assistir aula: ${lesson.title}`}
                                      >
                                        <div className="flex items-center gap-4 md:gap-5">
                                          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-lg md:rounded-xl flex items-center justify-center group-hover/lesson:bg-red-600 group-hover/lesson:text-white transition-all border border-white/10">
                                            {isLessonCompleted(lesson.id) ? <CheckCircle size={20} className="text-emerald-500 group-hover/lesson:text-white" /> : <Play size={18} className="ml-0.5" />}
                                          </div>
                                          <div>
                                            <p className="font-bold text-sm text-white group-hover/lesson:text-red-600 transition-colors">{lesson.title}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{Math.floor(lesson.durationSeconds / 60)} MIN • HD</p>
                                          </div>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover/lesson:opacity-100 transition-all">
                                          <ChevronRight size={18} className="text-red-600" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    <div className="p-6 md:p-10 bg-[#222] rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 md:space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 md:mb-6">Ficha Técnica</h4>
                        <div className="space-y-4 md:space-y-6">
                          <div className="flex items-center gap-4 text-sm font-bold text-slate-200 group/item">
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                              <CheckCircle size={18} />
                            </div>
                            Certificado Verificado
                          </div>
                          <div className="flex items-center gap-4 text-sm font-bold text-slate-200 group/item">
                            <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                              <Download size={18} />
                            </div>
                            Materiais de Apoio
                          </div>
                          <div className="flex items-center gap-4 text-sm font-bold text-slate-200 group/item">
                            <div className="w-8 h-8 bg-indigo-600/10 rounded-lg flex items-center justify-center text-indigo-600 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                              <Zap size={18} />
                            </div>
                            Suporte Mastermind
                          </div>
                        </div>
                      </div>

                      {sidebarOffers.find(o => o.key === 'vip_group') && (
                        <div className="pt-6 md:pt-8 border-t border-white/5 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400">
                              <Crown size={18} />
                            </div>
                            <h4 className="font-black text-sm text-white tracking-tight">{sidebarOffers.find(o => o.key === 'vip_group').title}</h4>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium">{sidebarOffers.find(o => o.key === 'vip_group').description}</p>
                          <button
                            onClick={() => window.open(sidebarOffers.find(o => o.key === 'vip_group').button_url, '_blank')}
                            className="w-full py-4 bg-white text-black hover:bg-indigo-600 hover:text-white rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                          >
                            <Plus size={14} strokeWidth={3} />
                            {sidebarOffers.find(o => o.key === 'vip_group').button_text}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* High-Conversion Promo Section */}
                    {sidebarOffers.find(o => o.key === 'cross_sell') && (
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-[1px] bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl">
                          <div className="bg-[#121212] rounded-[calc(1rem-3px)] md:rounded-[2.4rem] p-6 md:p-8 space-y-5 relative overflow-hidden">
                            {/* Animated Shine Effect */}
                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-40 group-hover:animate-shine" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Oferta Expirando</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="font-black text-xl md:text-2xl tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                                {sidebarOffers.find(o => o.key === 'cross_sell').title}
                              </h4>
                              <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-2">
                                {sidebarOffers.find(o => o.key === 'cross_sell').description}
                              </p>
                            </div>

                            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3">
                              <div className="flex items-baseline gap-2">
                                {sidebarOffers.find(o => o.key === 'cross_sell').price_promocional > 0 && (
                                  <span className="text-2xl font-black text-white tracking-tighter">
                                    R$ {sidebarOffers.find(o => o.key === 'cross_sell').price_promocional.toFixed(2)}
                                  </span>
                                )}
                                {sidebarOffers.find(o => o.key === 'cross_sell').price_original > 0 && (
                                  <span className="text-xs text-slate-600 line-through font-bold">
                                    R$ {sidebarOffers.find(o => o.key === 'cross_sell').price_original.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 w-fit px-2 py-1 rounded">
                                <CheckCircle size={10} />
                                Economia Imediata Ativa
                              </div>
                            </div>

                            <button
                              onClick={() => window.open(sidebarOffers.find(o => o.key === 'cross_sell').button_url, '_blank')}
                              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-black rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2"
                            >
                              <ShoppingCart size={16} strokeWidth={3} />
                              {sidebarOffers.find(o => o.key === 'cross_sell').button_text}
                            </button>

                            <p className="text-[9px] text-center text-slate-600 font-bold uppercase tracking-widest">
                              * Vagas limitadas para esta condição especial
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lesson View Overlay - Cinematic Player Screen */}
      <AnimatePresence>
        {currentLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-[#050507]"
          >
            <div className="w-full h-full flex flex-col">
              <div className="p-4 md:p-6 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/5 safe-top">
                <button
                  onClick={() => setCurrentLesson(null)}
                  className="flex items-center gap-2 md:gap-3 text-slate-400 hover:text-white transition-all font-black text-xs uppercase tracking-widest"
                  aria-label="Sair do player"
                >
                  <ChevronLeft size={20} strokeWidth={3} />
                  <span className="hidden sm:inline">Sair do Player</span>
                </button>
                <div className="text-center flex-1 mx-4">
                  <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] truncate">{currentLesson.title}</h2>
                  <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mt-1 hidden sm:block">Lovable Infinito Experience</p>
                </div>
                <button
                  onClick={() => toggleComplete(currentLesson.id)}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isLessonCompleted(currentLesson.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white text-black hover:bg-slate-200'}`}
                  aria-label={isLessonCompleted(currentLesson.id) ? "Aula já concluída" : "Marcar aula como concluída"}
                >
                  <span className="hidden sm:inline">{isLessonCompleted(currentLesson.id) ? 'Aula Concluída ✓' : 'Concluir Aula'}</span>
                  <span className="sm:hidden">{isLessonCompleted(currentLesson.id) ? '✓' : 'Concluir'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 md:px-6 space-y-10 md:space-y-16">
                  <PandaPlayer
                    videoUrl={currentLesson.videoUrl}
                    videoType={currentLesson.videoType}
                    title={currentLesson.title}
                  />

                  <div className="grid lg:grid-cols-3 gap-10 md:gap-16 pb-16 md:pb-24">
                    <div className="lg:col-span-2 space-y-8 md:space-y-10">
                      <div className="space-y-3 md:space-y-4">
                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-[0.3em]">Sobre este Episódio</h3>
                        <p className="text-slate-300 leading-relaxed text-lg md:text-xl font-medium">{currentLesson.description}</p>
                      </div>

                      {/* Discussion Area */}
                      <div className="space-y-4 md:space-y-6 pt-8 md:pt-10 border-t border-white/5">
                        <h3 className="text-lg md:text-xl font-black">Comentários e Dúvidas</h3>
                        <div className="bg-white/5 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-white/5">
                          <textarea
                            placeholder="Deixe seu comentário ou dúvida sobre esta aula..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-sm outline-none focus:border-red-600/50 transition-all resize-none mb-4"
                            rows={3}
                            aria-label="Escrever comentário"
                          />
                          <div className="flex justify-end">
                            <button className="bg-red-600 text-white px-6 md:px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all active:scale-95">
                              Enviar Comentário
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                      <div className="p-6 md:p-10 bg-white/5 rounded-2xl md:rounded-[2.5rem] border border-white/5 space-y-6 md:space-y-8">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 md:mb-6">Recursos Adicionais</h4>
                          {currentLesson.supportMaterialUrl ? (
                            <a
                              href={currentLesson.supportMaterialUrl}
                              download
                              className="flex items-center gap-4 md:gap-5 p-4 md:p-5 bg-white/5 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all group/dl border border-white/5 active:scale-[0.98]"
                            >
                              <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600 group-hover/dl:bg-red-600 group-hover/dl:text-white transition-all">
                                <Download size={20} />
                              </div>
                              <span className="text-sm font-bold truncate text-slate-200 group-hover/dl:text-white">{currentLesson.supportMaterialName || 'Arquivo Complementar'}</span>
                            </a>
                          ) : (
                            <div className="p-5 md:p-6 bg-black/40 rounded-xl md:rounded-2xl text-center border border-white/5">
                              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Nenhum material disponível</p>
                            </div>
                          )}
                        </div>

                        <div className="pt-6 md:pt-8 border-t border-white/5">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Suporte ao Aluno</h4>
                          <button className="w-full py-3 md:py-4 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95">
                            Falar com Monitor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  onClick: () => void;
  onLongPress?: () => void;
  progress: number;
  completed?: boolean;
  categoryName?: string;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick, onLongPress, progress, completed, categoryName }) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        triggerHaptic('heavy');
        onLongPress();
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08, zIndex: 40, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.5)] group border border-white/5 hover:border-red-600/30 transition-all touch-manipulation"
      role="button"
      tabIndex={0}
      aria-label={`${course.title}${progress > 0 ? `, ${progress}% concluído` : ''}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <img
        src={course.coverUrl}
        alt={course.title}
        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 object-${course.coverPosition || 'center'}`}
        loading="lazy"
      />

      {/* Featured Badge */}
      {course.isFeatured && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-yellow-500 text-black text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-tight">Destaque</span>
        </div>
      )}

      {/* Completed Badge */}
      {completed && (
        <div className="absolute top-2 right-2 z-10 bg-emerald-500 rounded-full p-1 shadow-lg">
          <CheckCircle size={10} className="text-white" />
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

      <div className="absolute inset-x-0 bottom-0 p-3 md:p-5 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
        <div className="flex items-center gap-2 mb-1">
          {categoryName && (
            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest bg-red-600/10 px-1.5 py-0.5 rounded border border-red-600/20">{categoryName}</span>
          )}
          {progress > 0 && <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{progress}% assistido</span>}
        </div>
        <h3 className="font-black text-xs md:text-sm text-white line-clamp-2 mb-2 md:mb-3 drop-shadow-lg leading-tight group-hover:text-red-600 transition-colors uppercase tracking-tight">
          {course.title}
        </h3>

        {progress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[9px] font-black text-white/40 uppercase tracking-widest">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Hover Play Icon */}
      <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-0 group-hover:scale-100 transition-transform duration-500 delay-75">
          <Play fill="currentColor" size={20} className="ml-0.5" />
        </div>
      </div>
    </motion.div>
  );
};

export default StudentCourses;
