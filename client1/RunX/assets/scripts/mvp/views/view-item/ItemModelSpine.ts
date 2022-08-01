import RoleLoader from "../view-battle/RoleLoader";

const LOAD_TAG: string = `ITEM_MODEL_SPINE`;
const MODEL_URL: string = `spine/role/`;
// 动作类型
export const enum ANIMATION_TYPE {
    IDLE = 'Idle',
    RUN = 'Run'
}

const TAG_SPINE = "MODEL_SPINE"
const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemModelSpine extends cc.Component {
    @property(cc.Node) spineNode: cc.Node = null;

    private _modelPath: string = '';
    private _spine: sp.Skeleton = null;
    init(modelName: string, isHero: boolean = true, scale: number = 1) {
        this._modelPath = this._getSpineUrl(modelName);
        this._loadSpine(isHero, scale, this._modelPath);
    }

    deInit() {
        if (this.spineNode.childrenCount) {
            RoleLoader.releaseRole(this._modelPath, this.spineNode.children[0], TAG_SPINE);
        }

        this._modelPath = "";
        this._spine = null;
    }

    setAnimation(animation: string, isLoop: boolean = true, isReset: boolean = false) {
        if(this._spine) {
            if(this._spine.animation != animation) {
                this._spine.setAnimation(0, animation, isLoop);
            } else {
                if(isReset) {
                    this._spine.setAnimation(0, animation, isLoop);
                }
            }
        }
    }

    private _loadSpine(isHero: boolean, scale: number, path: string) {
        let tag = TAG_SPINE;
        let url = path;

        RoleLoader.loadRole(url, isHero, tag).then(_spineNode => {
            if (this.spineNode.childrenCount) { 
                RoleLoader.releaseRole(path, this.spineNode.children[0], tag);
            }

            this.spineNode.addChild(_spineNode);
            _spineNode.scale = scale;
            this._spine = _spineNode.getChildByName("sp").getComponent(sp.Skeleton);
            this.setAnimation(ANIMATION_TYPE.IDLE);
        });
    }

    private _getSpineUrl(nameStr: string) {
        return `${MODEL_URL}${nameStr}`;
    }
}
