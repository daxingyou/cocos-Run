import { ALLTYPE_TYPE, BAG_ITEM_TYPE } from "../../../app/AppEnums";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { resPathUtils } from "../../../app/ResPathUrlUtils";
import List from "../../../common/components/List";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { eventCenter } from "../../../common/event/EventCenter";
import { guildEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { guildData } from "../../models/GuildData";
import { guildOpt } from "../../operations/GuildOpt";
import HeroUnit from "../../template/HeroUnit";
import ItemBossTeam from "./ItemBossTeam";

const FIGHT_TEAM_MAX: number = 3;

const {ccclass, property} = cc._decorator;

@ccclass
export default class GuildBossFightTeamView extends ViewBaseComponent {
    @property(cc.Label) fightTeamCountLb: cc.Label = null;
    @property(cc.Node) fightTeamContent: cc.Node = null;
    @property(cc.Node) fightTeamTypeContent: cc.Node = null;
    @property(cc.Label) teamPowerLb: cc.Label = null;
    @property(cc.Node) powerAddIcon: cc.Node = null;
    @property(cc.Prefab) itemTeamTemplate: cc.Prefab = null;
    @property(cc.Node) toFightBtn: cc.Node = null;
    @property(List) herosList: List = null;

    private _heros: number[] = [];
    private _curSelected: number[] = [];
    private _needTypeActivityList: number[] = [];
    private _spriteLoader: SpriteLoader = new SpriteLoader();
    private _guildMonsterCfg: cfg.GuildMonster = null;
    private _itemTeamPool: cc.NodePool = new cc.NodePool();
    onInit() {
        this.doInit();
        this._dueData();
        this._initAddTypeView();
        this._refreshView();
    }

    onRelease() {
        eventCenter.unregisterAll(this);
        this._spriteLoader.release();
        this.herosList._deInit();
        let children = [...this.fightTeamContent.children]
        children.forEach(_c => {
            _c.getComponent(ItemBossTeam).deInit();
            this._putItemTeamNode(_c);
        });
        this._clearItemTeamPool();
    }

    doInit() {
        eventCenter.register(guildEvent.JOIN_FIGHT_SUC, this, this._recvJoinSuc);
    }

    private _dueData() {
        let bossInfo = guildData.bossInfo;
        if(bossInfo) {
            let curOrder = (bossInfo.Order || 0) + 1;
            this._guildMonsterCfg = configManager.getOneConfigByManyKV('guildMonster', "GuildMonsterLevel", bossInfo.Level || 1, "GuildMonsterOrder", curOrder);
        }
        this._heros = bagData.getItemsByType(BAG_ITEM_TYPE.HERO).map(_heroUnit => { return Number(_heroUnit.ID); });
        this._heros.sort((_a, _b) => {
            let aPower = this._getHeroPower(_a);
            let bPower = this._getHeroPower(_b);
            return bPower - aPower;
        });
    }

    private _refreshView() {
        this.herosList.numItems = this._heros.length;
        this._refreshFightView();
    }

    onFightTeamItemRender(item: cc.Node, index: number) {
        let heroId: number = this._heros[index];
        let itemBossTeam = item.getComponent(ItemBossTeam);
        itemBossTeam.setData(heroId, this._curSelected.indexOf(heroId) > -1, null);
    }

    onFightTeamItemSelected(item: cc.Node, index: number, lastIndex: number) {
        let heroId = this._heros[index];
        let toFightedIndex: number = this._curSelected.indexOf(heroId);
        if(this._curSelected.length >= FIGHT_TEAM_MAX && toFightedIndex == -1) {
            guiManager.showTips('出战英雄已达到最大上限');
        } else {
            if(toFightedIndex > -1) {
                this._curSelected.splice(toFightedIndex, 1);
            } else {
                this._curSelected.push(heroId);
            }
            this._refreshFightView();
            item.getComponent(ItemBossTeam).refreshSelected(toFightedIndex == -1)
        }

    }

    private _refreshFightView() {
        for(let i = 0; i < FIGHT_TEAM_MAX; ++i) {
            let heroId = this._curSelected[i] || 0;
            let itemTeam = this.fightTeamContent.children[i];
            if(!itemTeam) {
                itemTeam = this._getItemTeamNode();
                this.fightTeamContent.addChild(itemTeam);
                itemTeam.y = 0;
            }
            if(itemTeam) {
                itemTeam.getComponent(ItemBossTeam).setData(heroId, false, () => {
                    let index = this._curSelected.indexOf(heroId);
                    this._curSelected.splice(index, 1);
                    this._refreshView();
                });
            }
        }
        this._updateNeedType();

        this._refreshAddTypeView();

        this.fightTeamCountLb.string = `请选择出战英雄（${this._curSelected.length}/${FIGHT_TEAM_MAX}）`;
        this.teamPowerLb.string = `${this._getTeamPower()}`;
        this.scheduleOnce(() => {
            this.powerAddIcon.x = this.teamPowerLb.node.x + this.teamPowerLb.node.width + 10;
        });

        this.toFightBtn.color = this._curSelected.length < FIGHT_TEAM_MAX ? cc.color().fromHEX("#BEBEBE") : cc.Color.WHITE;
    }

    private _initAddTypeView() {
        let needTypeStr = this._guildMonsterCfg.GuildMonsterNeedType;
        if(needTypeStr) {
            let needTypes = needTypeStr.split('|');
            let itemTeamplate = this.fightTeamTypeContent.children[0];
            for(let i = 0; i < needTypes.length; ++i) {
                let itemType = this.fightTeamTypeContent.children[i + 1];
                if(!itemType) {
                    itemType = cc.instantiate(itemTeamplate);
                    this.fightTeamTypeContent.addChild(itemType);
                }
                let curType = Number(needTypes[i]);
                let allTypeCfg = configUtils.getAllTypeCfg(curType);
                if(allTypeCfg) {
                    let typeIconUrl = resPathUtils.getHeroAllTypeIconUrl(allTypeCfg.HeroTypeIcon);
                    this._spriteLoader.changeSprite(itemType.getComponent(cc.Sprite), typeIconUrl);
                }
                itemType.active = true;
                itemType.children[0].active = false;
            }
        }
    }

    private _refreshAddTypeView() {
        let tempActivitys = utils.deepCopyArray(this._needTypeActivityList);
        let needTypes = this._guildMonsterCfg.GuildMonsterNeedType.split('|').map(_c => { return Number(_c); });
        for(let i = 0; i < needTypes.length; ++i) {
            let itemType = this.fightTeamTypeContent.children[i + 1];
            if(!itemType) {
               return;
            }
            let curType = needTypes[i];
            let findIndex = tempActivitys.indexOf(curType);
            if(findIndex > -1) {
                tempActivitys.splice(findIndex, 1);
            }
            itemType.children[0].active = findIndex > -1;
        }
    }

    private _updateNeedType() {
        let needTypeStr = this._guildMonsterCfg.GuildMonsterNeedType;
        if(needTypeStr) {
            let needTypes = needTypeStr.split('|');
            this._needTypeActivityList = [];
            if(this._curSelected.length <= 0) {
                return;
            }
            for(let i = 0; i < this._curSelected.length; ++i) {
                if(needTypes.length <= 0) {
                    return;
                }
                let heroId = this._curSelected[i];
                let heroCfg = configUtils.getHeroBasicConfig(heroId);
                // 定位
                let ability = heroCfg.HeroBasicAbility;
                let abilityCfg: cfg.ALLType = this._getAllTypeCfg(ALLTYPE_TYPE.HERO_ABILITY, ability);
                let findIndex = needTypes.indexOf(abilityCfg.HeroTypeId + '');
                if(findIndex > -1) {
                    let strs = needTypes.splice(findIndex, 1);
                    this._needTypeActivityList.push(Number(strs[0]));
                }

                // 装备类型
                let equipType = heroCfg.HeroBasicEquipType;
                let equipTypeCfg: cfg.ALLType = this._getAllTypeCfg(ALLTYPE_TYPE.HERO_EQUIP_TYPE, equipType);
                findIndex = needTypes.indexOf(equipTypeCfg.HeroTypeId + '');
                if(findIndex > -1) {
                    let strs = needTypes.splice(findIndex, 1);
                    this._needTypeActivityList.push(Number(strs[0]));

                }

                // 卦象
                let trigrams = heroCfg.HeroBasicTrigrams;
                let trigramsCfg: cfg.ALLType = this._getAllTypeCfg(ALLTYPE_TYPE.HERO_TRIGRAMS, trigrams);
                findIndex = needTypes.indexOf(trigramsCfg.HeroTypeId + '');
                if(findIndex > -1) {
                    let strs = needTypes.splice(findIndex, 1);
                    this._needTypeActivityList.push(Number(strs[0]));
                }
            }
        }
    }

    onClickToFightBtn() {
        if(this._curSelected.length < FIGHT_TEAM_MAX) {
            guiManager.showTips(`请上阵至少${FIGHT_TEAM_MAX}名英雄`);
        } else {
            let curOrder = (guildData.bossInfo.Order || 0) + 1;
            guildOpt.sendJoinFight(curOrder, this._curSelected);
        }
    }

    onClickOnceFightBtn() {
        if(this._curSelected.length >= FIGHT_TEAM_MAX) {
            guiManager.showTips(`阵容已满`);
        } else {
            let newList = this._heros.slice(0, FIGHT_TEAM_MAX).filter(_heroId => {
                return this._curSelected.indexOf(_heroId) == -1;
            }).slice(0, FIGHT_TEAM_MAX - this._curSelected.length);
            this._curSelected = this._curSelected.concat(newList);
            this.herosList.updateAll();
            this._refreshFightView();
        }
    }

    private _recvJoinSuc() {
        guiManager.showTips(`派遣成功`);
        this.closeView();
    }

    private _getTeamPower(): number {
        let teamPower: number = 0;
        let needTypeStr = this._guildMonsterCfg.GuildMonsterNeedType;
        let needTypes: number[] = []
        if(needTypeStr) {
            needTypes = needTypeStr.split('|').map(_str => { return Number(_str); });
        }
        for(let i = 0; i < this._curSelected.length; ++i) {
            let heroId: number = this._curSelected[i];
            let heroUnit = new HeroUnit(heroId);
            let power = heroUnit.getCapability();
            teamPower += power;
        }
        console.log('附加属性前:', teamPower);
        teamPower = teamPower * (1 + this._needTypeActivityList.length * this._guildMonsterCfg.GuildMonsterTypeAdd / 10000);
        console.log('附加属性后:', teamPower);
        return Math.floor(teamPower);
    }

    private _getHeroPower(heroId: number): number {
        let needTypeStr = this._guildMonsterCfg.GuildMonsterNeedType;
        let needTypes: number[] = []
        let needTypeAddCount: number = 0;
        if(needTypeStr) {
            needTypes = needTypeStr.split('|').map(_str => { return Number(_str); });
        }

        let heroUnit = new HeroUnit(heroId);
        // 定位
        let ability = heroUnit.heroCfg.HeroBasicAbility;
        let abilityCfg: cfg.ALLType = this._getAllTypeCfg(ALLTYPE_TYPE.HERO_ABILITY, ability);
        let findIndex = needTypes.indexOf(abilityCfg.HeroTypeId);
        if(findIndex > -1) {
            needTypes.splice(findIndex, 1);
            needTypeAddCount++;
        }
        // 装备类型
        let equipType = heroUnit.heroCfg.HeroBasicEquipType;
        let equipTypeCfg: cfg.ALLType = this._getAllTypeCfg(ALLTYPE_TYPE.HERO_EQUIP_TYPE, equipType);
        findIndex = needTypes.indexOf(equipTypeCfg.HeroTypeId);
        if(findIndex > -1) {
            needTypes.splice(findIndex, 1);
            needTypeAddCount++;
        }
        // 卦象
        let trigrams = heroUnit.heroCfg.HeroBasicTrigrams;
        let trigramsCfg: cfg.ALLType = this._getAllTypeCfg(ALLTYPE_TYPE.HERO_TRIGRAMS, trigrams);
        findIndex = needTypes.indexOf(trigramsCfg.HeroTypeId);
        if(findIndex > -1) {
            needTypes.splice(findIndex, 1);
            needTypeAddCount++;
        }
        let power = heroUnit.getCapability();
        power = power * (1 + needTypeAddCount * this._guildMonsterCfg.GuildMonsterTypeAdd / 10000);
        return Math.round(power);
    }

    private _getAllTypeCfg(heroTypeForm: ALLTYPE_TYPE, heroTypeFormNum: number): cfg.ALLType {
        return configManager.getOneConfigByManyKV('allType', 'HeroTypeForm', heroTypeForm, 'HeroTypeFormNum', heroTypeFormNum);
    }

    private _getItemTeamNode(): cc.Node {
        if(this._itemTeamPool.size() > 0) {
            return this._itemTeamPool.get();
        } else {
            return cc.instantiate(this.itemTeamTemplate);
        }
    }

    private _putItemTeamNode(item: cc.Node) {
        this._itemTeamPool.put(item);
    }

    private _clearItemTeamPool() {
        let size = this._itemTeamPool.size();
        for(let i = 0; i < size; ++i) {
            let item = this._itemTeamPool.get();
            item.getComponent(ItemBossTeam).deInit();
        }
        this._itemTeamPool.clear();
    }

}
