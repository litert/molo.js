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

import * as C from './Common';
import * as $FS from 'fs';
import * as $Path from 'path';

class ModuleScanner implements C.IModuleScanner {

    public scan(
        paths: string[],
        filter: (v: string) => boolean = () => true,
        loadModule: (v: string) => any = require
    ): void {

        for (const p of paths) {

            this._load(p, filter, loadModule);
        }
    }

    private _load(root: string, filter: (v: string) => boolean, loadModule: (v: string) => any): void {

        const items = $FS.readdirSync(root);

        for (const i of items) {

            if (i === '.' || i === '..') {

                continue;
            }

            if (i.toLowerCase().endsWith('.js')) {

                const path = $Path.resolve(root, i);

                if ($FS.statSync(path).isDirectory()) {

                    this._load(path, filter, loadModule);
                }
                else if (filter(path)) {

                    loadModule($Path.resolve(root, i));
                }
            }
        }
    }
}

export function createDefaultModuleScanner(): C.IModuleScanner {

    return new ModuleScanner();
}
