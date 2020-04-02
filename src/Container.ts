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

/* eslint-disable @typescript-eslint/no-require-imports */
import * as C from './Common';
import * as I from './Internal';
import * as E from './Errors';

const REGEXP_DOT_PATH = /^[A-Za-z0-9]\w*(\.[A-Za-z0-9]\w*)*$/;
const REGEXP_PROVIDE_PATH = /^[A-Za-z0-9]\w*(\.[A-Za-z0-9]\w*)*(\.\*)?$/;
const REGEXP_DEPEND_PATH = /^&?[A-Za-z0-9]\w*(\.[A-Za-z0-9]\w*)*(\.\*)?$/;

const REGEXP_OBJECT_NAME = /^@@?\w+(\.\w+)*$/;

interface IConstructContext extends Required<C.ICreateObjectOptions> {

    stack: string[];

    component: I.IComponent;

    objects: Record<string, any>;

    target: string;
}

interface INamespace {

    fullName: string;

    namespaces: Record<string, INamespace>;

    components: Record<string, I.IComponent>;
}

interface IProvider {

    component: string;

    method: string;
}

class MoloContainer implements C.IContainer {

    private _ns: INamespace = { fullName: '', namespaces: {}, components: {} };

    private _globalObjects: Record<string, any> = {};

    private _singletons: Record<string, any>;

    private _namedObjectConfigs: Record<string, I.IComponentDepend> = {};

    private _providers: Record<string, IProvider[]> = {};

    private _wilecardProviders: Array<[RegExp, IProvider]> = [];

    private _imported: string[] = [];

    private _entries: string[] = [];

    public constructor() {

        this._singletons = {
            'Molo.Container': this
        };
    }

    public import(name: string): this {

        if (this._imported.includes(name)) {

            return this;
        }

        let packageJson: Record<'molo', string>;
        let moloLoader: (molo: C.IContainer) => void;

        try {

            packageJson = require(`${name}/package.json`);
        }
        catch (e) {

            console.error(e);
            throw new E.E_THIRD_MODULE_NOT_FOUND({ metadata: { name } });
        }

        if (typeof packageJson.molo !== 'string') {

            throw new E.E_NOT_MOLO_MODULE({ metadata: { name } });
        }

        try {

            moloLoader = require(`${name}/${packageJson.molo}`);
        }
        catch (e) {

            console.error(e);
            throw new E.E_THIRD_MODULE_NOT_FOUND({ metadata: { name } });
        }

        moloLoader(this);

        return this;
    }

    private _validateDotPath(path: string): void {

        if (!REGEXP_DOT_PATH.test(path)) {

            throw new E.E_INVALID_DOT_PATH();
        }
    }

    private _validateProvidePath(path: string): void {

        if (!REGEXP_PROVIDE_PATH.test(path)) {

            throw new E.E_INVALID_PROVIDE_PATH();
        }
    }

    private _validateDependPath(path: string): void {

        if (!REGEXP_DEPEND_PATH.test(path)) {

            throw new E.E_INVALID_DOT_PATH();
        }
    }

    private _validateObjectName(name: string): void {

        if (!REGEXP_OBJECT_NAME.test(name)) {

            throw new E.E_INVALID_OBJECT_NAME();
        }
    }

    private _getNamespace(ns: string): INamespace {

        this._validateDotPath(ns);

        const names = ns.split('.');

        let ret = this._ns;

        for (const n of names) {

            ret = ret.namespaces[n];

            if (!ret) {

                throw new E.E_NAMESPACE_NOT_FOUND({ metadata: { path: ns } });
            }
        }

        return ret;
    }

    private _getComponent(path: string): I.IComponent {

        this._validateDotPath(path);

        const pathPieces = path.split('.');

        const ns = this._getNamespace(pathPieces.slice(0, -1).join('.'));

        const ret = ns.components[pathPieces[pathPieces.length - 1]];

        if (!ret) {

            throw new E.E_COMPONENT_NOT_FOUND({ metadata: { path } });
        }

        return ret;
    }

    public hasNamespace(ns: string): boolean {

        try {

            this._getNamespace(ns);

            return true;
        }
        catch {

            return false;
        }
    }

    private _addNamespace(ns: string, root: INamespace): INamespace {

        this._validateDotPath(ns);

        const names = ns.split('.');

        if (!names.length) {

            return root;
        }

        for (const x of names) {

            if (root.namespaces[x]) {

                if (root.components[x]) {

                    throw new E.E_NAME_CONFLICTED({ metadata: {
                        'namespace': root.fullName,
                        'name': x
                    } });
                }

                root = root.namespaces[x];
            }
            else {

                root = root.namespaces[x] = {
                    fullName: root.fullName ? `${root.fullName}.${x}` : x,
                    namespaces: {},
                    components: {}
                };
            }
        }

        return root;
    }

