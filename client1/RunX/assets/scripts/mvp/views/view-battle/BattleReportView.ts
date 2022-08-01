import { RES_ICON_PRE_URL } from "../../../app/AppConst";
import { PVE_MODE, PVP_MODE } from "../../../app/AppEnums";
import { configUtils } from "../../../app/ConfigUtils";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { configManager } from "../../../common/ConfigManager";
import { SpriteLoader } from "../../../common/ui-helper/SpriteLoader";
import { cfg } from "../../../config/config";
import { data, gamesvr } from "../../../network/lib/protocol";
import { battleUIData } from "../../models/BattleUIData";
import { pveData } from "../../models/PveData";
import { pvpData } from "../../models/PvpData";
import { userData } from "../../models/UserData";
import HeroUnit from "../../template/HeroUnit";
import ItemReportRole from "./ItemReportRole";

const { ccclass, property } = cc._decorator;

enum RoleType {
    Role,       // 角色
    Practice,   // 修炼
}

enum RecordType {
    Attack,
    Hurt,
    Cure
}

enum BuffType {
    Common,         // 普通技能
    Passive,        // 被动
    Friend,         // 仙缘
    EquipExclusive, // 专属
    Gift,           // 天赋
    Pragmatic,      // 修炼
    Equip,          // 装备
}

const PRE_FIX_UID_PTC = "PTC" // 修炼UID前缀

export interface RoleReport {
    Type: RoleType,
    ID: number, 
    Pos: number, 
    Attack: number, 
    Hurt: number,
    Cure: number,
    Team: number,
    Uid: number,
    SubSource: number[], // 记录他给出去的buff-Uid, 光环-Uid，teambuff-ID
}

@ccclass
export default class BattleReportView extends ViewBaseComponent {
    // 己方
    @property(cc.Label) lbSelfName: cc.Label = null;
    @property(cc.Label) lbSelfPower: cc.Label = null;
    @property(cc.Sprite) spSelfHead: cc.Sprite = null;
    @property(cc.Sprite) spSelfFrame: cc.Sprite = null;
    @property(cc.Node)   ndSelfRoot: cc.Node = null;
    @property(cc.Node)   ndSelfTampate: cc.Node = null;

    @property(cc.Sprite) spResult: cc.Sprite = null;
    @property(cc.SpriteFrame) spResultFrame: cc.SpriteFrame[] = [];

    // 敌方
    @property(cc.Node)  ndEmenyRole: cc.Node = null;
    @property(cc.Node)  ndEmenyChapter: cc.Node = null;
    @property(cc.Node)  ndEmenyRoot: cc.Node = null;
    @property(cc.Node)  ndEmenyTampate: cc.Node = null;

    @property(cc.Label) lbEmenyTitle: cc.Label = null;
    @property(cc.Label) lbEmenyDesc: cc.Label = null;

    @property(cc.Label) lbEmenyName: cc.Label = null;
    @property(cc.Label) lbEmenyPower: cc.Label = null;
    @property(cc.Sprite) spEmenyHead: cc.Sprite = null;
    @property(cc.Sprite) spEmenyFrame: cc.Sprite = null;

    private _roles: Map<string, RoleReport> = new Map();
    private _spriteLoader = new SpriteLoader();
    private _items: ItemReportRole[] = [];
    private _battleResult: gamesvr.IEnterBattleResult = null;
    private _battleStep: number = 0;
    onInit(res: gamesvr.IEnterBattleResult,index?:number): void {
        this._roles.clear();
        this._battleResult = res;
        this._battleStep = index;

        this.stepWork
        .addTask(()=> {
            this._prepareData(res);
        })
        .addTask(()=> {
            this._updateUi();
            this._updateResult(res.BattleEndRes);
        })

        this.ndSelfRoot.removeAllChildren();
        this.ndEmenyRoot.removeAllChildren();
    }   

    onRelease(): void {
        this._items.forEach(_v=> {_v.deInit()});
        this._items = [];
        this._spriteLoader.release();
    }

    private _updateUi () {
        this._updateBase();
        this._updateDetail();
    }

    private _updateResult (endRes: gamesvr.IBattleEndResult) {
        let isWin = endRes && endRes.Win
        this.spResult.spriteFrame = isWin? this.spResultFrame[0]:this.spResultFrame[1];
    }

