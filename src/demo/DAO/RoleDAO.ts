/**
 * Copyright 2020 Angus.Fenying <fenying@litert.org>
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

import Molo from '../../lib';
import { IDBConn } from '../Components/DBConn';

export interface IRoleDAO {

    getRoleById(id: number): string;
}

@Molo.Type(['~IRoleDAO'])
@Molo.Private()
class RoleDAO implements IRoleDAO {

    public constructor(private _db: IDBConn, private _adminId: number) {}

    public getRoleById(id: number): string {

        this._db.query(`SELECT * FROM roles WHERE id=${id};`);

        return id === this._adminId ? 'admin' : 'guest';
    }

    @Molo.Uninitializer()
    public releaseData(): void {

        console.log('RoleDAO: Uninitializing...');
        return;
    }

    @Molo.Initializer()
    public init(): void {

        console.log('Initializeing RoleDAO...');
        return;
    }
}

@Molo.Singleton()
class RoleDAOFactory {

    @Molo.Provide('~IRoleDAO')
    public createRoleDAO(
    /* eslint-disable @typescript-eslint/indent */
        @Molo.Inject('~IDBConn@main')   db: IDBConn,
        @Molo.Inject('@adminId')       adminId: number
    /* eslint-enable @typescript-eslint/indent */
    ): IRoleDAO {

        return new RoleDAO(db, adminId);
    }

    @Molo.Initializer()
    protected _init(): void {

        console.log('Preparing RoleDAO factory...');
    }
}

Molo.use(RoleDAO, RoleDAOFactory);