    public addNamespace(ns: string): this {

        this._addNamespace(ns, this._ns);
        return this;
    }

    public load(opts: C.ILoadOptions): this {

        let namespace = this._getNamespace(opts.namespace);

        let root = opts.path.endsWith('/') ? opts.path : `${opts.path}/`;

        const scanResult = opts.scanner.scan(root);

        for (const modulePath of scanResult) {

            this._loadFile(namespace, root, modulePath);
        }

        return this;
    }

    private _loadFile(namespace: INamespace, root: string, file: string): void {

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        let module = require(file);

        if (!module.__molo) {

            return;
        }

        const molo = module.__molo as I.IModule;

        let dotPath = `${namespace.fullName}.${file.slice(root.length, -3).replace(/[/\\]/g, '.')}`;

        this._validateDotPath(dotPath);

        const coms = molo.getComponent();

        if (!coms) {

            return;
        }

        let ns: INamespace;

        if (!coms.options || !coms.ctor) {

            return;
        }

        const lastDotPos = dotPath.lastIndexOf('.');

        const relNSDotPath = dotPath.slice(namespace.fullName.length + 1, lastDotPos);

        if (relNSDotPath) {

            ns = this._addNamespace(relNSDotPath, namespace);
        }
        else {

            ns = namespace;
        }

        this._registerComponent(coms, dotPath.slice(lastDotPos + 1), ns, dotPath);
    }

    private _registerComponent(
        coms: I.IComponent,
        comName: string,
        ns: INamespace,
        dotPath: string,
    ): void {

        if (ns.namespaces[comName]) {

            throw new E.E_NAME_CONFLICTED({ metadata: {
                'namespace': ns.fullName,
                'name': comName
            } });
        }

        ns.components[comName] = coms;

        if (Object.keys(coms.options.provides)) {

            for (const method in coms.options.provides) {

                const targetInterface = coms.options.provides[method];

                this._validateProvidePath(targetInterface);

                if (targetInterface.endsWith('.*')) {

                    this._wilecardProviders.push([
                        new RegExp(`^${targetInterface.replace(/\./g, '\\.').slice(0, -1)}`),
                        {
                            component: dotPath,
                            method
                        }
                    ]);
                }
                else {

                    if (!this._providers[targetInterface]) {

                        this._providers[targetInterface] = [];
                    }

                    this._providers[targetInterface].push({
                        component: dotPath,
                        method
                    });
                }
            }
        }

        if (coms.options.depends) {

            for (let dep of coms.options.depends) {

                this._validateDependPath(dep.target);

                if (dep.name) {

                    this._validateObjectName(dep.name);

                    if (this._namedObjectConfigs[dep.name]) {

                        throw new E.E_DUP_OBJECT_DECLARATION({
                            metadata: { name: dep.name, component: dotPath }
                        });
                    }

                    this._namedObjectConfigs[dep.name] = dep;
                }

                if (dep.provider) {

                    this._validateDotPath(dep.provider);
                }
            }
        }

        for (const mName of coms.options.imports) {

            this.import(mName);
        }

        if (coms.options.entry) {

            this._entries.push(dotPath);
        }
    }

    public async run(opts: C.IRunOptions = {}): Promise<void> {

        if (!this._entries.length) {

            throw new E.E_NO_ENTRIES_DEFINIED();
        }

        if (!opts.entry) {

            if (this._entries.length > 1) {

                throw new E.E_SEVERAL_ENTRIES_DEFINIED();
            }

            opts.entry = this._entries[0];
        }
        else if (!this._entries.includes(opts.entry)) {

            throw new E.E_NOT_ENTRY_COMPONENT({
                metadata: { entry: opts.entry }
            });
        }

        let entryCom = this._getComponent(opts.entry);

        if (!entryCom.options.entry) {

            throw new E.E_NOT_ENTRY_COMPONENT({ metadata: { entry: opts.entry } });
        }

        let entryObj = await this._getObject({
            'stack': [],
            'target': opts.entry,
            'objects': {},
            'interface': [],
            'parameters': {},
            'name': '',
            'provider': '',
            'component': entryCom,
            'optional': false
        });

        if (entryObj.main === undefined) {

            throw new E.E_NOT_ENTRY_COMPONENT({ metadata: { entry: opts.entry } });
        }

        return entryObj.main(opts?.args ?? []);
    }

