import Molo from '../../lib';
import { IDBConn } from './DBConn';

@Molo.Type(['~IDBConn'])
class MySQLConn implements IDBConn {

    public constructor(
        @Molo.Inject('@dbconfig') protected _config: any
    ) {

    }

    public query(sql: string): any[] {

        console.log(`MySQL: Query ${sql}`);
        return [];
    }

    @Molo.Uninitializer()
    public close(): void {

        console.info('MySQL: Closing connection...');
    }
}

Molo.use(MySQLConn);
