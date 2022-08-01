import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { cfg } from "../../../config/config";

const SPACE_Y: number = 35;

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildLevelDetailView extends ViewBaseComponent {
    @property(cc.Node) templateNode: cc.Node = null;
    @property(cc.Node) levels: cc.Node = null;
    @property(cc.Node) memberLimits: cc.Node = null;
    @property(cc.Node) vicePresidentLimits: cc.Node = null;
    @property(cc.Node) shopLimits: cc.Node = null;

    onInit() {
        this._refreshView();
    }

    onRelease() {
        
    }

    private _refreshView() {
        const levelCfgs = configManager.getConfigList('guildLevel');
        if(levelCfgs && levelCfgs.length > 0) {
            // levels
            this._createLabels(levelCfgs, this.levels, 'GuildLevelID');
            // 成员上限
            this._createLabels(levelCfgs, this.memberLimits, 'GuildLevelPeopleNum');
            // 副会长上限
            this._createLabels(levelCfgs, this.vicePresidentLimits, 'GuildLevelLeaderNum');
            // 声望商城
            this._createLabels(levelCfgs, this.shopLimits, 'GuildLevelShopItemIntroduce');
        }

    }

    private _createLabels(cfgs: cfg.GuildLevel[], parent: cc.Node, key: string) {
        let childrenIndex: number = 0;
        for(let i = 0; i < cfgs.length; ++i) {
            // @ts-ignore
            const str = `${cfgs[i][key]}`;
            if(str && str != 'undefined') {
                let node = parent.children[childrenIndex];
                if(!node) {
                    node = cc.instantiate(this.templateNode);
                    parent.addChild(node);
                }
                node.setPosition(cc.v2(0, - i * SPACE_Y));
                node.getComponent(cc.Label).string = str;
                ++childrenIndex;
            }
        }
    }
}
