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
import * as C from '../Common';
import * as E from '../Errors';
import * as Symbols from './Symbols';
import { IReflectManager } from '@litert/reflect';
import { ClassDescriptor } from './ClassDescriptor';

export class ClassManager implements I.IClassManager {

    private _classes: Record<string, ClassDescriptor> = {};

    private _ctorMap: Map<any, ClassDescriptor> = new Map();

    public constructor(
        private _ref: IReflectManager
    ) {}

    public get(name: string): I.IClassDescriptor {

        const ret = this._classes[name];

        if (!ret) {

            throw new E.E_CLASS_NOT_FOUND({ name });
        }

        return ret;
    }

    public has(name: string): boolean {

        return !!this._classes[name];
    }

    public getNames(): string[] {

        return Object.keys(this._classes);
    }

    public getMethod(className: string, methodName: string): I.IMethodDescriptor {

        return this.get(className).getMethod(methodName);
    }

    public add(theClass: C.IClassConstructor): void {

        const prefix = this._ref.getMetadata(theClass, Symbols.K_CLASS_NAME_PREFIX) ?? '';

        const clsName = this._ref.getMetadata(theClass, Symbols.K_CLASS_NAME) ?? theClass.name;

        const name = prefix ? `${prefix}.${clsName}` : clsName;

        const params: I.IInjectOptions[] = [];

        const props: Record<string, I.IInjectOptions> = {};

        const isPrivate = this._ref.getMetadata(theClass, Symbols.K_IS_PRIVATE) ?? false;

        if (!isPrivate) {

            for (let i = 0; ; i++) {

                const p = this._ref.getMetadataOfConstructorParameter(theClass, i, Symbols.K_INJECTION);

                if (!p) {

                    break;
                }

                params.push(p);
            }

            if (params.length !== theClass.length) {

                throw new E.E_LACK_PARAMS({ class: name, method: 'constructor' });
            }

            for (const p of this._ref.getOwnPropertyNames(theClass)) {

                const inject = this._ref.getMetadataOfProperty(theClass, p, Symbols.K_INJECTION);

                if (inject) {

                    props[p as string] = inject;
                }
            }
        }

        this._classes[name] = new ClassDescriptor(
            name,
            this._ref.getMetadata(theClass, Symbols.K_TYPES) ?? [],
            theClass,
            this._ref.getMetadata(theClass, Symbols.K_IS_SINGLETON) ?? false,
            isPrivate,
            params,
            props,
            this._ref
        );

        this._ctorMap.set(theClass, this._classes[name]);
    }

    public findClassesByNamePattern(pattern: RegExp): I.IClassDescriptor[] {

        return Object.values(this._classes).filter((v) => pattern.test(v.name));
    }

    public findClassByObject<T extends Record<string, any>>(object: T): I.IClassDescriptor | undefined {

        return this._ctorMap.get(object.__proto__.constructor);
    }

    public findClassesByType(type: string): I.IClassDescriptor[] {

        return Object.values(this._classes).filter((v) => v.types.includes(type));
    }

    public findFactoryMethodsByClass(clsName: string): I.IMethodDescriptor[] {

        const ret: I.IMethodDescriptor[] = [];

        for (const n in this._classes) {

            const methods = this._classes[n].findFactoryMethodsByClass(clsName);

            if (methods.length) {

                ret.push(...methods);
            }
        }

        return ret;
    }

    public findFactoryMethodsByType(type: string): I.IMethodDescriptor[] {

        const ret: I.IMethodDescriptor[] = [];

        for (const n in this._classes) {

            const methods = this._classes[n].findFactoryMethodsByType(type);

            if (methods.length) {

                ret.push(...methods);
            }
        }

        return ret;
    }

}
