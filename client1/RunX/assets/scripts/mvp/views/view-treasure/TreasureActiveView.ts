import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { utils } from "../../../app/AppUtils";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { bagData } from "../../models/BagData";
import { taskData } from "../../models/TaskData";

const {ccclass, property} = cc._decorator;

const CLOSE_DELAY_TIME = 1000;
const TreasureMaxLv = 6;

@ccclass
export default class TreasureActiveView extends ViewBaseComponent {
    @property(sp.Skeleton) bgEff: sp.Skeleton = null;
    @property([cc.SpriteFrame]) titleSpfs: cc.SpriteFrame[] = [];
    @property(cc.Sprite) titleSp: cc.Sprite = null;
    @property(cc.Sprite) treasureIcon: cc.Sprite = null;
    @property(cc.Label) treasureName: cc.Label = null;
    @property(cc.Label) treasureOldLv: cc.Label = null;
    @property(cc.Label) treasureNewLv: cc.Label = null;
    @property(cc.Node)  lvRaiseTag: cc.Node = null;
    @property(cc.Label)  propDesc: cc.Label = null;
    @property(cc.Node) closeTip: cc.Node = null;

    private _spLoader: SpriteLoader = null;
    private _treasuerCfg: cfg.Item = null;
    private _leadTreasureCfg: cfg.LeadTreasure = null;
    private _closeCb: Function = null;
    private _openTime: number = 0;

    protected onInit(treasureID: number, closeCb: Function): void {
        this._openTime = new Date().getTime();
        this._treasuerCfg = configUtils.getItemConfig(treasureID);
        this._leadTreasureCfg = configUtils.getLeadTreasureConfig(treasureID);
        this._closeCb = closeCb;
        this.closeTip.active = false;
        this.treasureOldLv.node.active = false;
        this.treasureNewLv.node.active = false;
        this.lvRaiseTag.active = false;
        this._playBgEff();
        this.scheduleOnce(() => {
            this._initUI();
        }, 0.2);
        this.scheduleOnce(()=> {
          this.closeTip.active = true;
          this.closeTip.opacity = 0;
          cc.tween(this.closeTip).repeatForever(cc.tween().to(2, {opacity: 255}).to(2, {opacity: 0})).start()
      }, 1);
    }

    private _initUI(){
        this._spLoader = this._spLoader || new SpriteLoader();
        //图片
        let url = `${RES_ICON_PRE_URL.BAG_ITEM}/${this._treasuerCfg.ItemIcon}`;
        this._spLoader.changeSprite(this.treasureIcon, url);

        //名字
        this.treasureName.string = this._treasuerCfg.ItemName;

        let lv = bagData.treasureProp.get(this._treasuerCfg.ItemId).lv;
        let titleIdx = lv <= 1 ? 0 : 1;
        //标题
        this.titleSp.spriteFrame = this.titleSpfs[titleIdx];

        let isRaise = lv > 1;
        //之前的等级
        this.treasureOldLv.string = `等级:${isRaise ?  lv - 1 : lv}`;
        this.treasureOldLv.node.active = true;

        //现在的等级
        this.lvRaiseTag.active = isRaise;
        this.treasureNewLv.node.active = isRaise;
        isRaise && (this.treasureNewLv.string = `等级:${lv}`);

        //描述
        this.propDesc.string = this._getDesc(lv);
    }

    private _playBgEff(){
          if(this.titleSp.node.parent == this.node){
            //@ts-ignore
            let bones = this.bgEff.attachUtil.generateAttachedNodes('bone5');
            if(bones && bones.length > 0){
                this.titleSp.node.setPosition(cc.Vec2.ZERO);
                this.titleSp.node.parent = bones[0];
            }
        }

        this.bgEff.clearTracks();
        this.bgEff.setAnimation(0, 'animation', false);
    }

    deInit(){
        this._spLoader && this._spLoader.release();
    }

    onClickClose(){
        if(!this._openTime) return;
        if(new Date().getTime() - this._openTime >= CLOSE_DELAY_TIME){
            this._openTime = 0;
            this.closeView();
        }
    }

