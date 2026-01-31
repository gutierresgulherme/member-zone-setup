export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            categories: {
                Row: {
                    created_at: string | null
                    display_order: number | null
                    id: string
                    is_active: boolean | null
                    name: string
                }
                Insert: {
                    created_at?: string | null
                    display_order?: number | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                }
                Update: {
                    created_at?: string | null
                    display_order?: number | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                }
                Relationships: []
            }
            comments: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    likes: number | null
                    post_id: string | null
                    user_id: string | null
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    likes?: number | null
                    post_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    likes?: number | null
                    post_id?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            courses: {
                Row: {
                    category_id: string | null
                    cover_position: string | null
                    cover_url: string | null
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    id: string
                    is_featured: boolean | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    category_id?: string | null
                    cover_position?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    category_id?: string | null
                    cover_position?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            course_sidebar_offers: {
                Row: {
                    badge_text: string | null
                    button_text: string
                    button_url: string
                    created_at: string | null
                    description: string | null
                    id: string
                    is_active: boolean | null
                    key: string
                    price_original: number | null
                    price_promocional: number | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    badge_text?: string | null
                    button_text: string
                    button_url: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    key: string
                    price_original?: number | null
                    price_promocional?: number | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    badge_text?: string | null
                    button_text?: string
                    button_url?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    is_active?: boolean | null
                    key?: string
                    price_original?: number | null
                    price_promocional?: number | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            lessons: {
                Row: {
                    content: string | null
                    created_at: string | null
                    description: string | null
                    duration_seconds: number | null
                    id: string
                    module_id: string | null
                    order_number: number | null
                    support_material_name: string | null
                    support_material_url: string | null
                    title: string
                    video_type: string | null
                    video_url: string | null
                }
                Insert: {
                    content?: string | null
                    created_at?: string | null
                    description?: string | null
                    duration_seconds?: number | null
                    id?: string
                    module_id?: string | null
                    order_number?: number | null
                    support_material_name?: string | null
                    support_material_url?: string | null
                    title: string
                    video_type?: string | null
                    video_url?: string | null
                }
                Update: {
                    content?: string | null
                    created_at?: string | null
                    description?: string | null
                    duration_seconds?: number | null
                    id?: string
                    module_id?: string | null
                    order_number?: number | null
                    support_material_name?: string | null
                    support_material_url?: string | null
                    title?: string
                    video_type?: string | null
                    video_url?: string | null
                }
                Relationships: []
            }
            modules: {
                Row: {
                    course_id: string | null
                    cover_position: string | null
                    cover_url: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    order_number: number | null
                    title: string
                }
                Insert: {
                    course_id?: string | null
                    cover_position?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    order_number?: number | null
                    title: string
                }
                Update: {
                    course_id?: string | null
                    cover_position?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    order_number?: number | null
                    title?: string
                }
                Relationships: []
            }
            offers: {
                Row: {
                    created_at: string | null
                    data_expiracao: string | null
                    data_inicio: string | null
                    id: string
                    image_url: string | null
                    preco_original: number | null
                    preco_promocional: number | null
                    priority: number | null
                    short_description: string | null
                    status: string | null
                    title: string
                    url_destino: string | null
                }
                Insert: {
                    created_at?: string | null
                    data_expiracao?: string | null
                    data_inicio?: string | null
                    id?: string
                    image_url?: string | null
                    preco_original?: number | null
                    preco_promocional?: number | null
                    priority?: number | null
                    short_description?: string | null
                    status?: string | null
                    title: string
                    url_destino?: string | null
                }
                Update: {
                    created_at?: string | null
                    data_expiracao?: string | null
                    data_inicio?: string | null
                    id?: string
                    image_url?: string | null
                    preco_original?: number | null
                    preco_promocional?: number | null
                    priority?: number | null
                    short_description?: string | null
                    status?: string | null
                    title?: string
                    url_destino?: string | null
                }
                Relationships: []
            }
            post_likes: {
                Row: {
                    created_at: string | null
                    post_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    post_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    post_id?: string
                    user_id?: string
                }
                Relationships: []
            }
            posts: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    image_url: string | null
                    likes_count: number | null
                    status: string | null
                    title: string | null
                    user_id: string | null
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    likes_count?: number | null
                    status?: string | null
                    title?: string | null
                    user_id?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    likes_count?: number | null
                    status?: string | null
                    title?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar: string | null
                    bio: string | null
                    created_at: string | null
                    email: string
                    id: string
                    name: string
                    role: string | null
                    updated_at: string | null
                    login_count: number | null
                }
                Insert: {
                    avatar?: string | null
                    bio?: string | null
                    created_at?: string | null
                    email: string
                    id: string
                    name: string
                    role?: string | null
                    updated_at?: string | null
                    login_count?: number | null
                }
                Update: {
                    avatar?: string | null
                    bio?: string | null
                    created_at?: string | null
                    email?: string
                    id?: string
                    name?: string
                    role?: string | null
                    updated_at?: string | null
                    login_count?: number | null
                }
                Relationships: []
            }
            user_progress: {
                Row: {
                    completed: boolean | null
                    id: string
                    last_watched_at: string | null
                    lesson_id: string | null
                    user_id: string | null
                    watched_seconds: number | null
                }
                Insert: {
                    completed?: boolean | null
                    id?: string
                    last_watched_at?: string | null
                    lesson_id?: string | null
                    user_id?: string | null
                    watched_seconds?: number | null
                }
                Update: {
                    completed?: boolean | null
                    id?: string
                    last_watched_at?: string | null
                    lesson_id?: string | null
                    user_id?: string | null
                    watched_seconds?: number | null
                }
                Relationships: []
            }
            support_messages: {
                Row: {
                    id: string
                    user_id: string | null
                    content: string
                    is_bot: boolean | null
                    is_admin: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    content: string
                    is_bot?: boolean | null
                    is_admin?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    content?: string
                    is_bot?: boolean | null
                    is_admin?: boolean | null
                    created_at?: string | null
                }
                Relationships: []
            }
            site_settings: {
                Row: {
                    id: string
                    key: string
                    value: Json
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    key: string
                    value: Json
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    key?: string
                    value?: Json
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for easier imports
export type Profile = Tables<'profiles'>
export type Category = Tables<'categories'>
export type Course = Tables<'courses'>
export type Module = Tables<'modules'>
export type Lesson = Tables<'lessons'>
export type UserProgress = Tables<'user_progress'>
export type Post = Tables<'posts'>
export type PostLike = Tables<'post_likes'>
export type Comment = Tables<'comments'>
export type Offer = Tables<'offers'>
