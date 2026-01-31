
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, Video, Youtube, Cloud, X, UploadCloud, Play, Paperclip, FileText, File as FileIcon } from 'lucide-react';
import { getDB, saveDB, fetchAllData, uploadMaterial, initializeStore } from '../supabaseStore';
import { Course, Module, Lesson } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const AdminLessons: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Lesson>>({
    title: '',
    description: '',
    videoType: 'youtube',
    videoUrl: '',
    durationSeconds: 0,
    orderNumber: 1
  });

  useEffect(() => {
    const db = getDB();
    setCourses(db.courses);
    if (db.courses.length > 0) setSelectedCourseId(db.courses[0].id);
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      const db = getDB();
      const courseModules = db.modules.filter(m => m.courseId === selectedCourseId);
      setModules(courseModules);
      if (courseModules.length > 0) setSelectedModuleId(courseModules[0].id);
      else setSelectedModuleId('');
    }
  }, [selectedCourseId]);

  const fetchUsers = async () => {
    if (selectedModuleId) {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', selectedModuleId)
        .order('order_number');

      if (data) {
        setLessons(data.map(l => ({
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          description: l.description,
          content: l.content,
          videoUrl: l.video_url,
          videoType: l.video_type,
          supportMaterialUrl: l.support_material_url,
          supportMaterialName: l.support_material_name,
          durationSeconds: l.duration_seconds,
          orderNumber: l.order_number
        })));
      }
    } else {
      setLessons([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedModuleId]);

  const openModal = (lesson?: Lesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData(lesson);
    } else {
      setEditingLesson(null);
      setFormData({
        title: '',
        description: '',
        videoType: 'youtube',
        videoUrl: '',
        durationSeconds: 300,
        orderNumber: lessons.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulating S3 upload with Base64 (max 50MB for simulation safety)
    if (file.size > 50 * 1024 * 1024) {
      alert("Arquivo muito grande para esta demonstração (Máx 50MB).");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, videoUrl: reader.result as string, videoType: 'upload' }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMaterial(true);
    try {
      const { url, name } = await uploadMaterial(file);
      setFormData(prev => ({
        ...prev,
        supportMaterialUrl: url,
        supportMaterialName: name
      }));
    } catch (err) {
      console.error('Error uploading material:', err);
      alert('Erro ao fazer upload do material.');
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const handleSave = async () => {
    if (!selectedModuleId || !formData.title) return;

    setIsUploading(true);
    const lessonData = {
      module_id: selectedModuleId,
      title: formData.title,
      description: formData.description,
      video_url: formData.videoUrl,
      video_type: formData.videoType,
      duration_seconds: formData.durationSeconds,
      order_number: formData.orderNumber,
      support_material_url: formData.supportMaterialUrl,
      support_material_name: formData.supportMaterialName,
      content: formData.content || ''
    };

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(lessonData);
        if (error) throw error;
      }

      await fetchUsers(); // Refresh lessons
      await initializeStore(); // Refresh global cache
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving lesson:', err);
      alert('Erro ao salvar aula.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta aula permanentemente?')) {
      try {
        const { error } = await supabase.from('lessons').delete().eq('id', id);
        if (error) throw error;
        await fetchUsers();
        await initializeStore();
      } catch (err) {
        console.error('Error deleting lesson:', err);
        alert('Erro ao excluir aula.');
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Aulas</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Gerenciamento de Transmissão</p>
        </div>
        <button
          onClick={() => openModal()}
          disabled={!selectedModuleId}
          className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] active:scale-95 shrink-0 disabled:opacity-50"
        >
          <Plus size={18} strokeWidth={3} />
          Cadastrar Aula
        </button>
      </div>

      <div className="bg-[#0f0f13] rounded-[2.5rem] border border-white/5 shadow-2xl p-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Filtrar por Curso</label>
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-sm font-bold text-white"
              >
                {courses.map(c => <option key={c.id} value={c.id} className="bg-[#0f0f13]">{c.title}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Filtrar por Módulo</label>
            <div className="relative">
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none appearance-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-sm font-bold text-white"
              >
                <option value="" className="bg-[#0f0f13]">Selecione um módulo</option>
                {modules.map(m => <option key={m.id} value={m.id} className="bg-[#0f0f13]">{m.title}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {lessons.map(lesson => (
            <div key={lesson.id} className="group flex items-center gap-6 p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
              <div className="w-12 h-12 bg-[#1c1c24] border border-white/5 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                {lesson.videoType === 'youtube' ? <Youtube size={20} /> : lesson.videoType === 'drive' ? <Cloud size={20} /> : <Video size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-sm text-white truncate group-hover:text-indigo-400 transition-colors">{lesson.title}</h4>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black mt-1">{Math.floor(lesson.durationSeconds / 60)} min • Servidor: {lesson.videoType.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(lesson)}
                  className="p-3 text-slate-500 hover:text-indigo-400 transition-all rounded-xl hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="p-3 text-slate-500 hover:text-red-400 transition-all rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {lessons.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
              <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Aguardando inserção de conteúdo neste módulo.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0f0f13] w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h3>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Configuração de Transmissão</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                  <X size={28} />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Título da Aula</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Aula 01 - Boas-vindas"
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Ordem</label>
                    <input
                      type="number"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Servidor de Transmissão</label>
                  <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                    {['youtube', 'drive', 'upload'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, videoType: type as any })}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${formData.videoType === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}
                      >
                        {type === 'youtube' ? 'YouTube' : type === 'drive' ? 'Google Drive' : 'Upload Direto'}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.videoType === 'upload' ? (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Arquivo de Vídeo</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="relative aspect-video rounded-[2rem] overflow-hidden bg-white/5 border-2 border-dashed border-white/10 group transition-all hover:border-indigo-500/40 cursor-pointer flex flex-col items-center justify-center"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Processando Vídeo...</p>
                        </div>
                      ) : formData.videoUrl && formData.videoType === 'upload' ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 border border-green-500/20 shadow-lg">
                            <Play size={24} fill="currentColor" />
                          </div>
                          <p className="text-[10px] font-black uppercase text-green-400">Vídeo Carregado com Sucesso</p>
                          <button className="text-[10px] font-bold text-slate-500 hover:text-white underline underline-offset-4">Trocar arquivo</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-600 group-hover:text-indigo-400 transition-colors">
                          <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center border border-white/5 shadow-xl">
                            <UploadCloud size={32} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest">Selecione o vídeo da aula</p>
                            <p className="text-[10px] font-medium text-slate-700 mt-2">Suporte: MP4, WebM (Simulação S3)</p>
                          </div>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">
                      {formData.videoType === 'youtube' ? 'ID do Vídeo YouTube' : 'Link de Incorporação Google Drive'}
                    </label>
                    <input
                      type="text"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder={formData.videoType === 'youtube' ? 'Ex: dQw4w9WgXcQ' : 'Link do iframe (src)...'}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-bold placeholder:text-slate-700"
                    />
                    <p className="text-[10px] text-slate-600 font-medium ml-1">
                      {formData.videoType === 'youtube' ? 'Insira apenas os caracteres após "v=" no link do YouTube.' : 'Insira o link completo do player do Drive.'}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Resumo da Aula</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="O que o aluno vai aprender nesta aula?"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-white text-sm font-medium leading-relaxed resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Material de Apoio (PDF, ZIP, RAR)</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => materialInputRef.current?.click()}
                      disabled={isUploadingMaterial}
                      className="flex items-center gap-3 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 px-6 py-4 rounded-2xl transition-all group disabled:opacity-50"
                    >
                      {isUploadingMaterial ? (
                        <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      ) : (
                        <UploadCloud size={20} className="text-slate-500 group-hover:text-indigo-400" />
                      )}
                      <span className="text-xs font-bold text-white uppercase tracking-widest">
                        {formData.supportMaterialUrl ? 'Trocar Material' : 'Fazer Upload'}
                      </span>
                    </button>
                    <input
                      ref={materialInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.zip,.rar"
                      onChange={handleMaterialUpload}
                    />
                    {formData.supportMaterialUrl && (
                      <div className="flex-1 flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <Paperclip size={18} className="text-emerald-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest truncate">
                            {formData.supportMaterialName || 'Arquivo selecionado'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, supportMaterialUrl: '', supportMaterialName: '' }))}
                          className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium ml-1 italic">
                    Formatos aceitos: PDF, ZIP e RAR. O material aparecerá na respectiva seção para os alunos.
                  </p>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-[#0a0a0f]/50 backdrop-blur-md">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-all">Descartar</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all active:scale-95">
                  {editingLesson ? 'Atualizar Aula' : 'Publicar Aula'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLessons;
