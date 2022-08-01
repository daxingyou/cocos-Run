import RichTextEx from "../../../common/components/rich-text/RichTextEx";
import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";
import { eventCenter } from "../../../common/event/EventCenter";
import { testEvent } from "../../../common/event/EventData";
import guiManager from "../../../common/GUIManager";
import { data, gamesvr } from "../../../network/lib/protocol";
import { svrConfig } from "../../../network/SvrConfig";
import { battleTestOpt } from "../../operations/BattleTestOpt";
import ItemTestFile from "../view-item/ItemTestFile";

const {ccclass, property} = cc._decorator

const MAX_LOGS = 255;

@ccclass
export default class SkillTestView extends ViewBaseComponent {
    @property(cc.Node) nodeItem: cc.Node = null;
    @property(cc.Node) content: cc.Node = null;
    @property(cc.Label) lbBase: cc.Label = null;
    @property(cc.Label) lbTitle: cc.Label = null;
    @property(cc.Node) itemFile: cc.Node = null;

    @property(cc.Node) ndBtnBegin: cc.Node = null;
    @property(cc.Node) ndBtnSelect: cc.Node = null;
    @property(cc.Node) ndBtnBack: cc.Node = null;

    @property(cc.Node) ndSelectAll: cc.Node = null;

    private _items: cc.Node[] = [];
    private _logs: any[] = [];
    private _currInfo: any = [];
    private _reqList: any = [];
    private _flieList: string[] = [];
    private _errCnt: number[] = [];
    private _totalCnt: number = 0;
    
    onInit() {
        this.ndSelectAll.active = false
        this.lbBase.string = `服务器：${svrConfig.worldsvr}`
        eventCenter.register(testEvent.EVENT_SKILL_TEST, this, this._whenReceiveRes);
        this._showAllFile()
    }

    onRelease () {

    }

    clearView () {
        this._items = [];
        this._logs = [];
        this._flieList = [];
        this.content.removeAllChildren();
    }

    update () {
        if (this._logs.length > 0) {
            const info = this._logs.shift();
            this._addOneItem(info);
        }
    }

    onClickBegin () {
        let fileList: string [] = [];
        this.content.children.forEach(_n => {
            let comp = _n.getComponent(ItemTestFile);
            if (comp && comp.select) {
                fileList.push(comp.file)
            }
        })

        if (fileList.length == 0) {
            guiManager.showTips("请选择测试脚本");
            return;
        }
        this._reqList = [];
        this._currInfo = [];
        this._errCnt = [];
        this._totalCnt = 0;
        this.content.removeAllChildren();
        this.ndBtnBegin.active = false;
        this.ndBtnSelect.active = false;
        this.ndBtnBack.active = false;

        this.lbTitle.string = "测试结果"
        fileList.forEach((v, idx)=> {
            let file = cc.resources.load(`battleTest/${v}`, cc.JsonAsset, 
            (err, res)=> {
                if (err) {
                    this._logs.push("json文件读取错误，检查格式"+ v)
                } else {
                    // @ts-ignore
                    this._reqList.push(res.json)
                }

                if (idx == fileList.length - 1) {
                    this.ndBtnBack.active = true;
                    if (this._reqList.length > 0) {
                        this._currInfo = this._reqList.shift()
                        battleTestOpt.reqTest(this._currInfo)
                    }
                }
            })
        })
    }

    onClickSelectAll() {
        this.ndSelectAll.active = !this.ndSelectAll.active
        this.content.children.forEach(_n => {
            let comp = _n.getComponent(ItemTestFile);
            if (comp) {
                comp.select = this.ndSelectAll.active
            }
        })
    }

    onClickBack() {
        this.ndBtnBegin.active = true;
        this.ndBtnSelect.active = true;
        this.ndBtnBack.active = false;
        this._showAllFile();
    }

    private _showAllFile () {
        this.lbTitle.string = "目录文件"
        this.clearView();
        cc.resources.loadDir("battleTest", cc.JsonAsset, 
        (err, arrRes) => {
            if (err) {
                guiManager.showTips("json文件读取错误，检查格式"+ err)
            } else {
                const arrJson = new Set<string>();
                arrRes.forEach((asset, index) => {
                    if (asset instanceof cc.JsonAsset) {
                        // @ts-ignore
                        // let info = cc.resources.getAssetInfo(asset._uuid)
                        arrJson.add(asset.name);
                    }
                });
                arrJson.forEach(k => {
                    this._flieList.push(k);
                });

                this._flieList.forEach( (v) => {
                    let fItem = cc.instantiate(this.itemFile);
                    let comp = fItem.getComponent(ItemTestFile)
                    comp.file = v;
                    comp.node.active = true
                    this.content.addChild(fItem)
                });
            }
        })
    }

