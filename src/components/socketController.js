import { io } from 'socket.io-client';

const URL = 'http://localhost:2024';

export const socket = io(URL, {
  withCredentials: true,
});
