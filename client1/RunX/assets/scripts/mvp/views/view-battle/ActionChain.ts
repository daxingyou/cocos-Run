import { logger } from "../../../common/log/Logger";

interface ActionHandlerParam {
    onComplete: () => void;
    onError: (err: any) => void;
    onEvent: (event: string) => void;
}

interface ActionHandler {
    (param: ActionHandlerParam): void;
}

enum ACTION_STATE {
    NONE = 0,
    DOING,
    COMPLETE,
}

class ActionNode {    
    private _name: string;
    private _state = ACTION_STATE.NONE;
    private _parent: ActionNode;
    private _actionHandler: ActionHandler;
    private _completeChilds: ActionNode[] = [];
    private _eventChilds = new Map<string, ActionNode[]>();
    constructor (name: string, action: ActionHandler, parent: ActionNode = null) {
        this._name = name;
        this._parent = parent;
        this._actionHandler = action;
    }

    exec () {
        this._state = ACTION_STATE.DOING;
        this._actionHandler({
            onComplete: () => {
                if (this._state === ACTION_STATE.DOING) {
                    this._onComplete();
                } else {
                    logger.warn('ActionNode', `你已经完成了，就谢谢吧，别完成这么多次. name = ${this._name}`);
                }
            },
            onError: (err: any) => {
                this._onError(err);
            },
            onEvent: (event: string) => {
                this._onEvent(event);
            },
        });
    }

    get state (): ACTION_STATE {
        return this._state;
    }

    private _onComplete () {
        this._state = ACTION_STATE.COMPLETE;
        // 触发complete的Action
        this._completeChilds.forEach(child => {
            child.exec();
        });

        const keys = new Set<string>();
        // 看看当前是否还有event相关的没有处理的？如果有的话，就要报警了！！
        this._eventChilds.forEach((arrActions, key) => {
            arrActions.forEach(action => {
                if (action.state === ACTION_STATE.NONE) {
                    logger.warn('ActionNode', `there still child event action not exec while self alread complete!!. key = ${key}. this.name = ${this.name}`);
                    keys.add(key);
                }
            })
        });

        // 还没有执行的，遗漏的事件，在complete时，自动派发一下子吧，不然有可能会卡死？
        keys.forEach(v => {
            logger.warn('ActionNode', `没有设置Event，最后Complete的时候调用了 key = ${v}`);
            this._onEvent(v);
        });
    }

    /**
     * @desc error 一直向上冒泡
     *
     * @private
     * @param {ActionNode} nodeInst
     * @param {*} err
     * @memberof ActionNode
     */
    private _onError (err: any) {
        if (!this.error(err)) {
            this.parent && this.parent.error(err);
        }
    }

    private _onEvent (event: string) {
        if (this._eventChilds.has(event)) {
            const childs = this._eventChilds.get(event);
            childs.forEach(child => {
                // 防止在事件和onComplete里执行两次
                if (child.state === ACTION_STATE.NONE) {
                    child.exec();
                }
            });
        }
    }

    get name (): string {
        return this._name;
    }

    /**
     * @desc 添加一个Complete的节点
     *
     * @param {ActionNode} child
     * @returns {ActionNode} 返回添加的节点
     * @memberof ActionNode
     */
    append (child: ActionNode): ActionNode {
        this._completeChilds.push(child);
        child.parent = this;
        return this;
    }

    /**
     * @desc 添加一个事件的节点，事件不会冒泡，事件是这个Action派发出来的
     *
     * @param {string} event
     * @param {ActionNode} child
     * @returns {ActionNode}
     * @memberof ActionNode
     */
    on (event: string, child: ActionNode): ActionNode {
        if (this._eventChilds.has(event)) {
            this._eventChilds.get(event).push(child);
        } else {
            this._eventChilds.set(event, [child]);
        }
        return this;
    }

    /**
     * @desc 添加一个子节点，如果条件成立的话
     *
     * @param {ActionNode} child
     * @param {*} condtion
     * @returns {ActionNode}
     * @memberof ActionNode
     */
    appendIf (child: ActionNode, condtion: any): ActionNode {
        if (condtion) {
            return this.append(child);
        } else {
            return this;
        }
    }

    /**
     * @desc 添加一个事件节点
     *
     * @param {string} event
     * @param {ActionNode} child
     * @param {*} condition
     * @returns {ActionNode}
     * @memberof ActionNode
     */
    onIf (event: string, child: ActionNode, condition: any): ActionNode {
        if (condition) {
            return this.on(event, child);
        } else {
            return this;
        }
    }

    error (err: any): boolean {
        return false;
    }

    get parent (): ActionNode {
        return this._parent;
    }

    set parent (v: ActionNode) {
        this._parent = v;
    }

    get root (): ActionNode {
        let self: ActionNode = this;
        while (self.parent) {
            self = self.parent;
        }
        return self;
    }
}

export {
    ActionNode,
    ActionHandler,
    ActionHandlerParam,
}