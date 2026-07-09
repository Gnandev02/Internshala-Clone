import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Trash2, Send } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const PostCard = ({ post, currentUser, onPostDelete }: { post: any, currentUser: any, onPostDelete: (id: string) => void }) => {
  const [likes, setLikes] = useState<number>(post.likeCount || 0);
  const [hasLiked, setHasLiked] = useState<boolean>(post.hasLiked || false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(post.commentCount || 0);
  const [shares, setShares] = useState<number>(post.shareCount || 0);
  const [showMenu, setShowMenu] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/publicspace/comment/${post._id}`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showComments]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Please login to like posts");
      return;
    }
    const prevLiked = hasLiked;
    const prevCount = likes;
    
    // Optimistic Update
    setHasLiked(!prevLiked);
    setLikes(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      if (prevLiked) {
        await api.delete('/api/publicspace/unlike', { data: { userId: currentUser._id, postId: post._id } });
      } else {
        await api.post('/api/publicspace/like', { userId: currentUser._id, postId: post._id });
      }
    } catch (error) {
      // Rollback
      setHasLiked(prevLiked);
      setLikes(prevCount);
      toast.error("Failed to update like");
    }
  };

  const handleComment = async (e: any) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please login to comment");
      return;
    }
    if (!commentText.trim()) return;

    const tempId = Date.now().toString();
    const newComment = {
      _id: tempId,
      text: commentText,
      user: { _id: currentUser._id, name: currentUser.name, photo: currentUser.photo },
      createdAt: new Date().toISOString(),
    };

    // Optimistic Update
    setComments([newComment, ...comments]);
    setCommentCount((c) => c + 1);
    setCommentText('');

    try {
      const res = await api.post('/api/publicspace/comment', {
        userId: currentUser._id,
        postId: post._id,
        text: newComment.text
      });
      // Update temp id with real id
      setComments((prev) => prev.map((c) => c._id === tempId ? res.data.comment : c));
    } catch (error) {
      // Rollback
      setComments(comments);
      setCommentCount((c) => c - 1);
      toast.error("Failed to post comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const prevComments = [...comments];
    
    // Optimistic Update
    setComments(comments.filter(c => c._id !== commentId));
    setCommentCount((c) => c - 1);

    try {
      await api.delete(`/api/publicspace/comment/${commentId}`, { data: { userId: currentUser._id } });
    } catch (error) {
      // Rollback
      setComments(prevComments);
      setCommentCount((c) => c + 1);
      toast.error("Failed to delete comment");
    }
  };

  const handleShare = async () => {
    if (!currentUser) {
      toast.error("Please login to share");
      return;
    }
    // Optimistic Update
    setShares(shares + 1);
    try {
      await api.post('/api/publicspace/share', { userId: currentUser._id, postId: post._id });
      toast.success("Post shared successfully");
    } catch (error) {
      setShares(shares - 1);
      toast.error("Failed to share post");
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/api/publicspace/post/${post._id}`, { data: { userId: currentUser._id } });
      toast.success("Post deleted");
      onPostDelete(post._id);
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div className="flex space-x-3 items-center">
          <img src={post.user?.photo || '/default-avatar.png'} alt="User" className="w-12 h-12 rounded-full object-cover" />
          <div>
            <h3 className="font-semibold text-gray-900">{post.user?.name}</h3>
            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        {currentUser && currentUser._id === post.user?._id && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                <button onClick={handleDeletePost} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.caption && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
        </div>
      )}

      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((img: any, i: number) => (
            <img key={i} src={img.secure_url} alt="Post content" className="w-full h-auto max-h-96 object-cover" loading="lazy" />
          ))}
        </div>
      )}

      {post.video && (
        <div className="bg-black w-full">
          <video src={post.video.secure_url} className="w-full max-h-96" controls preload="metadata" />
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center text-gray-500 text-sm">
        <button onClick={handleLike} className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 ${hasLiked ? 'text-blue-600' : ''}`}>
          <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
          <span>{likes > 0 ? likes : ''} Like</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
          <MessageSquare className="w-5 h-5" />
          <span>{commentCount > 0 ? commentCount : ''} Comment</span>
        </button>
        <button onClick={handleShare} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
          <Share2 className="w-5 h-5" />
          <span>{shares > 0 ? shares : ''} Share</span>
        </button>
      </div>

      {showComments && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          {currentUser && (
            <form onSubmit={handleComment} className="flex items-center space-x-2 mb-4">
              <img src={currentUser.photo} className="w-8 h-8 rounded-full object-cover" alt="User" />
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="submit" disabled={!commentText.trim()} className="text-blue-600 disabled:opacity-50 p-2 hover:bg-blue-50 rounded-full">
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c._id} className="flex space-x-2 group">
                <img src={c.user?.photo || '/default-avatar.png'} className="w-8 h-8 rounded-full object-cover" alt="User" />
                <div className="flex-1">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none inline-block shadow-sm border border-gray-100">
                    <p className="font-semibold text-sm text-gray-900">{c.user?.name}</p>
                    <p className="text-gray-700 text-sm">{c.text}</p>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 ml-2 text-xs text-gray-500">
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    {currentUser && currentUser._id === c.user?._id && (
                      <button onClick={() => handleDeleteComment(c._id)} className="hover:text-red-600 hidden group-hover:block">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
