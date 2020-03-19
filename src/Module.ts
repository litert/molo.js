import * as C from './Common';
import * as I from './Internal';
import * as E from './Errors';

class MoloModule implements I.IModule {

    private _component!: I.IComponent;

    public constructor(module: NodeJS.Module) {

        module.exports.__molo = this;
    }

    public getComponent(): I.IComponent {

        return this._component;
    }

    public Component(opts: Partial<C.IComponentOptions<any>> = {}): ClassDecorator {

        return <T extends Function>(target: T): void | T => {

            if (this._component) {

                throw new E.E_MULTI_COMPONENT_IN_FILE();
            }

            this._component = {
                'options': {
                    'name': opts.name ?? '',
                    'depends': opts.depends ?? {},
                    'imports': opts.imports ?? [],
                    'singleton': !!opts.singleton,
                    'type': opts.type ?? [],
                    'deprecated': opts.deprecated ?? '',
                    'bootable': !!opts.bootable,
                    'provides': opts.provides ?? ''
                },
                'ctor': target as any
            };

            return target;
        };
    }
}

export function Molo(module: NodeJS.Module): C.IModule {

    return new MoloModule(module);
}
