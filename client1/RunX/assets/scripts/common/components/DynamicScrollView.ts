
const {ccclass, property, requireComponent} = cc._decorator;

interface DynamicScrollVViewOptions {
    getItem: (idx: number) => cc.Node;
    releaseItem: (node: cc.Node) => void,
    initItem: (idx: number, node: cc.Node) => void
}

interface NodeData {
    node: cc.Node,
    idx: number
}

const HORIZONTAL_ANCHOR = cc.v2(0, 0.5);
const VERTICAL_ANCHOR = cc.v2(0.5, 1);
const VERTICAL_VIEW_BOUNDARY_OFFSET = 10;
const HORIZONTAL_VIEW_BOUNDARY_OFFSET = 10;

@ccclass
@requireComponent(cc.ScrollView)
export default class DynamicScrollView extends cc.Component {
    @property(cc.ScrollView) scrollView: cc.ScrollView = null;

    @property({
        type: cc.Float,
        visible() {return !!(this.scrollView && this.scrollView.vertical)},
    }) spaceY: number = 0;

    @property({
        type: cc.Float,
        visible() {return !!(this.scrollView && this.scrollView.horizontal)},
    }) spaceX: number = 0;

    @property({
        type: cc.Float,
        visible(){ return !!(this.scrollView && this.scrollView.horizontal)}
    }) paddingLeft: number = 0;

    @property({
        type: cc.Float,
        visible(){ return !!(this.scrollView && this.scrollView.horizontal)}
    }) paddingRight: number = 0;

    @property({
        type: cc.Float,
        visible(){ return !!(this.scrollView && this.scrollView.vertical)}
    }) paddingTop: number = 0;

    @property({
        type: cc.Float,
        visible(){ return !!(this.scrollView && this.scrollView.vertical)}
    }) paddingBottom: number = 0;

    private _dataLen: number = 0;
    private _visibleNodes: NodeData[] = [];

    private _options: DynamicScrollVViewOptions = null;

    private _contentViewSize: number = 0;

    private _contentView: cc.Node = null;
    private _viewPortSize: cc.Size = null;
    private _lastOffSet: number = 0;

    protected onLoad(): void {
        if(cc.isValid(this.scrollView)) {
            this.scrollView.vertical
            this._contentView = this.scrollView.content;
            this._viewPortSize = this._contentView.parent.getContentSize();
            let anchorP = this.scrollView.horizontal ? HORIZONTAL_ANCHOR : VERTICAL_ANCHOR;
            this._contentView.setAnchorPoint(anchorP);
            this.scrollView.node.on('scroll-began', this._onScrollBegan, this);
            this.scrollView.node.on('scrolling', this._onScrolling, this);
            this.scrollView.node.on('scroll-ended', this._onScrollEnded, this);
        }
    }

    protected onDestroy(): void {
        if(cc.isValid(this.scrollView)) {
            this.scrollView.node.off('scroll-began', this._onScrollBegan, this);
            this.scrollView.node.off('scrolling', this._onScrolling, this);
            this.scrollView.node.off('scroll-ended', this._onScrollEnded, this);
        }
    }

    private _onScrollBegan() {
        this._lastOffSet = this.scrollView.horizontal ? this.scrollView.getScrollOffset().x : this.scrollView.getScrollOffset().y;
    }

    private _onScrolling() {
        let curOffset = this.scrollView.horizontal ? this.scrollView.getScrollOffset().x : this.scrollView.getScrollOffset().y;

        if(curOffset == this._lastOffSet){
            return;
        }
    
        if(this.scrollView.horizontal) {    
            this._handleHorizontalScroll(curOffset);
        } else {
            this._handleVerticalScroll(curOffset);
        }
        this._lastOffSet = curOffset;
    }

