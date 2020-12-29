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
import { Utils } from './_internal/Utils';

class BuildContext {

    public bind?: I.ITargetExpress;

    public constructor(
        public rootExpr: I.ITargetExpress,
        public scope: I.IScope,
        public ctxBinds?: Record<string, any>,
        public expr: I.ITargetExpress = rootExpr,
        public buildPath: string[] = [expr.fullExpr]
    ) {}

    public fork(newExpr: I.ITargetExpress): BuildContext {

        const newCtxBinds = this.scope.findExtraBindings(newExpr.fullExpr);

        return new BuildContext(
            this.rootExpr,
            this.scope,
            newCtxBinds ? { ...newCtxBinds, ...this.ctxBinds } : this.ctxBinds,
            newExpr,
            [...this.buildPath, newExpr.fullExpr]
        );
    }
}

class Container implements C.IContainer {

    private _ = new Utils();

    private readonly _scopes: Record<string, I.IScope>;

    private _scopeSeq: I.IScope[];

    private readonly _classes: I.IClassManager;

    public constructor(registry: I.IRegistry) {

        this._scopes = {
            [Symbols.K_GLOBAL_SCOPE]: new Scope('_global').bindValue('molo.container', this)
        };
        this._scopeSeq = [this._scopes[Symbols.K_GLOBAL_SCOPE]];
        this._classes = registry.getClassManager();
    }

