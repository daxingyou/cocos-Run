import { HERO_PROP_MAP, NumberValueType } from "../../../app/AppEnums";
import { BagItemInfo, ItemInfo } from "../../../app/AppType";
import { utils } from "../../../app/AppUtils";
import { bagDataUtils } from "../../../app/BagDataUtils";
import { configUtils } from "../../../app/ConfigUtils";
import UIGridView, { GridData } from "../../../common/components/UIGridView";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { bagDataEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import moduleUIManager from "../../../common/ModuleUIManager";
import { ItemBagPool } from "../../../common/res-manager/NodePool";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { bagData } from "../../models/BagData";
import { bagDataOpt } from "../../operations/BagDataOpt";
import ItemBag, { ITEM_SHOW_TYPE } from "../view-item/ItemBag";
import { BEASR_SPE_PROP_TYPE, BeastPropCfgs } from "./SpiritBeastListView";

const {ccclass, property} = cc._decorator;

const PROP_SPACE_Y = 10;
const NUMBER_MAX_V = 100000;

@ccclass
export default class BeastRiseStarView extends ViewBaseComponent {
    @property(UIGridView) beastList: UIGridView = null;
    @property(cc.ScrollView) propList: cc.ScrollView = null;
    @property(cc.Button) btnRiseStar: cc.Button = null;
    @property(cc.Node) costItemRoot: cc.Node = null;
    @property(cc.Label) beastSeldesc: cc.Label = null;
    @property(cc.Node) propItemTmp: cc.Node = null;
    @property(cc.Label) propDesc: cc.Label = null;
    @property(cc.Node) maxStarTip: cc.Node = null;

    private _closeCb: Function = null;
    private _beastInfo: data.IBagUnit = null;
    private _spLoader: SpriteLoader = null;
    private _riseCfg: {[k: string]: cfg.LevelStar} = null;
    private _beastCfg: cfg.Beast = null;
    private _beastList: data.IBagUnit[] = null;
    private _needBeastSelfCnt: number = 0;
    private _selBeastIdxs: number[] = [];
    private _propItemPool: cc.NodePool = new cc.NodePool();
    private _propDescPool: cc.NodePool = new cc.NodePool();

    private _speProps: Map<number, number[]> = new Map();
    private _speSkills: Map<number, number[]> = new Map();
    private _propStarMap: Map<number, cc.Node[]> = new Map();
    private _propStarBgMap: Map<number, cc.Node[]>  = new Map();
    private _needCostCfg: Map<number, number> = null;

    protected onInit(beastInfo: data.IBagUnit, speProps: BeastPropCfgs, closeCb: Function): void {
        this._beastInfo = beastInfo;
        this._beastCfg = configUtils.getBeastConfig(beastInfo.ID);
        this._closeCb = closeCb;
        this._spLoader = this._spLoader || new SpriteLoader();
        this._riseCfg = configUtils.getLevelStarByTypeAndQuality(4, this._beastCfg.BeastQuality, this._beastCfg.BeastType);
        this._registerEvents();
        this._initCfgs(speProps);
        this._beastList = this._getBeastData();
        this._updateBaseInfo();
        this._updatePropList();
        this._updateBeastList();
    }

    protected onRelease(): void {
        eventCenter.unregisterAll(this);
        this._beastInfo = null;
        this._beastCfg = null;
        this._riseCfg = null;
        this.beastList.clear();
        this._speProps.clear();
        this._speSkills.clear();
        this._recycleCostItem();
        this._recyclePropItem();
        this._propItemPool.clear();
        this._propDescPool.clear();
        this._selBeastIdxs.length = 0;
        this._beastList = null;
        this._spLoader && this._spLoader.release();
    }

    private _registerEvents() {
          eventCenter.register(bagDataEvent.EQUIP_BROKE, this, this._onBeastRiseStar);
    }

    private _initCfgs(speProps: BeastPropCfgs) {
        if(!speProps || !speProps.speProps || speProps.speProps.length == 0) return;
        speProps.speProps.forEach(ele => {
            // 特殊属性和特殊技能数据结构不一样，注意区别
            let props = ele.propType == BEASR_SPE_PROP_TYPE.PROP ? this._speProps : this._speSkills;
            let propID = ele.propID;
            if(propID) {
                !props.has(0) && props.set(0, []);
                props.get(0).push(propID);
            }
            ele.riseAdd && ele.riseAdd.forEach((ele1, idx) => {
                if(ele1) {
                    let star = idx + (ele.propType == BEASR_SPE_PROP_TYPE.PROP ? 1 : 0);
                    !props.has(star) && props.set(star, []);
                    props.get(star).push(ele1);
                }
            });
        })
    }

    onClickRiseStar() {
        //同名灵兽的数量不足
        if(this._selBeastIdxs.length < this._needBeastSelfCnt) {
            guiManager.showTips(`选择的灵兽数量不足${this._needBeastSelfCnt}个`);
            return;
        }

        //材料数量检测
        if(this._needCostCfg) {
            let isEnough = true;
            this._needCostCfg.forEach((cnt, ID) => {
                if(!isEnough) return;
                let holdCnt = bagData.getItemCountByID(ID);
                if(holdCnt < cnt) {
                    isEnough = false;
                    guiManager.showDialogTips(1000127, ID);
                }
            });

            if(!isEnough) {
                return;
            }
        }

        let materials: data.IBagUnit[] = [];
        this._selBeastIdxs.forEach(ele => {
            materials.push(this._beastList[ele]);
        });

        if(this._needCostCfg) {
            this._needCostCfg.forEach((cnt, ID) => {
                //不需要传递金币
                if(ID == 10010001) return;
                let bagUnit = bagData.getItemByID(ID).Array[0];
                bagUnit = {...bagUnit};
                bagUnit.Count = cnt;
                materials.push(bagUnit);
            });
        }
        bagDataOpt.sendBreakEquipRequest(this._beastInfo, materials);
    }

    onClickClose() {
        super.closeView();
        this._closeCb && this._closeCb();
    }

    private _updateBeastList() {
        this.beastList.clear();
        let gridData: GridData[] = this._beastList.map((ele, idx) => {
            return {
              key: idx +'',
              data: ele
            }
        });
        this.beastList.init(gridData, {
            onInit: (item: ItemBag, data: GridData) => {
              let idx = parseInt(data.key);
              let beastItem = data.data as data.IBagUnit;
              let beastCfg: cfg.Beast = configUtils.getBeastConfig(beastItem.ID);
              let itemInfo = {
                  idx: idx,
                  id: beastItem.ID,
                  seq: utils.longToNumber(beastItem.Seq),
                  level: bagDataUtils.getBeastLVByExp(beastItem.EquipUnit.Exp, beastCfg.BeastQuality),
                  star: beastItem.EquipUnit.Star || 0,
                  clickHandler: (info: BagItemInfo, type: ITEM_SHOW_TYPE) => {
                      if(info.id == this._beastInfo.ID && info.seq == utils.longToNumber(this._beastInfo.Seq)) {
                          //正在升星的灵兽不做处理
                          return;
                      }
                      let selIdx = info.idx;
                      let arrIdx = this._selBeastIdxs.findIndex((ele) => {return selIdx == ele});
                      if(arrIdx != -1) {
                          this._selBeastIdxs[arrIdx] = this._selBeastIdxs[this._selBeastIdxs.length - 1];
                          this._selBeastIdxs.length = this._selBeastIdxs.length - 1;
                          item.showBlack(false);
                          item.showGou(false);
                      } else {
                          this._selBeastIdxs.length < this._needBeastSelfCnt && (this._selBeastIdxs.push(selIdx), item.showBlack(true, 150), item.showGou(true));
                      }
                  }
              }
              item.init(itemInfo);
              item.showBlack(this._selBeastIdxs.indexOf(idx) != -1, 150);
              item.showGou(this._selBeastIdxs.indexOf(idx) != -1);
            },
            getItem: (): ItemBag => {
                return ItemBagPool.get();
            },
            releaseItem: (item: ItemBag) => {
                ItemBagPool.put(item);
            }
        });
    }

    private _updateBaseInfo() {
        this._clearSelBeasts();
        this._recycleCostItem();
        let levelStarCfg = this._riseCfg[`${this._beastInfo.EquipUnit.Star || 0}`];
        let needSelfCnt = levelStarCfg.LevelStarNeedSelf || 0;
        this._needBeastSelfCnt = needSelfCnt;

        let needOtherStr = levelStarCfg.LevelStarNeedItem;
        let otherItemMap: Map<number, number> = null;
        if(needOtherStr && needOtherStr.length != 0) {
            otherItemMap = otherItemMap || new Map();
            utils.parseStingList(needOtherStr, (strArr: string[]) => {
                let itemID = parseInt(strArr[0]), count = parseInt(strArr[1]);
                otherItemMap.set(itemID, count);
            })
        }

        let needCoinCnt = levelStarCfg.LevelStarNeedMoney || 0;
        if(needCoinCnt >= 0) {
            otherItemMap = otherItemMap || new Map();
            otherItemMap.set(10010001, needCoinCnt);
        }
        this._needCostCfg = otherItemMap;

        if(otherItemMap && otherItemMap.size > 0) {
            let itemCnt = otherItemMap.size;
            let startPosX: number;
            let scale = 0.9;
            let spaceX = 10;
            let itemW = 0;
            let posY = 0;
            otherItemMap.forEach((value, key) => {
                let item: ItemBag = this._getCostItem();
                let itemNode = item.node;
                itemNode.scale = scale;
                if(typeof startPosX == 'undefined') {
                    itemW = itemNode.width * scale;
                    let totalW = itemW * itemCnt + (itemCnt - 1) * spaceX;
                    posY = -(itemNode.height >> 1) - 10;
                    startPosX = -(totalW >> 1);
                }
                itemNode.setPosition(startPosX + (itemW >> 1), posY);
                let holdCnt = bagData.getItemCountByID(key);
                let str = `<color='${value > holdCnt ? '#ff0000' : '#8A5E28'}'>${holdCnt >= NUMBER_MAX_V ? `${Math.floor(holdCnt/10000)}万` : holdCnt}/${value >= NUMBER_MAX_V ? `${Math.floor(value/10000)}万` : value}</color>`
                item.init({
                    id: key,
                    richTxt: str,
                    clickHandler: (itemInfo: BagItemInfo) => {
                        moduleUIManager.showItemDetailInfo(itemInfo.id, 0, this.node);
                    }
                });
                this.costItemRoot.addChild(itemNode);
                startPosX += (itemW + spaceX);
            })
        }

        if(this._needBeastSelfCnt > 0) {
            this.beastSeldesc.string = `请选择${this._needBeastSelfCnt}个同名灵兽，用于本次升星操作`;
        } else {
            this.beastSeldesc.string = `本次升星不需要灵兽`;
        }

        let isMaxStar = this._beastInfo.EquipUnit.Star >= 6;
        this.btnRiseStar.node.active = !isMaxStar;
        this.maxStarTip.active = isMaxStar;
    }

    private _updatePropList() {
        this._recyclePropItem();
        if((!this._speProps && !this._speSkills) || (this._speProps.size ==0 && this._speSkills.size == 0)) return;

        let startPosY = -PROP_SPACE_Y;
        let curStar = this._beastInfo.EquipUnit.Star || 0;
        this._speProps.forEach((eles, idx) => {
            let star = idx;
            let isHas = curStar >= star;
            let propNode = this._getPropItem();
            !this._propStarMap.has(star) && this._propStarMap.set(star, []);
            !this._propStarBgMap.has(star) && this._propStarBgMap.set(star, []);
            propNode.getChildByName('title').getComponent(cc.Label).string = `${star}星`;
            propNode.getChildByName('title').color = isHas ? cc.color().fromHEX('#8A5E28') : cc.color().fromHEX('#686871');
            this._propStarMap.get(star).push(propNode.getChildByName('title'));

            let activeBgNode = propNode.getChildByName('activeBg');
            let unactiveBgNode = propNode.getChildByName('unactiveBg');
            activeBgNode.active = isHas, unactiveBgNode.active = !isHas;
            this._propStarBgMap.get(star).push(activeBgNode, unactiveBgNode);

            let containor = propNode.getChildByName('descContainor');
            let innerStartY = 0;
            let propCount = 0;
            eles.forEach(ele => {
                if(ele == 0) return;
                let yellowCfg = configUtils.getEquipYellowConfig(ele);
                if(!yellowCfg) return;
                for(let k in HERO_PROP_MAP) {
                    let attrName = HERO_PROP_MAP[k];
                    if(yellowCfg[attrName]) {
                        let attrCfg = configUtils.getAttributeConfig(parseInt(k));
                        let attrDesc = `${attrCfg.Name}：${attrCfg.AttributeValueType == NumberValueType.REAL_VALUE ? yellowCfg[attrName] : `${yellowCfg[attrName]/100}%`}`;
                        let propdesc = this._getPropDescItem();
                        let lbComp = propdesc.getComponent(cc.Label);
                        lbComp.overflow = cc.Label.Overflow.NONE;
                        propdesc.height = 20;
                        lbComp.string = attrDesc;
                        let isNewRaw = propCount % 2 == 0;
                        propdesc.setPosition(isNewRaw ? 0 : (containor.width >> 1), innerStartY);
                        propdesc.color =  isHas ? cc.color().fromHEX('#8A5E28') : cc.color().fromHEX('#686871');
                        !isNewRaw && (innerStartY -= (propdesc.height + PROP_SPACE_Y));
                        containor.addChild(propdesc);
                        propCount++;
                        this._propStarMap.get(star).push(propdesc);
                    }
                }
            });
            propNode.height = containor.height = Math.abs(innerStartY + PROP_SPACE_Y);
            propNode.setPosition(0, startPosY);
            startPosY -= (propNode.height + PROP_SPACE_Y);
            this.propList.content.addChild(propNode);
        });

        this._speSkills.forEach((eles, idx) => {
            let star = idx;
            eles.forEach(ele => {
                if(ele == 0) return;
                !this._propStarMap.has(star) && this._propStarMap.set(star, []);
                if(star == 0) {
                    let buffCfg: cfg.SkillBuff = configUtils.getBuffConfig(ele);
                    if(!buffCfg) return;
                    let propNode = this._addOneSkillDesc(buffCfg.Illustrate || '', star, cc.v2(0, startPosY), curStar >= star);
                    startPosY -= (propNode.height + PROP_SPACE_Y);
                } else {
                    let changeCfg: cfg.SkillChange = configUtils.getSkillChangeConfig(ele);
                    if(!changeCfg) return;
                    let propNode = this._addOneSkillDesc(changeCfg.Desc || '', star, cc.v2(0, startPosY), curStar >= star);
                    startPosY -= (propNode.height + + PROP_SPACE_Y);
                }
            })
        })
        this.propList.content.height = Math.abs(startPosY);
    }

    private _addOneSkillDesc(desc: string, star: number, pos: cc.Vec2, isHas: boolean) {
        let propNode = this._getPropItem();
        propNode.getChildByName('title').getComponent(cc.Label).string = `${star}星`;
        propNode.getChildByName('title').color = isHas ? cc.color().fromHEX('#8A5E28') : cc.color().fromHEX('#686871');
        this._propStarMap.get(star).push(propNode.getChildByName('title'));

        let activeBgNode = propNode.getChildByName('activeBg');
        let unactiveBgNode = propNode.getChildByName('unactiveBg');
        activeBgNode.active = isHas, unactiveBgNode.active = !isHas;
        this._propStarBgMap.get(star).push(activeBgNode, unactiveBgNode);

        let propdesc = this._getPropDescItem();
        let lbComp = propdesc.getComponent(cc.Label);
        lbComp.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        propdesc.width = 280;
        lbComp.string = desc;
        propdesc.color = isHas ? cc.color().fromHEX('#8A5E28') : cc.color().fromHEX('#686871');

        lbComp._forceUpdateRenderData();
        propdesc.x = 0;
        let containor = propNode.getChildByName('descContainor');
        containor.addChild(propdesc);
        propNode.height = containor.height = propdesc.height;
        propNode.setPosition(pos);
        this.propList.content.addChild(propNode);
        this._propStarMap.get(star).push(propdesc);
        return propNode;
    }

    private _onBeastRiseStar(event: number, data: gamesvr.IEnhanceEquipmentRes) {
        if(!data || data.ID != this._beastInfo.ID || utils.longToNumber(data.Seq) != utils.longToNumber(this._beastInfo.Seq)) return;
        guiManager.showDialogTips(1000065);
        let curStar = this._beastInfo.EquipUnit.Star || 0;
        //更新文本
        if(this._propStarMap && this._propStarMap.has(curStar)) {
            let nodes = this._propStarMap.get(curStar);
            nodes && nodes.forEach(ele => {
                ele.color = cc.color().fromHEX('#8A5E28');
            })
        }

        //更新星级背景
        if(this._propStarBgMap && this._propStarBgMap.has(curStar)) {
            let nodes = this._propStarBgMap.get(curStar);
            nodes && nodes.forEach((ele, idx) => {
                ele.active = (idx % 2 == 0);
            })
        }

        this._beastList = this._getBeastData();
        this._updateBaseInfo();
        this._updateBeastList();
    }

    private _getBeastData(): data.IBagUnit[] {
        let beastList = bagDataUtils.getBeastsUsedRiseStar(this._beastInfo.ID, utils.longToNumber(this._beastInfo.Seq));
        return beastList;
    }

    private _clearSelBeasts() {
        this._needBeastSelfCnt = 0;
        this._selBeastIdxs.length = 0;
    }

    private _getCostItem(): ItemBag {
        let item = ItemBagPool.get();
        return item;
    }

    private _recycleCostItem() {
        let children = [...this.costItemRoot.children];
        children.forEach(ele => {
            let item = ele.getComponent(ItemBag);
            item && ItemBagPool.put(item);
        });
    }

    private _getPropItem() {
        if(this._propItemPool.size() > 0) {
            return this._propItemPool.get();
        }

        let node = cc.instantiate(this.propItemTmp);
        node.active = true;
        return node;
    }

    private _recyclePropItem() {
        let children = [...this.propList.content.children];
        children.forEach(ele => {
            let descContainor = ele.getChildByName('descContainor');
            let subChildren = [...(descContainor.children)];
            subChildren.forEach(ele1 => {
                this._propDescPool.put(ele);
            })
            this._propItemPool.put(ele);
        });
        this._propStarMap.clear();
        this._propStarBgMap.clear();
    }

    private _getPropDescItem() {
        if(this._propDescPool.size() > 0) {
            return this._propDescPool.get();
        }

        let node = cc.instantiate(this.propDesc.node);
        node.active = true;
        return node;
    }
}