    private _whenReceiveRes (cmd: any, msg: gamesvr.IBattleMeasureRes ) {
        let res:data.IMeasureResult[] = []
        let resTransform = new Map<number,  data.IMeasureRoundResult[][]>()

        for (let i = 0; i < msg.MeasureResult.length; i++) {
            let v = msg.MeasureResult[i]
            let roundRes = v.RoundRes;
            let roundArr:data.IMeasureRoundResult[][] = []
            for (let j = 0; j < roundRes.length; j++) {
                let r = roundRes[j]
                let roundIdx = r.Round
                if (!roundArr[roundIdx]) {
                    roundArr[roundIdx] = []
                }
                roundArr[roundIdx].push(r);
            }
            resTransform.set(v.Ref, roundArr)
        }

        let expect: any = this._currInfo

        for (let i = 0; i < expect.length; i++) {
            let v = expect[i];
            for (let j = 0; j < v.Result.length; j++) {
                let r = v.Result[j];
                this._logs.push(`---------- 校验测试用例 ID = ${v.Ref} ----------`);
                let resNeed = resTransform.get(v.Ref)
                this._showOneLog(r, resNeed, v.Ref)
            }
        }

        if (this._reqList.length > 0) {
            this._currInfo = this._reqList.shift()
            battleTestOpt.reqTest(this._currInfo)
        } else {
            let str = `总用例【${this._totalCnt}】，错误用例${this._errCnt.length}=> `;
            for (let i = 0; i < this._errCnt.length; i++) {
                str += `${this._errCnt[i]}, `
            }
            this._logs.push(str)
            this._logs.push('---------- 测试结束 ---------- \n')
        }
    }

    // 单个结果用例
    private _showOneLog (want:data.IMeasureRoundResult,  res: data.IMeasureRoundResult[][], ref: number) {
        let isErr = false;
        if (!want || (!want.RoleRes && !want.TeamRes)) {
            this._logs.push("结果预期输入错误，用例ID = ", ref)
            return;
        }

        let roundRes = res[want.Round]
        if (!roundRes) {
            this._logs.push("结果没查询到，用例ID = ", ref, "回合数", want.Round)
            return;
        }

        let timer = want.TimePoint;
        let svrRes: data.IMeasureRoundResult = null;
        roundRes.forEach(v=> {
            if (v.TimePoint == timer) {
                svrRes = v;
            }
        })

        if (svrRes == null) {
            this._logs.push(`结果没查询到，用例ID = ${ref}, 回合数 = ${want.Round}, 时机 = ${want.TimePoint}`)
            return;
        }

        let strAll = ``;
        if (want.RoleRes && want.RoleRes.length > 0) {
            want.RoleRes.forEach( v=> {
                let role = this._findRole(v, svrRes.RoleRes)
                let str = `回合数 = ${want.Round}, 时机 = ${want.TimePoint}, ID = ${v.ID}\n`;
                if (role) {
                    let error = this._prepare(v, role);
                    if (error.length > 2) {
                        isErr = true
                        str += error
                        strAll += str
                    }
                } else {
                    this._logs.push("结果没查询角色，用例ID = ", ref, "回合数", want.Round, "时机", want.TimePoint, "角色", v.ID)
                }
            })
        }

        if (want.TeamRes && want.TeamRes.length > 0) {
            want.TeamRes.forEach( v=> {
                let team = this._findTeam(v, svrRes.TeamRes)
                let str = `"回合数", ${want.Round}, "时机", ${want.TimePoint}, "Team", ${v.Team}\n`;
                if (team) {
                    let error = this._prepareTeam(v, team);
                    if (error.length > 2) {
                        isErr = true
                        str += error
                        // this._logs.push(str);
                        strAll += str
                    }
                } else {
                    this._logs.push("结果没查询队伍，用例ID = ", ref, "回合数", want.Round, "时机", want.TimePoint, "队伍", v.Team)
                }
            })
        }

        if (isErr) this._errCnt.push(ref)
        let resStr = isErr?"不通过":"通过"
        this._logs.push(`${strAll} => 测试【${resStr}】`);
        this._totalCnt++
    }

