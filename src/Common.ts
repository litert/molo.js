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
    name?: string;

    /**
     * Filter the component with type, only works when this requires a bulk result.
     */
    types?: string[];

    /**
     * The preferred provider to be used.
     */
    provider?: string;

    parameters?: Record<string, any>;
}

export interface IComponentOptions<T> {

    /**
     * The name of component.
     */
    name: string;

    /**
     * The type of component.
     *
     * **Only used for filter.**
     */
    type: string[];

    /**
     * Mark this as a singleton.
     */
    singleton: boolean;

    /**
     * Specify the target this provider could provides, and mark this component as a provider.
     */
    provides: string;

    bootable: boolean;

    deprecated: string;

    depends: Record<keyof T, string | ICreateObjectOptions>;

    imports: string[];
}

export interface IScanner {

    getAbsolutePath(path: string): string;

    scan(path: string): string[];
}

export interface IRunOptions {

    entry: string;

    args: string[];
}

export interface IHub {

    addNamespace(namespace: string): this;

    hasNamespace(namespace: string): boolean;

    load(options: ILoadOptions): this;

    run(opts: IRunOptions): Promise<void>;

    getObject(opts: ICreateObjectOptions): Promise<any>;

    import(name: string): this;
}

export interface IModule {

    Component<T = any>(opts?: Partial<IComponentOptions<T>>): ClassDecorator;
}

export interface IProvideResult<T> {

    object: T;

    singleton?: boolean;
}

export interface IProvider<T, A> {

    provide(args: A): Promise<IProvideResult<T>>;
}

export interface IBootable {

    main(args: string[]): Promise<void>;
}
