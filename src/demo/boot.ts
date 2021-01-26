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

import * as $Molo from '../lib';
import { ILogger } from './Components/Logger';
import { MOLO_MYSQL_CONNECTION } from './Components/MySQL';
import { MOLO_PGSQL_CONNECTION } from './Components/PgSQL';
import { IUserManager, MOLO_USER_MANAGER } from './Services/UserManager';

(async () => {

    try {

        $Molo.createDefaultModuleScanner().scan([
            `${__dirname}/Components`,
            `${__dirname}/DAO`,
            `${__dirname}/Services`,
        ]);

        const container = $Molo.createContainer();

        const scope = container.createScope('demo', container.getScope());

        const logs = await container.get<ILogger>('~logger', {
            'binds': {
                '@subject': 'demo'
            },
            scope
        });

        if (Math.random() > 0.5) {

            logs.info('Using PgSQL.');
            container.getScope().bind('~IDBConn', MOLO_PGSQL_CONNECTION);
        }
        else {

            logs.info('Using MySQL.');
            container.getScope().bind('~IDBConn', MOLO_MYSQL_CONNECTION);
        }

        scope.bindValue('dbconfig', 1223);

        const users = await container.get<IUserManager>(MOLO_USER_MANAGER, {
            binds: { '@adminId': 1, },
            scope
        });

        logs.info(`The role for user 1 is ${users.getRoleById(1)}.`);
        logs.info(`The role for user 123 is ${users.getRoleById(123)}.`);
        logs.info(`The first user is ${users.getUserList()[0]}`);

        await container.destroy();

        logs.warn('bye bye');
    }
    catch (e) {

        console.error(e);
    }

    console.info('quit');

})().catch(console.error);
