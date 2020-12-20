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
import * as E from '../Errors';

export class Builder implements I.IBuilder {

    public constructor(private _classes: I.IClassManager) {}

    public async build(injectExpr: string, scope: I.IScope): Promise<any> {

        let [injection, alias] = injectExpr.split('@');

        if (alias) {

            let ret = scope.get(alias);

            if (ret !== undefined) {

                return ret;
            }

            const bind = scope.findBindByAlias(alias);

            if (bind) {

                switch (bind.type) {
                    case 'alias-class':
                        return this._buildByClass(this._classes.get(bind.className), scope, alias);
                    case 'alias-factory': {
                        const cls = this._classes.get(bind.className);
                        return this._buildByFactory(cls, cls.getMethod(bind.methodName), scope, alias);
                    }
                    default:
                        throw new E.E_FACTORY_NOT_FOUND({ injection: injectExpr, scope: scope.name });
                }
            }
        }

        if (injection.startsWith('~')) {

            injection = injection.slice(1);

            const bind = scope.findBindByType(injection);

            if (bind) {

                switch (bind.type) {
                    case 'type-class':
                        return this._buildByClass(this._classes.get(bind.className), scope, alias);
                    case 'type-factory': {
                        const cls = this._classes.get(bind.className);
                        return this._buildByFactory(cls, cls.getMethod(bind.methodName), scope, alias);
                    }
                    default:
                        throw new E.E_FACTORY_NOT_FOUND({ injection: injectExpr, scope: scope.name });
                }
            }

            const classes = this._classes.findClassesByType(injection);

            if (classes.length === 1) {

                return this._buildByClass(classes[0], scope, alias);
            }

            const methods = this._classes.findFactoryMethodsByType(injection);

            if (methods.length === 1) {

                return this._buildByFactory(this._classes.get(methods[0].parent), methods[0], scope, alias);
            }

        }
        else if (this._classes.has(injection)) {

            return this._buildByClass(this._classes.get(injection), scope, alias);
        }
        else {

            const methods = this._classes.findFactoryMethodsByClass(injection);

            if (methods.length === 1) {

                return this._buildByFactory(this._classes.get(methods[0].parent), methods[0], scope, alias);
            }
        }

        throw new E.E_FACTORY_NOT_FOUND({ name: injection, scope: scope.name, alias });
    }

    private async _buildByFactory(
        cls: I.IClassDescriptor,
        method: I.IMethodDescriptor,
        scope: I.IScope,
        alias?: string
    ): Promise<any> {

        const factoryObj = await this._buildByClass(cls, scope);

        const fnArgs: any[] = [];

        for (const a of method.parameters) {

            fnArgs.push(await this.build(a.injection, scope));
        }

        let obj = factoryObj[method.name](...fnArgs);

        if (obj instanceof Promise) {

            obj = await obj;
        }

        if (alias !== undefined) {

            scope.set(alias, obj);
        }

        return obj;
    }

    private async _buildByClass(
        cls: I.IClassDescriptor,
        scope: I.IScope,
        alias?: string
    ): Promise<any> {

        if (cls.isSingleton) {

            const ret = scope.getSingleton(cls.name);

            if (ret !== undefined) {

                if (alias !== undefined) {

                    scope.set(alias, ret);
                }

                return ret;
            }
        }

        const ctorArgs: any[] = [];

        const props: Record<string, any> = {};

        for (const a of cls.parameters) {

            ctorArgs.push(await this.build(a.injection, scope));
        }

        for (const propName in cls.properties) {

            const p = cls.properties[propName];

            props[propName] = await this.build(p.injection, scope);
        }

        const obj = new cls.ctor(...ctorArgs);

        for (const propName in props) {

            obj[propName] = props[propName];
        }

        if (cls.isSingleton) {

            scope.setSingleton(cls.name, obj);
        }

        if (alias !== undefined) {

            scope.set(alias, obj);
        }

        if (cls.initializer) {

            await this._initObject(obj, scope, cls);
        }

        return obj;
    }

    private async _initObject(obj: any, scope: I.IScope, cls: I.IClassDescriptor): Promise<void> {

        if (!cls.initializer) {

            return;
        }

        const method = cls.getMethod(cls.initializer);

        const fnArgs: any[] = [];

        for (const a of method.parameters) {

            fnArgs.push(await this.build(a.injection, scope));
        }

        const result = obj[method.name](...fnArgs);

        if (result instanceof Promise) {

            await result;
        }
    }
}
