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

class MoloModule implements I.IModule {

    private _components!: Map<any, I.IComponent>;

    private _filePath: string;

    public constructor(module: NodeJS.Module) {

        module.exports.__molo = this;
        this._filePath = module.filename;
        this._components = new Map();
    }

    public getComponents(): I.IComponent[] {

        return Array.from(this._components.values());
    }

    private _prepare(target: any): I.IComponent {

        if (!this._components.has(target)) {

            const ret: I.IComponent = {
                'options': {
                    'depends': [],
                    'info': null as any
                },
                'ctor': target
            };

            this._components.set(target, ret);

            return ret;
        }

        return this._components.get(target) as I.IComponent;
    }

    public Component(opts: Partial<C.IComponentOptions> = {}): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            this._prepare(target).options.info = {

                'name': opts.name ?? '',
                'imports': opts.imports ?? [],
                'singleton': opts.singleton ?? false,
                'type': opts.type ?? [],
                'deprecated': opts.deprecated ?? '',
                'bootable': !!opts.bootable,
                'provides': opts.provides ?? ''
            };

            return target;
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

export function createModule(module: NodeJS.Module): C.IModule {

    return new MoloModule(module);
}
