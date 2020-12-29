import Molo from '../../lib';
import { IDBConn } from './DBConn';
import { ILogger } from './Logger';

@Molo.Type(['~IDBConn'])
class MySQLConn implements IDBConn {

    @Molo.Inject('~logger', { binds: { '@subject': 'pgsql' } })
    private _logs!: ILogger;

    public constructor(
        @Molo.Inject('@dbconfig') protected _config: any
    ) {

    }

    @Molo.Initializer()
    public async connect(): Promise<void> {

        while (1) {

            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (Math.random() > 0.5) {

                this._logs.info('connected to mysql.');
                break;
            }

            this._logs.error('failed to connect to mysql, retrying...');
        }
    }

    public query(sql: string): any[] {

        this._logs.info(`query ${sql}`);
        return [];
    }

    @Molo.Uninitializer()
    public close(): void {

        this._logs.warn('closing connection...');
    }
}

Molo.use(MySQLConn);
