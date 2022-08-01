const {ccclass, property} = cc._decorator;

@ccclass
export default class ScrollMsg extends cc.Component {

    @property(cc.Node) maskNode: cc.Node = null;
    @property(cc.Label) label: cc.Label = null;
    @property scrollMsg:string = "";
    
    /**
     * 滚动内容
     */
    contentArr:Array<string> = new Array<string>()

    startPos:cc.Vec3 = null

    onLoad()
    {
        this.startPos = cc.v3(-this.maskNode.height/2,0,0);

        if(this.contentArr.length == 0)
        {
            this.node.active = false;
        }
        this.label.node.position = this.startPos;
        this.startScroll(this.scrollMsg);
    }

    /**
     * 开始滚动信息
     * @param content 滚动内容
     */
    startScroll(content:string):void
    {
        let self = this;
        if(content == null || content.length == 0)
        {
            return;
        }
        this.node.active = true;
        this.contentArr.push(content);
        if(self.label.node.getActionByTag(0) != null && this.label.node.getActionByTag(0).isDone() == false)//如果正在播放只插入数据
        {
            return;
        }

        let scrollFunc = function()
        {
            if(self.contentArr.length > 0)
            {
                self.label.string = self.contentArr.shift();
                //需要先更新标签的宽度，不然下一帧才更新，这里取到的值就会是原来的值，导致宽度计算错误
                //self.label._updateRenderData(true)
                self.label.node.position = self.startPos;
                let distance:number = self.label.node.height + self.label.node.parent.height;
                let duration: number = distance / 100;
                let seq = cc.sequence(
                    cc.delayTime(1),cc.moveBy(duration,cc.v2(0,distance)),cc.delayTime(0.5),
                    cc.callFunc(function(){
                        self.label.string = "";
                        self.label.node.position = self.startPos;
                        scrollFunc();
                    }),
                )
                seq.setTag(0);
                self.label.node.runAction(seq);
            }
            else
            {
                self.node.active = false;
            }
            self.contentArr.push(content);
        }
        scrollFunc();
    }
    onDestroy()
    {
        if(this.label.node.getActionByTag(0) != null )
        {
             this.label.node.stopAction(this.label.node.getActionByTag(0));
        }
    }
}