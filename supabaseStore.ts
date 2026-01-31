/**
 * Unified Store - Supabase Integration
 * 
 * This store provides a unified interface that works with Supabase.
 * It maintains backward compatibility with the old localStorage-based API
 * while persisting all data to Supabase.
 */

import { supabase } from './Area-de-Membros---Produto-Lovable-Infinito/lib/supabase';
import * as DBTypes from './Area-de-Membros---Produto-Lovable-Infinito/lib/database.types';
import {
    UserRole,
    User,
    Category,
    Course,
    Module,
    Lesson,
    Progress as UserProgress,
    Post,
    Comment,
    Offer,
    PostLike
} from './types';

const USER_SESSION_KEY = 'lovable_user';

// ============ DB INTERFACE ============

export interface DB {
    users: User[];
    categories: Category[];
    courses: Course[];
    modules: Module[];
    lessons: Lesson[];
    progress: UserProgress[];
    posts: Post[];
    postLikes: PostLike[];
    comments: Comment[];
    offers: Offer[];
    settings: {
        allowComments: boolean;
    };
}

// ============ AUTH ============

export async function signUp(email: string, password: string, name: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Signup failed');

    const isAdmin = email.toLowerCase() === 'developerslimitada@gmail.com';

    // Create profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: data.user.id,
            email,
            name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            role: isAdmin ? 'admin' : 'user',
            login_count: 1
        })
        .select()
        .single();

    if (profileError) throw profileError;

    const user: User = {
        id: (profile as any).id,
        name: (profile as any).name,
        email: (profile as any).email,
        avatar: (profile as any).avatar || '',
        role: (profile as any).role === 'admin' ? UserRole.ADMIN : UserRole.USER,
        bio: (profile as any).bio || undefined,
        loginCount: 1
    };

    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    return user;
}

export async function signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    if (!data.user) throw new Error('Login failed');

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) throw profileError;

    // Increment login count
    const currentCount = (profile as any).login_count || 0;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ login_count: currentCount + 1 })
        .eq('id', data.user.id);

    if (updateError) console.error('Failed to increment login count:', updateError);

    const user: User = {
        id: (profile as any).id,
        name: (profile as any).name,
        email: (profile as any).email,
        avatar: (profile as any).avatar || '',
        role: (profile as any).role === 'admin' ? UserRole.ADMIN : UserRole.USER,
        bio: (profile as any).bio || undefined,
        loginCount: currentCount + 1
    };

    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    return user;
}

export async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem(USER_SESSION_KEY);
    window.location.hash = '#/login';
}

export const logout = signOut;

export const getLoggedUser = (): User | null => {
    const sessionData = localStorage.getItem(USER_SESSION_KEY);
    if (!sessionData) return null;
    try {
        return JSON.parse(sessionData) as User;
    } catch {
        return null;
    }
};

export async function updateProfile(userId: string, data: Partial<User>) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .update({
            name: data.name,
            avatar: data.avatar,
            bio: data.bio
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;

    if (profile) {
        const currentUser = getLoggedUser();
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser, ...data };
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedUser));
        }

        // Update cachedDB for immediate UI reflection in Feed/Community
        if (cachedDB) {
            cachedDB.users = (cachedDB.users || []).map(u => u.id === userId ? { ...u, ...data } : u);
            cachedDB.posts = (cachedDB.posts || []).map(p =>
                p.userId === userId ? { ...p, userName: data.name || p.userName, userAvatar: data.avatar || p.userAvatar } : p
            );
        }
    }

    return profile;
}

export async function updateUserPassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
}

