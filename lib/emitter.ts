import { EventEmitter } from 'events';

const globalForEventEmitter = global as unknown as { emitter: EventEmitter };

export const emitter = globalForEventEmitter.emitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') globalForEventEmitter.emitter = emitter;