    private _handleHorizontalScroll(offset: number) {
        let isLeft = offset < this._lastOffSet;
        //向左滚动
        if(isLeft) {
            for(let i = 0, len = this._visibleNodes.length; i < len; i++){
                let node = this._visibleNodes[i].node;
                let idx = this._visibleNodes[i].idx;
                //左滑移除超出视野的子项
                if(node.getBoundingBox().xMax + offset <= -HORIZONTAL_VIEW_BOUNDARY_OFFSET){
                    this._options.releaseItem(node);
                    this._visibleNodes.splice(i, 1);
                    i--, len --;
                    continue;
                }

                //上滑补充即将进入视野的子项
                if(i == len - 1 && idx < (this._dataLen - 1) && node.getBoundingBox().xMax + this.spaceX + offset <= (this.viewPortSize + HORIZONTAL_VIEW_BOUNDARY_OFFSET)) {
                    let newNode = this._options.getItem(idx + 1);
                    this._visibleNodes.push({node: newNode, idx: idx + 1});
                    this._options.initItem(idx+1, newNode);
                    let nodeOffset = this._getItemPosOffset(newNode);
                    let relativePos = cc.v2(node.getBoundingBox().xMax + this.spaceX, 0);
                    newNode.setPosition(relativePos.add(nodeOffset));
                    this.scrollView.content.addChild(newNode);
                    let curH = Math.abs(relativePos.x) + newNode.width + this.paddingRight;
                    if(curH > this._contentViewSize) {
                        this.containorSize = this._contentViewSize = curH;
                    }
                }
            }
        } else {
            //向右滚动
            for(let i = 0, len = this._visibleNodes.length; i < len; i++){
                let node = this._visibleNodes[i].node;
                let idx = this._visibleNodes[i].idx;
                
                 //右滑补充即将进入视野的子项
                if(i == 0 && idx > 0 && node.getBoundingBox().xMin - this.spaceX + offset >= -HORIZONTAL_VIEW_BOUNDARY_OFFSET) {
                    let newNode = this._options.getItem(idx - 1);
                    this._visibleNodes.unshift({node: newNode, idx: idx - 1});
                    this._options.initItem(idx - 1, newNode);
                    let nodeOffset = this._getItemPosOffset(newNode);
                    let relativePos = cc.v2(node.getBoundingBox().xMin - this.spaceX - newNode.width, 0);
                    newNode.setPosition(relativePos.add(nodeOffset));
                    this.scrollView.content.addChild(newNode);
                    i++, len++;
                    continue;
                }

                //右滑移除超出视野的子项
                if(i == len - 1 && node.getBoundingBox().xMin + offset >= (this.viewPortSize + HORIZONTAL_VIEW_BOUNDARY_OFFSET)){
                    this._options.releaseItem(node);
                    this._visibleNodes.splice(i, 1);
                    i--, len --;
                    continue;
                }
            }
        }
    }

    private _handleVerticalScroll(offset: number) {
        let isUp = offset > this._lastOffSet;
        //向上滚动
        if(isUp) {
            for(let i = 0, len = this._visibleNodes.length; i < len; i++){
                let node = this._visibleNodes[i].node;
                let idx = this._visibleNodes[i].idx;
                //上滑移除超出视野的子项
                if(node.getBoundingBox().yMin + offset >= VERTICAL_VIEW_BOUNDARY_OFFSET){
                    this._options.releaseItem(node);
                    this._visibleNodes.splice(i, 1);
                    i--, len --;
                    continue;
                }

                //上滑补充即将进入视野的子项
                if(i == len - 1 && idx < (this._dataLen - 1) && node.getBoundingBox().yMin - this.spaceY + offset >= -(this.viewPortSize + VERTICAL_VIEW_BOUNDARY_OFFSET)) {
                    let newNode = this._options.getItem(idx + 1);
                    this._visibleNodes.push({node: newNode, idx: idx + 1});
                    this._options.initItem(idx+1, newNode);
                    let nodeOffset = this._getItemPosOffset(newNode);
                    let relativePos = cc.v2(0, node.getBoundingBox().yMin - this.spaceY);
                    newNode.setPosition(relativePos.add(nodeOffset));
                    this.scrollView.content.addChild(newNode);
                    let curH = Math.abs(relativePos.y) + newNode.height + this.paddingBottom;
                    if(curH > this._contentViewSize) {
                        this.containorSize = this._contentViewSize = curH;
                    }
                }
            }
        }else {
            //向下滚动
            for(let i = 0, len = this._visibleNodes.length; i < len; i++){
                let node = this._visibleNodes[i].node;
                let idx = this._visibleNodes[i].idx;
                //下滑补充即将进入视野的子项
                if(i == 0 && idx > 0 && node.getBoundingBox().yMax + offset + this.spaceY <= VERTICAL_VIEW_BOUNDARY_OFFSET){
                    let newNode = this._options.getItem(idx -1);
                    this._visibleNodes.unshift({node: newNode, idx: idx - 1});
                    this._options.initItem(idx -1, newNode);
                    let nodeOffset = this._getItemPosOffset(newNode);
                    let relativePos = cc.v2(0, node.getBoundingBox().yMax + this.spaceY + newNode.height);
                    newNode.setPosition(relativePos.add(nodeOffset));
                    this.scrollView.content.addChild(newNode);
                    i++, len++;
                    continue;
                }

                //下滑移除超出视野的子项
                if(i == len - 1 && node.getBoundingBox().yMax + offset + this.viewPortSize <= -VERTICAL_VIEW_BOUNDARY_OFFSET) {
                    this._options.releaseItem(node);
                    this._visibleNodes.pop();
                }
            }
        }
    }

