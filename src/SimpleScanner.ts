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

class SimpleScanner implements C.IScanner {

    public scan(path: string): string[] {

        const ret: string[] = [];

        this._scan(path, ret);

        return ret;
    }

    private _scan(path: string, stack: string[]): void {

        const items = $FS.readdirSync(path);

        if (!path.endsWith('/')) {

            path += '/';
        }

        for (let x of items) {

            if (x.startsWith('.')) {

                continue;
            }

            const fPath = `${path}${x}`;

            if ($FS.statSync(fPath).isDirectory()) {

                this._scan(fPath, stack);
                continue;
            }

            if (x.toLowerCase().endsWith('.js')) {

                stack.push(fPath);
            }
        }
    }

    public getAbsolutePath(path: string): string {

        let ret = $Path.isAbsolute(path) ? path : $Path.resolve(path);

        if (!ret.endsWith('/')) {

            ret += '/';
        }

        return ret;
    }
}

export function createSimpleScanner(): C.IScanner {

    return new SimpleScanner();
}
