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

    private _uninit: Array<[any, string]> = [];

    public constructor(public readonly name: string, private _parent?: I.IScope) {}

    public addUninitializer(obj: unknown, method: string): this {

        this._uninit.push([obj, method]);

        return this;
    }

    public async release(): Promise<void> {

        while (1) {

            const [obj, method] = this._uninit.pop() ?? [null, ''];

            if (!obj) {

                return;
            }

            const result = obj[method]();

            if (result instanceof Promise) {

                await result;
            }
        }
    }

    public findBindByAlias(alias: string): I.IClassBind<'alias', any> {

        return this._binds.alias[alias];
    }

    public findBindByType(type: string): I.IClassBind<'type', any> {

        return this._binds.type[type];
    }

    public bindTypeWithFactory(
        type: string,
        factory: string,
        method: string
    ): this {

        this._.checkClassType(type);
        this._binds['type'][type.slice(1)] = {
            'type': 'type-factory',
            'className': factory,
            'methodName': method
        };
        return this;
    }

    public bindTypeWithClass(
        type: string,
        className: string
    ): this {

        this._.checkClassType(type);
        this._binds['type'][type.slice(1)] = {
            'type': 'type-class',
            'className': className
        };
        return this;
    }

    public bindAliasWithFactory(
        alias: string,
        factory: string,
        method: string
    ): this {

        this._binds['alias'][alias] = {
            'type': 'alias-factory',
            'className': factory,
            'methodName': method
        };
        return this;
    }

    public bindAliasWithClass(
        alias: string,
        className: string
    ): this {

        this._binds['alias'][alias] = {
            'type': 'alias-class',
            'className': className
        };
        return this;
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