    public createScope(name: string, baseScope?: string): C.IScope {

        if (this._scopes[name]) {

            throw new E.E_DUP_SCOPE({ name });
        }

        if (baseScope && !this._scopes[baseScope]) {

            throw new E.E_SCOPE_NOT_FOUND({ name: baseScope });
        }

        this._scopes[name] = new Scope(name, baseScope ? this._scopes[baseScope] : undefined);

        this._scopeSeq.push(this._scopes[name]);

        return this._scopes[name];
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

    public async destroy(): Promise<void> {

        while (1) {

            const scope = this._scopeSeq.pop();

            if (!scope) {

                break;
            }

            await scope.destroy();
        }
    }

    private _resolve(ctx: BuildContext): void {

        if (ctx.expr.varName) {

            ctx.bind = ctx.scope.findBind(ctx.expr.varName);

            if (ctx.bind) {

                return;
            }
        }

        ctx.bind = ctx.scope.findBind(ctx.expr.fullExpr);

        if (ctx.bind) {

            return;
        }

        if (ctx.expr.typeExpr) {

            ctx.bind = ctx.scope.findBind(ctx.expr.typeExpr);
        }
    }

    private async _get(ctx: BuildContext): Promise<any> {

        if (ctx.expr.varName) {

            let ret = ctx.scope.getValue(ctx.expr.varName);

            if (ret !== undefined) {

                return ret;
            }
        }

        const ctxBind = ctx.ctxBinds?.[ctx.expr.varExpr] ?? ctx.ctxBinds?.[ctx.expr.typeExpr] ?? ctx.ctxBinds?.[ctx.expr.factoryExpr];

        if (ctxBind !== undefined) {

            const extBindExpr = ctxBind?.[Symbols.K_INJECTION_EXPR] as I.IInjectOptions;

            if (extBindExpr) {

                return this.get(extBindExpr.expr, {
                    'scope': ctx.scope,
                    'binds': {
                        ...extBindExpr.binds,
                        ...ctx.ctxBinds
                    }
                });
            }
            else {

                return ctxBind;
            }
        }

        if (ctx.expr.factoryMethod) {

            return this._buildByFactory(ctx);
        }

        this._resolve(ctx);

        if (ctx.bind) {

            const ret = await this._get(ctx.fork(ctx.bind));

            if (ctx.expr.varName) {

                ctx.scope.bindValue(ctx.expr.varName, ret);
            }

            return ret;
        }

        const factoryMethods = this._classes.findFactoryMethodsByType(ctx.expr.typeName);

        if (factoryMethods.length === 1) {

            return this._buildByFactory(ctx.fork(this._.parseTargetExpression(
                `${factoryMethods[0].parent}::${factoryMethods[0].name}`
            )));
        }

        if (!ctx.expr.typeName) {

            throw new E.E_FACTORY_NOT_FOUND({ 'buildStack': ctx.buildPath });
        }

        if (ctx.expr.isAbstract) {

            const clsList = this._classes.findClassesByType(ctx.expr.typeName).filter((v) => !v.isPrivate);

            if (clsList.length !== 1) {

                throw new E.E_FACTORY_NOT_FOUND({
                    'classType': ctx.expr.typeName,
                    'classCandidates': clsList.map((v) => v.name),
                    'buildStack': ctx.buildPath
                });
            }

            return this._buildByClass(ctx, clsList[0]);
        }
        else {

            return this._buildByClass(ctx, this._classes.get(ctx.expr.typeName));
        }
    }

    private async _buildByClass(ctx: BuildContext, cls: I.IClassDescriptor): Promise<any> {

        if (cls.isPrivate) {

            throw new E.E_PRIVATE_CLASS({
                'classType': ctx.expr.typeName,
                'expr': ctx.expr.factoryExpr,
                'buildStack': ctx.buildPath,
                'class': cls.name
            });
        }

        if (cls.isSingleton) {

            const ret = ctx.scope.getSingleton(cls.name);

            if (ret !== undefined) {

                if (ctx.expr.varName !== undefined) {

                    ctx.scope.bindValue(ctx.expr.varName, ret);
                }

                return ret;
            }
        }

        const extInjects = ctx.ctxBinds ?? {};

        const ctorArgs: any[] = [];

        const props: Record<string, any> = {};

        for (const a of cls.parameters) {

            ctorArgs.push(await this._getInjection(a, ctx, extInjects));
            // ctorArgs.push(await this.get(a.expr, { 'scope': ctx.scope }));
        }

        for (const propName in cls.properties) {

            const p = cls.properties[propName];

            props[propName] = await this._getInjection(p, ctx, extInjects);
            // props[propName] = await this.get(p.expr, { 'scope': ctx.scope, injects: p.injects });
        }

        const obj = new cls.ctor(...ctorArgs);

        for (const propName in props) {

            obj[propName] = props[propName];
        }

        await this._prepareObject(obj, ctx, extInjects, cls);

        if (cls.isSingleton) {

            ctx.scope.setSingleton(cls.name, obj);
        }

        return obj;
    }

    private async _buildByFactory(ctx: BuildContext): Promise<any> {

        const factoryObj = await this._get(ctx.fork(this._.parseTargetExpression(ctx.expr.factoryExpr)));
        const factoryCls = this._classes.findClassByObject(factoryObj);

        if (!factoryCls) {

            throw new E.E_CLASS_NOT_FOUND({ 'expr': ctx.expr.factoryExpr, 'buildStack': ctx.buildPath });
        }

        const method = factoryCls.getMethod(ctx.expr.factoryMethod);

        const fnArgs: any[] = [];

        const extInjects = ctx.ctxBinds ?? {};

        for (const a of method.parameters) {

            fnArgs.push(await this._getInjection(a, ctx, extInjects));
            // props[propName] = await this._getInjection(p, ctx, extInjects);
        }

        let obj = factoryObj[method.name](...fnArgs);

        if (obj instanceof Promise) {

            obj = await obj;
        }

        await this._prepareObject(obj, ctx, extInjects, this._classes.findClassByObject(obj));

        return obj;
    }

    private async _getInjection(injection: I.IInjectOptions, ctx: BuildContext, extInjects: Record<string, any>): Promise<any> {

        const extInjectValue = extInjects[injection.expr];

        if (extInjectValue !== undefined) {

            const extBindExpr = extInjectValue?.[Symbols.K_INJECTION_EXPR] as I.IInjectOptions;

            if (extBindExpr) {

                return this.get(extBindExpr.expr, {
                    'scope': ctx.scope,
                    'binds': {
                        ...extBindExpr.binds,
                        ...ctx.ctxBinds
                    }
                });
            }
            else {

                return extInjectValue;
            }
        }

        return this.get(injection.expr, {
            'scope': ctx.scope,
            'binds': {
                ...injection.binds,
                ...ctx.ctxBinds
            }
        });
    }

    private async _prepareObject(obj: any, ctx: BuildContext, extInjects: Record<string, any>, cls?: I.IClassDescriptor): Promise<void> {

        if (cls) {

            if (cls.initializer) {

                const method = cls.getMethod(cls.initializer);

                const fnArgs: any[] = [];

                for (const a of method.parameters) {

                    fnArgs.push(await this._getInjection(a, ctx, extInjects));
                    // fnArgs.push(await this.get(a.expr, { scope: ctx.scope }));
                }

                const result = obj[method.name](...fnArgs);

                if (result instanceof Promise) {

                    await result;
                }
            }

            if (cls.uninitializer) {

                ctx.scope.addUninitializer(obj, cls.uninitializer);
            }
        }

        if (ctx.expr.varName) {

            ctx.scope.bindValue(ctx.expr.varName, obj);
        }
    }

    public async get(expr: string, opts?: C.IInstantiationOptions): Promise<any> {

        const ctx = new BuildContext(
            this._.parseTargetExpression(expr),
            opts?.scope as I.IScope ?? this._scopes[Symbols.K_GLOBAL_SCOPE],
            opts?.binds
        );

        try {

            return await this._get(ctx);
        }
        catch (e) {

            if (e instanceof E.E_FACTORY_NOT_FOUND && ctx.rootExpr.optional) {

                return undefined;
            }

            throw e;
        }
    }
}

export function createContainer(registry: C.IRegistry = getGlobalRegistry()): C.IContainer {

    return new Container(registry as any);
}
