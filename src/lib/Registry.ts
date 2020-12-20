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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */
import Reflect from '@litert/reflect';
import * as Symbols from './_internal/Symbols';
import * as C from './Common';
import * as E from './Errors';
import * as I from './_internal';
import { ClassManager } from './_internal/ClassManager';
import { Utils } from './_internal/Utils';

class Registry implements C.IRegistry, I.IRegistry {

    private readonly _ = new Utils();

    private _classMgr: I.IClassManager = new ClassManager();

    public getClassManager(): I.IClassManager {

        return this._classMgr;
    }

    public use(theClass: C.IClassConstructor): this {

        this._classMgr.add(theClass);

        return this;
    }

    public Name(name: string): ClassDecorator {

        this._.checkClassName(name);

        return Reflect.metadata(Symbols.K_NAME, name);
    }

    public Type(types: string[]): ClassDecorator {

        for (const t of types) {

            this._.checkClassType(t);
        }

        return Reflect.metadata(Symbols.K_TYPES, types.map((v) => v.slice(1)));
    }

    public Inject(element: string): C.IInjectDecorator {

        this._.checkInjectionExpression(element);

        const inject: I.IInjectOptions = { injection: element };

        return function(...args: any[]): void {

            if (Reflect.isForConstructorParameter(args)) {

                Reflect.setMetadataOfConstructorParameter(args[0], args[2], Symbols.K_INJECT_NAME, inject);
            }
            else if (Reflect.isForMethodParameter(args)) {

                Reflect.setMetadataOfParameter(args[0], args[1], args[2], Symbols.K_INJECT_NAME, inject);
            }
            else if (Reflect.isForProperty(args)) {

                Reflect.setMetadataOfProperty(args[0], args[1], Symbols.K_INJECT_NAME, inject);
            }
            else if (Reflect.isForClass(args)) {

                console.warn(`[WARNING] Incorrect injection "${element}" for "${args[0].constructor.name}".`);
            }
            else if (Reflect.isForMethod(args)) {

                console.warn(`[WARNING] Incorrect injection "${element}" for "${args[0].constructor.name}.prototype.${args[1] as string}".`);
            }
        };
    }

    public Singleton(): ClassDecorator {

        return Reflect.metadata(Symbols.K_IS_SINGLETON, true);
    }

    public Initializer(): MethodDecorator {

        return Reflect.metadata(Symbols.K_INITIALIZER, true);
    }

    public Provide(element: string): MethodDecorator {

        if (!/^~?[a-z_]\w*$/i.test(element)) {

            throw new E.E_MALFORMED_PRODUCT({ 'product': element });
        }

        return Reflect.metadata(Symbols.K_PRODUCT, element);
    }
}

export function createRegistry(): C.IRegistry {

    return new Registry();
}

const globalRegistry = createRegistry();

export function getGlobalRegistry(): C.IRegistry {

    return globalRegistry;
}
