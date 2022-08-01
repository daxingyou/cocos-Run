
import { EffectInfo, ANIMATION_TAG, RoleSkillInfo, EffectConst, GFX_TYPE, EffectAnimationInfo, EffectGfxInfo, TARGET_EFFECT, SORT_EFFECT, EffectMoveInfo } from "./view-actor/CardSkill"
import EditorItemEffect from "./EditorItemEffect";
import { store } from "./store/EditorStore";
import { stateCurrSkill, stateCurrEffect, getSkillDesc } from "./reducers/EditorReducers";
import { actionAddEffectInfo, actionSelectEffect, actionUpdateSkillId, actionUpdateSkill, actionUpdateDesc, actionUpdateTargetEffect, actionUpdateRoleInfo } from "./actions/EditorActions";
import { StateCurrSkill, StateCurrEffect, EditorEvent, EditorActionType } from "./models/EditorConst";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { resourceManager } from "../../../common/ResourceManager";
import Actor from "./view-actor/Actor";
import UICombox from "./components/UICombox";
import skeletonManager from "./view-actor/SkeletonManager";
import EditorUISwitchButton from "./EditorUISwitchButton";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorSkillInfo extends cc.Component {
    @property (cc.EditBox) editId: cc.EditBox = null;
    @property (UICombox) comboxTargetEffect: UICombox = null;
    @property (cc.ScrollView) scroll: cc.ScrollView = null;
    @property (cc.Layout) layout: cc.Layout = null;
    @property (cc.Prefab) prefabItem: cc.Prefab = null;
    @property (UICombox) boxSort: UICombox = null;
    @property (EditorUISwitchButton) btnHide: EditorUISwitchButton = null;

    private _currentId: number = 0;
    private _items = new Map<number, EditorItemEffect>();
    private _itemsPool: EditorItemEffect [] = [];
    private _actorFrom: Actor = null;
    private _sortType: SORT_EFFECT = SORT_EFFECT.DEFAULT;

    onLoad () {
        this._registerEditBoxEvent(this.editId, 'editId');
        store.subscribe(stateCurrSkill, this._onEffectListChange, this);
        store.registerReady(this._onLoadFinish, this);
        store.subscribe(stateCurrEffect, this._onSelectChange, this);
        this.comboxTargetEffect.setHandler((v) => {
            this._onTargetEffectChanged();
        });
        this.comboxTargetEffect.addItem([TARGET_EFFECT.NONE, TARGET_EFFECT.ATTACK, TARGET_EFFECT.STATE, TARGET_EFFECT.LOOP]);

        this.boxSort.setHandler( _v => {
            this._onSkillListSort();
        })
        this.boxSort.addItem([SORT_EFFECT.DEFAULT, SORT_EFFECT.GROUP, SORT_EFFECT.TYPE]);
        this.boxSort.selected = null;

        this.node.on(EditorEvent.COPY_ITEM_EFFECT, this._copyItemEffect, this);

        this.node.on(EditorEvent.FILTER_INDEX_CHANGED, this._onChangeFilterIndex, this)

        this.btnHide.init('', () => {
            this._onHideClick();
        })
    }

    private _onLoadFinish () {
        this._actorFrom = store.sourceRole.node.getComponent(Actor);
    }

    private _onTargetEffectChanged () {
        store.dispatch(actionUpdateTargetEffect(<TARGET_EFFECT>this.comboxTargetEffect.selected));
    }

    private _onSkillListSort () {
        this._sortType = <SORT_EFFECT>this.boxSort.selected;
        this._update(store.getState().stateCurrSkill);
    }

    private _registerEditBoxEvent (editBox: cc.EditBox, name: string) {
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "EditorSkillInfo";
        handler.handler = '_onTextChanged';
        handler.customEventData = name;        
        editBox.textChanged.push(handler);
    }

    private _onTextChanged () {
        const v = parseInt(this.editId.string);
        if (v <= 0) {
            return;
        }

        store.dispatch(actionUpdateSkillId(parseInt(this.editId.string)));
    }

    private _onEffectListChange (cmd: string, state: StateCurrSkill) {
        this._update(state);
    }

    private _onSelectChange (cmd: string, state: StateCurrEffect) {
        this._items.forEach((v, k) => {
            if (k === state.id) {
                v.select = true;
            } else {
                v.select = false;
            }
        });
    }

    private _onChangeFilterIndex(event: cc.Event.EventCustom) {
        let filterIndex = store.filterIndex;
        if(filterIndex > -1) {
            const data = this.data;
            const effectList = data.effectList;
            const filterEffectList = this._getFilterEffectList(effectList, filterIndex);
            this._freeAllItems();
            filterEffectList.forEach(_effect => {
                const item = this._getItem();
                this.layout.node.addChild(item.node);
                item.updateData(_effect, (type, data) => {
                });
                this._items.set(_effect.id, item);
                this._currentId = Math.max(0, _effect.id);
            });
        }
    }

    private _getFilterEffectList(data: EffectInfo[], index: number) {
        return data.filter(_effect => {
            let effectSeq = _effect.seq ? _effect.seq : 0;
            return effectSeq == index;
        });
    }

    private _update (state: StateCurrSkill) {
        this._freeAllItems();

        this.editId.string = state.skillInfo.id + '';

        this.comboxTargetEffect.selected = null;
        this.comboxTargetEffect.selected = state.skillInfo.targetEffect || TARGET_EFFECT.NONE;

        // select
        let effList = state.skillInfo.effectList;
        let effListSort = this._sortList(effList, this._sortType);
        effListSort.forEach(effect => {
            const item = this._getItem();
            this.layout.node.addChild(item.node);
            item.updateData(effect, (type, data) => {
            });
            this._items.set(effect.id, item);
            this._currentId = Math.max(0, effect.id);
        });

        if (state.skillInfo.effectList.length == 0) {
            this._currentId = 0;
        }

        this._updateLayout();

        let lastId = store.getState().stateCurrEffect.id;
        if (this._items.has(lastId)) {
            this._items.get(lastId).select = true;
            return;
        }

        lastId = store.getState().stateCurrEffect.id;
        while (lastId >= 0) {
            if (this._items.has(lastId)) {
                break;
            }
            lastId--;
        }

        if (lastId > 0 ) {
            store.dispatch(actionSelectEffect(lastId));
        } else {
            lastId = store.getState().stateCurrEffect.id;
            while (lastId <= this._currentId) {
                if (this._items.has(lastId)) {
                    break;
                }
                lastId++;
            }
            lastId = lastId > this._currentId ? 0 : lastId;
            store.dispatch(actionSelectEffect(lastId));
        }
    }

    private _sortList (data: EffectInfo[], sortType = SORT_EFFECT.DEFAULT): EffectInfo[] {
        let sorted: EffectInfo[] = [];
        switch (sortType) {
            case SORT_EFFECT.DEFAULT: {
                sorted = data.sort( (_l, _r) => {
                    return _l.id < _r.id? -1:1
                })
                break;
            }
            case SORT_EFFECT.GROUP: {
                sorted = data.sort( (_l, _r) => {
                    let lSeq = _l.seq? _l.seq:0;
                    let rSeq = _r.seq? _r.seq:0;
                    return lSeq < rSeq? -1:1
                })
                break;
            }
            case SORT_EFFECT.TYPE: {
                sorted = data.sort( (_l, _r) => {
                    return _l.tag < _r.tag? -1:1
                })
                break;
            }
            default: {
                sorted = data.sort( (_l, _r) => {
                    return _l.id < _r.id? -1:1
                })
                break;
            }
        }
        return sorted;
    }

    private _freeAllItems () {
        this._items.forEach(item => {
            item.node.removeFromParent(true);
            item.deInit();
            this._itemsPool.push(item);
        });
        this._items.clear();
    }

    private _getItem (): EditorItemEffect {
        if (this._itemsPool.length > 0) {
            return this._itemsPool.shift();
        } else {
            let node = cc.instantiate(this.prefabItem);
            return node.getComponent(EditorItemEffect);
        }
    }

    private _generateId () : number {
        return ++this._currentId;
    }

    private _updateLayout () {
        this.layout.updateLayout();
        this.scroll.content.height = this.layout.node.height;
    }

    get data () : RoleSkillInfo {
        let arrEffect : EffectInfo [] = [];
        this._items.forEach((v, k) => {
            let info: EffectInfo = v.data;
            if (info) {
                arrEffect.push(info);
            }
        })

        let data: RoleSkillInfo = {
            id: parseInt(this.editId.string),
            effectList: arrEffect,
            arrEvent: store.getState().stateCurrSkill.skillInfo.arrEvent,
            arrGroupInfo: store.getState().stateCurrSkill.skillInfo.arrGroupInfo,
            targetEffect: <TARGET_EFFECT>this.comboxTargetEffect.selected,
            desc: getSkillDesc(parseInt(this.editId.string), store.getState()),
            roleInfo: store.getState().stateCurrSkill.skillInfo.roleInfo,
        };

        store.getState().stateCurrSkill.skillInfo.shakes && store.getState().stateCurrSkill.skillInfo.shakes.length > 0 
            && (data.shakes = store.getState().stateCurrSkill.skillInfo.shakes);

        store.getState().stateCurrSkill.skillInfo.shadows &&store.getState().stateCurrSkill.skillInfo.shadows.length > 0
            && (data.shadows = store.getState().stateCurrSkill.skillInfo.shadows);

        store.getState().stateCurrSkill.skillInfo.sfxInfos && store.getState().stateCurrSkill.skillInfo.sfxInfos.url
            &&  store.getState().stateCurrSkill.skillInfo.sfxInfos.url.length > 0
            && (data.sfxInfos = store.getState().stateCurrSkill.skillInfo.sfxInfos);

        return data;
    }

    onClickAdd () {
        let info = {
            id: this._generateId(),
            tag: ANIMATION_TAG.Source_anim,
        };
        store.dispatch(actionAddEffectInfo(info));
        store.dispatch(actionSelectEffect(info.id));
    }

    private _copyItemEffect(event: cc.Event.EventCustom) {
        let info = {...event.detail};
        info.id = this._generateId();
        store.dispatch(actionAddEffectInfo(info));
        store.dispatch(actionSelectEffect(info.id));
    }

    private _parseAnimationDuration (animInfo: EffectAnimationInfo): Promise<number> {
        return new Promise((resolve, reject) => {
            if (EffectConst.isAnimationValid(animInfo)) {
                const duration = skeletonManager.findAnimation(this._actorFrom.skeleton.skeletonData, animInfo.animation).duration;
                resolve(duration);
            } else {
                resolve(0);
            }
        });
    }

    private _parseMoveDuration (move: EffectMoveInfo): Promise<number> {
        return new Promise((resolve, reject) => {
            if (EffectConst.isMoveValid(move)) {
                let moveTime = move.time || 0;
                resolve(moveTime); return;
            } else {
                resolve(0);
            }
        })
    }

    private _parseGfxDuration (gfxInfo: EffectGfxInfo): Promise<number> {
        return new Promise((resolve, reject) => {
            if (EffectConst.isGfxValid(gfxInfo)) {
                switch(gfxInfo.type) {
                    case GFX_TYPE.SKELETON: {
                        const ret = skeletonManager.loadSkeletonData(gfxInfo.skeleton);
                        // @ts-ignore
                        ret.then(skd => {
                            const dura = skeletonManager.findAnimation(skd, gfxInfo.animation).duration;
                            resolve(dura);
                        })
                        // @ts-ignore
                        .catch(err => {
                            logger.warn('Editor', `Can not load spine animation for path = ${gfxInfo.skeleton}`);
                            resolve(0);
                        });
                    } break;
                    case GFX_TYPE.COCOS_ANIMATION: {
                        resourceManager.load(gfxInfo.skeleton, cc.Prefab)
                        .then(info => {
                            const node = cc.instantiate(info.res);
                            const anim = node.getComponent(cc.Animation);
                            if (!anim) {
                                logger.warn('Editor', `Can not find animation for path = ${gfxInfo.skeleton}.`);
                                resolve(0);
                                return;
                            }

                            let dura = 0;
                            anim.getClips().some((clip: { name: string; duration: number; }) => {
                                if (clip.name == gfxInfo.animation) {
                                    dura = clip.duration;
                                    return true;
                                }
                                return false;
                            });
                            resolve(dura);
                        })
                        .catch(err => {
                            logger.warn('Editor', `Can not load cocos prefab animation. path = ${gfxInfo.skeleton}`);
                            resolve(0);
                        })
                    } break;
                    default: resolve(0); return;
                }
            } else {
                resolve(0);
            }
        })
    }

    private _prepareData (): Promise<RoleSkillInfo> {
        return new Promise((resolve, reject) => {
            const skillInfo = this.data;
            let skPromise: Promise<number>[] = [];
            // @ts-ignore
            skillInfo.effectList.forEach((effInfo, index) => {
                if (EffectConst.isGfxValid(effInfo.gfxInfo)) {
                    skPromise.push(this._parseGfxDuration(effInfo.gfxInfo));
                } else if (EffectConst.isMoveValid(effInfo.roleMove)) {
                    skPromise.push(this._parseMoveDuration(effInfo.roleMove));
                } else {
                    skPromise.push(Promise.resolve(null));
                }
            });

            Promise.all(skPromise)
            .then(arrSkd => {
                arrSkd.forEach((dura, index) => {
                    const effInfo = skillInfo.effectList[index];
                    let animStart = 0;
                    let animEnd = 0;
                    if (EffectConst.isAnimationValid(effInfo.animation)) {
                        animStart = effInfo.animation.delay || 0;
                        const duration = skeletonManager.findAnimation(this._actorFrom.skeleton.skeletonData, effInfo.animation.animation).duration;
                        animEnd = animStart + duration;
                    }

                    let gfxStart = 0;
                    let gfxEnd = 0;

                    if (EffectConst.isGfxValid(effInfo.gfxInfo)) {
                        let gfd = dura || 0;
                        if (effInfo.gfxInfo.cuve) {
                            gfd = Math.max(gfd, effInfo.gfxInfo.cuve.duration);
                        }

                        gfxStart = effInfo.gfxInfo.delay || 0;
                        gfxEnd = gfxStart + gfd;
                    }

                    let bulletStart = 0;
                    let bulletEnd = 0;
                    if (EffectConst.isBulletValid(effInfo.bulletInfo)) {
                        let gfd = effInfo.bulletInfo.duration || 0;
                        if (effInfo.bulletInfo.count > 1 && effInfo.bulletInfo.interval > 0) {
                            gfd += ((effInfo.bulletInfo.count - 1) * effInfo.bulletInfo.interval)
                        }

                        bulletStart = effInfo.bulletInfo.delay || 0;
                        bulletEnd = bulletStart + gfd;
                    }

                    let moveStart = 0;
                    let moveEnd = 0;
                    if (EffectConst.isMoveValid(effInfo.roleMove)) {
                        let moveTime = effInfo.roleMove.time || 0;
                     
                        moveStart = effInfo.roleMove.delay || 0;
                        moveEnd = moveStart + moveTime;
                    }

                    effInfo.maxTime =  Math.max(Math.max(animEnd, gfxEnd), Math.max(bulletEnd, moveEnd));
                    effInfo.minTime = Math.min(Math.min(animStart, gfxStart, Math.min(moveStart, bulletStart)));
                });
                resolve(skillInfo);
            })
            .catch(err => {
                reject(err);
            })
        });
    }

    private _onHideClick () {
        if (!this.btnHide.select) {
            this._hideView();
        } else {
            this._showView();
        }
    }

    private _hideView () {
        this.node.children.forEach(v => {
            if (v !== this.btnHide.node) {
                v.active = false;
            }
        });
        this._updateLayout();
    }
    private _showView () {
        this.node.children.forEach(v => {
            v.active = true;
        });
        this._updateLayout();
    }
    
    onSaveClick () {
        if (!this.checkIdValid()) {
            guiManager.showTips(`請設置正確的ID先`);
            return;
        }

        this._prepareData()
        .then(info => {
            store.dispatch(actionUpdateSkill(info));
            // 同时，做一下保存
            store.save();
        })
        .catch(err => {
            guiManager.showTips(`保存失败，请查看控制台得到详细信息！`);
            logger.error('Editor', `prepare data for RoleSkillInfo. err = ${err}`);
        })
    }

    get Id (): number {
        return parseInt(this.editId.string);
    }

    checkIdValid (): boolean {
        return this.Id && this.Id > 0;
    }

    onDescriptionClick () {
        const id = this.Id;
        if (!this.checkIdValid()) {
            guiManager.showTips(`請設置正確的ID先`);
            return;
        }
        guiManager.loadView('EditorDescView', null, getSkillDesc(id, store.getState()) || '', (desc: string) => {
            store.dispatch(actionUpdateDesc(id, desc));
        });
    }
}