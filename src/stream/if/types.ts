import stream from 'stream';
import { Function0, TT$, ensureArray, TT } from '@upradata/util';
import { Stream } from '../types';
import { ConcatOptionsType } from '../concat/stream.concat.options';

export type ConditionSync<Data> = boolean | ((data: Data, callback?: (err: Error, condition: boolean) => void) => void | boolean);

export type Condition<Data> = TT$<boolean | ((data: Data, callback?: (err: Error, condition: boolean) => void) => void | TT$<boolean>)>;

export type ConditionActionSync = Stream | Function0<Stream>;
export type ConditionAction = TT$<Stream | Function0<TT$<Stream>>>;

export type ConditionActionsSync = TT<ConditionActionSync>;
export type ConditionActions<ConcatMode extends Mode> = ConcatMode extends 'concat' ? ConcatOptionsType : TT<ConditionAction>;

export type Mode = 'pipe' | 'concat';
export type SyncMode = 'sync' | 'async';


export class IfOptions<Data, ConcatMode extends Mode> {
    condition: Condition<Data>;
    true: ConditionActions<ConcatMode>;
    false?: ConditionActions<ConcatMode>;
    stream?: stream.DuplexOptions = {};
    mode?: Mode = 'pipe';
    sync?: SyncMode = 'sync';

    constructor(options?: IfOptions<Data, ConcatMode>) {
        Object.assign(this, options);

        if (!this.true)
            throw new Error('ternary: true action is required');
    }
}


export const getActionStreamsAsync = async (conditionActions: ConditionActions<'pipe'>): Promise<Stream[]> => {
    if (!conditionActions)
        return [];

    const actions = ensureArray(await conditionActions);

    return Promise.all(getActionStreamsSync((await Promise.all(actions)) as any));
};


export const getActionStreamsSync = (conditionActions: ConditionActionsSync): Stream[] => {
    if (!conditionActions)
        return [];

    const actions = ensureArray(conditionActions) as ConditionActionSync[];

    return actions.map(action => typeof action === 'function' && action.length === 0 ? action() : action as any);
};
