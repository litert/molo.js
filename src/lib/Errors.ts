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

import * as $Exception from '@litert/exception';

export const exceptionRegistry = $Exception.createExceptionRegistry({
    'module': 'molo.litert.org',
    'types': {
        'public': {
            'index': $Exception.createIncreaseCodeIndex(0)
        }
    }
});

export const E_CLASS_NOT_FOUND = exceptionRegistry.register({
    name: 'class_not_found',
    message: 'The determined class does not exist.',
    metadata: {},
    type: 'public'
});

export const E_PRIVATE_CLASS = exceptionRegistry.register({
    name: 'private_class',
    message: 'The determined class is private and unconstructable.',
    metadata: {},
    type: 'public'
});

export const E_MALFORMED_CLASS_NAME = exceptionRegistry.register({
    name: 'malformed_class_name',
    message: 'The name for class is malformed.',
    metadata: {},
    type: 'public'
});

export const E_MALFORMED_PRODUCT = exceptionRegistry.register({
    name: 'malformed_product',
    message: 'The product for a factory method is malformed.',
    metadata: {},
    type: 'public'
});

export const E_MALFORMED_INJECTION = exceptionRegistry.register({
    name: 'malformed_injection',
    message: 'The expression of an injection is malformed.',
    metadata: {},
    type: 'public'
});

export const E_MALFORMED_CLASS_TYPE = exceptionRegistry.register({
    name: 'malformed_class_type',
    message: 'The type for class is malformed.',
    metadata: {},
    type: 'public'
});

export const E_MALFORMED_VAR_NAME = exceptionRegistry.register({
    name: 'malformed_var_name',
    message: 'The name for variable is malformed.',
    metadata: {},
    type: 'public'
});

export const E_METHOD_NOT_FOUND = exceptionRegistry.register({
    name: 'method_not_found',
    message: 'The determined method does not exist.',
    metadata: {},
    type: 'public'
});

export const E_SCOPE_NOT_FOUND = exceptionRegistry.register({
    name: 'scope_not_found',
    message: 'The determined scope does not exist.',
    metadata: {},
    type: 'public'
});

export const E_DUP_SCOPE = exceptionRegistry.register({
    name: 'dup_scope',
    message: 'The determined scope already exists.',
    metadata: {},
    type: 'public'
});

export const E_DUP_INITIALIZER = exceptionRegistry.register({
    name: 'dup_initializer',
    message: 'There is already an initializer declared for the class.',
    metadata: {},
    type: 'public'
});

export const E_DUP_UNINITIALIZER = exceptionRegistry.register({
    name: 'dup_uninitializer',
    message: 'There is already an uninitializer declared for the class.',
    metadata: {},
    type: 'public'
});

export const E_MALFORMED_UNINITIALIZER = exceptionRegistry.register({
    name: 'malformed_uninitializer',
    message: 'The uninitializer method can not have any parameters.',
    metadata: {},
    type: 'public'
});

export const E_LACK_PARAMS = exceptionRegistry.register({
    name: 'lack_params',
    message: 'The injection descriptors of method parameters is lacked.',
    metadata: {},
    type: 'public'
});

export const E_FACTORY_NOT_FOUND = exceptionRegistry.register({
    name: 'factory_not_found',
    message: 'Can not find a way to create the object.',
    metadata: {},
    type: 'public'
});

export const E_INVALID_INJECTION = exceptionRegistry.register({
    name: 'invalid_injection',
    message: 'The injection here will not work.',
    metadata: {},
    type: 'public'
});

export const E_SCOPE_REFERRED = exceptionRegistry.register({
    name: 'scope_referred',
    message: 'The scope has been referred by other scopes.',
    metadata: {},
    type: 'public'
});
