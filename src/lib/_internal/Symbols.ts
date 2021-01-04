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

export const K_INJECTION = Symbol('litert:molo:injection');

export const K_IS_SINGLETON = Symbol('litert:molo:singleton');

export const K_IS_PRIVATE = Symbol('litert:molo:private');

export const K_INITIALIZER = Symbol('litert:molo:initializer');

export const K_UNINITIALIZER = Symbol('litert:molo:uninitializer');

export const K_PRODUCT = Symbol('litert:molo:product');

export const K_CLASS_NAME = Symbol('litert:molo:class:name');

export const K_CLASS_NAME_PREFIX = Symbol('litert:molo:class:name:prefix');

export const K_TYPES = Symbol('litert:molo:types');

export const K_GLOBAL_SCOPE = Symbol('litert:molo:scope:global') as any as string;

export const K_INJECTION_EXPR = Symbol('litert:molo:injection:expr') as any as string;
