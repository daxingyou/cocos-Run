class UIHelper {

    /**
     * 设置节点的active
     * @param el 节点或组件所依附的节点
     * @param flag 是否显示
     */
    static setActive(el: (cc.Node | cc.Component), flag: boolean=false): void {
        if (el instanceof cc.Component && el.node) {
            el.node.active = flag;
        } else if (el instanceof cc.Node) {
            el.active = flag;
        }
    }

    /**
     * 设置类似Label组件的string，不需要语言
     * @param el 类Label组件
     * @param content string的内容
     * @param prefix string前加的前缀
     * @param postfix string后加的后缀
     */
    static setText(el: (cc.Label|cc.EditBox|cc.RichText), content: (string|number), prefix?:string, postfix?:string): void {
        if (el instanceof cc.Label || el instanceof cc.EditBox || el instanceof cc.RichText) {
            if (typeof content == 'number') {
              content = content.toString();
            }
            el.string = (prefix||"") + (content || "") + (postfix||"");
            el.node.active = true;
        }
    }

    /**
     * @desc 设置BMFont的Color和描边；函数内部不做类型检测，使用者要保证使用的是BMFont，以及Shader用的是EffectBMFont
     *
     * @static
     * @param {cc.Label} label
     * @param {cc.Color} color
     * @param {cc.Color} border
     * @memberof UIHelper
     */
    static setBMFontColor (label: cc.Label, color: cc.Color, border?: cc.Color) {
        label.node.color = color;
        if (border) {
            const material = label.getMaterial(0);
            // @ts-ignore
            material.setProperty('border', border);
        }
    }

    /**
     * 通过图集获得图片资源并替换精灵资源
     * @param spr 精灵组件
     * @param spf 图片名称
     * @param atlas 图集
     * @param succCallback 成功回调
     */
    static changeSFAtlas (spr: cc.Sprite|cc.Mask, spf: string, atlas: cc.SpriteAtlas, succCallback?: Function) {
        if (spr instanceof cc.Sprite || spr instanceof cc.Mask){
            spr.node.active = true;
            if (spf.length > 0 && !!atlas) {
                spr.spriteFrame = atlas.getSpriteFrame(spf);
                if (succCallback) succCallback();
            }  else {
                spr.spriteFrame = null;
            }
        }
    }

    /**
     * 根据不同的语言设置类似Label组件的string
     * @param target 类Label组件
     * @param langId 配置表的语言Id
     * @param prefix string前加的前缀
     * @param postfix string后加的后缀
     */
    static setString(target: (cc.Label|cc.EditBox|cc.RichText), text: string, prefix?: string, postfix?: string) {
        if (cc.isValid(target) && cc.isValid(text)) {
          target.node.active = true;
          target.string = (prefix||"") + text + (postfix||"");
        }
    }

    // 按照左边距和上边距，进行对齐；会根据anchorPoint来进行设置
    // 必须要保证parent有效才行
    static alignNode (node: cc.Node, padSize: cc.Size) {
        if (!cc.isValid(node) || !cc.isValid(node.parent)) {
            return;
        }

        const pSize = node.parent.getContentSize();
        pSize.width *= node.parent.scaleX;
        pSize.height *= node.parent.scaleY;

        const pOffsetX = pSize.width * node.parent.anchorX;
        const pOffsetY = pSize.height * (1 - node.parent.anchorY);

        const size = node.getContentSize();
        size.width *= node.scaleX;
        size.height *= node.scaleY;
        const posX = node.anchorX * size.width + padSize.width - pOffsetX;
        const posY = pOffsetY - ((1 - node.anchorY) * size.height + padSize.height);
        node.position = cc.v3(posX, posY);
    }

    static getNodeSizeWithScale (node: cc.Node): cc.Size {
        const size = node.getContentSize();
        size.width *= node.scaleX;
        size.height *= node.scaleY;
        return size;
    }
}

export let uiHelper = UIHelper;