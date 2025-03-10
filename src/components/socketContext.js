import { createContext } from 'react';
import { socket } from './socketController';

export const SocketContext = createContext(socket);
