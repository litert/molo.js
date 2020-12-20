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

import * as I from '.';
import { Utils } from './Utils';

type IBindMap = {
    [K in 'alias' | 'type']: {

        [k: string]: I.IClassBind<K, any> | I.IFactoryBind<K>;
    };
};

export class Scope implements I.IScope {

    private readonly _ = new Utils();

    private _content: Record<string, any> = {};

    private _singletons: Record<string, any> = {};

    private _binds: IBindMap = {
        'alias': {},
        'type': {}
    };

    public constructor(public readonly name: string, private _parent?: I.IScope) {}

    public findBindByAlias(alias: string): I.IClassBind<'alias', any> {

        return this._binds.alias[alias];
    }

    public findBindByType(type: string): I.IClassBind<'type', any> {

        return this._binds.type[type];
    }

    public bind(
        type: string,
        target: string,
        className: string,
        methodName?: string
    ): void {

        switch (type) {

            case 'alias-class':
                this._binds['alias'][target] = {
                    type,
                    className
                };
                break;
            case 'alias-factory':
                this._binds['alias'][target] = {
                    type,
                    className,
                    methodName
                };
                break;
            case 'type-class':
                this._.checkClassType(target);
                this._binds['type'][target.slice(1)] = {
                    type,
                    className
                };
                break;
            case 'type-factory':
                this._.checkClassType(target);
                this._binds['type'][target.slice(1)] = {
                    type,
                    className,
                    methodName
                };
                break;
        }
    }

    public get(name: string): any {

        return this._content[name] ?? this._parent?.get(name);
    }

    public set(name: string, value: unknown): void {

        this._content[name] = value;
    }

    public getSingleton(name: string): any {

        return this._singletons[name] ?? this._parent?.getSingleton(name);
    }

    public setSingleton(name: string, value: unknown): void {

        this._singletons[name] = value;
    }
}
