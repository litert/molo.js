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
import { IRoleDAO } from '../DAO/RoleDAO';

export interface IUserDAO {

    getUserList(): string[];
}

export interface IUserManager {

    getRoleById(id: number): string;

    getUserList(): string[];
}

class UserManager {

    @Molo.Inject('UserDAO')
    private _dao!: IUserDAO;

    public constructor(
        @Molo.Inject('~IRoleDAO')
        private _roleDAO: IRoleDAO,
    ) {}

    @Molo.Initializer()
    public loadData(): void {

        console.log('UserManager: Loading data...');
    }

    public getUserList(): string[] {

        return this._dao.getUserList();
    }

    public getRoleById(id: number): string {

        return this._roleDAO.getRoleById(id);
    }

    @Molo.Uninitializer()
    public async uninit(): Promise<void> {

        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log('UserManager: bye bye');
    }
}

Molo.use(UserManager);
