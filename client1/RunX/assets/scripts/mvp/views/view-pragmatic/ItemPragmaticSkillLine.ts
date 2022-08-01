const {ccclass, property} = cc._decorator;

@ccclass
export default class ItemPragmaticSkillLine extends cc.Component {
    @property(cc.Node)          top: cc.Node = null;
    @property(cc.Node)          center: cc.Node = null;
    @property(cc.Node)          bottom: cc.Node = null;

    private _needLeadSkillGroupId: number = 0   // 前置技能组ID
    private _toLeadSkillGroupId: number = 0;    // 当前技能组ID
    onInit(startPos: cc.Vec2, endPos: cc.Vec2, isUnlock: boolean) {
        this._toLeadSkillGroupId = 0;
        this._refreshLinesMap(startPos, endPos);
        this.refreshLinesState(isUnlock);
    }

    setTag(needGroupId: number, toGroupId: number) {
        this._needLeadSkillGroupId = needGroupId;
        this._toLeadSkillGroupId = toGroupId;
    }

    get tag() {
        return this._toLeadSkillGroupId;
    }

    /**
     * 根据起止的技能组ID判断当前线
     * @param needGroupId 前置技能组ID
     * @param toGroupId 当前技能组ID
     */
    isTagLine(needGroupId: number, toGroupId: number) {
        return this._needLeadSkillGroupId == needGroupId && this._toLeadSkillGroupId == toGroupId;
    }

    private _refreshLinesMap(startPos: cc.Vec2, endPos: cc.Vec2) {
        let isStraight: boolean = endPos.x == startPos.x;
        this.center.opacity = isStraight ? 0 : 255;
        this.bottom.opacity = isStraight ? 0 : 255;
        let width: number = this.top.width;
        // 不是直线
        if(!isStraight) {
            // 上线
            this.top.height = Math.abs(endPos.y - startPos.y) / 2;
            // 中线
            let isRight: boolean = endPos.x - startPos.x > 0;
            this.center.height = Math.abs(endPos.x - startPos.x) + width;
            this.center.angle = isRight ? 90 : -90;
            this.center.setPosition(cc.v2((isRight ? -1 : 1) * width / 2, -this.top.height));
            // 下线
            this.bottom.height = Math.abs(endPos.y - startPos.y) / 2;
            this.bottom.setPosition(cc.v2(endPos.x - startPos.x, -this.top.height));
        } else {
            this.top.height = Math.abs(endPos.y - startPos.y);
        }
    }

    refreshLinesState(isUnLock: boolean) {
        this.top.color = !isUnLock ? cc.Color.GRAY : cc.Color.WHITE;
        this.center.color = !isUnLock ? cc.Color.GRAY : cc.Color.WHITE;
        this.bottom.color = !isUnLock ? cc.Color.GRAY : cc.Color.WHITE;
        if(isUnLock) {
            this.node.zIndex = this.node.parent.childrenCount;
        }
    }
}
