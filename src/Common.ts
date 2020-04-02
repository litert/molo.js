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

export interface ILoadOptions {

    namespace: string;

    scanner: IScanner;

    path: string;

    base?: string;
}

export interface ICreateObjectOptions {

    target: string;

    /**
     * Give this object a name to make it reusable.
     *
     * The name must be start `@`.
     *
     * An named object's lifetime is the whole build time. But if an object's name starts with `@@`,
     * it will become a global object and persistent.
     */
    name: string;

    /**
     * Filter the component with interface, only works when this requires a bulk result.
     */
    interface: string[];

    /**
     * The preferred provider to be used.
     */
    provider: string;

    parameters: Record<string, any>;

    /**
     * The initial objects pool.
     */
    objects: Record<string, any>;

    /**
     * Mark as an optional dependency.
     */
    optional: boolean;
}

export interface IScanner {

    getAbsolutePath(path: string): string;

    scan(path: string): string[];
}

export interface IRunOptions {

    entry?: string;

    args?: string[];
}

export type TCreateInputType<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;

export interface IContainer {

    addNamespace(namespace: string): this;

    hasNamespace(namespace: string): boolean;

    load(options: ILoadOptions): this;

    run(opts?: IRunOptions): Promise<void>;

    getObject(opts: TCreateInputType<ICreateObjectOptions, 'target'> | string): Promise<any>;

    import(name: string): this;
}

export type TMixDecorator = (target: any, propertyKey: string | symbol, index?: any) => void;

export interface IComponent {

    /**
     * Mark a class as a component.
     *
     * > Duplicated calls for a same class will be ignored.
     *
     * @decorator
     */
    Component(): ClassDecorator;

    /**
     * Mark a class as a singleton.
     *
     * > Duplicated calls for a same class, the previous setting will be overwritten.
     *
     * @decorator
     *
     * @param singleton The singleton status.
     */
    Singleton(singleton?: boolean | 'context'): ClassDecorator;

    /**
     * Bind a class with an interface.
     *
     * > Duplicated calls for a same class, the previous setting will be overwritten.
     *
     * @decorator
     *
     * @param name The name of interface that this class implemented
     */
    Interface(name: string): ClassDecorator;

    /**
     * Mark a class as an entry component.
     *
     * > Duplicated calls for a same class will be ignored.
     *
     * @decorator
     */
    Entry(): ClassDecorator;

    /**
     * Mark a class as deprecated.
     *
     * > Duplicated calls for a same class, the previous setting will be overwritten.
     *
     * @decorator
     *
     * @param msg The message shown for tips.
     */
    Deprecated(msg?: string): ClassDecorator;

    /**
     * Declare a third module as a dependency.
     *
     * > Duplicated calls is allowed for a same class.
     *
     * @decorator
     *
     * @param singleton The name of depended third module.
     */
    Import(mod: string): ClassDecorator;

    /**
     * Declare a method as a component provider.
     *
     * > Duplicated calls is allowed for a same method.
     *
     * @decorator
     *
     * @param target The target that the provider could provides.
     */
    Provides(target: string): MethodDecorator;

    /**
     * Declare an injection for constructor parameters, setter methods, properties.
     *
     * > Duplicated calls for a same injection position will be ignored.
     *
     * @decorator
     *
     * @param opts The options of injection.
     */
    Inject(opts: TCreateInputType<ICreateObjectOptions, 'target'> | string): TMixDecorator;
}

export interface IProvideResult<T> {

    object: T;

    singleton?: boolean | 'context';
}

export interface IProvideOptions<A> {

    parameters: A;

    target: string;
}

export interface IEntry {

    main(args: string[]): Promise<void>;
}
