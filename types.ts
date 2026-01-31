
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  role: UserRole;
  bio?: string;
  loginCount?: number;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Course {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  coverUrl: string;
  coverPosition: 'top' | 'center' | 'bottom';
  isFeatured: boolean;
  createdBy: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  coverUrl?: string;
  coverPosition?: 'top' | 'center' | 'bottom';
  orderNumber: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  videoType: 'youtube' | 'drive' | 'upload';
  supportMaterialUrl?: string;
  supportMaterialName?: string;
  durationSeconds: number;
  orderNumber: number;
}

export interface Progress {
  userId: string;
  lessonId: string;
  completed: boolean;
  watchedSeconds: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title?: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  allowComments?: boolean;
  status: 'published' | 'draft';
  createdAt: string;
}

export interface PostLike {
  userId: string;
  postId: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  shortDescription: string;
  urlDestino: string;
  imageUrl: string;
  precoOriginal: number;
  precoPromocional: number;
  dataInicio: string;
  dataExpiracao: string;
  status: 'active' | 'inactive';
  priority: number;
}

export interface SidebarOffer {
  id: string;
  key: string;
  title: string;
  description: string;
  button_text: string;
  button_url: string;
  badge_text: string | null;
  price_original: number;
  price_promocional: number;
  is_active: boolean;
}
