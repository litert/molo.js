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

export interface IInjectOptions {

    binds?: Record<string, any>;
}

export interface IRegistry {

    /**
     * Mark a method as the initializer of an object that will be called after built.
     */
    Initializer(): MethodDecorator;

    /**
     * Mark a method as the uninitializer of an object that will be called before destroying.
     */
    Uninitializer(): MethodDecorator;

    /**
     * Mark the requirement of an injection of determined dependency.
     *
     * > NOTICE: When using multiple injection on a same method, only the last one will be applied.
     *
     * @param expr   The expression of the depended element.
     * @param opts   The extra options of injection.
     */
    Inject(expr: string, opts?: IInjectOptions): IInjectDecorator;

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
     * Mark a class as unconstructable.
     */
    Private(): ClassDecorator;

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
     * @param name      The alter name of the class.
     */
    Name(name: string): ClassDecorator;

    /**
     * Setup the prefix of class name.
     *
     * > NOTICE: When using multiple prefix on a same class, only the last one will be applied.
     *
     * @param prefix    The prefix of class alter name.
     */
    Prefix(prefix: string): ClassDecorator;

    /**
     * Import the class into global classes space.
     *
     * @param theClass The class to be imported.
     */
    use(...theClass: IClassConstructor[]): this;
}

export interface IScope {

    /**
     * The name of the scope.
     */
    readonly name: string;

    /**
     * Bind a varaible with determined value.
     *
     * @param varName   The name of variable.
     * @param val       The value of varibale.
     */
    bindValue(varName: string, val: any): this;

    /**
     * Bind an express with another express.
     *
     * @param expr      The source express
     * @param dest      The target express
     * @param extBinds  The optional extra binds.
     */
    bind(expr: string, dest: string, extBinds?: Record<string, any>): this;

    /**
     * Bind the value or injection express for the context.
     */
    bindContext(expr: string, context: Record<string, any>): this;
}

export interface IInstantiationOptions {

    /**
     * The custom scope. [Default: the global scope]
     */
    scope?: IScope;

    /**
     * The context bindings for injections.
     */
    binds?: Record<string, any>;
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
     * Free up all data insides container or specific scope.
     */
    destroy(scope?: string): Promise<void>;

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
    createScope(name: string, baseScope?: string | IScope): IScope;

    /**
     * Get a custom scope by name.
     *
     * @param name  The name of the existing scope.
     */
    getScope(name?: string): IScope;

    /**
     * Get an object by injection expression.
     *
     * @param injection The injection expression of object to be fetched.
     * @param opts      The options of instantialization.
     */
    get<T>(injection: string, opts?: IInstantiationOptions): Promise<T>;
}
