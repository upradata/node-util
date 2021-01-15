import { yellow } from '../template-style';

export const warn = (msg: string) => console.warn(yellow`>> ${msg}`);