    private _updateBase () {
        this._updateSelfBase();
        this._updateEmenyBase();
    }

    private _updateSelfBase() {
        let uInfo = userData.accountData;
        this.lbSelfName.string = `${uInfo.Name}`;
        let teamPowers = battleUIData.getTeamPower()
        //巅峰对决多阵容
        if (pvpData.pvpConfig && pvpData.pvpConfig.pvpMode == PVP_MODE.PEAK_DUEL) {
            if (this._battleResult && this._battleResult.Teams[0]?.Roles) {
                let power1 = 0, power2 = 0;
                this._battleResult.Teams[0].Roles.forEach(role => {
                    let heroUnit = new HeroUnit(role.ID);    
                    power2 += heroUnit.getCapability();
                })
                power1 = teamPowers[1];
                this.lbEmenyPower.string = `${power1}`;
                this.lbSelfPower.string = `${power2}`;
            } else {
                this.lbEmenyPower.string = `战斗力丢失`;
            }
        }
        
        //头像与头像框部分,每次加载前需手动释放引用，但保留最后一次更新头像
        let headUrl = `${RES_ICON_PRE_URL.HEAD_IMG}/` + configUtils.getHeadConfig(uInfo.HeadID).HeadFrameImage;
        let frameUrl = `${RES_ICON_PRE_URL.HEAD_FRAME}/` + configUtils.getHeadConfig(uInfo.HeadFrameID).HeadFrameImage;
        this._spriteLoader.changeSprite(this.spSelfHead, headUrl);
        this._spriteLoader.changeSprite(this.spSelfFrame, frameUrl);
    }

    private _updateEmenyBase() {
        this.ndEmenyRole.active = false;
        this.ndEmenyChapter.active = false;
        let teamPowers = battleUIData.getTeamPower()
        this.lbEmenyPower.string = `${teamPowers[1]}`;

        if (pvpData.pvpConfig) {
            this.ndEmenyRole.active = true;
            this.lbEmenyTitle.string = "竞技"
            let cfg = pvpData.pvpConfig;
            let headID: number = 0;
            let frameID: number = 0;
            let enemyInfo: data.IRankUser = null;
            switch (cfg.pvpMode) {
                case PVP_MODE.DEIFY_COMBAT: {
                    if (pvpData.isReplay)
                        enemyInfo = cfg.replayDetail.FightUserUnit;
                    else
                        enemyInfo = cfg.enemyInfo;
                    break;
                }
                case PVP_MODE.IMMORTALS_RANK: {
                    enemyInfo = cfg.enemyInfo;
                    break;
                }
                case PVP_MODE.PEAK_DUEL: {
                    let  power = pvpData.peakDuelEnemiesInfo?.PVPPeakDuelDefensiveHeroList[this._battleStep]?.Power || 0;
                    this.lbEmenyPower.string = `${power}`;
                    enemyInfo = pvpData.peakDuelEnemiesInfo?.User;
                    break;
                }
            }
            if (!enemyInfo) return;
            headID = enemyInfo.HeadID;
            frameID = enemyInfo.HeadFrameID;
            this.lbEmenyName.string = `${enemyInfo.Name || ""}`
            
            if (headID && frameID) {
                let headUrl = configUtils.getHeadConfig(headID).HeadFrameImage;
                let frameUrl = configUtils.getHeadConfig(frameID).HeadFrameImage;
                this._spriteLoader.changeSprite(this.spEmenyHead, `${RES_ICON_PRE_URL.HEAD_IMG}/${headUrl}`);
                this._spriteLoader.changeSprite(this.spEmenyFrame, `${RES_ICON_PRE_URL.HEAD_FRAME}/${frameUrl}`);
            }
        } else if (pveData.pveConfig) {
            this.ndEmenyChapter.active = true;
            this._setPveTitleInfoByCfg();
        }
    }

