import { ActionNode } from "../view-battle/ActionChain";

enum QueneType {
    HP = 0,
    TAKE_ATTACK
}

interface QueneData {
    uid: number,
    action: ActionNode,
    type: QueneType
}

class HpAnimationHerlper {
    private _hpQuene = new Map<number, ActionNode[]>();
    private _attackQuene = new Map<number, ActionNode[]>();

    private _getQuene (type: QueneType) {
        let quene: Map<number, ActionNode[]>;
        if (type == QueneType.HP) {
            quene = this._hpQuene;
        } else if (type == QueneType.TAKE_ATTACK) {
            quene = this._attackQuene;
        }
        return quene;
    }

    clear () {
        this._hpQuene.clear();
        this._attackQuene.clear();
    }

    addActionNode (queneData: QueneData) {
        if (!queneData) return;
        
        let quene = this._getQuene(queneData.type);
        if (quene) {
            if (quene.get(queneData.uid)) {
                quene.get(queneData.uid).push(queneData.action);
            } else {
                quene.set(queneData.uid, [queneData.action]);
            }
        }
    }

    checkActionNode (uid: number, type: QueneType) {
        let quene = this._getQuene(type);
        if (quene) {
            if (quene.get(uid) && quene.get(uid).length > 0) {
                return true;
            }
        }
        return false;
    }

    appendActionNode (uid: number, type: QueneType, action: ActionNode) {
        let quene = this._getQuene(type);
        if (quene) {
            if (quene.get(uid) && quene.get(uid).length > 0) {
                let actions = quene.get(uid);
                actions[actions.length - 1].append(action);
            }
        }
    }

    onFinish (uid: number, type: QueneType, action: ActionNode) {
        let quene = this._getQuene(type);
        if (quene) {
            let actions = quene.get(uid);
            if (actions && actions.indexOf(action) >= 0) {
                let index = actions.indexOf(action);
                actions.splice(index, 1);
            }
        }
    }
}

export let hpAnimationHelper = new HpAnimationHerlper();