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

import * as I from '.';

export class MethodDescriptor implements I.IMethodDescriptor {

    public readonly isFactoryMethod: boolean;

    public constructor(
        public readonly name: string,
        public readonly parent: string,
        public readonly product: string,
        public readonly parameters: I.IInjectOptions[],
    ) {

        this.isFactoryMethod = !!product;
    }
}
