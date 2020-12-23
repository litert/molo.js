import Molo from '../../lib';
import { IDBConn } from './DBConn';

@Molo.Type(['~IDBConn'])
class PgSQLConn implements IDBConn {

    public query(sql: string): any[] {

        console.log(`PgSQL: Query ${sql}`);
        return [];
    }

    @Molo.Uninitializer()
    public close(): void {

        console.info('PgSQL: Closing connection...');
    }
}

Molo.use(PgSQLConn);
