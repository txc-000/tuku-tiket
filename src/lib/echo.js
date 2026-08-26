import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

// routes/channels.php registers /broadcasting/auth at the API root, not under
// /api — VITE_API_URL is "http://host/api", so strip the suffix back off.
const apiRoot = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '');

const broadcastingAuth = axios.create({ baseURL: apiRoot });
broadcastingAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
  wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
  // Private channels (admin.dashboard) are authorized with our bearer token,
  // not a session cookie — Echo's default authorizer only knows cookies, so
  // this routes the handshake through our own axios instance instead.
  authorizer: (channel) => ({
    authorize: (socketId, callback) => {
      broadcastingAuth
        .post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
        .then((response) => callback(false, response.data))
        .catch((error) => callback(true, error));
    },
  }),
});

export default echo;
