import { BASE_SERVER } from '../constants/envConstants';
import io from 'socket.io-client';

export const socket = io(BASE_SERVER);
