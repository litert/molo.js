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

import * as I from '.';
import * as E from '../Errors';
import { Utils } from './Utils';

export class Scope implements I.IScope {

    private readonly _ = new Utils();

    private _vars: Record<string, any> = {};

    private _ctxBinds: Record<string, Record<string, any>> = {};

    private _singletons: Record<string, any> = {};

    private _uninit: Array<[any, string]> = [];

    private _binds: Record<string, I.ITargetExpress> = {};

    private _refs: number = 0;

    public constructor(public readonly name: string, private _parent?: I.IScope) {

        _parent?.ref();
    }

    public ref(): void {

        this._refs++;
    }

    public unref(): void {

        this._refs--;
    }

    public addUninitializer(obj: unknown, method: string): this {

        this._uninit.push([obj, method]);

        return this;
    }

    public isReferred(): boolean {

        return !!this._refs;
    }

    public async destory(): Promise<void> {

        if (this._refs) {

            throw new E.E_SCOPE_REFERRED({ 'name': this.name });
        }

        const uninitList = this._uninit;

        this._parent?.unref();
        delete this._parent;

        // @ts-ignore
        delete this._singletons;
        // @ts-ignore
        delete this._binds;
        // @ts-ignore
        delete this._vars;
        // @ts-ignore
        delete this._uninit;
        // @ts-ignore
        delete this._ctxBinds;

        while (1) {

            const [obj, method] = uninitList.pop() ?? [null, ''];

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

        this._ctxBinds[expr] = ctx;

        return this;
    }

    public findContextBindings(expr: string): Record<string, any> | undefined {

        return (this._ctxBinds[expr] ? { ...this._ctxBinds[expr] } : undefined) ?? this._parent?.findContextBindings(expr);
    }

    public bind(srcExpr: string, dstExpr: string, injects?: Record<string, any>): this {

        this._.checkSourceExpression(srcExpr);
        const dst = this._.parseTargetExpression(dstExpr);

        this._binds[srcExpr] = dst;

        if (injects) {

            this.bindContext(srcExpr, injects);
        }

        return this;
    }

    public findBind(expr: string): I.ITargetExpress | undefined {

        return this._binds[expr] ?? this._parent?.findBind(expr);
    }

    public getSingleton(name: string): any {

        return this._singletons[name] ?? this._parent?.getSingleton(name);
    }

    public setSingleton(name: string, value: unknown): void {

        this._singletons[name] = value;
    }
}
