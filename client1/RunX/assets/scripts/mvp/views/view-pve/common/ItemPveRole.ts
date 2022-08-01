import { ROLE_TYPE } from "../../../../app/BattleConst";
import { configUtils } from "../../../../app/ConfigUtils";
import { resPathUtils } from "../../../../app/ResPathUrlUtils";
import { cfg } from "../../../../config/config";
import RoleLoader from "../../view-battle/RoleLoader";
import { BASE_ANIM } from "../../view-item/ItemRole";

const {ccclass, property} = cc._decorator;

interface ItemPveRoleInfo {
    /** 英雄ID或者怪物ID */
    roleID: number;
    /** 角色类型，与ID一致 */
    roleType: ROLE_TYPE;
    /** 骨骼路径【手动传入无效】 */
    skeletonPath?: string;
    /** 展示的骨骼动画【BASE_ANIM中字符串】 */
    skeletonAnimation?: string;
}

/**
 * 参考ItemRole的轻量的用于展示用的人物节点及骨骼动画
 */
@ccclass
export default class ItemPveRole extends cc.Component {
    @property(cc.Node) skeletonNode: cc.Node = null;        // 用于挂在骨骼模型的节点
    @property(cc.Node) shadowNode: cc.Node = null;          // 阴影

    private static LOADER_TAG: string = "ITEM_PVE_ROLE";    // 用于生成loadTag
    private static ROLE_SEQU: number = 1;                   // 用于生成loadTag，暂不清楚原理，保持机制

    private _roleInfo: ItemPveRoleInfo = null;          // 角色数据
    private _curSkeletonPath: string = null;            // 当前骨骼路径
    private _curSkeletonNode: cc.Node = null;           // 当前骨骼节点
    private _loadTag: string = null;                    // 保证唯一

    init(roleInfo: ItemPveRoleInfo) {
        this._loadTag = ItemPveRole.LOADER_TAG + ItemPveRole.ROLE_SEQU;
        ItemPveRole.ROLE_SEQU += 1;

        this._prepareData(roleInfo);
        this._initRole();
    }

    deInit() {
        this.node.setPosition(cc.v3(0, 0, 0));
        this.node.stopAllActions();
        this.node.targetOff(this);
        this.unscheduleAllCallbacks();
        this._releaseSkeleton();
    }

    private _prepareData(roleInfo: ItemPveRoleInfo) {
        this._roleInfo = roleInfo;

        let modelID: number = this._getModelID(roleInfo.roleID, roleInfo.roleType);
        let skeletonPath: string = resPathUtils.getModelSpinePath(modelID) || "";
        this._roleInfo.skeletonPath = skeletonPath;
    }

    private _getModelID(roleID: number, roleType: ROLE_TYPE): number {
        let modelID: number;
        let roleCfg: cfg.HeroBasic | cfg.Monster = null;
        if (roleType === ROLE_TYPE.HERO) {
            roleCfg = configUtils.getHeroBasicConfig(roleID);
            modelID = roleCfg.HeroBasicModel;
        } else if (roleType === ROLE_TYPE.MONSTER) {
            roleCfg = configUtils.getMonsterConfig(roleID);
            modelID = roleCfg.ModelId;
        }

        return modelID;
    }

    private _initRole() {
        let defaultScale: number = 0.4;     // 缩放比例，没必要读配置，可考虑加载参数里，目前固定
        let skeletonPath: string = this._roleInfo.skeletonPath;
        if (this._curSkeletonPath == null || this._curSkeletonPath != skeletonPath) {
            this._releaseSkeleton();

            this._curSkeletonPath = skeletonPath;
            RoleLoader.loadRole(skeletonPath, this._roleInfo.roleType === ROLE_TYPE.HERO, this._loadTag)
            .then((node) => {
                this._curSkeletonNode = node;
                this._curSkeletonNode.scale = defaultScale;
                this.skeletonNode.addChild(node);
                this.shadowNode.width = node.width * defaultScale + 10;

                this.initIdle(this._roleInfo.skeletonAnimation);
            });
        }
    }

    private _releaseSkeleton() {
        if (cc.isValid(this._curSkeletonNode)) {
            RoleLoader.releaseRole(this._curSkeletonPath, this._curSkeletonNode, this._loadTag);
            this._curSkeletonPath = null;
            this._curSkeletonNode = null;
        }
    }

    /**
     * 角色初始化之后的展示状态
     */
    initIdle (animationName: string) {
        animationName == null && (animationName = BASE_ANIM.IDLE);

        let spine = null;
        if (this._curSkeletonNode && cc.isValid(this._curSkeletonNode)) {
            spine = this._curSkeletonNode.getChildByName("sp").getComponent(sp.Skeleton);
            if (spine && spine.animation != BASE_ANIM.IDLE) {
                spine.setAnimation(0, animationName, true);
            }
        }
    }
}
