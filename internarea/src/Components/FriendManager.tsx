import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, UserX, UserMinus } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const FriendManager = ({ currentUser }: { currentUser: any }) => {
  const [activeTab, setActiveTab] = useState('discover');
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 'discover') fetchDiscover();
      if (activeTab === 'requests') fetchRequests();
      if (activeTab === 'friends') fetchFriends();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser]);

  const fetchDiscover = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/friends/discover/${currentUser._id}`);
      setDiscoverUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/friends/requests/${currentUser._id}`);
      setPendingRequests(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/user/${currentUser._id}`);
      setFriends(res.data.friends || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (receiverId: string) => {
    try {
      await api.post('/api/friends/request', { senderId: currentUser._id, receiverId });
      toast.success("Friend request sent");
      setDiscoverUsers(discoverUsers.filter(u => u._id !== receiverId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send request");
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await api.post('/api/friends/accept', { requestId });
      toast.success("Request accepted");
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await api.post('/api/friends/reject', { requestId });
      toast.info("Request rejected");
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const removeFriend = async (targetId: string) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await api.delete('/api/friends/remove', { data: { userId: currentUser._id, targetId } });
      toast.success("Friend removed");
      setFriends(friends.filter(f => f._id !== targetId));
    } catch (error) {
      toast.error("Failed to remove friend");
    }
  };

  if (!currentUser) {
    return <div className="p-4 bg-white rounded-xl shadow-sm text-center text-gray-500">Please login to manage friends.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('discover')} 
          className={`flex-1 p-3 text-sm font-medium text-center ${activeTab === 'discover' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Discover
        </button>
        <button 
          onClick={() => setActiveTab('requests')} 
          className={`flex-1 p-3 text-sm font-medium text-center ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Requests
        </button>
        <button 
          onClick={() => setActiveTab('friends')} 
          className={`flex-1 p-3 text-sm font-medium text-center ${activeTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Friends
        </button>
      </div>
      
      <div className="p-4 h-96 overflow-y-auto">
        {loading && <div className="flex justify-center py-4"><span className="animate-spin text-blue-600">⌛</span></div>}
        
        {!loading && activeTab === 'discover' && (
          <div className="space-y-4">
            {discoverUsers.length === 0 ? <p className="text-gray-500 text-center">No new users to discover</p> : 
              discoverUsers.map((u: any) => (
                <div key={u._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={u.photo || '/default-avatar.png'} alt="user" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">{u.name}</p>
                    </div>
                  </div>
                  <button onClick={() => sendRequest(u._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Add Friend">
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              ))
            }
          </div>
        )}

        {!loading && activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? <p className="text-gray-500 text-center">No pending requests</p> : 
              pendingRequests.map((r: any) => (
                <div key={r._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={r.sender.photo || '/default-avatar.png'} alt="user" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">{r.sender.name}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => acceptRequest(r._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full" title="Accept">
                      <UserCheck className="w-5 h-5" />
                    </button>
                    <button onClick={() => rejectRequest(r._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Reject">
                      <UserX className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {!loading && activeTab === 'friends' && (
          <div className="space-y-4">
            {friends.length === 0 ? <p className="text-gray-500 text-center">You have no friends yet</p> : 
              friends.map((f: any) => (
                <div key={f._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img src={f.photo || '/default-avatar.png'} alt="user" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">{f.name}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFriend(f._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Remove Friend">
                    <UserMinus className="w-5 h-5" />
                  </button>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendManager;
