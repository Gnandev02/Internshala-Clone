const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Validate file type
    const validImageFormats = ['jpg', 'jpeg', 'png', 'webp'];
    const validVideoFormats = ['mp4', 'mov', 'webm'];
    
    // Split the mimetype (e.g. image/jpeg -> jpeg)
    const ext = file.mimetype.split('/')[1];
    
    let resource_type = 'image';
    let format = ext;

    if (file.mimetype.startsWith('video/')) {
      resource_type = 'video';
      if (!validVideoFormats.includes(ext)) {
        throw new Error(`Invalid video format: ${ext}`);
      }
    } else if (file.mimetype.startsWith('image/')) {
      if (!validImageFormats.includes(ext)) {
        throw new Error(`Invalid image format: ${ext}`);
      }
    } else {
      throw new Error(`Invalid file type: ${file.mimetype}`);
    }

    return {
      folder: 'internshala-clone/public-space',
      resource_type: resource_type,
      // allowed_formats: validImageFormats.concat(validVideoFormats)
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max size
  }
});

module.exports = {
  cloudinary,
  upload
};
