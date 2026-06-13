const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

let isCloudinaryConfigured = false;

if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  isCloudinaryConfigured = true;
  console.log('✅ Cloudinary storage configured.');
} else {
  console.log('ℹ️ Cloudinary credentials not configured. Falling back to local storage uploads.');
}

const uploadFile = async (filePath, folder = 'medihist') => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto'
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
        source: 'cloudinary'
      };
    } catch (error) {
      console.error('❌ Cloudinary upload failed, checking local fallback:', error.message);
    }
  }

  // Local storage fallback implementation
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `${Date.now()}-${path.basename(filePath)}`;
  const destinationPath = path.join(uploadsDir, fileName);
  fs.copyFileSync(filePath, destinationPath);

  // Return a relative path served by our backend static server
  return {
    url: `/uploads/${fileName}`,
    publicId: fileName,
    source: 'local'
  };
};

const deleteFile = async (publicId, source = 'cloudinary') => {
  if (source === 'cloudinary' && isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('❌ Cloudinary deletion failed:', error.message);
      return false;
    }
  }

  // Local deletion
  try {
    const filePath = path.join(__dirname, '../../public/uploads', publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error('❌ Local file deletion failed:', error.message);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadFile,
  deleteFile,
  isConfigured: () => isCloudinaryConfigured
};