    private _onScrollEnded() {

    }

    init(number: number, options: DynamicScrollVViewOptions) {
        if(!options || !options.getItem || !options.initItem || !options.releaseItem) {
            cc.error('DynamicScrollView instance init fail!!!');
            return;
        }
        this._options = options;
        this.clear();
        this._dataLen = number;

        let idx = 0;
        this._contentViewSize = this.scrollView.horizontal ? this.paddingLeft : this.paddingTop;
        while(idx < number && this._contentViewSize < this.viewPortSize) {
            let node = this._options.getItem(idx);
            this._options.initItem(idx, node);
            let nodeOffset = this._getItemPosOffset(node);
            if(idx != 0) {
                this._contentViewSize += (this.scrollView.horizontal ? this.spaceX : this.spaceY);
            }
            let relativePos = this.scrollView.horizontal ? cc.v2(this._contentViewSize, 0) : cc.v2(0, -this._contentViewSize);
            node.setPosition(relativePos.add(nodeOffset));
            this._contentViewSize += (this.scrollView.horizontal ? node.width : node.height);
            this._contentView.addChild(node);
            this._visibleNodes.push({node: node, idx: idx});
            idx += 1;
        }
        let curH = this._contentViewSize + (this.scrollView.horizontal ? this.paddingRight : this.paddingBottom);
        this.containorSize = this._contentViewSize = Math.max(this.viewPortSize, curH);
    }

    private _getItemPosOffset(node: cc.Node): cc.Vec2 {
        if(!cc.isValid(node)) return cc.Vec2.ZERO;
        let anchorP = node.getAnchorPoint();
        let  anchorOffset: cc.Vec2 = null;
        if(this.scrollView.horizontal) {
            anchorOffset = anchorP.sub(HORIZONTAL_ANCHOR);
        } else {
            anchorOffset = anchorP.sub(VERTICAL_ANCHOR);
        }
        return cc.v2(node.width * anchorOffset.x, node.height * anchorOffset.y);
    }

    private get itemSpace() {
        if(this.scrollView.horizontal) {
            return this.spaceX;
        }
        return this.spaceY;
    }

    private get viewPortSize() {
        if(this.scrollView.horizontal) {
            return this._viewPortSize.width;
        }
        return this._viewPortSize.height;
    }

    private get containorSize() {
      if(this.scrollView.horizontal) {
          return this.scrollView.content.width;
      }
      return this.scrollView.content.height;
    }

    private set containorSize(size: number) {
      if(this.scrollView.horizontal) {
          this.scrollView.content.width = size;
      }
      this.scrollView.content.height = size;
    }

    clear() {
        this._visibleNodes && this._visibleNodes.forEach((ele, idx) => {
            this._options.releaseItem(ele.node);
        });
        this._visibleNodes.length = 0;
        this._contentViewSize = 0;
        this.containorSize = this.viewPortSize;
        this.scrollView.scrollToTopLeft(0, true);
    }
    
    //PS: 这个接口在调用之前,不能在外部对需要调整的节点的尺寸进行更新，必须将调整后的节点尺寸在该函数中传入，通过该组件内部进行尺寸更新
    updateItemSize(idx: number, newSize: cc.Size) {
        if(!newSize || this._dataLen <= 0 || idx < 0 || idx >= this._dataLen) return;

        let startIdx = -1;
        let data = this._visibleNodes.find((ele, index) => {
            if(ele.idx == idx) {
                startIdx = index;
                return true;
            }
            return false;
        });

        //要更新的项不在可视范围内
        if(!data || startIdx == -1) return;
        //滚动模式是横向时，宽度无变化，则不进行更新
        if(this.scrollView.horizontal && newSize.width == data.node.width) return;
         //滚动模式是纵向时，高度无变化，则不进行更新
        if(this.scrollView.vertical && newSize.height == data.node.height) return;
        if (this.scrollView.horizontal) {
            this._resetHorizontalView(data, startIdx, newSize);
        } else {
            this._resetVerticalView(data, startIdx, newSize);
        }
    }

    private _resetHorizontalView(nodeData: NodeData, idxInView: number, newSize: cc.Size) {
        let node = nodeData.node;
        let startIdx = idxInView;
        let scrollViewOffset = this.scrollView.getScrollOffset().x;
    }

