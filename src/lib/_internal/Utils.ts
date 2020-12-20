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

import * as E from '../Errors';

export class Utils {

    public validateClassType(expr: string): boolean {

        return /^~[a-z_]\w*$/i.test(expr);
    }

    public validateClassName(expr: string): boolean {

        return /^[a-z_]\w*$/i.test(expr);
    }

    public validateFactoryProduct(expr: string): boolean {

        return /^~?[a-z_]\w*$/i.test(expr);
    }

    public validateInjectionExpression(expr: string): boolean {

        return /^~?[a-z_]\w*(@\w+)?$/i.test(expr) || /^@\w+$/i.test(expr);
    }

    public checkInjectionExpression(expr: string): void {

        if (!this.validateInjectionExpression(expr)) {

            throw new E.E_MALFORMED_INJECTION({ injection: expr });
        }
    }

    public checkClassType(expr: string): void {

        if (!this.validateClassType(expr)) {

            throw new E.E_MALFORMED_CLASS_TYPE({ type: expr });
        }
    }

    public checkClassName(expr: string): void {

        if (!this.validateClassName(expr)) {

            throw new E.E_MALFORMED_CLASS_NAME({ name: expr });
        }
    }

    public checkFactoryProduct(expr: string): void {

        if (!this.validateFactoryProduct(expr)) {

            throw new E.E_MALFORMED_PRODUCT({ product: expr });
        }
    }
}
