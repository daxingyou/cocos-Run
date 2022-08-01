import TextUtils from "./TextUtils";
import { LabelBlock, htmlParser } from "./RichTextParser";
import materialHelper from "../../../shader/MaterialHelper";

/**
 * bmfont 定义
 * h: 11            字符的高度（bmfont文件贴图中的真实高度，用来计算uv使用）
 * offsetX: 2       真实绘制的时候的偏移（bmfont中的贴图，是裁剪空白的，绘制的时候，要有一个偏移量）
 * offsetY: 15      真实绘制的时候的偏移（bmfont中的贴图，是裁剪空白的，绘制的时候，要有一个偏移量）
 * textureID: 0
 * u: 2040          其实位置高度（bmfont贴图中的位置）
 * v: 606           其实位置高度（bmfont贴图中的位置）
 * valid: true
 * w: 6             字符的宽度（bmfont文件贴图中的真实高度，用来计算uv使用）
 * xAdvance: 22     
 */

const RichTextChildName = "RICHTEXT_CHILD";
const RichTextChildImageName = "RICHTEXT_Image_CHILD";

const HorizontalAlign = cc.macro.TextAlignment;
// @ts-ignore
const VerticalAlign = cc.macro.VerticalTextAlignment;

let TextAlignmentEx = cc.Enum({
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2,
});

class Pool<Type> {
    private _count = 0;
    private _pool: Type[] = [];
    private _cleanup: Function = null;
    constructor (cleanupFunc: Function, size = 20) {
        this._cleanup = cleanupFunc;
        this._pool.length = size;
    }

    _get (): Type {
        if (this._count > 0) {
            --this._count;
            const cache = this._pool[this._count];
            this._pool[this._count] = null;
            return cache;
        }
        return null;
    }

    get count (): number {
        return this._count;
    }

    put (obj: Type) {
        const pool = this._pool;
        if (this._count < pool.length) {
            if (this._cleanup && this._cleanup(obj) === false) {
                return;
            }
            pool[this._count] = obj;
            ++this._count;
        }
    }

    resize (len: number) {
        if (len > 0) {
            this._pool.length = len;
            if (this._count > len) {
                this._count = len;
            }
        }
    }
}

class LabelPool extends Pool<cc.Node> {
    constructor () {
        super((node: cc.Node) => {
            if (CC_EDITOR) {
                return false;
            }
            if (CC_DEV && node.parent) {
                cc.warn('Recycling node\'s parent should be null!');
            }
            if (!cc.isValid(node)) {
                return false;
            }
            else if (node.getComponent(cc.LabelOutline)) {
                return false;
            }
            return true;
        }, 20);
    }

    get (str: string, richtext: RichTextEx): cc.Node {
        let labelNode = this._get();
        if (!labelNode) {
            labelNode = new cc.PrivateNode(RichTextChildName);
        }
        let labelComponent = labelNode.getComponent(cc.Label);
        if (!labelComponent) {
            labelComponent = labelNode.addComponent(cc.Label);
            const mat = materialHelper.getMaterial('BMFontEX', labelComponent)
            if (mat) {
                labelComponent.setMaterial(0, mat);
            }
        }

        labelNode.setPosition(0, 0);
        labelNode.setAnchorPoint(0.5, 0.5);
        labelNode.setContentSize(128, 128);
        labelNode.skewX = 0;

        let isAsset = richtext.font instanceof cc.BitmapFont;
        if (isAsset) {
            labelComponent.font = richtext.font;
        }

        labelComponent.string = str;
        // @ts-ignore
        labelComponent.horizontalAlign = HorizontalAlign.LEFT;
        labelComponent.verticalAlign = VerticalAlign.CENTER;
        labelComponent.fontSize = richtext.fontSize || 24;
        labelComponent.overflow = 0;
        labelComponent.enableWrapText = true;
        labelComponent.lineHeight = 40;
        return labelNode;
    }
}

const pool = new LabelPool();

interface RichFadeInOption {
    interval: number;
    fadeTime: number;

    // 状态控制数据
    currTime?: number;
    lineOpacity?: number[];
    state?: number;
    timeVelocity?: number;
    validLine?: number;
    callback?: Function;
}

const {ccclass, property, executeInEditMode, disallowMultiple} = cc._decorator;
@ccclass
@disallowMultiple
@executeInEditMode
export default class RichTextEx extends cc.Component {

