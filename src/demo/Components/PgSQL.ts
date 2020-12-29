import Molo from '../../lib';
import { IDBConn } from './DBConn';
import { ILogger } from './Logger';

@Molo.Type(['~IDBConn'])
class PgSQLConn implements IDBConn {

    @Molo.Inject('~logger', { binds: { '@subject': 'pgsql', '@levels': ['error', 'info'] } })
    private _logger!: ILogger<'info' | 'error'>;

    public query(sql: string): any[] {

        console.log(`query ${sql}`);
        return [];
    }

    @Molo.Initializer()
    public async connect(): Promise<void> {

        while (1) {

            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (Math.random() > 0.5) {

                this._logger.info('connected to pgsql.');
                break;
            }

            this._logger.error('failed to connect to pgsql, retrying...');
        }
    }

    @Molo.Uninitializer()
    public close(): void {

        console.info('closing connection...');
    }
}

Molo.use(PgSQLConn);
