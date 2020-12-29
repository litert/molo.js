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

export class Scope implements I.IScope {

    private readonly _ = new Utils();

    private _vars: Record<string, any> = {};

    private _contexts: Record<string, Record<string, any>> = {};

    private _singletons: Record<string, any> = {};

    private _uninit: Array<[any, string]> = [];

    private _solutions: Record<string, I.ITargetExpress> = {};

    public constructor(public readonly name: string, private _parent?: I.IScope) {}

    public addUninitializer(obj: unknown, method: string): this {

        this._uninit.push([obj, method]);

        return this;
    }

    public async destroy(): Promise<void> {

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

    public getValue(name: string): any {

        return this._vars[name] ?? this._parent?.getValue(name);
    }

    public bindValue(name: string, value: unknown): this {

        this._.checkVarName(name);

        this._vars[name] = value;

        return this;
    }

    public bindContext(expr: string, ctx: Record<string, any>): this {

        this._contexts[expr] = ctx;

        return this;
    }

    public findExtraBindings(expr: string): Record<string, any> | undefined {

        return this._contexts[expr];
    }

    public bind(srcExpr: string, dstExpr: string, injects?: Record<string, any>): this {

        this._.checkSourceExpression(srcExpr);
        const dst = this._.parseTargetExpression(dstExpr);

        this._solutions[srcExpr] = dst;

        if (injects) {

            this.bindContext(srcExpr, injects);
        }

        return this;
    }

    public findBind(expr: string): I.ITargetExpress | undefined {

        return this._solutions[expr];
    }

    public getSingleton(name: string): any {

        return this._singletons[name] ?? this._parent?.getSingleton(name);
    }

    public setSingleton(name: string, value: unknown): void {

        this._singletons[name] = value;
    }
}