    private _setPveTitleInfoByCfg() {
        let cfg = pveData.pveConfig;
        if (!cfg) return;
        this.lbEmenyTitle.string = "试炼";
        switch (cfg.pveMode) {
            case PVE_MODE.ADVENTURE_LESSON: {
                this.lbEmenyTitle.string = "冒险"; 
                if (cfg.adventureCfg) {
                    let cfgChapter = configManager.getConfigByKey("chapter", cfg.adventureCfg.LessonChapter);
                    let chaName = cfgChapter? cfgChapter.ChapterName || "":""
                    let lessonName = cfg.adventureCfg.LessonName|| ""
                    this.lbEmenyDesc.string = `${chaName} ${lessonName}`;
                }
                break;
            }
            case PVE_MODE.RISE_ROAD: { this.lbEmenyDesc.string = "众仙传道"; break; }
            case PVE_MODE.NINE_HELL: { this.lbEmenyDesc.string = "九幽森罗"; break; }
            case PVE_MODE.CLOUD_DREAM: { this.lbEmenyDesc.string = "云端梦境"; break; }
            case PVE_MODE.RANDOM_FIGHT: { this.lbEmenyDesc.string = "幻梦仙缘"; break; }
            case PVE_MODE.DREAM_LESSON: { this.lbEmenyDesc.string = "太虚幻境"; break; }
            case PVE_MODE.MAGIC_DOOR: { this.lbEmenyDesc.string = "奇门遁甲"; break; }
            case PVE_MODE.FAIRY_ISLAND: { this.lbEmenyDesc.string = "蓬莱仙岛"; break; }
            case PVE_MODE.XIN_MO_FA_XIANG: { this.lbEmenyDesc.string = "心魔法相"; break; }
            case PVE_MODE.PURGATORY: { this.lbEmenyDesc.string = "无间炼狱"; break; }
            case PVE_MODE.RESPECT: {this.lbEmenyDesc.string = "致师之礼"; break; }
            case PVE_MODE.YYBOOK: {this.lbEmenyDesc.string = "阴阳宝鉴"; break; }
            case PVE_MODE.DAILY_LESSON: {
                if (!cfg.dailyCfg) return;
                let belongId = cfg.dailyCfg?.PVEDailyLessonBelong;
                if (belongId) {
                    let pveCfg: cfg.PVEList = configManager.getConfigByKey(`pveList`, belongId);  
                    this.lbEmenyDesc.string = pveCfg.PVEListName + ` 第${cfg.dailyCfg.PVEDailyLessonNum}关`;
                } 
                break;
            }
        }
    }

    private _updateDetail () {
        let selfInfo:RoleReport[] = [];
        let emenyInfo:RoleReport[] = [];
        this._roles.forEach( _v => {
            if (_v.Team == 1) {
                emenyInfo.push(_v);
            } else {
                selfInfo.push(_v);
            }
        })

        this._showList(selfInfo, true);
        this._showList(emenyInfo, false);
    }

    private _showList (rolesIn: RoleReport[], isSelf: boolean) {
        let roles = rolesIn;
        let findFunc = (roles: RoleReport[], pos: number):RoleReport => {
            let find: RoleReport = null;
            roles.forEach(_v=> {
                if (_v.Pos == pos) { find = _v; }
            })
            return find
        }

        for (let i = 0; i < 6; i++) {
            let find = findFunc(roles, i);
            if (!find) {
                roles.push({
                    ID: -1 || 0, Uid:-1 || 0, Pos:i || 0, Team: isSelf? 0:1,
                    Hurt: 0, Cure: 0,Attack: 0,
                    SubSource: [], Type: RoleType.Role
                })
            }
        }

        roles.sort((_l, _r) => {
            return _l.Pos > _r.Pos? 1:-1
        })


        let root = isSelf?  this.ndSelfRoot:this.ndEmenyRoot;
        const ITEM_HEIGHT = 70;
        const GAP = 5
        root.height = (ITEM_HEIGHT+GAP) * roles.length + 20;
        let maxNum = [0, 0, 0];//[最大输出，最大承受伤害，最大治疗]
        roles.forEach( (_v, _idx) => {
            if (_v.Attack > maxNum[0])  maxNum[0] = _v.Attack;
            if (_v.Hurt > maxNum[1])  maxNum[1] = _v.Hurt;
            if (_v.Cure > maxNum[2])  maxNum[2] = _v.Cure;
        })
        roles.forEach( (_v, _idx) => {
            let tamplate = isSelf? this.ndSelfTampate:this.ndEmenyTampate;
            let nd = cc.instantiate(tamplate);
            let comp = nd.getComponent(ItemReportRole);
            //没有战报的占个空白位置
            if (_v.ID <= 0) comp.reflashContent(false);
            nd.active = true;
            comp.onInit(_v, maxNum);
            root.addChild(nd);
            comp.node.y = -ITEM_HEIGHT/2 - (_idx * (ITEM_HEIGHT+GAP) );
            comp.node.x = 0;
            this._items.push(comp)
        })
    }

