import React, { useState, useEffect, useRef, useCallback } from 'react';
import PostCard from '../../Components/PostCard';
import CreatePostModal from '../../Components/CreatePostModal';
import FriendManager from '../../Components/FriendManager';
import api from '../../utils/api';
import { useSelector } from 'react-redux';
import { selectuser } from '@/Feature/Userslice';
import { Loader2 } from 'lucide-react';
import Head from 'next/head';

export default function PublicSpace() {
  const user = useSelector(selectuser);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchUserStats = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/api/publicspace/stats/${user._id}`);
      setUserStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const lastPostElementRef = useCallback(
    (node: any) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/publicspace/feed?page=${page}&limit=10${user ? `&userId=${user._id}` : ''}`);
      if (res.data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => {
          // avoid duplicates
          const newPosts = res.data.filter((p: any) => !prev.some(existing => existing._id === p._id));
          return [...prev, ...newPosts];
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user?._id]); // Refetch if user logs in to get hasLiked status

  useEffect(() => {
    if (user?._id) {
      fetchUserStats();
    }
  }, [user?._id]);

  const handlePostCreated = (newPost: any) => {
    setPosts([newPost, ...posts]);
    fetchUserStats();
  };

  const handlePostDelete = (postId: string) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Head>
        <title>Public Space | Internshala</title>
      </Head>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Friend Manager */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24">
              <FriendManager currentUser={user} />
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* User Posting Limit & Quota Status Card */}
            {user && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span>Community Posting Status</span>
                    </h3>
                    <p className="text-xs text-blue-100 mt-1">
                      {userStats ? (
                        userStats.friendCount === 0 ? (
                          "⚠️ You have 0 friends. Add friends to unlock daily posting!"
                        ) : userStats.friendCount > 10 ? (
                          `🎉 You have ${userStats.friendCount} friends — Unlimited posts per day!`
                        ) : (
                          `👥 ${userStats.friendCount} friend(s) → Daily Limit: ${userStats.dailyLimit} post(s)/day (${userStats.todayPostCount} posted today)`
                        )
                      ) : (
                        "Loading quota stats..."
                      )}
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold">
                    {userStats?.friendCount === 0 
                      ? "0 Posts Allowed" 
                      : userStats?.friendCount > 10 
                      ? "Unlimited" 
                      : `${userStats?.remainingPosts ?? 0} Remaining`}
                  </div>
                </div>
              </div>
            )}

            {/* Create Post Input */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex space-x-4 items-center">
                <img src={user?.photo || '/default-avatar.png'} className="w-12 h-12 rounded-full object-cover" alt="User" />
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-left px-4 py-3 rounded-full text-gray-500 font-medium transition"
                >
                  Start a post
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post, index) => {
                if (posts.length === index + 1) {
                  return <div ref={lastPostElementRef} key={post._id}><PostCard post={post} currentUser={user} onPostDelete={handlePostDelete} /></div>;
                } else {
                  return <PostCard key={post._id} post={post} currentUser={user} onPostDelete={handlePostDelete} />;
                }
              })}

              {loading && (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white p-4 rounded-xl border animate-pulse">
                      <div className="flex space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      </div>
                      <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              )}

              {!hasMore && posts.length > 0 && (
                <div className="text-center py-6 text-gray-500">
                  You&apos;ve reached the end of the feed.
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Community Rules & Limits */}
          <div className="lg:col-span-1 hidden lg:block space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>📜 Posting Limits & Rules</span>
                </h3>
                <ul className="text-xs text-gray-600 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-500">0 Friends:</span>
                    <span>No posts allowed. Add friends to start posting!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">1 Friend:</span>
                    <span>1 post per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-600">2 Friends:</span>
                    <span>2 posts per day</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">&gt; 10 Friends:</span>
                    <span>Unlimited daily posts!</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-bold text-gray-900 mb-3">Trending Topics</h3>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer mb-2">#SoftwareEngineering</p>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer mb-2">#Internships2026</p>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer mb-2">#ReactJS</p>
                <p className="text-sm text-blue-600 hover:underline cursor-pointer">#CareerGrowth</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Friend Manager (shown below feed on mobile) */}
      <div className="lg:hidden px-4 mt-8">
        <h3 className="font-bold text-gray-900 mb-4">Connections</h3>
        <FriendManager currentUser={user} />
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        user={user} 
        onPostCreated={handlePostCreated} 
      />
    </div>
  );
}