    private _findRole (r: data.IMeasureRoleRes, roles: data.IMeasureRoleRes[]): data.IMeasureRoleRes {
        let find:data.IMeasureRoleRes = null;
        for (let i = 0; i < roles.length; i++) {
            let _r = roles[i];
            if (_r.ID == r.ID && _r.Team == r.Team) {
                return _r
            }
        }
        return find
    }

    private _findTeam (t: data.IMeasureTeamRes, teams: data.IMeasureTeamRes[]): data.IMeasureTeamRes {
        let find:data.IMeasureTeamRes = null;
        for (let i = 0; i < teams.length; i++) {
            let _t = teams[i];
            if (_t.Team == t.Team) {
                return _t
            }
        }
        return find
    }


    private _findBuff (findID: number, buffs: data.IMeasureBuff[]): data.IMeasureBuff {
        let find:data.IMeasureBuff = null;
        for (let i = 0; i < buffs.length; i++) {
            let _b = buffs[i];
            if (_b.BuffID == findID) {
                return _b
            }
        }
        return find
    }


    private _prepare (want: data.IMeasureRoleRes, real: data.IMeasureRoleRes): string {
        let errorStr = "";
        if (want.HP != null) {
            if (want.HP != real.HP) {
                errorStr+= `血量校验不正确, 预期 = ${want.HP }, 实际 = ${real.HP}\n`
            }
        }

        if (want.Power != null) {
            if (want.Power != real.Power) {
                errorStr+= `能量校验不正确, 预期 = ${want.Power }, 实际 = ${real.Power}\n`
            }
        }

        if (want.Shield != null) {
            if (want.Shield != real.Shield) {
                errorStr+= `护盾校验不正确, 预期 = ${want.Shield }, 实际 = ${real.Shield}\n`
            }
        }

        if (want.Distance != null) {
            if (want.Distance != real.Distance) {
                errorStr+= `进度校验不正确, 预期 = ${want.Distance }, 实际 = ${real.Distance}\n`
            }
        }

        if (want.Speed != null) {
            if (want.Speed != real.Speed) {
                errorStr+= `速度校验不正确, 预期 = ${want.Speed }, 实际 = ${real.Speed}\n`
            }
        }

        if (want.Buffs != null && want.Buffs.length > 0) {
            want.Buffs.forEach( _b => {
                let find = this._findBuff(_b.BuffID, real.Buffs)
                if (!find || find.Count != _b.Count) {
                    let acctual = find? find.Count:0
                    errorStr+= `Buff校验不正确, 预期层数 = ${_b.Count}, 实际 = ${acctual}\n`
                }
            })
        }

        if (want.Property != null && want.Property.length > 0) {
            let realProp = new Map<number, number>()
            real.Property.forEach( (v, k)=> {
                realProp.set(v.PropID, v.Value)
            })

            want.Property.forEach( _v=> {
                let _realProp = realProp.get(_v.PropID) || 0
                if (_realProp != _v.Value) {
                    errorStr+= `属性ID【${_v.PropID}】校验不正确, 预期 = ${_v.Value}, 实际 = ${_realProp}\n`
                }
            })
        }

        return errorStr
    }

    private _prepareTeam (want: data.IMeasureTeamRes, real: data.IMeasureTeamRes): string {
        let errorStr = "";
    
        if (want.TeamBuffs != null && want.TeamBuffs.length > 0) {
            want.TeamBuffs.forEach( _b => {
                let find = this._findBuff(_b.BuffID, real.TeamBuffs)
                if (!find || find.Count != _b.Count) {
                    let acctual = find? find.Count:0
                    errorStr+= `Team Buff${_b.BuffID}校验不正确, 预期能量 = ${_b.Count}, 实际 = ${acctual}\n`
                }
            })
        }

        return errorStr
    }

    private _addOneItem (info: string) {
        let node = cc.instantiate(this.nodeItem);
        node.getComponent(RichTextEx).string = info;
        node.active = true;
        this.content.addChild(node);
        this._items.push(node);

        if (this._items.length > MAX_LOGS) {
            const remove = this._items.shift();
            remove.destroy();
        }
    }
}