    @property(cc.BitmapFont)
    font: cc.BitmapFont = null;

    @property _str: string = '';
    @property
    get string (): string {
        return this._str;
    }
    set string(v: string) {
        if (this._str != v) {
            this._layoutDirty = true;
            this._str = v;
            this._updateRichText();
        }
    }

    @property _maxWidth = 0;
    @property
    get maxWidth (): number {
        return this._maxWidth;
    }
    set maxWidth (v: number) {
        if (this._maxWidth === v) {
            return;
        }

        this._maxWidth = v;
        this._layoutDirty = true;
        this._updateRichText();
    }

    
    @property({
        type: TextAlignmentEx
    })
    // @ts-ignore
    horizontalAlign = TextAlignmentEx.LEFT;

    @property _fontSize = 24;
    @property
    get fontSize (): number {
        return this._fontSize;
    }
    set fontSize(v: number) {
        if (this.fontSize === v) {
            return;
        }

        this._fontSize = v;
        this._layoutDirty = true;
        this._updateRichText();
    }

    @property _lineHeight = 26;
    @property
    get lineHeight (): number {
        return this._lineHeight;
    }
    set lineHeight (v: number) {
        if (this._lineHeight === v) {
            return;
        }

        this._lineHeight = v;
        this._layoutDirty = true;
        this._updateRichText();
    }

    @property(cc.SpriteAtlas)
    imageAtlas: cc.SpriteAtlas = null;

    @property _spacingX = 0;
    @property
    get spacingX (): number {
        return this._spacingX;
    }
    set spacingX (v: number) {
        if (v != this._spacingX) {
            this._spacingX = v;
            this._layoutDirty = true;
            this._updateRichText();
        }
    }

    @property _strenghEdge = 0.1;
    @property
    get strengthEdge (): number {
        return this._strenghEdge;
    }
    set strengthEdge (v: number) {
        v = Math.max(v, 0);
        if (this._strenghEdge != v) {
            this._strenghEdge = v;
            this._updateRichText();
        }
    }

    private _textArray: LabelBlock[] = [];
    private _labelSegments: cc.Node[] = [];
    private _labelSegmentsCache: cc.Node[] = [];
    private _linesWidth: number[] = [];
    private _layoutDirty = true;
    private _lineOffsetX = 0;
    private _lineCount = 1;
    private _labelWidth = 0;
    private _labelHeight = 0;

    private _fadeOption: RichFadeInOption = {interval: 0, fadeTime: 0};

    onEnable () {
        this._updateRichText();
        this._activateChildren(true);
    }

    onDisable () {
        this._activateChildren(false);
    }

    start () {
        this._onTTFLoaded();
    }

    _onColorChanged (parentColor: cc.Color) {
        let children = this.node.children;
        children.forEach(function (childNode) {
            childNode.color = parentColor;
        });
    }

    _updateLabelSegmentTextAttributes () {
        this._labelSegments.forEach((item: cc.Node) => {
            this._applyTextAttribute(item);
        });
    }

    _createFontLabel (string: string): cc.Node {
        return pool.get(string, this);
    }

    _onTTFLoaded () {
        this._layoutDirty = true;
        this._updateRichText();
    }

    _measureText (styleIndex: number, string: string): number;
    _measureText (styleIndex: number, string?: string): Function;
    _measureText (styleIndex: number, string: string): number | Function {
        let self = this;
        let func = function (string: string) {
            let label: cc.Node = null;
            if (self._labelSegmentsCache.length === 0) {
                label = self._createFontLabel(string);
                self._labelSegmentsCache.push(label);
            }
            else {
                label = self._labelSegmentsCache[0];
                label.getComponent(cc.Label).string = string;
            }
            // @ts-ignore
            label._styleIndex = styleIndex;
            self._applyTextAttribute(label);
            return self._getLabelWidth(label);
        };
        if (string) {
            return func(string);
        }
        else {
            return func;
        }
    }

    _onTouchEnded (event: any) {
        let components = this.node.getComponents(cc.Component);

        for (let i = 0; i < this._labelSegments.length; ++i) {
            let labelSegment = this._labelSegments[i];
            // @ts-ignore
            let clickHandler = labelSegment._clickHandler;
            // @ts-ignore
            let clickParam = labelSegment._clickParam;
            if (clickHandler && this._containsTouchLocation(labelSegment, event.touch.getLocation())) {
                components.forEach(function (component) {
                    // @ts-ignore
                    if (component.enabledInHierarchy && component[clickHandler]) {
                        // @ts-ignore
                        component[clickHandler](event, clickParam);
                    }
                });
                event.stopPropagation();
            }
        }
    }

