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

export enum EInjectType {
    CTOR_PARAM,
    PROP,
    SETTER_FN
}

export interface ICreateObjectOptions extends C.ICreateObjectOptions {

    injectPos: string | number;

    injectType: EInjectType;
}

export type IComponentDepend = C.TCreateInputType<ICreateObjectOptions, 'target' | 'injectPos' | 'injectType'>;

export interface IComponentOptions {

    interfaces: string[];

    depends: IComponentDepend[];

    singleton: boolean | 'context';

    entry: boolean;

    deprecated: string;

    imports: string[];

    provides: Record<string, string>;
}

export interface IComponent {

    options: IComponentOptions;

    ctor: new (...args: any[]) => any;
}

export interface IModule extends C.IComponent {

    getComponent(): IComponent;
}
