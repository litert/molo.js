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
import * as I from './Internal';
import * as E from './Errors';

class MoloComponent implements I.IModule {

    private _component!: I.IComponent;

    private _filePath: string;

    public constructor(module: NodeJS.Module) {

        module.exports.__molo = this;
        this._filePath = module.filename;
    }

    public getComponent(): I.IComponent {

        return this._component;
    }

    private _prepare(target: any): I.IComponent {

        if (!this._component) {

            this._component = {
                'options': {
                    'imports': [],
                    'singleton': false,
                    'interfaces': [],
                    'deprecated': '',
                    'entry': false,
                    'provides': {},
                    'depends': []
                },
                'ctor': target
            };

            return this._component;
        }

        return this._component;
    }

    public Component(): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            if (this._component && this._component.ctor !== target as any) {

                throw new E.E_MULTI_COMPONENTS();
            }

            this._prepare(target);

            return target;
        };
    }

    public Entry(): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            this._prepare(target).options.entry = true;

            return target;
        };
    }

    public Deprecated(msg: string = ''): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            this._prepare(target).options.deprecated = msg;

            return target;
        };
    }

    public Singleton(singleton: boolean | 'context' = true): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            this._prepare(target).options.singleton = singleton;

            return target;
        };
    }

    public Interface(name: string): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            const interfaces = this._prepare(target).options.interfaces;

            if (!interfaces.includes(name)) {

                interfaces.push(name);
            }

            return target;
        };
    }

    public Import(thirdModule: string): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            const imports = this._prepare(target).options.imports;

            if (!imports.includes(thirdModule)) {

                imports.push(thirdModule);
            }

            return target;
        };
    }

    public Provides(interfaceName: string): MethodDecorator {

        return <T>(target: any, propertyKey: string | symbol, descriptor: any): any => {

            if (target.constructor && target.constructor.prototype === target) {

                target = target.constructor;
            }

            this._prepare(target).options.provides[propertyKey as string] = interfaceName;

            return descriptor;
        };
    }

    public Inject(opts: C.TCreateInputType<C.ICreateObjectOptions, 'target'> | string): C.TMixDecorator {

        return (target: any, propertyKey: any, descriptor: any): void => {

            let inject: I.IComponentDepend;

            if (typeof opts === 'string') {

                const optional = opts.startsWith('?') ? true : undefined;

                if (optional) {

                    opts = opts.slice(1);
                }

                inject = {
                    target: opts,
                    injectPos: '',
                    optional,
                    injectType: I.EInjectType.CTOR_PARAM
                };
            }
            else {

                const optional = opts.target.startsWith('?') ? true : undefined;

                if (optional) {

                    opts.target = opts.target.slice(1);
                }

                inject = {
                    ...opts,
                    optional,
                    injectPos: '',
                    injectType: I.EInjectType.CTOR_PARAM
                };
            }

            if (target.constructor && target.constructor.prototype === target) {

                target = target.constructor;
            }

            if (propertyKey !== undefined) {

                switch (typeof descriptor) {

                    case 'number': {

                        // for method parameter

                        throw new E.E_UNKNOWN_INJECTION_POSITION({
                            metadata: { module: this._filePath }
                        });
                    }

                    case 'object': {

                        // for method

                        if (target.prototype[propertyKey].length !== 1) {

                            throw new E.E_UNKNOWN_INJECTION_POSITION({
                                metadata: { module: this._filePath }
                            });
                        }

                        inject.injectType = I.EInjectType.SETTER_FN;
                        inject.injectPos = propertyKey;

                        break;
                    }

                    case 'undefined': {

                        // for property

                        inject.injectType = I.EInjectType.PROP;
                        inject.injectPos = propertyKey;

                        break;
                    }

                    default: {

                        throw new E.E_UNKNOWN_INJECTION_POSITION({
                            metadata: { module: this._filePath }
                        });
                    }
                }

            }
            else if (typeof descriptor === 'number') {

                /**
                 * For constructor parameter
                 */
                inject.injectType = I.EInjectType.CTOR_PARAM;
                inject.injectPos = descriptor;

            }
            else {

                throw new E.E_UNKNOWN_INJECTION_POSITION({
                    metadata: { module: this._filePath }
                });
            }

            const deps = this._prepare(target).options.depends;

            if (deps.find((v) => v.injectType === inject.injectType && v.injectPos === inject.injectPos)) {

                throw new E.E_DUP_INJECTION_POSITION({
                    metadata: { module: this._filePath }
                });
            }

            deps.push(inject);
        };
    }
}

export function createComponent(module: NodeJS.Module): C.IComponent {

    return new MoloComponent(module);
}