    public async getObject(opts: C.TCreateInputType<C.ICreateObjectOptions, 'target'>): Promise<any> {

        return this._getObject({
            'stack': [],
            'target': opts.target,
            'component': null as any,
            'objects': opts.objects ?? {},
            'interface': opts.interface ?? [],
            'parameters': opts.parameters ?? {},
            'name': opts.name ?? '',
            'provider': opts.provider ?? '',
            'optional': opts.optional ?? false
        });
    }

    private async _getObject(ctx: IConstructContext): Promise<any> {

        if (ctx.target.startsWith('?')) {

            ctx.target = ctx.target.slice(1);
            ctx.optional = true;
        }

        if (ctx.target.startsWith('@')) {

            return this._getNamedObject(ctx);
        }

        if (this._singletons[ctx.target]) {

            return this._singletons[ctx.target];
        }

        if (ctx.target.endsWith('.*')) {

            return this._getByWildcard(ctx);
        }

        if (ctx.target.startsWith('&')) {

            return this._getComponentConstructor(ctx);
        }

        let provider!: IProvider;

        if (ctx.provider) {

            provider = this._providers[ctx.target]?.find((v) => v.component === ctx.provider)!;
        }

        if (!provider) {

            provider = this._providers[ctx.target]?.[0];

            if (!provider) {

                for (const r of this._wilecardProviders) {

                    if (r[0].test(ctx.target)) {

                        return this._getObjectByProvider(r[1], ctx, true);
                    }
                }
            }
        }

        if (provider) {

            return this._getObjectByProvider(provider, ctx);
        }

        return this._getByComponent(ctx);
    }

    private async _getByWildcard(ctx: IConstructContext): Promise<Record<string, any>> {

        const [prefix, ...rest] = ctx.target.split('*');

        if (rest.length > 1 || rest[0]) {

            throw new E.E_INVALID_DOT_PATH({ metadata: { path: ctx.target } });
        }

        const ret: Record<string, any> = {};

        const filters: Record<string, boolean> = {};

        for (let x of ctx.interface) {

            filters[x] = true;
        }

        if (prefix.startsWith('&')) {

            const ns = this._getNamespace(prefix.slice(1, -1));

            await this._getComponentsInNamespaceR(ns, ctx, ret, ctx.interface.length ? filters : undefined);
        }
        else {

            const ns = this._getNamespace(prefix.slice(0, -1));

            await this._getObjectsInNamespaceR(ns, ctx, ret, ctx.interface.length ? filters : undefined);
        }

        return ret;
    }

    private async _getObjectsInNamespaceR(
        ns: INamespace,
        ctx: IConstructContext,
        ret: Record<string, any>,
        filter?: Record<string, boolean>
    ): Promise<void> {

        for (let x in ns.components) {

            const fullName = `${ns.fullName}.${x}`;

            if (filter && !ns.components[x].options.interfaces.some((v) => filter[v])) {

                continue;
            }

            ret[fullName] = await this._getObject({
                'component': ns.components[x],
                'name': '',
                'objects': ctx.objects,
                'parameters': {},
                'provider': '',
                'stack': ctx.stack,
                'target': fullName,
                'interface': [],
                'optional': ctx.optional
            });
        }

        for (const x in ns.namespaces) {

            await this._getObjectsInNamespaceR(
                ns.namespaces[x],
                ctx,
                ret,
                filter
            );
        }
    }

    private async _getComponentsInNamespaceR(
        ns: INamespace,
        ctx: IConstructContext,
        ret: Record<string, any>,
        filter?: Record<string, boolean>
    ): Promise<void> {

        for (let x in ns.components) {

            const fullName = `${ns.fullName}.${x}`;

            if (filter && !ns.components[x].options.interfaces.some((v) => filter[v])) {

                continue;
            }

            ret[fullName] = ns.components[x].ctor;
        }

        for (const x in ns.namespaces) {

            await this._getObjectsInNamespaceR(
                ns.namespaces[x],
                ctx,
                ret,
                filter
            );
        }
    }

    private async _getComponentConstructor(ctx: IConstructContext): Promise<any> {

        if (!ctx.component) {

            ctx.component = this._getComponent(ctx.target.slice(1));
        }

        return ctx.component.ctor;
    }

