
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { getDB, saveDB, getLoggedUser } from '../supabaseStore';
import { Post, PostLike } from '../types';

const StudentFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<PostLike[]>([]);
  const [currentUser, setCurrentUser] = useState(getLoggedUser());
  const [showHeartAnim, setShowHeartAnim] = useState<string | null>(null);


  useEffect(() => {
    const db = getDB();
    const publishedPosts = db.posts.filter(p => p.status === 'published').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPosts(publishedPosts);
    setUserLikes(db.postLikes.filter(l => l.userId === currentUser?.id));
  }, [currentUser]);

  const handleLike = (postId: string) => {
    if (!currentUser) return;

    const db = getDB();
    const likeIdx = db.postLikes.findIndex(l => l.postId === postId && l.userId === currentUser.id);
    const postIdx = db.posts.findIndex(p => p.id === postId);

    if (postIdx === -1) return;

    if (likeIdx >= 0) {
      // Unlike
      db.postLikes.splice(likeIdx, 1);
      db.posts[postIdx].likesCount = Math.max(0, db.posts[postIdx].likesCount - 1);
    } else {
      // Like
      db.postLikes.push({ userId: currentUser.id, postId });
      db.posts[postIdx].likesCount += 1;

      // Trigger animation
      setShowHeartAnim(postId);
      setTimeout(() => setShowHeartAnim(null), 800);
    }

    saveDB(db);
    setPosts(db.posts.filter(p => p.status === 'published').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setUserLikes(db.postLikes.filter(l => l.userId === currentUser.id));
  };

  const isLiked = (postId: string) => userLikes.some(l => l.postId === postId);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12 animate-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center gap-4 px-1">
        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]">
          <Zap className="text-indigo-400 fill-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Timeline Infinita</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Sua dose diária de inspiração</p>
        </div>
      </div>

      <div className="space-y-12">
        {posts.map((post, idx) => {
          const liked = isLiked(post.id);
          return (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="bg-[#0f0f13] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden group"
            >
              {/* Post Header */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white/5" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-500 border-4 border-[#0f0f13] rounded-full" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{post.userName}</h4>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Postado em {new Date(post.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <button className="text-slate-600 hover:text-white p-2 rounded-xl transition-all">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Image with Interaction */}
              <div
                className="relative bg-black/40 overflow-hidden cursor-pointer aspect-square"
                onDoubleClick={() => handleLike(post.id)}
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt="Post content"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-500/5">
                    <Zap className="text-indigo-500/20" size={80} strokeWidth={1} />
                  </div>
                )}

                {/* Heart Animation Overlay */}
                <AnimatePresence>
                  {showHeartAnim === post.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <Heart fill="#ff6b6b" className="text-[#ff6b6b] drop-shadow-[0_0_20px_rgba(255,107,107,0.8)]" size={100} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Post Content */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-all active:scale-90 ${liked ? 'text-[#ff6b6b]' : 'text-slate-500 hover:text-white'}`}
                  >
                    <Heart size={26} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2} className={liked ? 'drop-shadow-[0_0_10px_rgba(255,107,107,0.5)]' : ''} />
                  </button>
                  {post.allowComments && (
                    <button className="text-slate-500 hover:text-indigo-400 transition-colors">
                      <MessageCircle size={26} />
                    </button>
                  )}
                  <button className="text-slate-500 hover:text-emerald-400 transition-colors">
                    <Share2 size={26} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-black text-white">
                    {post.likesCount} curtidas
                  </p>

                  <div className="space-y-1.5">
                    {post.title && <h3 className="font-extrabold text-lg text-white tracking-tight">{post.title}</h3>}
                    <p className="text-slate-400 text-sm leading-relaxed">
                      <span className="font-bold text-indigo-400 mr-2">{post.userName}</span>
                      {post.content}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest pt-2">
                  Há poucos minutos
                </p>
              </div>
            </motion.article>
          );
        })}

        {posts.length === 0 && (
          <div className="text-center py-24 bg-[#0f0f13] rounded-[3rem] border-2 border-dashed border-white/5">
            <Zap className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">O feed está aguardando as primeiras atualizações.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeed;
