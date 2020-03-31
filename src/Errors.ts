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

import * as L from '@litert/core';

export const ErrorHub = L.createErrorHub('@litert/molo');

export const E_COMPONENT_DEPRECATED = ErrorHub.define(
    null,
    'E_COMPONENT_DEPRECATED',
    'One of the referred components has been deprecated.',
    {}
);

export const E_OBJECT_NOT_DECLARATION = ErrorHub.define(
    null,
    'E_OBJECT_NOT_DECLARATION',
    'No declaration can be found for the object.',
    {}
);

export const E_DUP_OBJECT_DECLARATION = ErrorHub.define(
    null,
    'E_DUP_OBJECT_DECLARATION',
    'The name of object has been declared somewhere already.',
    {}
);

export const E_INVALID_DOT_PATH = ErrorHub.define(
    null,
    'E_INVALID_DOT_PATH',
    'The dot path is invalid.',
    {}
);

export const E_INVALID_PROVIDE_PATH = ErrorHub.define(
    null,
    'E_INVALID_PROVIDE_PATH',
    'The provided path is invalid.',
    {}
);

export const E_INVALID_OBJECT_NAME = ErrorHub.define(
    null,
    'E_INVALID_OBJECT_NAME',
    'The name of object is invalid.',
    {}
);

export const E_NAMESPACE_NOT_FOUND = ErrorHub.define(
    null,
    'E_NAMESPACE_NOT_FOUND',
    'The determined namespace doesn\'t exist.',
    {}
);

export const E_COMPONENT_NOT_FOUND = ErrorHub.define(
    null,
    'E_COMPONENT_NOT_FOUND',
    'The determined component doesn\'t exist.',
    {}
);

export const E_COMPONENT_NOT_BOOTABLE = ErrorHub.define(
    null,
    'E_COMPONENT_NOT_BOOTABLE',
    'The determined component is not runnable.',
    {}
);

export const E_COMPONENT_NOT_PROVIDABLE = ErrorHub.define(
    null,
    'E_COMPONENT_NOT_PROVIDABLE',
    'The component is not a provider.',
    {}
);

export const E_MISUSED_PROVIDER = ErrorHub.define(
    null,
    'E_MISUSED_PROVIDER',
    'The provider can not provides such component.',
    {}
);

export const E_THIRD_MODULE_NOT_FOUND = ErrorHub.define(
    null,
    'E_THIRD_MODULE_NOT_FOUND',
    'The 3rd module could be loaded.',
    {}
);

export const E_NOT_MOLO_MODULE = ErrorHub.define(
    null,
    'E_NOT_MOLO_MODULE',
    'The determined module doesn\'t supports Molo.',
    {}
);

export const E_UNKNOWN_INJECTION_POSITION = ErrorHub.define(
    null,
    'E_UNKNOWN_INJECTION_POSITION',
    'The injection position is not supported yet.',
    {}
);

export const E_DUP_INJECTION_POSITION = ErrorHub.define(
    null,
    'E_DUP_INJECTION_POSITION',
    'There is already an injection definition in the position.',
    {}
);
