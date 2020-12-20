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

import Molo from '../lib';

export interface IRoleDAO {

    getRoleById(id: number): string;
}

class RoleDAO implements IRoleDAO {

    public constructor(private _adminId: number) {}

    public getRoleById(id: number): string {

        return id === this._adminId ? 'admin' : 'guest';
    }
}

@Molo.Singleton()
class RoleDAOFactory {

    @Molo.Provide('~IRoleDAO')
    public createRoleDAO(@Molo.Inject('@admin_id') adminId: number): IRoleDAO {

        return new RoleDAO(adminId);
    }

    @Molo.Initializer()
    protected _init(): void {

        console.log('initialized roles dao factory.');
    }
}

Molo.use(RoleDAOFactory);
