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
import Reflect from '@litert/reflect';
import { ClassDescriptor } from './ClassDescriptor';

export class ClassManager implements I.IClassManager {

    private _classes: Record<string, ClassDescriptor> = {};

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

        const name = Reflect.getMetadata(theClass, Symbols.K_NAME) ?? theClass.name;

        const params: I.IInjectOptions[] = [];

        for (let i = 0; ; i++) {

            const p = Reflect.getMetadataOfConstructorParameter(theClass, i, Symbols.K_INJECT_NAME);

            if (!p) {

                break;
            }

            params.push(p);
        }

        if (params.length !== theClass.length) {

            throw new E.E_LACK_PARAMS({ class: name, method: 'constructor' });
        }

        const props: Record<string, I.IInjectOptions> = {};

        for (const p of Reflect.getOwnPropertyNames(theClass)) {

            const inject = Reflect.getMetadataOfProperty(theClass, p, Symbols.K_INJECT_NAME);

            if (inject) {

                props[p as string] = inject;
            }
        }

        this._classes[name] = new ClassDescriptor(
            name,
            Reflect.getMetadata(theClass, Symbols.K_TYPES) ?? [],
            theClass,
            Reflect.getMetadata(theClass, Symbols.K_IS_SINGLETON) ?? false,
            params,
            props
        );
    }

    public findClassesByType(type: string): I.IClassDescriptor[] {

        const ret: I.IClassDescriptor[] = [];

        for (const n in this._classes) {

            if (this._classes[n].types.includes(type)) {

                ret.push(this._classes[n]);
            }
        }

        return ret;
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
