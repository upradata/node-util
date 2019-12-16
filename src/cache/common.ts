import { yellow } from '../style';

export const warn = (msg: string) => console.warn(yellow`>> ${msg}`);
