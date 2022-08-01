import { ROLE_TYPE } from "../../../app/AppEnums";
import FloatTips from "../../../common/components/FloatTips";
import { configManager } from "../../../common/ConfigManager";
import guiManager from "../../../common/GUIManager";
import { logger } from "../../../common/log/Logger";
import { preloadHitLabelPool } from "../../../common/res-manager/Preloaders";
import resourceLoader from "../../../common/res-manager/ResourceLoader";
import scheduleManager from "../../../common/ScheduleManager";
import StepWork from "../../../common/step-work/StepWork";
import UIBTRoleCtrl from "../view-battle/UIBTRoleCtrl";
import ItemRole, { CLICK_TYPE } from "../view-item/ItemRole";
import LoadingView from "../view-loading/LoadingView";
import WaitingView from "../view-loading/WaitingView";
import engineHook from "./EditorGameHook";
import EditorSkillInfo from "./EditorSkillInfo";
import EditorUIBar from "./EditorUIBar";
import EditorUIRoleSelector from "./EditorUIRoleSelector";
import EditorUtils from "./EditorUtils";
import { rootReducer } from "./reducers/EditorReducers";
import { store } from "./store/EditorStore";
import shakeManager from "./view-actor/ShakeManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SkillEditor extends cc.Component {
    @property(cc.Camera)        camera: cc.Camera = null;
    @property(cc.Node)          rootNode: cc.Node = null;
    @property(FloatTips)        floatTips: FloatTips = null;
    @property(EditorSkillInfo)  currSkill: EditorSkillInfo = null;
    @property(EditorUIBar)      UIPlayBar: EditorUIBar = null;
    @property(LoadingView)      loading: LoadingView = null;
    @property(cc.Prefab)        prefabHero: cc.Prefab = null;
    @property(cc.Prefab)        prefabMonster: cc.Prefab = null;
    @property (WaitingView)     waitingView: WaitingView = null;
    @property (cc.Node)         nodeView: cc.Node = null;

    @property(cc.Node)          nodeSubHero: cc.Node[] = [];
    @property(cc.Node)          nodeSubMonsters: cc.Node[] = [];
    @property(EditorUIRoleSelector) roleSelector: EditorUIRoleSelector = null;
    @property(cc.Node) shadeNode: cc.Node = null;
    @property(UIBTRoleCtrl)     roleCtrl: UIBTRoleCtrl = null;

    private static _ins: SkillEditor = null;

    static getInstance(): SkillEditor{
        return SkillEditor._ins;
    }

    onLoad () {
        SkillEditor._ins = this;
        this.setShadeVisible(false);
        configManager.init();
        guiManager.init({sceneNode: this.node, tips: this.floatTips, loadingView: this.loading, waitingView: this.waitingView, gameloadingNode: this.node, labelVersion: null}, this.nodeView);
        scheduleManager.init(this);
        shakeManager.setCameraAndRoot(this.camera, null);

        const stepWork = new StepWork()
        // stepWork.concact(preloadMaterial());
        stepWork.concact(preloadHitLabelPool());
        stepWork
        .addTask((finHandler: Function) => {
            this._createRoleNode(finHandler);
        }, 'loadRoleNode', 10)
        .addTask((finHandler: Function) => {
            console.log(`load skeleton gfx`);
            this._loadGfxSkeleton(finHandler);
        }, 'skeleton', 10)
        .addTask((finHandler: Function) => {
            console.log(`load skeleton Role`);
            this._loadRoleSkeleton(finHandler);
        }, 'skeleton', 10)
        .addTask((finHandler: Function) => {
            console.log(`load _loadGfxCocosAnimation gfx`);
            this._loadGfxCocosAnimation(finHandler);
        }, 'cocosAnimation', 10)
        .addTask((finHandler: Function) => {
            console.log(`load _loadGfxCocosPrefab gfx`);
            this._loadGfxCocosPrefab(finHandler);
        }, 'cocosPrefab', 10)
        .addTask(() => {
            console.log(`load initialize gfx`);
            store.initialize(rootReducer);
        }, 'start', 1);

        engineHook.initialize();
        resourceLoader.captureSystem();

        cc.debug.setDisplayStats(false);

        guiManager.showLoading(() => {
            stepWork.start(() => {
                guiManager.hideLoading();
            });
        });
    }

    private  _createRoleNode (finHandler: Function) {
        this.nodeSubHero.forEach( (_n, _idx) => {
            let nHero = cc.instantiate(this.prefabHero);
            _n.addChild(nHero, 1, "Hero" + _idx);
            let itemRole = nHero.getComponent(ItemRole);
            itemRole.setHandler(this._clickRole.bind(this));
            itemRole.roleType = ROLE_TYPE.HERO;
            itemRole.roleCtrl = this.roleCtrl;
            itemRole.setRolePos(_idx);
            if (_idx == 2) {
                store.sourceRole = itemRole;
            }
        })

        this.nodeSubMonsters.forEach( (_n, _idx) => {
            let nMonster = cc.instantiate(this.prefabHero);
            _n.addChild(nMonster, 1, "Monster" + _idx);
            let itemRole = nMonster.getComponent(ItemRole);
            itemRole.roleCtrl = this.roleCtrl;
            itemRole.setHandler(this._clickRole.bind(this));
            itemRole.roleType = ROLE_TYPE.MONSTER;
            itemRole.setRolePos(_idx);
            if (_idx == 2) {
                store.targetRole = itemRole;
            }
        })

        finHandler();
    }

    private _clickRole (nameStr: string, opt: CLICK_TYPE, tNode: cc.Node) {
        switch (opt) {
            case CLICK_TYPE.ADD: {
                this._clickAddRole(nameStr);
                break;
            }
            case CLICK_TYPE.SELECT: {
                this._clickSelect(nameStr, tNode);
                break;
            }
            case CLICK_TYPE.SET_SOURCE: {
                this._clickSelectSource(nameStr, tNode);
                break;
            }
            case CLICK_TYPE.SET_TARGET: {
                this._clickSelectTarget(nameStr, tNode);
                break;
            }
            default: {
                break;
            }
        }
    }

    private _clickAddRole (t: string) {
        
    }

    private _clickSelect (t: string, tNode: cc.Node) {
        let isHero = t.indexOf("Hero") != -1? true:false;
        if (isHero) {
            store.sourceRole = tNode.getComponent(ItemRole);
            this.roleSelector.onChangeHero(tNode.getComponent(ItemRole).currRole, isHero);

            this.nodeSubHero.forEach( (_n, _idx) => {
                _n.children.forEach( _c => {
                    let nameStr = _c.name;
                    if (nameStr.indexOf("Hero") != -1) {
                        _c.getComponent(ItemRole).select = tNode == _c? true:false
                    }
                })
            })
        } else {
            store.targetRole = tNode.getComponent(ItemRole);
            this.roleSelector.onChangeHero(tNode.getComponent(ItemRole).currRole, isHero);
            this.nodeSubMonsters.forEach( (_n, _idx) => {
                _n.children.forEach( _c => {
                    let nameStr = _c.name;
                    if (nameStr.indexOf("Monster") != -1) {
                        _c.getComponent(ItemRole).select = tNode == _c? true:false
                    }
                })
            })
        }
    }

    private _clickSelectSource (t: string, tNode: cc.Node) {
        this.UIPlayBar.setActorScource(tNode);
        this.nodeSubHero.forEach( (_n, _idx) => {
            _n.children.forEach( _c => {
                let nameStr = _c.name;
                if (nameStr.indexOf("Hero") != -1) {
                    _c.getComponent(ItemRole).isSource = tNode == _c? true:false;
                }
            })
        })

        this.nodeSubMonsters.forEach( (_n, _idx) => {
            _n.children.forEach( _c => {
                let nameStr = _c.name;
                if (nameStr.indexOf("Monster") != -1) {
                    _c.getComponent(ItemRole).isSource = tNode == _c? true:false;
                }
            })
        })
    
    }

    private _clickSelectTarget (t: string, tNode: cc.Node) {
        this.UIPlayBar.setTargetScource(tNode);

        this.nodeSubHero.forEach( (_n, _idx) => {
            _n.children.forEach( _c => {
                let nameStr = _c.name;
                if (nameStr.indexOf("Hero") != -1) {
                    _c.getComponent(ItemRole).isTarget = tNode == _c? true:false;
                }
            })
        })

        this.nodeSubMonsters.forEach( (_n, _idx) => {
            _n.children.forEach( _c => {
                let nameStr = _c.name;
                if (nameStr.indexOf("Monster") != -1) {
                    _c.getComponent(ItemRole).isTarget = tNode == _c? true:false;
                }
            })
        })
 
    }

    private _loadGfxSkeleton (finHandler: Function) {
        const path = 'spine/gfx';
        cc.resources.loadDir(path, sp.SkeletonData, (err, arrRes) => {
            if (err) {
                logger.warn('Editor', `load sound reource faield. err = ${err}`);
            } else {
                const arrGfx = new Set<string>();
                arrRes.forEach((asset, index) => {
                    if (asset instanceof sp.SkeletonData) {
                        // @ts-ignore
                        let info = cc.resources.getAssetInfo(asset._uuid)
                        arrGfx.add(info.path);
                    }
                });
                EditorUtils.GfxSkeleton = [];
                arrGfx.forEach(k => {
                    EditorUtils.GfxSkeleton.push(k);
                });
                cc.resources.release(path);
            }
            finHandler();
        });
    }

    private _loadGfxCocosAnimation (finHandler: Function) {
        const path = 'prefab/gfxAnimation';
        cc.resources.loadDir(path, cc.Prefab, (err, arrRes) => {
            if (err) {
                logger.warn('Editor', `load sound reource faield. err = ${err}`);
            } else {
                const arrGfx = new Set<string>();
                arrRes.forEach((asset, index) => {
                    if (asset instanceof cc.Prefab) {
                        // @ts-ignore
                        let info = cc.resources.getAssetInfo(asset._uuid)
                        arrGfx.add(info.path);
                    }
                });
                EditorUtils.GfxCocosAnimation = [];
                arrGfx.forEach(k => {
                    EditorUtils.GfxCocosAnimation.push(k);
                });
                cc.resources.release(path);
            }
            finHandler();
        });
    }

    private _loadGfxCocosPrefab (finHandler: Function) {
        const path = 'prefab/gfxPrefab';
        cc.resources.loadDir(path, cc.Prefab, (err, arrRes) => {
            if (err) {
                logger.warn('Editor', `load cocos Prefab reource faield. err = ${err}`);
            } else {
                const arrGfx = new Set<string>();
                arrRes.forEach((asset, index) => {
                    if (asset instanceof cc.Prefab) {
                        // @ts-ignore
                        let info = cc.resources.getAssetInfo(asset._uuid)
                        arrGfx.add(info.path);
                    }
                });
                EditorUtils.GfxCocosPrefab = [];
                arrGfx.forEach(k => {
                    EditorUtils.GfxCocosPrefab.push(k);
                });

                cc.resources.release(path);
            }
            finHandler();
        });
    }

    private _loadRoleSkeleton (finHandler: Function) {
        const path = 'spine/role';
        cc.resources.loadDir(path, sp.SkeletonData, (err, arrRes) => {
            if (err) {
                logger.warn('Editor', `load role Skeleton reources faield. err = ${err}`);
            } else {
                const arrSkeleton = new Set<{name: string, path: string}>();
                arrRes.forEach((asset, index) => {
                    if (asset instanceof sp.SkeletonData) {
                        // @ts-ignore
                        let info = cc.resources.getAssetInfo(asset._uuid)
                        arrSkeleton.add({
                            path: info.path,
                            name: asset.name
                        });
                    }
                });
                EditorUtils.RoleSkeleton.clear();
                arrSkeleton.forEach(k => {
                    EditorUtils.RoleSkeleton.set(k.name, k.path)
                });
                cc.resources.release(path, sp.SkeletonData);
            }
            finHandler();
        });
    }
    
    onSkillListClick () {
        guiManager.loadView('EditorSkillListView', this.nodeView);
    }

    setShadeVisible(visible: boolean = false){
        this.shadeNode.active = visible;
    }

    // onClickHelper () {
    //     guiManager.loadView('EditorHelperView', null);
    // }

}