    private _prepareData(res: gamesvr.IEnterBattleResult ) {
        let team = res.Teams;
        team.forEach( (_t, _idx) => {
            _t.Roles.forEach( _r => {
                this._roles.set( _r.UID.toString(), {
                    ID: _r.ID || 0, Uid:_r.UID || 0, Pos:_r.Pos || 0, Team: _idx,
                    Hurt: 0, Cure: 0,Attack: 0,
                    SubSource: [], Type: RoleType.Role
                })
            })

            // 修炼的
            this._roles.set( PRE_FIX_UID_PTC +_idx, {
                ID: 0, Uid: 0, Pos: 5, Team: _idx,
                Hurt: 0, Cure: 0,Attack: 0,
                SubSource: [], Type: RoleType.Practice
            })
        })

        if (res.BattleStartRes) {
            this._process(res.BattleStartRes.Results);
        } 

        if (res.RoundRes) {
            res.RoundRes.forEach( _v => {
                this._process(_v.RoundStartRes)
                this._process(_v.ActionRes)
                this._process(_v.RoundEndRes)
            } );
        }

        if (res.BattleEndRes && res.BattleEndRes.Results) {
            this._process(res.BattleEndRes.Results);
        } 
    }

    private _process (res: gamesvr.IResult[]) {
        if (!res || res.length<=0) return;
        res.forEach( _r => {
            switch(_r.ResultType) {
                case gamesvr.ResultType.RTBuffResult: {
                    this._processBuff(_r);
                    break;
                }
                case gamesvr.ResultType.RTTeamBuffResult: {
                    this._processTeamBuff(_r);
                    break;
                }
                case gamesvr.ResultType.RTHaloResult: {
                    this._processHalo(_r);
                    break;
                }
                case gamesvr.ResultType.RTHPResult: {
                    this._processHp(_r);
                    break;
                }
            }
        })
    }

    private _processBuff(v: gamesvr.IResult) {
        let form = v.From || 0;
        if (v.BuffResult.Delta <= 0 || !v.BuffResult.Delta) return;

        let source = this._getSourceRole(form);
        // 记录所有buff的根来源
        if (source) {
            if (source.SubSource.indexOf(v.BuffResult.BuffUID) == -1) {
                source.SubSource.push(v.BuffResult.BuffUID)
            }
            return;
        } else {
            // TEAM BUFF
            let key = PRE_FIX_UID_PTC + form
            let realSrc = this._roles.get(key);
            if (realSrc && realSrc.SubSource.indexOf(v.BuffResult.BuffUID) == -1) {
                realSrc.SubSource.push(v.BuffResult.BuffUID)
            }
            return;
        }
    }

    private _getSourceRole(fromID: number): RoleReport {
        let formStr = fromID ? fromID.toString() : "0"

        let role = this._roles.get(formStr)
        if (role) return role;
    

        this._roles.forEach( (v, k) => {
            if (v.SubSource.indexOf(fromID) != -1 && !role) {
                role = v;
            }
        })
        return role;
    }

    private _processTeamBuff(v: gamesvr.IResult) {
        // 暂时只有天赋和修炼用到teambuff
        let buffID = v.TeamBuffResult.BuffID;

        let cfg = configUtils.getBuffConfig(buffID);
        // 天赋平均算
        if (cfg.SkillAscription == BuffType.Friend) {
            let needHeros = configUtils.getHerosByFriendBuffID(buffID);
            this._roles.forEach( (v, k) => {
                if (needHeros.indexOf(v.ID) != -1 && v.SubSource.indexOf(buffID) == -1) {
                    v.SubSource.push(buffID);
                }
            })
        } else {
        // 其他放到修炼上
            let key = PRE_FIX_UID_PTC + v.TeamBuffResult.Team || 0 + ""
            let realSrc = this._roles.get(key);
            if (realSrc && realSrc.SubSource.indexOf(v.TeamBuffResult.BuffID) == -1) {
                realSrc.SubSource.push(v.TeamBuffResult.BuffID)
            }
        }
    }

