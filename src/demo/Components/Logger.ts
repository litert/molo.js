import Molo from '../../lib';

export type ILogger<T extends string = 'info' | 'error' | 'warn'> = {

    [K in T]: (text: string) => void;
};

class LoggerFactory {

    @Molo.Provide('~logger')
    public create<T extends string>(
        /* eslint-disable @typescript-eslint/indent */
        @Molo.Inject('@subject') subject: string,
        @Molo.Inject('?@levels') levels: T[] = ['info', 'error', 'warn'] as any
        /* eslint-enable @typescript-eslint/indent */
    ): ILogger<T> {

        const ret = {} as ILogger<T>;

        for (const lv of levels) {

            ret[lv] = (text) => console.log(`[${new Date().toISOString()}][${subject.padEnd(10)}][${lv}] ${text}`);
        }

        return ret;
    }
}

Molo.use(LoggerFactory);
