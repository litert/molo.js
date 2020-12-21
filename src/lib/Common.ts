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

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */

export type IClassConstructor = new (...args: any[]) => any;

export type IInjectDecorator = (target: Object, propertyKey: string | symbol, index?: any) => void;

export interface IRegistry {

    /**
     * Mark a method as the initializer of an object that call after build.
     */
    Initializer(): MethodDecorator;

    /**
     * Mark the requirement of an injection of determined dependency.
     *
     * > NOTICE: When using multiple injection on a same method, only the last one will be applied.
     *
     * @param element   The name of the depended element.
     */
    Inject(element: string): IInjectDecorator;

    /**
     * Specify the product of a factory method.
     *
     * > NOTICE: When using multiple provision on a same method, only the last one will be applied.
     *
     * @param element The product the factory method produces.
     */
    Provide(element: string): MethodDecorator;

    /**
     * Mark a class as a singleton.
     */
    Singleton(): ClassDecorator;

    /**
     * Mark the type(s) of the class.
     *
     * @param type  The type(s) of the class.
     */
    Type(type: string[]): ClassDecorator;

    /**
     * Give an alter name of the class.
     *
     * > NOTICE: When using multiple name on a same class, only the last one will be applied.
     *
     * @param name  The alter name of the class.
     */
    Name(name: string): ClassDecorator;

    /**
     * Import the class into global classes space.
     *
     * @param theClass The class to be imported.
     */
    use(theClass: IClassConstructor): this;
}

export interface IScope {

    /**
     * The name of the scope.
     */
    readonly name: string;

    /**
     * Set the key-value pair data in the scope. And the data will be used as aliases.
     *
     * @param alias     The name/alias of data.
     * @param value     The content of data.
     */
    set(alias: string, value: any): void;

    /**
     * Bind an alias/type to a factory method.
     *
     * @param mode      The mode of bind.
     * @param target    The alias or type.
     * @param factory   The factory class name.
     * @param method    The factory method name.
     */
    bind<T extends 'type' | 'alias'>(
        mode: `${T}-factory`,
        target: string,
        factory: string,
        method: string
    ): void;

    /**
     * Bind an alias/type to a class.
     *
     * @param mode      The mode of bind.
     * @param target    The alias or type.
     * @param className The class to bind.
     */
    bind<T extends 'type' | 'alias'>(mode: `${T}-class`, target: string, className: string): void;
}

export interface IInstantiationOptions {

    /**
     * The custom scope. [Default: the global scope]
     */
    scope?: IScope;

    alias?: string;
}

export interface IModuleScanner {

    /**
     * Scan and load modules in specific paths.
     *
     * @param paths         The paths to find the modules.
     * @param filter        The filter of *.js files to be loaded.
     * @param moduleLoader  The load of modules, default to be `require`
     */
    scan(
        paths: string[],
        filter?: (v: string) => boolean,
        moduleLoader?: (v: string) => any
    ): void;
}

export interface IContainer {

    /**
     * Find registered classes by name pattern.
     *
     * @param pattern   The pattern of classes names to be found.
     */
    getClassesByPattern(pattern: RegExp): Record<string, IClassConstructor>;

    /**
     * Find registered classes by types.
     *
     * @param type   The name of types without prefix `~`.
     */
    getClassesByType(type: string[]): Record<string, IClassConstructor>;

    /**
     * Create a custom scope.
     *
     * @param name          The name of the new scope.
     * @param baseScope     The name of the based scope.
     */
    createScope(name: string, baseScope?: string): IScope;

    /**
     * Get a custom scope by name.
     *
     * @param name  The name of the existing scope.
     */
    getScope(name?: string): IScope;

    /**
     * Get the built-in global scope.
     */
    getGlobalScope(): IScope;

    /**
     * Get an object by injection expression.
     *
     * @param injection The injection expression of object to be fetched.
     * @param opts      The options of instantialization.
     */
    get<T>(injection: string, opts?: IInstantiationOptions): Promise<T>;
}
