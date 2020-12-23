export interface IDBConn {

    query<T>(sql: string): T[];
}
