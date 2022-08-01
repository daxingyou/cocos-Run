export class BattleArray  {
    private _battleArray: Map<number, number[]> = new Map<number, number[]>();

    get value () {
        return this._battleArray;
    }

    get size () {
        return this._battleArray.size;
    }

    get (v: number) {
       return this._battleArray.get(v) || [0, 0, 0, 0, 0]
    }

    set (step: number, data: number[]) {
        this._battleArray.set(step, data)

        for (let i = 0; i < this._battleArray.size; i++) {
            if (i == step) continue;

            let v = this._battleArray.get(i)
            if (v) {
                for (let j = 0; j < data.length; j++) {
                    let index = v.indexOf(data[j])
                    if (index != -1 && data[j]) {
                        v[index] = 0;
                    }
                }
            }
        }
    }

    clear () {
        this._battleArray.clear();
    }

    checkDuplicate (vIDs: number[], except: number): number {
        let find = -1;
        for (let i = 0; i < this._battleArray.size; i++) {
            if (i == except) continue;

            let v = this._battleArray.get(i)
            if (v) {
                for (let j = 0; j < vIDs.length; j++) {
                    let index = v.indexOf(vIDs[j])
                    if (index != -1 && vIDs[j]) {
                        find = i;
                        break;
                    }
                }
            }
        }
        return find;
    }
}