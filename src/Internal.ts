import * as C from './Common';

export interface IComponent {

    options: C.IComponentOptions<any>;

    ctor: new (...args: any[]) => any;
}

export interface IModule extends C.IModule {

    getComponent(): IComponent;
}