export async function uploadAvatar(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`; // Create unique filename

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    return data.publicUrl;
}

export async function uploadMaterial(file: File): Promise<{ url: string, name: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

    return {
        url: data.publicUrl,
        name: file.name
    };
}

// ============ DATA MAPPING ============

const mapCategory = (row: DBTypes.Category): Category => ({
    id: row.id,
    name: row.name,
    order: row.display_order || 0
});

const mapCourse = (row: DBTypes.Course): Course => ({
    id: row.id,
    categoryId: row.category_id || '',
    title: row.title,
    description: row.description || '',
    coverUrl: row.cover_url || '',
    coverPosition: (row.cover_position as any) || 'center',
    isFeatured: row.is_featured || false,
    createdBy: row.created_by || ''
});

const mapModule = (row: DBTypes.Module): Module => ({
    id: row.id,
    courseId: row.course_id || '',
    title: row.title,
    description: row.description || '',
    coverUrl: row.cover_url || undefined,
    coverPosition: (row.cover_position as any) || undefined,
    orderNumber: row.order_number || 0
});

const mapLesson = (row: DBTypes.Lesson): Lesson => ({
    id: row.id,
    moduleId: row.module_id || '',
    title: row.title,
    description: row.description || '',
    content: row.content || '',
    videoUrl: row.video_url || '',
    videoType: (row.video_type as any) || 'youtube',
    supportMaterialUrl: row.support_material_url || undefined,
    supportMaterialName: row.support_material_name || undefined,
    durationSeconds: row.duration_seconds || 0,
    orderNumber: row.order_number || 0
});

const mapProgress = (row: DBTypes.UserProgress): UserProgress => ({
    userId: row.user_id || '',
    lessonId: row.lesson_id || '',
    completed: row.completed || false,
    watchedSeconds: row.watched_seconds || 0
});

const mapOffer = (row: DBTypes.Offer): Offer => ({
    id: row.id,
    title: row.title,
    shortDescription: row.short_description || '',
    urlDestino: row.url_destino || '',
    imageUrl: row.image_url || '',
    precoOriginal: row.preco_original || 0,
    precoPromocional: row.preco_promocional || 0,
    dataInicio: row.data_inicio || '',
    dataExpiracao: row.data_expiracao || '',
    status: (row.status as any) || 'inactive',
    priority: row.priority || 0
});

// ============ DATA FETCHING ============

export async function fetchAllData(): Promise<DB> {
    const user = getLoggedUser();

    const [
        categoriesRes,
        coursesRes,
        modulesRes,
        lessonsRes,
        progressRes,
        postsRes,
        offersRes
    ] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
        supabase.from('courses').select('*').order('created_at', { ascending: false }),
        supabase.from('modules').select('*').order('order_number'),
        supabase.from('lessons').select('*').order('order_number'),
        user ? supabase.from('user_progress').select('*').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
        supabase.from('posts').select('*, profiles(*)').eq('status', 'published').order('created_at', { ascending: false }),
        supabase.from('offers').select('*').order('priority', { ascending: false })
    ]);

    const db: DB = {
        users: [],
        categories: (categoriesRes.data || []).map(mapCategory),
        courses: (coursesRes.data || []).map(mapCourse),
        modules: (modulesRes.data || []).map(mapModule),
        lessons: (lessonsRes.data || []).map(mapLesson),
        progress: (progressRes.data || []).map(mapProgress),
        posts: (postsRes.data || []).map(p => ({
            id: p.id,
            userId: p.user_id || '',
            userName: (p as any).profiles?.name || 'Usuário',
            userAvatar: (p as any).profiles?.avatar || '',
            title: p.title || undefined,
            content: p.content,
            imageUrl: p.image_url || undefined,
            likesCount: p.likes_count || 0,
            allowComments: (p as any).allow_comments ?? true,
            status: (p.status as any) || 'published',
            createdAt: p.created_at || new Date().toISOString()
        })),
        postLikes: [],
        comments: [],
        offers: (offersRes.data || []).map(mapOffer),
        settings: {
            allowComments: true // Deprecated global setting, keeping for specific logic if needed
        }
    };

    // Inject mock posts if empty
    if (db.posts.length === 0) {
        db.posts = [
            {
                id: 'mock-1',
                userId: 'admin-1',
                userName: 'Equipe Infinito',
                userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Infinito',
                title: 'Bem-vindo à Revolução!',
                content: 'Estamos muito felizes em ter você aqui. Explore os cursos, conecte-se com a comunidade e prepare-se para evoluir. O infinito é o limite!',
                imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
                likesCount: 128,
                status: 'published',
                createdAt: new Date().toISOString()
            },
            {
                id: 'mock-2',
                userId: 'admin-1',
                userName: 'Mestre dos Códigos',
                userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Code',
                title: 'Dica do Dia: Persistência',
                content: 'A programação não é sobre o que você sabe, é sobre o que você pode descobrir. Mantenha-se curioso e nunca pare de aprender.',
                imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop',
                likesCount: 84,
                status: 'published',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'mock-3',
                userId: 'admin-1',
                userName: 'Suporte',
                userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support',
                title: 'Novidades na Área',
                content: 'Acabamos de liberar um novo módulo no curso de Fullstack. Confiram lá e deixem seu feedback!',
                likesCount: 56,
                status: 'published',
                createdAt: new Date(Date.now() - 172800000).toISOString()
            }
        ];
    }

    return db;
}

// Legacy getDB - returns cached data or empty
let cachedDB: DB | null = null;

export const getDB = (): DB => {
    if (cachedDB) return cachedDB;

    return {
        users: [],
        categories: [],
        courses: [],
        modules: [],
        lessons: [],
        progress: [],
        posts: [],
        postLikes: [],
        comments: [],
        offers: [],
        settings: {
            allowComments: true
        }
    };
};

export const setDB = (db: DB) => {
    cachedDB = db;
};

export const saveDB = async (db: DB) => {
    cachedDB = db;
    // Data is persisted per operation, saveDB is just a cache update for backward compatibility
};

// ============ CRUD OPERATIONS ============

// Categories
export async function deleteCategory(id: string) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
}

// Courses
export async function deleteCourse(id: string) {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw error;
}

// Modules
export async function deleteModule(id: string) {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) throw error;
}

// Lessons
export async function deleteLesson(id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw error;
}

// Offers
export async function saveOffer(offer: Partial<Offer> & { id?: string }) {
    const payload = {
        title: offer.title,
        short_description: offer.shortDescription,
        url_destino: offer.urlDestino,
        image_url: offer.imageUrl,
        preco_original: offer.precoOriginal,
        preco_promocional: offer.precoPromocional,
        data_inicio: offer.dataInicio,
        data_expiracao: offer.dataExpiracao,
        status: offer.status,
        priority: offer.priority
    };

    if (offer.id && !offer.id.includes('mock')) {
        const { data, error } = await supabase
            .from('offers')
            .update(payload)
            .eq('id', offer.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('offers')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

export async function deleteOffer(id: string) {
    if (id.includes('mock')) return;
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) throw error;
}

// User Progress
export async function updateProgress(lessonId: string, completed: boolean, watchedSeconds?: number) {
    const user = getLoggedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed,
            watched_seconds: watchedSeconds || 0,
            last_watched_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function toggleLessonComplete(lessonId: string) {
    const user = getLoggedUser();
    if (!user) throw new Error('Not authenticated');

    // Check current status
    const { data: existing } = await supabase
        .from('user_progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .single();

    const newCompleted = !(existing?.completed ?? false);
    await updateProgress(lessonId, newCompleted);

    // Update local cache if available
    if (cachedDB) {
        const idx = cachedDB.progress.findIndex(p => p.userId === user.id && p.lessonId === lessonId);
        if (idx >= 0) {
            cachedDB.progress[idx].completed = newCompleted;
        } else {
            cachedDB.progress.push({
                userId: user.id,
                lessonId,
                completed: newCompleted,
                watchedSeconds: 0
            });
        }
    }
}

// ============ REAL-TIME SUBSCRIPTIONS ============

export function subscribeToChanges(
    table: 'categories' | 'courses' | 'modules' | 'lessons' | 'user_progress' | 'course_sidebar_offers' | 'offers',
    callback: (payload: any) => void
) {
    const channel = supabase
        .channel(`public:${table}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            callback
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// ============ INITIALIZE ============

export async function initializeStore(): Promise<DB> {
    const db = await fetchAllData();
    setDB(db);
    return db;
}

// ============ POSTS CRUD ============

export async function createPost(post: Omit<Post, 'id' | 'userId' | 'createdAt' | 'likesCount' | 'userAvatar' | 'userName'>) {
    const user = getLoggedUser();
    if (!user) throw new Error('User not found');

    const { data, error } = await supabase
        .from('posts')
        .insert({
            user_id: user.id,
            title: post.title,
            content: post.content,
            image_url: post.imageUrl,
            status: post.status,
            allow_comments: post.allowComments ?? true
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updatePost(id: string, updates: Partial<Post>) {
    const { error } = await supabase
        .from('posts')
        .update({
            title: updates.title,
            content: updates.content,
            image_url: updates.imageUrl,
            status: updates.status,
            allow_comments: updates.allowComments
        })
        .eq('id', id);

    if (error) throw error;
}

export async function deletePost(id: string) {
    const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
