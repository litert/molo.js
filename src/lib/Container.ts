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
import * as E from './Errors';
import * as I from './_internal';
import * as Symbols from './_internal/Symbols';
import { Scope } from './_internal/Scope';
import { getGlobalRegistry } from './Registry';
import { Builder } from './_internal/Builder';

class Container implements C.IContainer {

    private readonly _scopes: Record<string, I.IScope> = {
        [Symbols.K_GLOBAL_SCOPE]: new Scope('_global')
    };

    private readonly _builder: I.IBuilder;

    private readonly _classes: I.IClassManager;

    public constructor(registry: I.IRegistry) {

        this._classes = registry.getClassManager();
        this._builder = new Builder(this._classes);
    }

    public createScope(name: string, baseScope?: string): C.IScope {

        if (this._scopes[name]) {

            throw new E.E_DUP_SCOPE({ name });
        }

        if (baseScope && !this._scopes[baseScope]) {

            throw new E.E_SCOPE_NOT_FOUND({ name: baseScope });
        }

        return this._scopes[name] = new Scope(name, baseScope ? this._scopes[baseScope] : undefined);
    }

    public getClassesByPattern(pattern: RegExp): Record<string, C.IClassConstructor> {

        const ret: Record<string, C.IClassConstructor> = {};

        for (const c of this._classes.findClassesByNamePattern(pattern)) {

            ret[c.name] = c.ctor;
        }

        return ret;
    }

    public getClassesByType(types: string[]): Record<string, C.IClassConstructor> {

        const clsList = Array.from(new Set(
            types
                .map((t) => this._classes.findClassesByType(t))
                .reduce((p, q) => p.concat(q), [])
        ));

        const ret: Record<string, C.IClassConstructor> = {};

        for (const c of clsList) {

            ret[c.name] = c.ctor;
        }

        return ret;
    }

    public getScope(name?: string): C.IScope {

        const ret = this._scopes[name ?? Symbols.K_GLOBAL_SCOPE];

        if (!ret) {

            throw new E.E_SCOPE_NOT_FOUND({ name });
        }

        return ret;
    }

    public getGlobalScope(): C.IScope {

        return this._scopes[Symbols.K_GLOBAL_SCOPE];
    }

    public async get(injection: string, opts?: C.IInstantiationOptions): Promise<any> {

        if (!opts) {

            opts = {};
        }

        const scope: I.IScope = opts.scope ?? this._scopes[Symbols.K_GLOBAL_SCOPE] as any;

        let ret = this._builder.build(injection, scope, opts.alias);

        if (ret instanceof Promise) {

            ret = await ret;
        }

        return ret;
    }
}

export function createContainer(registry: C.IRegistry = getGlobalRegistry()): C.IContainer {

    return new Container(registry as any);
}
