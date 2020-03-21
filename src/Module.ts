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

class MoloModule implements I.IModule {

    private _components!: Map<any, I.IComponent>;

    public constructor(module: NodeJS.Module) {

        module.exports.__molo = this;
        this._components = new Map();
    }

    public getComponents(): I.IComponent[] {

        return Array.from(this._components.values());
    }

    public Component(opts: Partial<C.IComponentOptions<any>> = {}): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            this._components.set(target, {
                'options': {
                    'name': opts.name ?? '',
                    'depends': opts.depends ?? {},
                    'imports': opts.imports ?? [],
                    'singleton': opts.singleton ?? false,
                    'type': opts.type ?? [],
                    'deprecated': opts.deprecated ?? '',
                    'bootable': !!opts.bootable,
                    'provides': opts.provides ?? ''
                },
                'ctor': target as any
            });

            return target;
        };
    }
}

export function createModule(module: NodeJS.Module): C.IModule {

    return new MoloModule(module);
}
