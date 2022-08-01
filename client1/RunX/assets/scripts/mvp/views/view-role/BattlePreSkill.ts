import { HEAD_ICON } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";

const MAX_FRIENDS_COUNT: number = 3;
const {ccclass, property} = cc._decorator;
const HEAD_SP_OFFSET = 500
@ccclass
export default class BattlePreSkill extends cc.Component {
    @property([cc.Node]) attachedNode2: cc.Node[] = [];
    @property([cc.Node]) attachedNode3: cc.Node[] = [];

    @property(sp.Skeleton) spSingel: sp.Skeleton = null;
    @property(cc.Sprite) sprHead: cc.Sprite = null;

    @property(sp.Skeleton) spMulti: sp.Skeleton = null;

    private _spriteLoader: SpriteLoader = new SpriteLoader();

    onInit(heroList: number[], skillId: number, isLeft: boolean = true,  endFunc: Function) {
        // 有bug获取不到挂载节点
        // this._initFriendActionRootNodes();
        if (!heroList || heroList.length <= 0 || heroList.length > 3) {
            endFunc && endFunc()
            return
        }
        this._initSpineNode(heroList, isLeft, skillId, endFunc);
        // this._refreshView(skillId);
    }

    deInit() {
        this._releaseSpr()
        this.node.active = false;
    }

    private _releaseSpr () {
        this._spriteLoader.release();
    }


    private _refreshView(skillId: number) {
        // TODO 更换图像，现在只有1个，后续补充
        let skillConfig = configUtils.getSkillConfig(skillId);
        if(skillConfig) {
            // 技能
            // this.skillName.string = skillConfig.Name;
            return;
        }
    }

    private _initSpineNode(heroList: number[], isLeft: boolean, skillID: number, endFunc: Function) {
        this.spSingel.node.active = false;
        this.spMulti.node.active = false;

        // 个人大招技能
        if (heroList.length == 1) {
            let scale = 0.25
            // 更换头像 - TODO 没资源
            let url = `textures/head_release/`;
            // let url = resPathUtils.getItemIconPath(heroList[0], HEAD_ICON.SQUARE);
            let modelCfg: cfg.Model
            if (isLeft) {
                let herocfg = configUtils.getHeroBasicConfig(heroList[0]);
                if (!herocfg) return;
                modelCfg = configUtils.getModelConfig(herocfg.HeroBasicModel);
            } else {
                let cfg:any = configUtils.getMonsterConfig(heroList[0]);
                if (!cfg) {
                    cfg = configUtils.getHeroBasicConfig(heroList[0]);
                    if (cfg && cfg.HeroBasicModel) {
                        modelCfg = configUtils.getModelConfig(cfg.HeroBasicModel);
                    }
                } else {
                    if (cfg.ModelId) {
                        modelCfg = configUtils.getModelConfig(cfg.ModelId);
                    }
                }
            }
          
            if (!modelCfg) {
                endFunc && endFunc()
                return;
            };
            this.node.active = true;
            url += modelCfg.ModelReleaseHead;
            this._spriteLoader.changeSprite(this.sprHead, url)
            this.spSingel.node.active = true;
            this.spSingel.node.x = isLeft? -cc.winSize.width/2 + HEAD_SP_OFFSET : cc.winSize.width/2 - HEAD_SP_OFFSET
            this.spSingel.node.scaleX = isLeft? -scale:scale;
            this.spSingel.setAnimation(0, "animation4", false)
            this.spSingel.setCompleteListener(() => {
                this._releaseSpr()
                endFunc && endFunc();
                this.node.active = false;
            })
        } else {
            // 合体技能
            this.node.active = true;
            this.spMulti.node.active = true;
            let rootNodes = heroList.length == 2? this.attachedNode2:this.attachedNode3

            for(let i = 0; i < heroList.length; ++i) {
                let modelId: number = this._getModelId(heroList[i]);
                let rootNode = rootNodes[i];
                if(!!modelId && rootNode) {
                    let modelCfg = configUtils.getModelConfig(modelId);
                    let url = resPathUtils.getModelPhotoPath(modelCfg.ModelId);
                    let imgNode = null;
                    let sp: cc.Sprite = null;
                    if(rootNode.childrenCount > 0) {
                        imgNode = rootNode.children[0];
                        sp = imgNode.getComponent(cc.Sprite);
                        imgNode.active = true;
                    } else {
                        imgNode = new cc.Node();
                        imgNode.anchorY = 0;
                        rootNode.addChild(imgNode);
                        sp = imgNode.addComponent(cc.Sprite);
                    }
                    sp.sizeMode = cc.Sprite.SizeMode.RAW;
                    sp.trim = false;
                    // let scales = modelCfg.ModelPhotoSize.split("|");
                    // imgNode.setScale(cc.v2(Number(scales[0]) / 10000, Number(scales[1]) / 10000));
                    imgNode.setScale(0.7)
                    imgNode.y = -250
                    this._spriteLoader.changeSpriteP(sp, url).then(() => {
                        rootNode.active = true;
                    });
                }
            }

            if (heroList.length == 2) {
                this._show2FriendEffect(isLeft, skillID, endFunc)
            } else {
                this._show3FriendEffect(isLeft, skillID, endFunc)
            }
        }
    }

    private _show2FriendEffect (isLeft: boolean, skillID: number, endFunc: Function) {
        this._updateName2Friend(skillID);
        this.spMulti.setAnimation(0, "animation3", false)


        // this._showRole2NameAnim(isLeft)
        this.spMulti.node.scaleX = isLeft? 1:-1
        this.spMulti.setCompleteListener(() => {
            this._releaseSpr()
            endFunc && endFunc();
            this.node.active = false;
        })
    } 

    private _show3FriendEffect (isLeft: boolean, skillID: number, endFunc: Function) {
        // this._updateName3Frient(skillID);
        this.spMulti.setAnimation(0, "animation5", false)

        this.spMulti.node.scaleX = isLeft? -1:1
        this.spMulti.setCompleteListener(() => {
            this._releaseSpr()
            endFunc && endFunc();
            this.node.active = false;
        })
    }

    private _showRole2FriendAnim (isLeft: boolean) {
        // TODO
    }

    private _updateName2Friend (skillID: number) {
        let cfg = configUtils.getHeroFriendConfig(skillID);
        if(cfg && cfg.HeroFriendName) {
            // TODO
            return;
        }
    }

    private _getModelId(id: number): number {
        let cfg = configUtils.getHeroBasicConfig(id);
        if(cfg) {
            return cfg.HeroBasicModel;
        } else {
            let monscfg = configUtils.getMonsterConfig(id);
            if(monscfg) {
                return monscfg.ModelId;
            }
        }
        return 0;
    }
}
