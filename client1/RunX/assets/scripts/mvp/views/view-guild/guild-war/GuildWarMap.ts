import GuildWarBattleView from "./GuildWarBattleView";
import { HOLE_TAG, MAPLAYER, WAR_HOLE, WAR_HOLE_INDEX } from "./GuildWarCommon";
import ItemHoleLine from "./ItemHoleLine";
import ItemWarHole from "./ItemWarHole";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GuildWarMap extends cc.Component {
    @property(cc.Prefab) holeTemp: cc.Prefab = null;
    @property(cc.Prefab) lineTemp: cc.Prefab = null;

    private _vecLayoutNode: cc.Node[] = [];
    private _holePosMap: Map<string, cc.Vec3[]> = new Map();
    private _holeLine: cc.Node[] = [];
    private _root: GuildWarBattleView = null;

    onInit(root: GuildWarBattleView): void {
        this._root = root;
        this._initMapLayout();
    }

    deInit() {
        this._vecLayoutNode.forEach(node => {
            node.removeAllChildren();
        })
    }

    private _initMapLayout() {
        let idx = 0
        WAR_HOLE.forEach((holeNum,index) => {
            let layoutNode = this._createLayoutNode();
            layoutNode.parent = this.node;
            layoutNode.zIndex = MAPLAYER.HOLE;
            layoutNode.setPosition(this.node.width * (index + 1) / (WAR_HOLE.length)
                - this.node.width / 2 - 100, 0);

            this._vecLayoutNode.push(layoutNode);
            let isEnemy = index > 2 ? true : false;
            
            for (let el = 0; el < holeNum; el++) {
                let hole = this._createHoleNode();
                if (!hole) continue;
                hole.parent = layoutNode;  
            
                idx = WAR_HOLE_INDEX[holeNum - 1][el] || 0;
                
                let holeComp = hole.getComponent(ItemWarHole);
                holeComp.onInit(idx,isEnemy);
                layoutNode.height += hole.height + 10;
            }
        })

        this.scheduleOnce(() => {
            this._vecLayoutNode.forEach((node, index) => {
                let resultPos: cc.Vec3[] = [], tag = HOLE_TAG + index;
                node.children.forEach(hole => {
                    //得到的坐标原点为左下角
                    let worldPos = node.convertToWorldSpaceAR(hole.position);
                    //转换成坐标原点为中心点
                    let tempPos = worldPos.add(cc.v3(-this.node.width / 2, -this.node.height / 2));
                    resultPos.push(tempPos);
                })
                this._holePosMap.set(tag, resultPos);
            })
            this._drawLine();
        }, 0.1);
    }

    private _createLayoutNode():cc.Node {
        let node = new cc.Node();
        node.height = 0;
        node.width = 100;
        node.name = 'holeLayout';
        node.addComponent(cc.Layout);
        let layout = node.getComponent(cc.Layout);
        layout.type = cc.Layout.Type.VERTICAL;
        layout.spacingY = 25;
        
        return node;  
    }

    private _createLineNode():cc.Node {
        if (this._root.itemHoleLinePool.size() > 0) {
            return this._root.itemHoleLinePool.get();
        }
        return cc.instantiate(this.lineTemp)
    }

    private _createHoleNode(): cc.Node{
        if (this._root.itemHolePool.size() > 0) {
            return this._root.itemHolePool.get();
        }
        return cc.instantiate(this.holeTemp);
    }

    private _drawLine() {
        const draw = (curTag:string,nextTag:string,add:boolean) => {
            //当前的点集合
            let curPosList = this._holePosMap.get(curTag);
            if (!curPosList || !curPosList.length) return;
            //下一列的点集合
            let nextPostList = this._holePosMap.get(nextTag);
            if (!nextPostList || !nextPostList.length) return;

            curPosList.forEach((pos, idx) => {
                //只能连接临界两个点
                nextPostList.forEach((nextPos, index) => {
                    if (index - idx >= 0 && index - idx < 2) {
                        let linePrefab = this._createLineNode();
                        this._holeLine.push(linePrefab);        
                        let lineComp = linePrefab.getComponent(ItemHoleLine);
                        lineComp.onInit(this.node, pos, nextPos);
                    }
                })           
            })
        }

        for (let i = 0; i < 2; i++){
            let curTag = HOLE_TAG + i, nextTag = HOLE_TAG + (i + 1);
            draw(curTag, nextTag, true);
        }
        
        for (let i = WAR_HOLE.length - 1; i > 3; i--){
            let curTag = HOLE_TAG + i, nextTag = HOLE_TAG + (i - 1);
            draw(curTag, nextTag, true);
        }
    }
}