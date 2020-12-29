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

import { ISourceExpress, ITargetExpress } from '.';
import * as E from '../Errors';

const REGEXP_SRC_EXPR = /^((~?)([a-z_]\w*(\.[a-z_]\w*)*))?(@([a-z_]\w*(\.[a-z_]\w*)*))?$/i;
const REGEXP_DST_EXPR = /^(\??)(((~?)([a-z_]\w*(\.[a-z_]\w*)*))?(@([a-z_]\w*(\.[a-z_]\w*)*))?)(::(\w+|\*))?$/i;
const REGEXP_CLASS_NAME = /^[a-z_]\w*(\.[a-z_]\w*)*$/i;
const REGEXP_TYPE_NAME = /^~[a-z_]\w*(\.[a-z_]\w*)*$/i;
const REGEXP_VAR_NAME = /^[a-z_]\w*(\.[a-z_]\w*)*$/i;
const REGEXP_PRODUCT = /^(~?)([a-z_]\w*(\.[a-z_]\w*)*)$/i;

export class Utils {

    public validateClassType(expr: string): boolean {

        return REGEXP_TYPE_NAME.test(expr);
    }

    public validateVarName(expr: string): boolean {

        return REGEXP_VAR_NAME.test(expr);
    }

    public validateClassName(expr: string): boolean {

        return REGEXP_CLASS_NAME.test(expr);
    }

    public validateFactoryProduct(expr: string): boolean {

        return REGEXP_PRODUCT.test(expr);
    }

    public checkSourceExpression(expr: string): void {

        let re = REGEXP_SRC_EXPR.exec(expr);

        if (!re || (!re[1] && !re[5])) {

            throw new E.E_MALFORMED_INJECTION({ expr });
        }
    }

    public parseSourceExpression(expr: string): ISourceExpress {

        let re = REGEXP_SRC_EXPR.exec(expr);

        if (!re || (!re[1] && !re[5])) {

            throw new E.E_MALFORMED_INJECTION({ expr });
        }

        return {
            fullExpr: expr,
            'typeExpr': re[1],
            'typeName': re[3],
            'isAbstract': !!re[2],
            'varName': re[6],
            'varExpr': re[5],
        };
    }

    public checkTargetExpression(expr: string): void {

        let re = REGEXP_DST_EXPR.exec(expr);

        if (!re || (!re[6] && !re[2])) {

            throw new E.E_MALFORMED_INJECTION({ expr });
        }
    }

    public parseTargetExpression(expr: string): ITargetExpress {

        let re = REGEXP_DST_EXPR.exec(expr);

        if (!re || (!re[6] && !re[2])) {

            throw new E.E_MALFORMED_INJECTION({ expr });
        }

        const ret: ITargetExpress = {
            fullExpr: expr,
            'typeExpr': re[3],
            'typeName': re[5],
            'isAbstract': !!re[4],
            'varExpr': re[7],
            'varName': re[8],
            'optional': !!re[1],
            'factoryMethod': re[11],
            'factoryExpr': re[2]
        };

        if (ret.factoryMethod && !ret.typeName && !ret.varName) {

            throw new E.E_MALFORMED_INJECTION({ expr });
        }

        return ret;
    }

    public checkClassType(expr: string): void {

        if (!this.validateClassType(expr)) {

            throw new E.E_MALFORMED_CLASS_TYPE({ type: expr });
        }
    }

    public checkVarName(expr: string): void {

        if (!this.validateVarName(expr)) {

            throw new E.E_MALFORMED_VAR_NAME({ name: expr });
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
