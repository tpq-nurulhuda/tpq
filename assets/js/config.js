/**
 * Konfigurasi Publik Frontend - Portal Digital TPQ Nurul Huda
 * PENTING: Jangan pernah menempatkan kredensial rahasia, password, atau token admin di file ini.
 */
window.TPQ_CONFIG = {
  // Ganti URL ini dengan URL Web App hasil deployment Google Apps Script Anda
  // Contoh: 'https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxxx/exec'
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbyt5QV9Lu-I-WGjuQiIOV8Mewh_--wev2Tj-_kJIJE99cf0cWHUSmmTw5Oq-xjGy2NT/exec',

  // Nama aplikasi & identitas default (akan ditimpa oleh data dari PROFIL_LEMBAGA)
  APP_NAME: 'Portal Digital TPQ Nurul Huda',
  DEFAULT_LOGO: 'assets/images/logo.svg',

  // Durasi cache publik di sessionStorage (dalam milidetik)
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 menit

  // Pagination default
  DEFAULT_PAGE_SIZE: 15,

  // Timeout request API (ms)
  REQUEST_TIMEOUT_MS: 25000
};
