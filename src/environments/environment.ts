/**
 * Development environment configuration
 */
export const environment = {
  production: false,

  // API base URL (handled by proxy in development)
  apiUrl: '/api',

  // ImgProxy configuration
  imgproxy: {
    url: 'http://localhost:8081',
    // ⚠️ IMPORTANT: These keys are from docker-compose.media.yml
    // Use different keys in production!
    key: '943b421c9eb07c830af81030552c86009268de4e532ba2ee2eab8247c6da0881',
    salt: '520f986b998545b4785e0defbc4f3c1203f22de2374a3d53cb7a7fe9fea309c5'
  },

  // MinIO configuration
  minio: {
    url: 'http://localhost:9000',
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
