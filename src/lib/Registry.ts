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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */
import Reflect, { IReflectManager } from '@litert/reflect';
import * as Constants from './_internal/Constants';
import * as C from './Common';
import * as E from './Errors';
import * as I from './_internal';
import { ClassManager } from './_internal/ClassManager';
import { Utils } from './_internal/Utils';

class Registry implements C.IRegistry, I.IRegistry {

    private readonly _ = new Utils();

    private _classMgr: I.IClassManager;

    public constructor(private readonly _ref: IReflectManager) {

        this._classMgr = new ClassManager(this._, this._ref);
    }

    public getClassManager(): I.IClassManager {

        return this._classMgr;
    }

    public getReflectObject(): IReflectManager {

        return this._ref;
    }

    public use(...theClass: C.IClassConstructor[]): string[] {

        return theClass.map((v) => this._classMgr.add(v));
    }

    public Name(name: string | null): ClassDecorator {

        if (name !== null) {

            this._.checkClassName(name);
        }

        return this._ref.metadata(Constants.K_CLASS_NAME, name);
    }

    public Prefix(prefix: string): ClassDecorator {

        this._.checkClassName(prefix);

        return this._ref.metadata(Constants.K_CLASS_NAME_PREFIX, prefix);
    }

    public Type(types: string[]): ClassDecorator {

        for (const t of types) {

            this._.checkClassType(t);
        }

        return <TFunction extends Function>(target: TFunction): TFunction | void => {

            const m = this._ref.getMetadata(target, Constants.K_TYPES) ?? [];

            m.push(...types.map((v) => v.slice(1)));

            this._ref.setMetadata(target, Constants.K_TYPES, m);
        };
    }

    public Inject(expr: string, opts: C.IInjectOptions = {}): C.IInjectDecorator {

        this._.checkTargetExpression(expr);

        const inject: I.IInjectOptions = {
            'expr': expr,
            'binds': opts.binds
        };

        const decFn: C.IInjectDecorator = (...args: any[]): void => {

            if (this._ref.isForConstructorParameter(args)) {

                this._ref.setMetadataOfConstructorParameter(args[0], args[2], Constants.K_INJECTION, inject);
            }
            else if (this._ref.isForMethodParameter(args)) {

                this._ref.setMetadataOfParameter(args[0], args[1], args[2], Constants.K_INJECTION, inject);
            }
            else if (this._ref.isForProperty(args)) {

                this._ref.setMetadataOfProperty(args[0], args[1], Constants.K_INJECTION, inject);
            }
            else if (this._ref.isForClass(args)) {

                console.warn(`[WARNING] Incorrect injection "${expr}" for "${args[0].constructor.name}".`);
            }
            else if (this._ref.isForMethod(args)) {

                console.warn(`[WARNING] Incorrect injection "${expr}" for "${args[0].constructor.name}.prototype.${args[1] as string}".`);
            }
        };

        (decFn as any)[Constants.K_INJECTION_EXPR] = inject;

        return decFn;
    }

    public Singleton(): ClassDecorator {

        return this._ref.metadata(Constants.K_IS_SINGLETON, true);
    }

    public Private(): ClassDecorator {

        return this._ref.metadata(Constants.K_IS_PRIVATE, true);
    }

    public Initializer(): MethodDecorator {

        return this._ref.metadata(Constants.K_INITIALIZER, true);
    }

    public Uninitializer(): MethodDecorator {

        return this._ref.metadata(Constants.K_UNINITIALIZER, true);
    }

    public Provide(element: string): MethodDecorator {

        if (!/^~?[a-z_]\w*$/i.test(element)) {

            throw new E.E_MALFORMED_PRODUCT({ 'product': element });
        }

        return this._ref.metadata(Constants.K_PRODUCT, element);
    }
}

/**
 * Create a new Molo registry object.
 *
 * @param reflect   The reflect metadata object.
 */
export function createRegistry(reflect: IReflectManager = Reflect): C.IRegistry {

    return new Registry(reflect);
}

const globalRegistry = createRegistry();

/**
 * Get the default registry object of Molo.
 */
export function getGlobalRegistry(): C.IRegistry {

    return globalRegistry;
}
