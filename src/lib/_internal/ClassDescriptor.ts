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
import { MethodDescriptor } from './MethodDescriptor';

export class ClassDescriptor implements I.IClassDescriptor {

    private _methods: Record<string, I.IMethodDescriptor> = {};

    public readonly isFactory: boolean = false;

    public readonly initializer: string;

    public constructor(
        public readonly name: string,
        public readonly types: string[],
        public readonly ctor: C.IClassConstructor,
        public readonly isSingleton: boolean,
        public readonly parameters: readonly I.IInjectOptions[],
        public readonly properties: Record<string, I.IInjectOptions>
    ) {

        this.initializer = '';

        for (const methodName of Reflect.getOwnMethodNames(ctor)) {

            const product = Reflect.getMetadataOfMethod(ctor, methodName, Symbols.K_PRODUCT);

            let isMoloFn: boolean = false;

            if (product) {

                isMoloFn = true;
            }

            const isInit = Reflect.getMetadataOfMethod(ctor, methodName, Symbols.K_INITIALIZER);

            if (isInit) {

                isMoloFn = true;

                if (this.initializer) {

                    throw new E.E_DUP_INITIALIZER({
                        initializer1: this.initializer,
                        initializer2: methodName
                    });
                }

                this.initializer = methodName as string;
            }

            if (!isMoloFn) {

                continue;
            }

            this.isFactory = true;

            const params: I.IInjectOptions[] = [];

            for (let i = 0; ; i++) {

                const injectType = Reflect.getMetadataOfParameter(ctor, methodName, i, Symbols.K_INJECT_NAME);

                if (!injectType) {

                    break;
                }

                params.push(injectType);
            }

            if (params.length !== ctor.prototype[methodName].length) {

                throw new E.E_LACK_PARAMS({ class: name, method: methodName });
            }

            this._methods[methodName as string] = new MethodDescriptor(
                methodName as string,
                name,
                product,
                params
            );
        }
    }

    public getMethod(name: string): I.IMethodDescriptor {

        const ret = this._methods[name];

        if (!ret) {

            throw new E.E_METHOD_NOT_FOUND({ name });
        }

        return ret;
    }

    public getMethodNames(): string[] {

        return Object.keys(this._methods);
    }

    public findFactoryMethodsByClass(clsName: string): I.IMethodDescriptor[] {

        const ret: I.IMethodDescriptor[] = [];

        for (const n in this._methods) {

            if (this._methods[n].product === clsName) {

                ret.push(this._methods[n]);
            }
        }

        return ret;
    }

    public findFactoryMethodsByType(type: string): I.IMethodDescriptor[] {

        const ret: I.IMethodDescriptor[] = [];

        type = `~${type}`;

        for (const n in this._methods) {

            if (this._methods[n].product === type) {

                ret.push(this._methods[n]);
            }
        }

        return ret;
    }
}
