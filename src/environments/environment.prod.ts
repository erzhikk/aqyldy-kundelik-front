/**
 * Production environment configuration
 */
export const environment = {
  production: true,

  // API base URL
  apiUrl: '/api',

  // ImgProxy configuration
  imgproxy: {
    url: 'https://imgproxy.yourdomain.com', // TODO: Replace with actual production URL
    // ⚠️ IMPORTANT: Replace with production keys from secure configuration
    key: process.env['IMGPROXY_KEY'] || '',
    salt: process.env['IMGPROXY_SALT'] || ''
  },

  // MinIO configuration
  minio: {
    url: 'https://minio.yourdomain.com', // TODO: Replace with actual production URL
    bucket: 'aq-media'
  },

  // File upload limits
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    minDimension: 256,
    maxDimension: 4000
  }
};