    protected onRelease(): void {
        this.deInit();
        this.bgEff.clearTracks();
        //@ts-ignore
        let bones = this.bgEff.attachUtil.generateAttachedNodes('bone5');
        if(bones && bones.length > 0){
          this.titleSp.node.parent = this.node;
          //@ts-ignore
          this.bgEff.attachUtil.destroyAttachedNodes('bone5');
        }
        cc.Tween.stopAllByTarget(this.closeTip);
        this.unscheduleAllCallbacks();
        this._closeCb && this._closeCb();
    }

    private _getDesc(level: number): string{
      let treasureCfg: cfg.LeadTreasure = this._leadTreasureCfg;
      if(!treasureCfg) return null;

      let intro = treasureCfg.Introduce;
      if(!intro) return null;

      let treasureProp = bagData.treasureProp.get(treasureCfg.ItemID);
      let finishTimes = treasureProp.taskCurProgress;

      let reg = /\%d11/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.FixedAttributeValue1;
          if(replaceCfg && replaceCfg.length > 0){
              let attrArr = treasureProp.fixAttr1Values;
              intro = intro.replace(reg, `${attrArr[level - 1]}`);
          }
      }

      reg = /\%d12/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.FixedAttributeValue2;
          let valueType = 1;
          if(treasureCfg.FixedAttributeID2){
              let attrID = treasureCfg.FixedAttributeID2;
              let attrCfg = configUtils.getAttributeConfig(attrID);
              attrCfg && (valueType = attrCfg.AttributeValueType);
          }

          if(replaceCfg && replaceCfg.length > 0){
              let attrArr = treasureProp.fixAttr2Values;
              let value:number|string =  attrArr[level - 1];
              //百分比数值
              if(valueType == 2){
                  value = `${value / 100}%`;
              }
              intro = intro.replace(reg, `${value}`);
          }
      }

      reg = /\%d2\*\%N/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.AttributeConditionValue;
          if(replaceCfg && replaceCfg.length > 0){
              let attrArr = treasureProp.addOnAttrValues;
              intro = intro.replace(reg, `${attrArr[level - 1] * finishTimes}`);
          }
      }

      reg = /\%d2/g;
      if(intro.match(reg)){
        let replaceCfg = treasureCfg.AttributeConditionValue;
          if(replaceCfg && replaceCfg.length > 0){
              let attrArr = treasureProp.addOnAttrValues;
              intro = intro.replace(reg, `${attrArr[level - 1]}`);
          }
      }

      reg = /\%N\/\%d3/g;
      if(intro.match(reg)){
        let curNum: number = bagData.convertUnitOfTreasureTaskNumByConditionType(treasureProp.taskCurNum, treasureCfg.ConditionID);
        let replaceCfg = treasureProp.taskMaxCount * treasureProp.taskPerStepNeedNum;
        replaceCfg = bagData.convertUnitOfTreasureTaskNumByConditionType(replaceCfg, treasureCfg.ConditionID);
        intro = intro.replace(reg, `${curNum}/${replaceCfg}`);
      }

      reg = /\%d3/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.AttributeConditionMax;
          intro = intro.replace(reg, `${replaceCfg}`);
      }

      reg = /\%d4/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.SystemPowerFactor;
          let attrArr: string[] = null;
          if(replaceCfg){
              attrArr = utils.parseStringTo1Arr(replaceCfg);
          }

          if(attrArr){
              intro = intro.replace(reg, `${(level > attrArr.length) ? parseFloat(attrArr[attrArr.length - 1]) : parseFloat(attrArr[level - 1])}`);
          }
      }

      reg = /\%p4/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.SystemPowerFactor;
          let attrArr: string[] = null;
          if(replaceCfg){
              attrArr = utils.parseStringTo1Arr(replaceCfg);
          }

          if(attrArr){
              intro = intro.replace(reg, `${(level > attrArr.length) ? parseFloat(attrArr[attrArr.length - 1]) / 100 : parseFloat(attrArr[level - 1]) / 100}%`);
          }
      }

      reg = /\%M/g;
      if(intro.match(reg)){
          let replaceCfg = treasureCfg.SystemPowerFactor;
          if(!replaceCfg || replaceCfg.indexOf('|') == -1) {
              intro = intro.replace(reg, `满`);
          }else{
              intro = intro.replace(reg, `${level >= TreasureMaxLv ? '满' : level}`);
          }
      }

      reg = /\%L/g;
      if(intro.match(reg)){
          intro = intro.replace(reg, `${level >= TreasureMaxLv ? '满' : level}`);
      }

      return intro;
  }
}
