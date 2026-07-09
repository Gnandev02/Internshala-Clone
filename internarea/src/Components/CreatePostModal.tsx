import React, { useState } from 'react';
import { X, Image as ImageIcon, Video, Upload, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const CreatePostModal = ({ isOpen, onClose, user, onPostCreated }: { isOpen: boolean, onClose: () => void, user: any, onPostCreated: (post: any) => void }) => {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: any) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      if (files.length + images.length > 10) {
        toast.error('Maximum 10 images allowed');
        return;
      }
      setImages((prev) => [...prev, ...files]);
      setVideo(null); // Clear video if images selected
    }
  };

  const handleVideoChange = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
      setImages([]); // Clear images if video selected
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!caption.trim() && images.length === 0 && !video) {
      toast.error('Please add some content to post');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('userId', user._id);
    formData.append('caption', caption);

    images.forEach((img) => {
      formData.append('images', img);
    });

    if (video) {
      formData.append('video', video);
    }

    try {
      const res = await api.post('/api/publicspace/post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
      toast.success('Post created successfully!');
      onPostCreated(res.data.post);
      handleClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setCaption('');
    setImages([]);
    setVideo(null);
    setUploadProgress(0);
    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button onClick={handleClose} disabled={isUploading} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <img src={user?.photo || '/default-avatar.png'} alt="User" className="w-10 h-10 rounded-full" />
            <span className="font-semibold">{user?.name}</span>
          </div>

          <textarea
            className="w-full min-h-[100px] p-2 resize-none focus:outline-none text-lg"
            placeholder="What do you want to talk about?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isUploading}
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={URL.createObjectURL(img)} className="w-full h-full object-cover rounded" alt="Preview" />
                  <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1" disabled={isUploading}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {video && (
            <div className="relative mb-4">
              <video src={URL.createObjectURL(video)} className="w-full max-h-64 rounded bg-black" controls />
              <button onClick={() => setVideo(null)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1" disabled={isUploading}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1 text-gray-600">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex space-x-2">
            <label className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 ${video ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <ImageIcon className="w-6 h-6 text-green-600" />
              <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" multiple className="hidden" onChange={handleImageChange} disabled={!!video || isUploading} />
            </label>
            <label className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 ${images.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Video className="w-6 h-6 text-blue-600" />
              <input type="file" accept="video/mp4,video/mov,video/webm" className="hidden" onChange={handleVideoChange} disabled={images.length > 0 || isUploading} />
            </label>
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={isUploading || (!caption.trim() && images.length===0 && !video)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting</> : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