    private _resetVerticalView(nodeData: NodeData, idxInView: number, newSize: cc.Size) {
        let node = nodeData.node;
        let startIdx = idxInView;
        let scrollViewOffset = this.scrollView.getScrollOffset().y;
        let nodeOffset = this._getItemPosOffset(node);
        let relativePos = node.getPosition().sub(nodeOffset);
        let lastSize = node.getContentSize();
        node.setContentSize(newSize);
        nodeOffset = this._getItemPosOffset(node);
        node.setPosition(relativePos.add(nodeOffset));
        let offsetY = newSize.height - lastSize.height;
        let curLen = this._visibleNodes.length;
        for(let i = startIdx + 1, len = curLen; i < len; i++) {
            let nextNode = this._visibleNodes[i].node;
            let nextIdx = this._visibleNodes[i].idx;
            //之前已经在滚动容器中的项需压进行位置偏移
            if(i < curLen) {
                nextNode.y -= offsetY;
            }
            //目标项的高度变大了，下面的项整体向下平移
            if(offsetY > 0) {
                //已经超出了可视区域的边界，进行移除
                if(nextNode.getBoundingBox().yMax + scrollViewOffset + this.viewPortSize <= -VERTICAL_VIEW_BOUNDARY_OFFSET) {
                    let deleteItems = this._visibleNodes.splice(i, len - i);
                    len = i;
                    deleteItems.forEach(ele => {
                        this._options.releaseItem(ele.node);
                    });
                    break;
                }
            } else if(offsetY < 0) {
                //目标项高度变小了, 下面的项整体向上平移
                if(i == len - 1 && nextIdx < (this._dataLen - 1) && nextNode.getBoundingBox().yMin - this.spaceY + scrollViewOffset >= -(this.viewPortSize + VERTICAL_VIEW_BOUNDARY_OFFSET)) {
                    let newNode = this._options.getItem(nextIdx + 1);
                    this._visibleNodes.push({node: newNode, idx: nextIdx+1});
                    this._options.initItem(nextIdx+1, newNode);
                    let newNodeOffset = this._getItemPosOffset(newNode);
                    let newNodeRelativePos = cc.v2(0, nextNode.getBoundingBox().yMin - this.spaceY);
                    newNode.setPosition(newNodeRelativePos.add(newNodeOffset));
                    this.scrollView.content.addChild(newNode);
                    len++;
                }
            }
        }

        let lastItem = this._visibleNodes[this._visibleNodes.length - 1];
        let lastNode = lastItem.node;
        let curH = Math.abs(lastNode.getBoundingBox().yMin) + this.paddingBottom;
        
        let newH = Math.max(this.viewPortSize, curH);
        if(scrollViewOffset + this.viewPortSize > newH) {
            let newScrollOffset = newH - this.viewPortSize;
            this.scrollView.scrollToOffset(cc.v2(0, newScrollOffset), 0, false);
            //收缩的时候，特殊情况下,顶部的项由于之前被回收了，收缩后顶部会留有空白，因此在这里检测并补充
            if(offsetY < 0) {
                let firstItem = this._visibleNodes[0];
                let itemNode = firstItem.node;
                let itemIdx = firstItem.idx;
                let boundBox = itemNode.getBoundingBox();
                let itemTopBound = boundBox.yMax + this.spaceY + newScrollOffset;
                while (itemIdx > 0 && itemTopBound <= VERTICAL_VIEW_BOUNDARY_OFFSET) {
                    itemIdx -= 1;
                    let newNode = this._options.getItem(itemIdx);
                    this._visibleNodes.unshift({node: newNode, idx: itemIdx});
                    this._options.initItem(itemIdx, newNode);
                    let nodeOffset = this._getItemPosOffset(newNode);
                    let newNodeRelativePos = cc.v2(0, boundBox.yMax + this.spaceY + newNode.height);
                    newNode.setPosition(newNodeRelativePos.add(nodeOffset));
                    this.scrollView.content.addChild(newNode);
                    itemTopBound = newNode.getBoundingBox().yMax + this.spaceY + newScrollOffset;
                }
            }
        }
        this.containorSize = this._contentViewSize = newH;
    }

    isHorizontal() {
        return this.scrollView.horizontal;
    }

    isVertical() {
        return this.scrollView.vertical;
    }

    // 获取可视区域内的item
    getItem(idx: number): cc.Node {
        if(!this._visibleNodes || this._visibleNodes.length == 0) return null;
        let targetNode: cc.Node = null;
        this._visibleNodes.some(ele => {
            if(ele.idx == idx) {
                targetNode = ele.node;
                return true;
            }
            return false;
        });
        return targetNode;
    }

    getItems() {
        return this._visibleNodes;
    }
}