    private async _getByComponent(ctx: IConstructContext): Promise<any> {

        if (!ctx.component) {

            try {

                ctx.component = this._getComponent(ctx.target);
            }
            catch (e) {

                if (e instanceof E.E_COMPONENT_NOT_FOUND && ctx.optional) {

                    return null;
                }

                throw e;
            }
        }

        if (ctx.component.options.singleton) {

            if (ctx.objects[ctx.target]) {

                return ctx.objects[ctx.target];
            }

            if (this._singletons[ctx.target]) {

                return this._singletons[ctx.target];
            }
        }

        if (ctx.component.options.deprecated) {

            E.ErrorHub.warn(new E.E_COMPONENT_DEPRECATED({
                message: `Compoonent '${ctx.target}' has been deprecated: ${ctx.component.options.deprecated}.`,
                metadata: { path: ctx.target, deprecated: ctx.component.options.deprecated }
            }));
        }

        let inject4CtorParams: any[] = Array(ctx.component.ctor.length);
        let inject4Props: Record<string, any> = {};
        let inject4Setters: Record<string, any> = {};

        for (const dVar of ctx.component.options.depends) {

            const varVal = await this._getObject({
                'component': null as any,
                'name': '',
                'objects': ctx.objects,
                'parameters': dVar.parameters ?? {},
                'provider': dVar.provider ?? '',
                'stack': [...ctx.stack, ctx.target],
                'target': dVar.target,
                'interface': dVar.interface ?? [],
                'optional': dVar.optional ?? false,
            });

            switch (dVar.injectType) {
                case I.EInjectType.CTOR_PARAM:

                    inject4CtorParams[dVar.injectPos as number] = varVal;
                    break;

                case I.EInjectType.PROP:

                    inject4Props[dVar.injectPos as string] = varVal;
                    break;

                case I.EInjectType.SETTER_FN:

                    inject4Setters[dVar.injectPos as number] = varVal;
                    break;
            }
        }

        let ret = new ctx.component.ctor(...inject4CtorParams);

        for (let k in inject4Props) {

            ret[k] = inject4Props[k];
        }

        for (let k in inject4Setters) {

            ret[k](inject4Setters[k]);
        }

        if (ctx.component.options.singleton === true) {

            this._singletons[ctx.target] = ret;
        }
        else if (ctx.component.options.singleton === 'context') {

            ctx.objects[ctx.target] = ret;
        }

        return ret;
    }

    private async _getObjectByProvider(provider: IProvider, ctx: IConstructContext, wildcard?: boolean): Promise<any> {

        const providerComponent = this._getComponent(provider.component);

        if (!wildcard && providerComponent.options.provides[provider.method] !== ctx.target) {

            throw new E.E_MISUSED_PROVIDER({
                metadata: {
                    stack: ctx.stack,
                    provider,
                    target: ctx.target
                }
            });
        }

        const pdrObj = await this._getObject({
            'component': null as any,
            'name': '',
            'objects': ctx.objects,
            'parameters': {},
            'provider': '',
            'stack': [...ctx.stack, ctx.target],
            'target': provider.component,
            'optional': false,
            'interface': [],
        });

        let result = pdrObj[provider.method]({
            parameters: ctx.parameters,
            target: ctx.target
        }) as C.IProvideResult<{}>;

        if (result instanceof Promise) {

            result = await result;
        }

        if (result.singleton === true) {

            this._singletons[ctx.target] = result.object;
        }
        else if (result.singleton === 'context') {

            ctx.objects[ctx.target] = result.object;
        }

        return result.object;
    }

    private async _getNamedObject(ctx: IConstructContext): Promise<any> {

        if (ctx.target[1] === '@') {

            if (undefined !== this._globalObjects[ctx.target]) {

                return this._globalObjects[ctx.target];
            }
        }
        else if (undefined !== ctx.objects[ctx.target]) {

            return ctx.objects[ctx.target];
        }

        const objCfg = this._namedObjectConfigs[ctx.target];

        if (!objCfg) {

            throw new E.E_OBJECT_NOT_DECLARATION({ metadata: { name: ctx.target } });
        }

        let ret = await this._getObject({
            'component': null as any,
            'name': '',
            'objects': ctx.objects,
            'parameters': objCfg.parameters ?? {},
            'provider': objCfg.provider ?? '',
            'stack': [...ctx.stack, ctx.target],
            'target': objCfg.target,
            'interface': objCfg.interface ?? [],
            'optional': ctx.optional || (objCfg.optional ?? false)
        });

        if (ctx.target[1] === '@') {

            this._globalObjects[ctx.target] = ret;
        }
        else {

            ctx.objects[ctx.target] = ret;
        }

        return ret;
    }
}

export function createContainer(): C.IContainer {

    return new MoloContainer();
}
