import Molo from '../../lib';
import { IDBConn } from './DBConn';
import { ILogger } from './Logger';

@Molo.Type(['~IDBConn'])
class PgSQLConn implements IDBConn {

    @Molo.Inject('~logger', { binds: { '@subject': 'pgsql', '@levels': ['error', 'info', 'warn'] } })
    private _logs!: ILogger;

    public query(sql: string): any[] {

        this._logs.info(`query ${sql}`);
        return [];
    }

    @Molo.Initializer()
    public async connect(): Promise<void> {

        while (1) {

            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (Math.random() > 0.5) {

                this._logs.info('connected to pgsql.');
                break;
            }

            this._logs.error('failed to connect to pgsql, retrying...');
        }
    }

    @Molo.Uninitializer()
    public close(): void {

        this._logs.warn('closing connection...');
    }
}

Molo.use(PgSQLConn);
