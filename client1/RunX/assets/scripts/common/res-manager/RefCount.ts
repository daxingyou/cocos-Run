

class RefCount<Type>{
    private _res: any = null;
    private _count: number = 0;
    constructor (res: Type) {
        this._res = res;
        this._count = 1;
    }

    get asset (): Type {
        return this._res;
    }

    retain (): number {
        return ++this._count;
    }

    release (): number {
        return --this._count;
    }

    get ref (): number {
        return this._count;
    }
}

export default RefCount;