    private _processHalo(v: gamesvr.IResult) {
        let haloUID = v.HaloResult.HaloUID;
        let form = v.From || 0;
        if (!v.HaloResult.isAdd) return;

        let source = this._getSourceRole(form);
        // 记录所有buff的根来源
        if (source && source.SubSource.indexOf(haloUID) == -1) {
            source.SubSource.push(haloUID)
        }
        if (!source) {
            console.log("[BattleReport] _processBuff 找不到光环来源")
        }
    }
    
    private _processHp (v: gamesvr.IResult) {
        if (v.HPResult.Delta > 0) {
            this._updateValue(v.From, v.HPResult.Delta, RecordType.Cure, v)
        } else {
            // 加护盾不统计
            if (v.HPResult.DeltaShield > 0) {
                return;
            }

            if (v.HPResult.DeltaShield < 0) {
                let source = this._getSourceRole(v.From);
                // 护盾超时自己扣的也不算
                if (source && source.Uid == v.HPResult.RoleUID) {
                    return;
                }
            }

            if (v.HPResult.HPDetail) {
                let detail = v.HPResult.HPDetail;
                let deltaShield = v.HPResult.Shield? Math.abs(v.HPResult.Shield):0;
                let trueAttack = detail.TrueAttack || 0;
                let attack = detail.Attack || 0;
                let value = attack + trueAttack + deltaShield;
                
                // 存在延迟伤害buff挂在其他玩家身上，判定正确的攻击方id
                let roleUID = detail.TruthRoleUID ? detail.TruthRoleUID : detail.RoleUID;
                
                this._updateValue(roleUID, value, RecordType.Attack, v);
                this._updateValue(detail.TargetUID, value, RecordType.Hurt, v);
            } else {
                console.log("[BattleReport] _processHp error");
            }
        }
    }

    private _updateValue(src: number, value: number, type: RecordType, v: gamesvr.IResult) {
        if (!value) return;

        let from = src || 0;

        // team buff
        if (from == 0 || from == 1) {
            if (!v) return;
            let friendBuffID = v.ItemID || 0;
            let cfg = configUtils.getBuffConfig(friendBuffID);
            if (cfg && cfg.SkillAscription == BuffType.Friend) {
                let roles:RoleReport[] = [];
                this._roles.forEach(_v => {
                    if (_v.Team == from && _v.SubSource.indexOf(friendBuffID)!=-1) {
                        roles.push(_v);
                    }
                })
        
                // 仙缘
                if (roles.length) {
                    let valueSeperate = Math.floor(value / roles.length)
                    for (let i = 0; i < roles.length; i++) {
                        this._updateValue(roles[i].Uid, valueSeperate, type, null)
                    }
                }
            } else {
                // TEAM BUFF
                let from = v.From || 0
                let key = PRE_FIX_UID_PTC + from + "";
                let realSrc = this._roles.get(key);
                //如果是修炼相关数据，直接赋值
                if (realSrc) {
                    switch(type) {
                        case RecordType.Cure:   {realSrc.Cure += value; break}
                        case RecordType.Attack: {realSrc.Attack += value; break}
                        case RecordType.Hurt:   {realSrc.Hurt += value; break}
                        default: break
                    }
                    // this._updateValue(realSrc.Uid, value, type, null,true);
                } else {
                    console.log("[Battle Report] Cant find role info.", v)
                }
            }
        } else {
            let rSrc = this._getSourceRole(from);
            if (rSrc) {
                switch(type) {
                    case RecordType.Cure:   {rSrc.Cure += value; break}
                    case RecordType.Attack: {rSrc.Attack += value; break}
                    case RecordType.Hurt:   {rSrc.Hurt += value; break}
                    default: break
                }
            } else {
                console.log("[Battle Report] Cant find role info.", v)
            }
        }
    }

}