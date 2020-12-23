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

/* eslint-disable @typescript-eslint/unified-signatures */
import { IReflectManager } from '@litert/reflect';
import * as C from '../Common';

export interface IRegistry {

    getClassManager(): IClassManager;

    getReflectObject(): IReflectManager;
}

export interface IMethodDescriptor {

    /**
     * The name of method.
     */
    readonly name: string;

    /**
     * Tell if the method is a factory method.
     */
    readonly isFactoryMethod: boolean;

    /**
     * The name of class this method belongs to.
     */
    readonly parent: string;

    /**
     * The element this method could produces.
     */
    readonly product: string;

    /**
     * The types of element for each parameter.
     */
    readonly parameters: readonly IInjectOptions[];
}

export interface IClassDescriptor {

    /**
     * The name of this class.
     */
    readonly name: string;

    /**
     * The constructor of this class.
     */
    readonly ctor: C.IClassConstructor;

    /**
     * The types of this class.
     */
    readonly types: string[];

    /**
     * Determined whether this class has factory methods.
     */
    readonly isFactory: boolean;

    /**
     * Determined whether this class is a singleton.
     */
    readonly isSingleton: boolean;

    /**
     * Determined whether this class is unconstructable.
     */
    readonly isPrivate: boolean;

    /**
     * The types of element for each parameter.
     */
    readonly parameters: readonly IInjectOptions[];

    /**
     * The types of element for each property.
     */
    readonly properties: Record<string, IInjectOptions>;

    /**
     * The initializer function name of the class.
     */
    readonly initializer: string;

    /**
     * The uninitializer function name of the class.
     */
    readonly uninitializer: string;

    /**
     * Get the descriptor of determined method.
     *
     * @param name  The name of method.
     */
    getMethod(name: string): IMethodDescriptor;

    /**
     * Get names list of all methods in this class.
     */
    getMethodNames(): string[];

    /**
     * Find the factory methods that produces determined type.
     *
     * @param type The name of type, without prefix `~`
     */
    findFactoryMethodsByType(type: string): IMethodDescriptor[];

    /**
     * Find the factory methods that produces determined class instance.
     *
     * @param className The name of class.
     */
    findFactoryMethodsByClass(className: string): IMethodDescriptor[];
}

export interface IClassManager {

    findClassByObject<T extends Record<string, any>>(object: T): IClassDescriptor;

    /**
     * Find the classes belongs to determined type.
     *
     * @param type The name of type, without prefix `~`
     */
    findClassesByType(type: string): IClassDescriptor[];

    /**
     * Find the classes that name matches the RegExp.
     *
     * @param pattern The pattern of name.
     */
    findClassesByNamePattern(pattern: RegExp): IClassDescriptor[];

    /**
     * Find the factory methods that produces determined type.
     *
     * @param type The name of type, without prefix `~`
     */
    findFactoryMethodsByType(type: string): IMethodDescriptor[];

    /**
     * Find the factory methods that produces determined class instance.
     *
     * @param className The name of class.
     */
    findFactoryMethodsByClass(className: string): IMethodDescriptor[];

    add(theClass: C.IClassConstructor): void;

    /**
     * Tell if a class exists by name.
     */
    has(name: string): boolean;

    get(name: string): IClassDescriptor;

    getNames(): string[];
}

export interface IClassBind<TMode extends 'type' | 'alias', TType extends 'class' | 'factory'> {

    type: `${TMode}-${TType}`;

    className: string;
}

export interface IFactoryBind<TMode extends 'type' | 'alias'> extends IClassBind<TMode, 'factory'> {

    methodName: string;
}

export interface IScope extends C.IScope {

    addUninitializer(obj: any, method: string): this;

    release(): Promise<void>;

    findBindByAlias(alias: string): IClassBind<'alias', 'class'> | IFactoryBind<'alias'>;

    findBindByType(type: string): IClassBind<'type', 'class'> | IFactoryBind<'type'>;

    /**
     * Get an object in the scope.
     *
     * @param name  The name of object.
     */
    get(name: string): any;

    /**
     * Get the singleton of determined class.
     *
     * @param name  The name of class.
     */
    getSingleton(name: string): any;

    /**
     * Set the singleton of determined class.
     *
     * @param name  The name of class.
     */
    setSingleton(name: string, singleton: any): void;
}

export interface IBuilder {

    /**
     * Build an object.
     *
     * @param injection     The injection expression of new object.
     * @param scope         The scope of the object.
     * @param alias         The alias of the new object.
     */
    build(injection: string, scope: IScope, alias?: string): any;
}

export interface IInjectOptions {

    injection: string;
}
