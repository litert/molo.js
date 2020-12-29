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

import * as $Molo from '../lib';
import { IUserManager } from './Services/UserManager';

(async () => {

    try {

        $Molo.createDefaultModuleScanner().scan([
            `${__dirname}/Components`,
            `${__dirname}/DAO`,
            `${__dirname}/Services`,
        ]);

        const container = $Molo.createContainer();

        if (Math.random() > 0.5) {

            console.log('Using PgSQL.');
            container.getScope().bind('~IDBConn', 'PgSQLConn');
        }
        else {

            console.log('Using MySQL.');
            container.getScope().bind('~IDBConn', 'MySQLConn');
        }

        const users = await container.get<IUserManager>('UserManager', {
            binds: {
                '@adminId': 1,
                '@dbconfig': 1,
            }
        });

        console.log(users.getRoleById(123));
        console.log(users.getRoleById(1));
        console.log(users.getUserList());

        await container.destroy();
    }
    catch (e) {

        console.error(e);
    }

    console.info('bye bye');

})().catch(console.error);
