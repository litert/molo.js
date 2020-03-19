import * as C from './Common';
import * as $FS from 'fs';
import * as $Path from 'path';

class SimpleScanner implements C.IScanner {

    public scan(path: string): string[] {

        const ret: string[] = [];

        this._scan(path, ret);

        return ret;
    }

    private _scan(path: string, stack: string[]): void {

        const items = $FS.readdirSync(path);

        if (!path.endsWith('/')) {

            path += '/';
        }

        for (let x of items) {

            if (x.startsWith('.')) {

                continue;
            }

            const fPath = `${path}${x}`;

            if ($FS.statSync(fPath).isDirectory()) {

                this._scan(fPath, stack);
                continue;
            }

            if (x.toLowerCase().endsWith('.js')) {

                stack.push(fPath);
            }
        }
    }

    public getAbsolutePath(path: string): string {

        let ret = $Path.isAbsolute(path) ? path : $Path.resolve(path);

        if (!ret.endsWith('/')) {

            ret += '/';
        }

        return ret;
    }
}

export function createSimpleScanner(): C.IScanner {

    return new SimpleScanner();
}