    _containsTouchLocation (label: cc.Node, point: cc.Vec2) {
        let myRect = label.getBoundingBoxToWorld();
        return myRect.contains(point);
    }

    _resetState () {
        let children = this.node.children;
        for (let i = children.length - 1; i >= 0; i--) {
            let child = children[i];
            if (child.name === RichTextChildName || child.name === RichTextChildImageName) {
                if (child.parent === this.node) {
                    child.parent = null;
                }
                else {
                    // In case child.parent !== this.node, child cannot be removed from children
                    children.splice(i, 1);
                }
                if (child.name === RichTextChildName) {
                    pool.put(child);
                }
            }
        }

        this._labelSegments.length = 0;
        this._labelSegmentsCache.length = 0;
        this._linesWidth.length = 0;
        this._lineOffsetX = 0;
        this._lineCount = 1;
        this._labelWidth = 0;
        this._labelHeight = 0;
        this._layoutDirty = true;
    }

    onRestore () {
        if (CC_EDITOR) {
            if (this.enabledInHierarchy) {
                this.onEnable();
            }
            else {
                this.onDisable();
            }
        }
    }

    _activateChildren (active: boolean) {
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            let child = this.node.children[i];
            if (child.name === RichTextChildName || child.name === RichTextChildImageName) {
                child.active = active;
            }
        }
    }

    _addLabelSegment (stringToken: string, styleIndex: number) {
        let labelSegment;
        if (this._labelSegmentsCache.length === 0) {
            labelSegment = this._createFontLabel(stringToken);
        }
        else {
            labelSegment = this._labelSegmentsCache.pop();
            labelSegment.getComponent(cc.Label).string = stringToken;
        }
        labelSegment.opacity = 255;

        // @ts-ignore
        labelSegment._styleIndex = styleIndex;
        // @ts-ignore
        labelSegment._lineCount = this._lineCount;
        labelSegment.active = this.node.active;

        labelSegment.setAnchorPoint(0, 0);
        this._applyTextAttribute(labelSegment);

        this.node.addChild(labelSegment);
        this._labelSegments.push(labelSegment);

        return labelSegment;
    }

    // 根据当前的一个字符节点信息，加上当前的横向位置偏移，看是否要拆分另外的段落
    _updateRichTextWithMaxWidth (labelString: string, labelWidth: number, styleIndex: number) {
        // 当前测量出来的字符宽度
        let fragmentWidth = labelWidth;

        let labelSegment;

        // 当前的X偏移量
        const oldOffsetX = this._lineOffsetX;

        // 如果当前的位置，不是在起始位置
        if (this._lineOffsetX > 0 && fragmentWidth + this._lineOffsetX > this.maxWidth) {
            let checkStartIndex = 0;
            while (checkStartIndex < labelString.length) {
                let checkEndIndex = this._getFirstWordLen(labelString,
                    checkStartIndex,
                    labelString.length);

                const checkString = labelString.substring(0, checkStartIndex + checkEndIndex);
                const checkStringWidth = this._measureText(styleIndex, checkString);
                if (this._lineOffsetX + checkStringWidth > this.maxWidth) {
                    // 如果是只有一个字符就过了的，就需要直接break了
                    if (checkStartIndex === 0) {
                        this._updateLineInfo();
                        break;
                    }
                    
                    const remainString = labelString.substring(0, checkStartIndex);
                    this._lineOffsetX += this._measureText(styleIndex, remainString);
                    this._addLabelSegment(remainString, styleIndex);
                    labelString = labelString.substring(checkStartIndex);
                    fragmentWidth = this._measureText(styleIndex, labelString);
                    this._updateLineInfo();
                    break;
                } else {
                    checkStartIndex += checkEndIndex;
                }
            }
        }

        if (fragmentWidth > this.maxWidth) {
            let fragments = TextUtils.fragmentText(labelString,
                fragmentWidth,
                this.maxWidth,
                this._measureText(styleIndex));
            for (let k = 0; k < fragments.length; ++k) {
                let splitString = fragments[k];
                labelSegment = this._addLabelSegment(splitString, styleIndex);
                const labelWidth = this._getLabelWidth(labelSegment);
                this._lineOffsetX += labelWidth + this.spacingX;
                if (fragments.length > 1 && k < fragments.length - 1) {
                    this._updateLineInfo();
                }
            }
        }
        else {
            this._lineOffsetX += fragmentWidth + this.spacingX;
            this._addLabelSegment(labelString, styleIndex);
            if (this._lineOffsetX > this.maxWidth) {
                this._updateLineInfo();
            }
        }
    }

    _isLastComponentCR (stringToken: string) {
        return stringToken.length - 1 === stringToken.lastIndexOf("\n");
    }

    _updateLineInfo () {
        this._linesWidth.push(this._lineOffsetX);
        this._lineOffsetX = 0;
        this._lineCount++;
    }

    _needsUpdateTextLayout (newTextArray: LabelBlock[]) {
        if (this._layoutDirty || !this._textArray || !newTextArray) {
            return true;
        }

        if (this._textArray.length !== newTextArray.length) {
            return true;
        }

        for (let i = 0; i < this._textArray.length; ++i) {
            let oldItem = this._textArray[i];
            let newItem = newTextArray[i];
            if (oldItem.text !== newItem.text) {
                return true;
            }
            else {
                if (oldItem.style) {
                    if (newItem.style) {
                        if (!!newItem.style.outline !== !!oldItem.style.outline) {
                            return true;
                        }
                        if (oldItem.style.size !== newItem.style.size
                            || oldItem.style.italic !== newItem.style.italic
                            || oldItem.style.isImage !== newItem.style.isImage
                            || oldItem.style.bold !== newItem.style.bold) {
                            return true;
                        }
                        if (oldItem.style.isImage === newItem.style.isImage) {
                            if (oldItem.style.src !== newItem.style.src) {
                                return true;
                            }
                        }
                    }
                    else {
                        if (oldItem.style.size || oldItem.style.italic || oldItem.style.isImage || oldItem.style.outline || oldItem.style.bold) {
                            return true;
                        }
                    }
                }
                else {
                    if (newItem.style) {
                        if (newItem.style.size || newItem.style.italic || newItem.style.isImage || newItem.style.outline || oldItem.style.bold) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    _addRichTextImageElement (richTextElement: LabelBlock) {
        let spriteFrameName = richTextElement.style.src;
        let spriteFrame = this.imageAtlas.getSpriteFrame(spriteFrameName);
        if (spriteFrame) {
            let spriteNode = new cc.PrivateNode(RichTextChildImageName);
            let spriteComponent = spriteNode.addComponent(cc.Sprite);
            spriteNode.setAnchorPoint(0, 0);
            spriteComponent.type = cc.Sprite.Type.SLICED;
            spriteComponent.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            this.node.addChild(spriteNode);
            this._labelSegments.push(spriteNode);

            let spriteRect = spriteFrame.getRect();
            let scaleFactor = 1;
            let spriteWidth = spriteRect.width;
            let spriteHeight = spriteRect.height;
            let expectWidth = richTextElement.style.imageWidth;
            let expectHeight = richTextElement.style.imageHeight;

            //follow the original rule, expectHeight must less then lineHeight
            if (expectHeight > 0 && expectHeight < this.lineHeight) {
                scaleFactor = expectHeight / spriteHeight;
                spriteWidth = spriteWidth * scaleFactor;
                spriteHeight = spriteHeight * scaleFactor;
            }
            else {
                scaleFactor = this.lineHeight / spriteHeight;
                spriteWidth = spriteWidth * scaleFactor;
                spriteHeight = spriteHeight * scaleFactor;
            }

            if (expectWidth > 0) spriteWidth = expectWidth;

            if (this.maxWidth > 0) {
                if (this._lineOffsetX + spriteWidth > this.maxWidth) {
                    this._updateLineInfo();
                }
                this._lineOffsetX += spriteWidth;

            }
            else {
                this._lineOffsetX += spriteWidth;
                if (this._lineOffsetX > this._labelWidth) {
                    this._labelWidth = this._lineOffsetX;
                }
            }
            spriteComponent.spriteFrame = spriteFrame;
            spriteNode.setContentSize(spriteWidth, spriteHeight);
            // @ts-ignore
            spriteNode._lineCount = this._lineCount;

            if (richTextElement.style.event) {
                if (richTextElement.style.event.click) {
                    // @ts-ignore
                    spriteNode._clickHandler = richTextElement.style.event.click;
                }
                if (richTextElement.style.event.param) {
                    // @ts-ignore
                    spriteNode._clickParam = richTextElement.style.event.param;
                }
                else {
                    // @ts-ignore
                    spriteNode._clickParam = '';
                }
            }
            else {
                // @ts-ignore
                spriteNode._clickHandler = null;
            }
        }
        else {
            cc.warn(4400);
        }
    }

    private _getLabelWidth (nodeLabel: cc.Node) {
        const ret = nodeLabel.getContentSize().width;
        const str = nodeLabel.getComponent(cc.Label).string;
        return this._getNextTokenOffset(str) + ret;
    }

    private _updateRichText () {
        if (!this.enabled) return;

        let newTextArray = htmlParser.parse(this.string);
        if (!this._needsUpdateTextLayout(newTextArray)) {
            this._textArray = newTextArray;
            this._updateLabelSegmentTextAttributes();
            return;
        }

        this._textArray = newTextArray;
        this._resetState();

        let lastEmptyLine = false;
        let label;
        let labelSize;

        // 根据标签拆分的数组，挨个进行过滤
        for (let i = 0; i < this._textArray.length; ++i) {
            let richTextElement = this._textArray[i];
            let text = richTextElement.text;
            //handle <br/> <img /> tag
            if (text === "") {
                if (richTextElement.style && richTextElement.style.newline) {
                    this._updateLineInfo();
                    continue;
                }
                if (richTextElement.style && richTextElement.style.isImage && this.imageAtlas) {
                    this._addRichTextImageElement(richTextElement);
                    continue;
                }
            }

            // 还要看看是不是有反斜杠划分的多行，这里也要处理的
            let multilineTexts = text.split("\n");

            for (let j = 0; j < multilineTexts.length; ++j) {
                let labelString = multilineTexts[j];
                // 如果是空字符
                if (labelString === "") {
                    //for continues \n
                    if (this._isLastComponentCR(text)
                        && j === multilineTexts.length - 1) {
                        continue;
                    }
                    this._updateLineInfo();
                    lastEmptyLine = true;
                    continue;
                }
                lastEmptyLine = false;

                if (this.maxWidth > 0) {
                    // 测量一下当前字符的宽度
                    let labelWidth = this._measureText(i, labelString);
                    this._updateRichTextWithMaxWidth(labelString, labelWidth, i);

                    if (multilineTexts.length > 1 && j < multilineTexts.length - 1) {
                        this._updateLineInfo();
                    }
                }
                else {
                    label = this._addLabelSegment(labelString, i);
                    const labelWidth = this._getLabelWidth(label);
                    this._lineOffsetX += labelWidth + this.spacingX;
                    if (this._lineOffsetX > this._labelWidth) {
                        this._labelWidth = this._lineOffsetX;
                    }

                    if (multilineTexts.length > 1 && j < multilineTexts.length - 1) {
                        this._updateLineInfo();
                    }
                }
            }
        }
        if (!lastEmptyLine) {
            this._linesWidth.push(this._lineOffsetX);
        }

        if (this.maxWidth > 0) {
            this._labelWidth = this.maxWidth;
        }
        this._labelHeight = (this._lineCount + TextUtils.BASELINE_RATIO) * this.lineHeight;

        // trigger "size-changed" event
        this.node.setContentSize(this._labelWidth, this._labelHeight);

        this._updateRichTextPosition();
        this._layoutDirty = false;
    }

    _getFirstWordLen (text: string, startIndex: number, textLen: number) {
        let character = text.charAt(startIndex);
        if (TextUtils.isUnicodeCJK(character)
            || TextUtils.isUnicodeSpace(character)) {
            return 1;
        }

        let len = 1;
        for (let index = startIndex + 1; index < textLen; ++index) {
            character = text.charAt(index);
            if (TextUtils.isUnicodeSpace(character)
                || TextUtils.isUnicodeCJK(character)) {
                break;
            }
            len++;
        }

        return len;
    }

    _updateRichTextPosition () {
        let nextTokenX = 0;
        let nextLineIndex = 1;
        let totalLineCount = this._lineCount;
        for (let i = 0; i < this._labelSegments.length; ++i) {
            let label = this._labelSegments[i];
            // @ts-ignore
            let lineCount = label._lineCount;
            if (lineCount > nextLineIndex) {
                nextTokenX = 0;
                nextLineIndex = lineCount;
            }
            let lineOffsetX = 0;
            // let nodeAnchorXOffset = (0.5 - this.node.anchorX) * this._labelWidth;
            switch (this.horizontalAlign) {
                case TextAlignmentEx.LEFT:
                    lineOffsetX = - this._labelWidth / 2;
                    break;
                case TextAlignmentEx.CENTER:
                    lineOffsetX = - this._linesWidth[lineCount - 1] / 2;
                    break;
                case TextAlignmentEx.RIGHT:
                    lineOffsetX = this._labelWidth / 2 - this._linesWidth[lineCount - 1];
                    break;
                default:
                    break;
            }
            label.x = nextTokenX + lineOffsetX + this.spacingX;
            const labelWidth = this._getLabelWidth(label);
            label.y = this.lineHeight * (totalLineCount - lineCount) - this._labelHeight / 2;
            if (lineCount === nextLineIndex) {
                nextTokenX += labelWidth + this.spacingX;
            }
        }
    }

    private _getNextTokenOffset (info: string): number {
        if (info.length > 0) {
            const cleanInfo = info.trim();
            const lastWord = cleanInfo.substring(cleanInfo.length - 1);
            // FontAtlas
            // @ts-ignore
            const fontAtlas = this.font._fontDefDictionary;
            const letterDef = fontAtlas.getLetterDefinitionForChar(lastWord);
            // @ts-ignore
            const fontScale = this.fontSize / this.font._fntConfig.fontSize;
            if (letterDef) {
                return letterDef.xAdvance * fontScale + this.spacingX - ((letterDef.offsetX + letterDef.w) * fontScale);
            }
        }
        return 0;
    }

    _convertLiteralColorValue (color: string) {
        let colorValue = color.toUpperCase();
        // @ts-ignore
        if (cc.Color[colorValue]) {
            // @ts-ignore
            return cc.Color[colorValue];
        }
        else {
            let out = cc.color();
            return out.fromHEX(color);
        }
    }

    _applyTextAttribute (labelNode: cc.Node) {
        let labelComponent = labelNode.getComponent(cc.Label);
        if (!labelComponent) {
            return;
        }

        let material = labelComponent.getMaterial(0);
        if (material && material.name.indexOf('MaterialBMFontEX') != -1) {
            // @ts-ignore
            material.setProperty('bold', 0.2);
        }

        // @ts-ignore
        let index = labelNode._styleIndex;

        labelComponent.useSystemFont = false;
        labelComponent.lineHeight = this.lineHeight;
        // @ts-ignore
        labelComponent.horizontalAlign = TextAlignmentEx.LEFT;
        labelComponent.verticalAlign = VerticalAlign.CENTER;

        labelComponent.spacingX = this.spacingX;

        let textStyle = null;
        if (this._textArray[index]) {
            textStyle = this._textArray[index].style;
        }

        if (textStyle && textStyle.color) {
            labelNode.color = this._convertLiteralColorValue(textStyle.color);
        }else {
            labelNode.color = this.node.color;
        }

        if (textStyle && textStyle.italic) {
            labelNode.skewX = 12;
        }

        if (textStyle && textStyle.size) {
            labelComponent.fontSize = textStyle.size;
        }
        else {
            labelComponent.fontSize = this.fontSize;
        }

        if (textStyle && textStyle.bold) {
            if (!material || material.name.indexOf('MaterialBMFontEX') == -1) {
                let material = materialHelper.getMaterial('BMFontEX', labelComponent);
                material && labelComponent.setMaterial(0, material);
            }
            // @ts-ignore
            material && material.setProperty('bold', 0.4);
        }

        // @ts-ignore
        labelComponent._forceUpdateRenderData(true);

        if (textStyle && textStyle.event) {
            if (textStyle.event.click) {
                // @ts-ignore
                labelNode._clickHandler = textStyle.event.click;
            }
            if (textStyle.event.param) {
                // @ts-ignore
                labelNode._clickParam = textStyle.event.param;
            }
            else {
                // @ts-ignore
                labelNode._clickParam = '';
            }
        }
        else {
            // @ts-ignore
            labelNode._clickHandler = null;
        }
    }

    getLabelWidth () {
        return this._labelWidth;
    }

    getLabelHeight () {
        return this._labelHeight;
    }

    onDestroy () {
        for (let i = 0; i < this._labelSegments.length; ++i) {
            this._labelSegments[i].removeFromParent();
            this._labelSegments[i].opacity = 255;
            pool.put(this._labelSegments[i]);
        }
    }

    /**
     * @description 设置文字的渐变效果；请在设置文字内容之后的同一帧调用。不然会出现闪烁情况。如果在文字已经显示的情况下调用，会把文字都给隐藏，然后按照逻辑再来一遍！
     * 
     * @param {number} interval 每一行之间出现的间隔。单位秒。可以小于0，但是小于零的情况下，绝对值要小于fadeTime
     * @param {number} fadeTime 每一行渐现的时间。小于等于0位关闭渐现。单位秒
     * @memberof RichTextEx
     */
    setFadeOption (interval: number, fadeTime: number, callback?: Function) {
        fadeTime = Math.max(fadeTime, 0);
        if (interval < 0) {
            interval = -Math.min(Math.abs(interval), fadeTime);
        }

        // if (this._fadeOption.fadeTime == fadeTime) {
        //     if (fadeTime == 0 || this._fadeOption.interval == interval) {
        //         return;
        //     }
        // }
        this._fadeOption.fadeTime = fadeTime;
        this._fadeOption.interval = interval;
        this._fadeOption.timeVelocity = 1;
        this._fadeOption.callback = callback;
        this._startFade();
    }

    /**
     * @description 设置文字渐现的速度。1为默认正常速度；该参数会在调用setFadeOption后被重置
     *
     * @param {number} vel { 0 - 10}
     * @memberof RichTextEx
     */
    setFadeVelocity (vel: number) {
        if (vel <= 0) {
            vel = 1;
        }

        this._fadeOption.timeVelocity = vel;
    }

    /**
     * @description 停止渐现效果，并且全部显示出来
     *
     * @memberof RichTextEx
     */
    stopFadeAndShow () {
        this._labelSegments.forEach(v => {
            v.opacity = 255;
        })

        this._fadeOption.state = 1;
        this._fadeOption.callback = null;
    }

    private _startFade () {
        this._fadeOption.currTime = 0;
        this._fadeOption.lineOpacity = [];
        this._fadeOption.lineOpacity.length = this._lineCount;
        this._fadeOption.state = 0;
        this._fadeOption.validLine = 0;

        const self = this;
        this._linesWidth.forEach(v => {
            if (v > 0) {
                self._fadeOption.validLine = self._fadeOption.validLine + 1;
            }
        });

        // 先把所有的节点，都给隐藏
        if (this._fadeOption.fadeTime > 0) {
            this._labelSegments.forEach(v => {
                v.opacity = 0;
            })
        }
    }

    update (dt: number) {
        if (this._fadeOption.fadeTime > 0 && this._fadeOption.validLine) {
            if (this._fadeOption.state) {
                return;
            }

            dt = dt * (this._fadeOption.timeVelocity || 1);

            this._fadeOption.currTime = this._fadeOption.currTime || 0;
            const intervalWithFade = Math.max(this._fadeOption.interval + this._fadeOption.fadeTime, 0);

            this._fadeOption.state = 1;

            let realLine = 0;
            // 更新每一行的opacity
            for (let k = 0; k < this._lineCount; ++k) {
                if (this._linesWidth[k] > 0) {
                    let opacity = 0;
                    const lineTime = this._fadeOption.currTime - intervalWithFade * realLine;
                    if (lineTime > 0) {
                        opacity = (lineTime / this._fadeOption.fadeTime) * 255;
                    }
                    if (opacity < 255) {
                        this._fadeOption.state = 0;
                    }
                    this._fadeOption.lineOpacity[k] = Math.min(opacity, 255);
                    realLine = realLine + 1;
                } else {
                    this._fadeOption.lineOpacity[k] = 255;
                }
            }

            this._labelSegments.forEach(v => {
                // @ts-ignore
                const line = v._lineCount - 1;
                v.opacity = this._fadeOption.lineOpacity[line];
            });

            this._fadeOption.currTime = this._fadeOption.currTime + dt;

            if (this._fadeOption.state && this._fadeOption.callback) {
                this._fadeOption.callback();
            }
        }
    }
}