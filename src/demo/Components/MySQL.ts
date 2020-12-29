import Molo from '../../lib';
import { IDBConn } from './DBConn';
import { ILogger } from './Logger';

@Molo.Type(['~IDBConn'])
class MySQLConn implements IDBConn {

    @Molo.Inject('~logger', { binds: { '@subject': 'mysql', '@levels': ['error', 'info'] } })
    private _logger!: ILogger<'info' | 'error'>;

    public constructor(
        @Molo.Inject('@dbconfig') protected _config: any
    ) {

    }

    @Molo.Initializer()
    public async connect(): Promise<void> {

        while (1) {

            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (Math.random() > 0.5) {

                this._logger.info('connected to mysql.');
                break;
            }

            this._logger.error('failed to connect to mysql, retrying...');
        }
    }

    public query(sql: string): any[] {

        this._logger.info(`query ${sql}`);
        return [];
    }

    @Molo.Uninitializer()
    public close(): void {

        this._logger.info('closing connection...');
    }
}

Molo.use(MySQLConn);
