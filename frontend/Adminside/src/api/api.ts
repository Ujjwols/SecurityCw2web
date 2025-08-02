import axios from 'axios';

const API_URL = 'https://localhost:5000/api/v1';

let isInitialized = false;
let csrfTokenPromise = null;
let csrfToken = null;

export async function initializeAPI() {
  if (isInitialized) {
    if (csrfTokenPromise) {
      await csrfTokenPromise;
    }
    return csrfToken;
  }
  if (csrfTokenPromise) {
    await csrfTokenPromise;
    return csrfToken;
  }
  csrfTokenPromise = api.get('/csrf-token')
    .then((response) => {
      csrfToken = response.data.csrfToken;
      isInitialized = true;
      csrfTokenPromise = null;
      return csrfToken;
    })
    .catch((error) => {
      console.error('Failed to initialize CSRF token:', error);
      isInitialized = false;
      csrfTokenPromise = null;
      throw error;
    });
  await csrfTokenPromise;
  return csrfToken;
}

const getCSRFToken = () => {
  return csrfToken;
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  console.log('Axios config.data:', config.data);
  console.log('Type of config.data.email:', config.data?.email ? typeof config.data.email : 'undefined');
  const method = config.method?.toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const token = getCSRFToken();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
      if (config.data instanceof FormData) {
        config.data.append('_csrf', token);
        delete config.headers['Content-Type'];
      } else if (config.data && typeof config.data === 'object') {
        config.data = { ...config.data, _csrf: token };
      }
    } else {
      console.warn('No CSRF token found');
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/user/refresh-token');
        if (data.success && data.data.accessToken) {
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;