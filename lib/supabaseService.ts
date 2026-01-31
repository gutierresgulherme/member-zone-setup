import { supabase } from './supabase';
import type {
    Profile, Category, Course, Module, Lesson,
    UserProgress, Post, PostLike, Comment, Offer,
    InsertTables, UpdateTables
} from './database.types';

// ============ AUTH ============

export async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    if (error) throw error;

    // Create profile after signup
    if (data.user) {
        await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            role: email.toLowerCase() === 'developerslimitada@gmail.com' ? 'admin' : 'user'
        });
    }

    return data;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile;
}

export function onAuthStateChange(callback: (user: Profile | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            callback(profile);
        } else {
            callback(null);
        }
    });
}

// ============ CATEGORIES ============

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data;
}

export async function createCategory(category: InsertTables<'categories'>) {
    const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCategory(id: string, updates: UpdateTables<'categories'>) {
    const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCategory(id: string) {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ COURSES ============

export async function getCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getCoursesByCategory(categoryId: string) {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getFeaturedCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_featured', true);

    if (error) throw error;
    return data;
}

export async function getCourse(id: string) {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createCourse(course: InsertTables<'courses'>) {
    const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCourse(id: string, updates: UpdateTables<'courses'>) {
    const { data, error } = await supabase
        .from('courses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCourse(id: string) {
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ MODULES ============

export async function getModulesByCourse(courseId: string) {
    const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number', { ascending: true });

    if (error) throw error;
    return data;
}

export async function createModule(module: InsertTables<'modules'>) {
    const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateModule(id: string, updates: UpdateTables<'modules'>) {
    const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteModule(id: string) {
    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ LESSONS ============

export async function getLessonsByModule(moduleId: string) {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_number', { ascending: true });

    if (error) throw error;
    return data;
}

export async function getLesson(id: string) {
    const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

export async function createLesson(lesson: InsertTables<'lessons'>) {
    const { data, error } = await supabase
        .from('lessons')
        .insert(lesson)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateLesson(id: string, updates: UpdateTables<'lessons'>) {
    const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteLesson(id: string) {
    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ USER PROGRESS ============

export async function getUserProgress(userId: string) {
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

    if (error) throw error;
    return data;
}

export async function updateProgress(userId: string, lessonId: string, updates: { completed?: boolean, watched_seconds?: number }) {
    const { data, error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: userId,
            lesson_id: lessonId,
            ...updates,
            last_watched_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function toggleLessonComplete(userId: string, lessonId: string) {
    // Check current status
    const { data: existing } = await supabase
        .from('user_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

    const newCompleted = !(existing?.completed ?? false);

    return updateProgress(userId, lessonId, { completed: newCompleted });
}

// ============ POSTS ============

export async function getPosts() {
    const { data, error } = await supabase
        .from('posts')
        .select(`
      *,
      profiles:user_id (name, avatar)
    `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function createPost(post: InsertTables<'posts'>) {
    const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deletePost(id: string) {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============ OFFERS ============

export async function getActiveOffers() {
    const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('status', 'active')
        .gte('data_expiracao', new Date().toISOString())
        .order('priority', { ascending: false });

    if (error) throw error;
    return data;
}

// ============ GALLERY DATA (Combined for StudentCourses) ============

export async function getGalleryData(userId?: string) {
    // Get all data in parallel
    const [categoriesRes, coursesRes, modulesRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('modules').select('*').order('order_number'),
        supabase.from('lessons').select('*').order('order_number'),
        userId
            ? supabase.from('user_progress').select('*').eq('user_id', userId)
            : Promise.resolve({ data: [], error: null })
    ]);

    if (categoriesRes.error) throw categoriesRes.error;
    if (coursesRes.error) throw coursesRes.error;
    if (modulesRes.error) throw modulesRes.error;
    if (lessonsRes.error) throw lessonsRes.error;
    if (progressRes.error) throw progressRes.error;

    return {
        categories: categoriesRes.data || [],
        courses: coursesRes.data || [],
        modules: modulesRes.data || [],
        lessons: lessonsRes.data || [],
        progress: progressRes.data || []
    };
}
