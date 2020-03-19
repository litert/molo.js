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

    private _component!: I.IComponent;

    public constructor(module: NodeJS.Module) {

        module.exports.__molo = this;
    }

    public getComponent(): I.IComponent {

        return this._component;
    }

    public Component(opts: Partial<C.IComponentOptions<any>> = {}): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            if (this._component) {

                throw new E.E_MULTI_COMPONENT_IN_FILE();
            }

            this._component = {
                'options': {
                    'name': opts.name ?? '',
                    'depends': opts.depends ?? {},
                    'imports': opts.imports ?? [],
                    'singleton': !!opts.singleton,
                    'type': opts.type ?? [],
                    'deprecated': opts.deprecated ?? '',
                    'bootable': !!opts.bootable,
                    'provides': opts.provides ?? ''
                },
                'ctor': target as any
            };

            return target;
        };
    }
}

export function createModule(module: NodeJS.Module): C.IModule {

    return new MoloModule(module);
}
