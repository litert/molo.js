/**
 * Copyright 2021 Angus.Fenying <fenying@litert.org>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Molo, { IContainer } from '../../lib';
import { IDBConn } from '../Components/DBConn';
import { ILogger } from '../Components/Logger';

export interface IRoleDAO {

    getRoleById(id: number): string;
}

@Molo.Type(['~IRoleDAO'])
@Molo.Private()
class RoleDAO implements IRoleDAO {

    public constructor(
        private _db: IDBConn,
        private _adminId: number,
        private _logs: ILogger
    ) {}

    public getRoleById(id: number): string {

        this._db.query(`SELECT * FROM roles WHERE id=${id};`);

        return id === this._adminId ? 'admin' : 'guest';
    }

    @Molo.Uninitializer()
    public releaseData(): void {

        this._logs.warn('Uninitializing...');
        return;
    }

    @Molo.Initializer()
    public init(): void {

        this._logs.info('Initializeing...');
        return;
    }
}

@Molo.Singleton()
class RoleDAOFactory {

    @Molo.Inject('~logger', { 'binds': { '@subject': 'role_dao' } })
    private _logs!: ILogger;

    @Molo.Provide('~IRoleDAO')
    public async createRoleDAO(
    /* eslint-disable @typescript-eslint/indent */
        @Molo.Inject('~IDBConn@main')   db: IDBConn,
        @Molo.Inject('@adminId')        adminId: number,
        @Molo.Inject('@molo.container') container: IContainer
    /* eslint-enable @typescript-eslint/indent */
    ): Promise<IRoleDAO> {

        return new RoleDAO(
            db,
            adminId,
            await container.get<ILogger>('~logger', { 'binds': { '@subject': 'role_dao' } })
        );
    }

    @Molo.Initializer()
    protected _init(): void {

        this._logs.info('Preparing RoleDAO factory...');
    }
}

Molo.use(RoleDAO, RoleDAOFactory);
