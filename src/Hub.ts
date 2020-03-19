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

class Hub implements C.IHub {

    private _ns: INamespace = { fullName: '', namespaces: {}, components: {} };

    private _globalObjects: Record<string, any> = {};

    private _singletons: Record<string, any>;

    private _namedObjectConfigs: Record<string, C.ICreateObjectOptions> = {};

    private _providers: Record<string, string[]> = {};

    private _imported: string[] = [];

    public constructor() {

        this._singletons = {
            'Molo.Hub': this
        };
    }

    public import(name: string): this {

        if (this._imported.includes(name)) {

            return this;
        }

        let packageJson: Record<'molo', string>;
        let moloLoader: (molo: C.IHub) => void;

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

        let coms = molo.getComponents();

        if (!coms.length) {

            return;
        }

        let ns: INamespace;

        if (coms.length === 1) {

            const lastDotPos = dotPath.lastIndexOf('.');

            const relNSDotPath = dotPath.slice(namespace.fullName.length + 1, lastDotPos);

            if (relNSDotPath) {

                ns = this._addNamespace(relNSDotPath, namespace);
            }
            else {

                ns = namespace;
            }

            if (!coms[0].options.name) {

                coms[0].options.name = dotPath.slice(lastDotPos + 1);
            }

            this._registerComponent(coms[0], ns, dotPath);
        }
        else {

            ns = this._addNamespace(dotPath.slice(namespace.fullName.length + 1), namespace);

            for (const item of coms) {

                if (!item.options.name) {

                    item.options.name = item.ctor.name;
                }

                this._registerComponent(item, ns, `${dotPath}.${item.options.name}`);
            }
        }
    }

    private _registerComponent(
        coms: I.IComponent,
        ns: INamespace,
        dotPath: string,
    ): void {

        ns.components[coms.options.name] = coms;

        if (coms.options.provides) {

            this._validateDotPath(coms.options.provides);

            if (!this._providers[coms.options.provides]) {

                this._providers[coms.options.provides] = [];
            }

            this._providers[coms.options.provides].push(dotPath);
        }

        if (coms.options.depends) {

            for (let k in coms.options.depends) {

                const dep = coms.options.depends[k];

                if (typeof dep === 'string') {

                    if (dep.startsWith('@')) {

                        this._validateObjectName(dep);
                    }
                    else {

                        this._validateDependPath(dep);
                    }
                }
                else {

                    this._validateDependPath(dep.target);

                    if (dep.name) {

                        this._validateObjectName(dep.name);

                        if (this._namedObjectConfigs[dep.name]) {

                            throw new E.E_DUP_OBJECT_DECLARATION({
                                metadata: { name: dep.name }
                            });
                        }

                        this._namedObjectConfigs[dep.name] = dep;

                        coms.options.depends[k] = dep.name;
                    }

                    if (dep.provider) {

                        this._validateDotPath(dep.provider);
                    }
                }
            }
        }

        for (const mName of coms.options.imports) {

            this.import(mName);
        }
    }

    public async run(opts: C.IRunOptions): Promise<void> {

        let entryCom = this._getComponent(opts.entry);

        if (!entryCom.options.bootable) {

            throw new E.E_COMPONENT_NOT_BOOTABLE({ metadata: { entry: opts.entry } });
        }

        let entryObj = await this._getObject({
            'stack': [],
            'target': opts.entry,
            'objects': {},
            'types': [],
            'parameters': {},
            'name': '',
            'provider': '',
            'component': entryCom
        });

        if (entryObj.main === undefined) {

            throw new E.E_COMPONENT_NOT_BOOTABLE({ metadata: { entry: opts.entry } });
        }

        return entryObj.main(opts.args);
    }

    public async getObject(opts: C.ICreateObjectOptions): Promise<any> {

        return this._getObject({
            'stack': [],
            'target': opts.target,
            'component': null as any,
            'objects': {},
            'types': opts.types ?? [],
            'parameters': opts.parameters ?? {},
            'name': opts.name ?? '',
            'provider': opts.provider ?? ''
        });
    }

    private async _getObject(ctx: IConstructContext): Promise<any> {

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

        let provider = ctx.provider;

        if (provider) {

            if (!this._providers[ctx.target] || !this._providers[ctx.target].includes(provider)) {

                throw new E.E_MISUSED_PROVIDER({
                    metadata: { provider: ctx.provider, component: ctx.target }
                });
            }
        }
        else {

            provider = this._providers[ctx.target]?.[0];
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

        for (let x of ctx.types) {

            filters[x] = true;
        }

        if (prefix.startsWith('&')) {

            const ns = this._getNamespace(prefix.slice(1, -1));

            await this._getComponentsInNamespaceR(ns, ctx, ret, ctx.types.length ? filters : undefined);
        }
        else {

            const ns = this._getNamespace(prefix.slice(0, -1));

            await this._getObjectsInNamespaceR(ns, ctx, ret, ctx.types.length ? filters : undefined);
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

            if (filter && !ns.components[x].options.type.some((v) => filter[v])) {

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
                'types': [],
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

            if (filter && !ns.components[x].options.type.some((v) => filter[v])) {

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

            ctx.component = this._getComponent(ctx.target);
        }

        if (ctx.component.options.singleton && this._singletons[ctx.target]) {

            return this._singletons[ctx.target];
        }

        if (ctx.component.options.deprecated) {

            E.ErrorHub.warn(new E.E_COMPONENT_DEPRECATED({
                message: `Compoonent '${ctx.target}' has been deprecated: ${ctx.component.options.deprecated}.`,
                metadata: { path: ctx.target, deprecated: ctx.component.options.deprecated }
            }));
        }

        let deps: Record<string, any> = {};

        for (const dVar in ctx.component.options.depends) {

            const dep = ctx.component.options.depends[dVar];

            if (typeof dep === 'string') {

                deps[dVar] = await this._getObject({
                    'component': null as any,
                    'name': '',
                    'objects': ctx.objects,
                    'parameters': {},
                    'provider': '',
                    'stack': [...ctx.stack, ctx.target],
                    'target': dep,
                    'types': [],
                });
            }
            else {

                deps[dVar] = await this._getObject({
                    'component': null as any,
                    'name': '',
                    'objects': ctx.objects,
                    'parameters': dep.parameters ?? {},
                    'provider': dep.provider ?? '',
                    'stack': [...ctx.stack, ctx.target],
                    'target': dep.target,
                    'types': dep.types ?? [],
                });
            }
        }

        let ret = new ctx.component.ctor(deps, ctx.parameters);

        if (ctx.component.options.singleton) {

            this._singletons[ctx.target] = ret;
        }

        return ret;
    }

    private async _getObjectByProvider(provider: string, ctx: IConstructContext): Promise<any> {

        const pdrObj = await this._getObject({
            'component': null as any,
            'name': '',
            'objects': ctx.objects,
            'parameters': {},
            'provider': '',
            'stack': [...ctx.stack, ctx.target],
            'target': provider,
            'types': [],
        });

        let result = pdrObj.provide(ctx.parameters) as C.IProvideResult<{}>;

        if (result instanceof Promise) {

            result = await result;
        }

        if (result.singleton) {

            this._singletons[ctx.target] = result.object;
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
            'types': objCfg.types ?? [],
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

export function createHub(): C.IHub {

    return new Hub();
}
