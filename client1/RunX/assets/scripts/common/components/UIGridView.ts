import { logger } from "../log/Logger";
import { uiHelper } from "../ui-helper/UIHelper";

/**
 * @desc 单元格数据；传入者需要给定key以及data；data对于UIGridView是透明的
 * @param key 用来标识唯一数据；常见instanceId或者其他之类的
 * @param data 用来更新的数据；对于GrieView来说是透明的，你传null也可以，但是要自己维护key-data的映射
 * @param uiState 用来标识UI状态的数据；Item的状态数据保存（比如选中或者其他状态数据)
 * @interface GridData
 */
interface GridData {
    key: string;
    data: any;
    dirty?: boolean;
    uiState?: any;
}

/**
 * @desc 每个格子的组件信息；要使用这个格子的，需要有下边的两个属性约定
 * @param node 组件要提供一个node属性（常见的就是派生自cc.Component就自带这个属性）
 * @param uiState 用来访问和设置UI状态数据的接口；可选
 * @interface GridItem
 */
interface GridItem {
    node: cc.Node;
    uiState?: any;
}

interface createItemFunction {
    (): GridItem;
}

interface releaseItemFunction {
    (item: GridItem): void;
}

interface initItemFunction {
    (item: GridItem, gridData: GridData): void;
}

interface sortFunction {
    (l: GridData, r: GridData): number;
}

/**
 * @desc GridView的使用配置信息
 * @param getItem 获取一个组件；要同步返回，返回的组件，要符合GridItem的约定
 * @param releaseItem 释放一个组件；
 * @param onInit 数据更新接口
 * @param updatePerFrame[optional] 分帧加载时的每一帧更新的数量
 * @param sortFunc[optional] 如果有排序需求，就按照这个来进行排序；否则就按照传入的顺序进行展示
 * @param autoCenter[optional] 自动居中；如果格子内显示的组件尺寸包围盒，比contentSize小；是否自动居中（比如只有一行，是不是把这一行居中在view内显示）
 * @param extraUnits[optional] 插入额外单元；如果需要插入标题/分隔线/描述等单元
 * @interface GridOption
 */
interface GridOption {
    getItem: createItemFunction;
    releaseItem: releaseItemFunction;
    onInit: initItemFunction;
    sortFunc?: sortFunction;

    updatePerFrame?: number;
    autoCenter?: boolean;
    resetSpacingCol?: number;
    resetSpacingRow?: number;
    extraUnits?: ExtraUnit[];
}

interface DelayUpdateInfo {
    updatePerFrame: number;
}

/**
 * @desc 扩展1：临时插入额外的单元
 * @param 插入的单元节点
 * @param 插入的位置，可选，默认最后
 */
interface ExtraUnit {
    node: cc.Node,
    index: number,
    releaseExtra: (node: cc.Node) => void
}

enum Direction {
    VERTICAL = 0,
    HORIZONTAL,
}

const { ccclass, property, menu } = cc._decorator;
@ccclass
@menu('自定义组件/UIGridView')
export default class UIGridView extends cc.Component {
    @property(cc.ScrollView)
    scroll: cc.ScrollView = null;

    @property({
        type: cc.Float,
        tooltip: "左边距"
    })
    paddingLeft = 4;

    @property({
        type: cc.Float,
        tooltip: "右边距"
    })
    paddingRight = 4;

    @property({
        type: cc.Float,
        tooltip: "上边距"
    })
    paddingTop = 4;

    @property({
        type: cc.Float,
        tooltip: "下边距"
    })
    paddingBottom = 4;

    @property({
        type: cc.Float,
        tooltip: "SpaceY 行间距（水平模式下，会自动修正非法数值）"
    })
    spacingRow = 0;

    @property({
        type: cc.Float,
        tooltip: "SpaceX 列间距（垂直模式下，会自动修正非法数值）"
    })
    spacingCol = 0;

    @property({
        type: cc.Enum(Direction),
        tooltip: "水平还是垂直滚动；垂直滚动模式下，宽度不变，高度自动计算；水平模式下，高度不变，宽度自动计算"
    })
    direction: Direction = Direction.VERTICAL;

    @property({
        tooltip: "关闭自适应位置"
    })
    closeAutoAlign: boolean = false;

    // 所有的数据信息
    private _datas: GridData[] = [];

    // 当前正在展示的格子信息<key，GridItem>
    private _curShowItems = new Map<string, GridItem>();

    // Item缓存池
    private _itemPool: GridItem[] = [];

    // 配置信息
    private _option: GridOption = { getItem: (): GridItem => { return null }, releaseItem: () => { }, onInit: () => { } };

    // 每一 行/列 能够显示几个
    private _numPerUnit = 0;

    // 单元格的大小位置
    private _itemSize: cc.Size = cc.size(0);

    // 开始显示的索引，基于_datas的索引
    private _startIndex = 0;

    // 这个数量，讲道理，应该是跟currShowItems的数量保持一致的！
    private _totalDisplayNum = 0;

    // 分帧加载的信息
    private _delayUpdateInfo: DelayUpdateInfo = null;

    // 额外插入的单元
    private _extraUnits: ExtraUnit[] = [];

    private _marginLeft = 0;
    private _marginRight = 0;
    private _marginTop = 0;
    private _marginBottom = 0;
    private _originSpacing = cc.Vec2.ZERO;

    get numPerUnit() {
        return this._numPerUnit;
    }

    get totalDisplayNum() {
        return this._totalDisplayNum;
    }

    get gridDatas() {
        return this._datas;
    }

    onLoad() {
        if (this.scroll) {
            this.scroll.node.on("scrolling", this._onScroll, this);
        }

        this._datas = [];
        this._curShowItems.clear();
        this._itemPool = [];
        this._extraUnits = [];
        if (this.direction === Direction.HORIZONTAL) {
            this.scroll.horizontal = true;
            this.scroll.vertical = false;
            this.scroll.content.setAnchorPoint(0, 0.5);
        } else {
            this.scroll.horizontal = false;
            this.scroll.vertical = true;
            this.scroll.content.setAnchorPoint(0.5, 1);
        }

        this._originSpacing.x = this.spacingCol;
        this._originSpacing.y = this.spacingRow;
    }

    onDestroy() {
        if (this._curShowItems.size > 0 || this._itemPool.length > 0) {
            logger.warn(`UIGridView`, `还有资源没有释放，释放之前要记得先调用 clear`);
        }

        if (this.scroll && this.scroll.node) {
            this.scroll.node.off("scrolling", this._onScroll, this);
        }
    }

    private _onScroll() {
        this.updateScroll();
    }

    private get startPad(): number {
        if (this.direction === Direction.VERTICAL) {
            return this.paddingTop + this._marginTop;
        } else {
            return this.paddingLeft + this._marginLeft;
        }
    }

    getLeftPendding() {
        return this.paddingLeft + this._marginLeft;
    }

    private get endPad(): number {
        if (this.direction === Direction.VERTICAL) {
            return this.paddingBottom + this._marginBottom;
        } else {
            return this.paddingRight + this._marginRight;
        }
    }

    private get varyingSpace(): number {
        return this.direction === Direction.VERTICAL ? this.spacingCol : this.spacingRow;
    }

    private get uniformSpace(): number {
        return this.direction === Direction.VERTICAL ? this.spacingRow : this.spacingCol;
    }

    /**
     * @desc 插入数据
     *
     * @param {GridData[]} datas
     * @param {boolean} [update=true] 如果发现有重复的，是否更新
     * @memberof UIGridView
     */
    addItems(datas: GridData[], update = true) {
        if (!this._option) {
            logger.warn(`UIGridView`, 'should init UIGridView first.');
            return;
        }

        datas.forEach(v => {
            const index = this._keyToIndex(v.key);
            if (index >= 0) {
                if (update) {
                    this._datas[index].data = v.data;
                    this._datas[index].uiState = v.uiState;
                    this._datas[index].dirty = true;
                }
            } else {
                // 插入
                this._datas.push(v);
            }
        });
        this.updateScroll();
    }

    updateDatas(datas: GridData[]) {
        if (!this._option) {
            logger.warn(`UIGridView`, 'should init UIGridView first.');
            return;
        }
        this._datas = datas;

        this._computeBaseInfo();
        this.updateScroll(false);
        for(let i = 0; i < this._datas.length; ++i) {
            this.updateItem(datas[i]);
        }
    }

    /**
     * @desc 根据info更新数据
     *
     * @param {GridData} info
     * @param {boolen} insert 是否插入，默认不插入
     * @memberof UIGridView
     */
    updateItem(info: GridData, insert = false) {
        const item = this._infoToItem(info);
        if (item) {
            this._option.onInit(item, info);
        }

        const index = this._keyToIndex(info.key);
        if (index >= 0) {
            this._datas[index].data = info.data;
            this._datas[index].uiState = info.uiState;
        } else {
            if (insert) {
                if (this._option.sortFunc) {
                    let pos = 0;
                    for (let i = 0; i < this._datas.length; ++i) {
                        if (this._option.sortFunc(this._datas[i], info) >= 0) {
                            pos = i;
                            break;
                        }
                    }
                    this._datas.splice(pos, 0, info);
                } else {
                    this._datas.push(info);
                }
                this.updateScroll();
            }
        }
    }

    getItems(): Map<string, GridItem> {
        return this._curShowItems;
    }

    getItemBykey(key: string): GridItem {
        if(!this._curShowItems || this._curShowItems.size == 0) return null;
        for (let idx of this._curShowItems.keys()) {
            if(idx == key) {
                return this._curShowItems.get(key);
            }
        }
        return null;
    }

    scrollTo(info: GridData, time?: number) {
        const index = this._keyToIndex(info.key);
        if (index >= 0) {
            let uTime = (typeof time == 'undefined'  || time == null) ? 0.2 : time;
            if (this.direction === Direction.VERTICAL) {
                // const offset = this.startPad + index * this._itemSize.height + (index - 1) * this.spacingRow;
                const cow: number = Math.floor(index / this._numPerUnit);
                const offsetY = this.startPad + cow * this._itemSize.height + cow * this.spacingRow;
                this.scroll.scrollToOffset(cc.v2(0, offsetY), uTime, true);
            } else {
                const offset = this.startPad + index * this._itemSize.width + (index - 1) * this.spacingCol;
                this.scroll.scrollToOffset(cc.v2(offset, 0), uTime, true);
            }
        }
    }

    /**
     * @desc 根据Key查询GridData数据
     *
     * @param {string} key
     * @returns {GridData}
     * @memberof UIGridView
     */
    getGridData(key: string): GridData {
        const index = this._keyToIndex(key);
        if (index >= 0 && index < this._datas.length) {
            const ret = { ...this._datas[index] };
            const item = this._infoToItem(ret);
            if (item) {
                ret.uiState = item.uiState;
            }
            return ret;
        }
        return null;
    }

    /**
     * @desc 删除数据
     *
     * @param {string} key
     * @memberof UIGridView
     */
    deleteItem(key: string) {
        const index = this._keyToIndex(key);
        if (index >= 0) {
            this._datas.splice(index, 1);
            this.updateScroll();
        }
    }

    /**
     * @desc 根据info查找一个Item；如果item不在当前的显示中，就返回一个null
     *
     * @private
     * @param {GridData} info
     * @returns {GridItem}
     * @memberof UIGridView
     */
    private _infoToItem(info: GridData): GridItem {
        return this._curShowItems.get(info.key);
    }

    /**
     * @desc 查询有效的显示大小（按照实际展示的行数、列数来计算的一个大小）
     *
     * @returns {cc.Size}
     * @memberof UIGridView
     */
    getDisplaySize(): cc.Size {
        if (this._startIndex > 0) {
            return this.scroll.content.getContentSize();
        }

        // 一个单元格都不够的
        if (this._totalDisplayNum < this._numPerUnit) {
            if (this.direction === Direction.VERTICAL) {
                return cc.size(
                    this.paddingLeft + this.paddingRight + this._marginLeft + this._marginRight + this._itemSize.width * this._totalDisplayNum + this.varyingSpace * (this._totalDisplayNum - 1),
                    this.paddingTop + this.paddingBottom + this._marginTop + this._marginBottom + this._itemSize.height
                );
            } else {
                return cc.size(
                    this.paddingLeft + this.paddingRight + this._marginLeft + this._marginRight + this._itemSize.width,
                    this.paddingTop + this.paddingBottom + this._marginTop + this._marginBottom + this._itemSize.width * this._totalDisplayNum + this.varyingSpace * (this._totalDisplayNum - 1)
                );
            }
        }

        return this.scroll.content.getContentSize();
    }

    /**
     * @desc 根据key定位在datas中的index
     *
     * @private
     * @param {string} key key
     * @returns {number} 返回查询到的datas中的index，查询不到则返回-1
     * @memberof UIGridView
     */
    private _keyToIndex(key: string): number {
        let ret = -1;
        this._datas.some((v, index) => {
            if (v.key == key) {
                ret = index;
                return true;
            }
            return false;
        });
        return ret;
    }

    /**
     * @desc 计算ItemSize、colPerRow、spaceY等信息
     *
     * @private
     * @memberof UIGridView
     */
    private _computeBaseInfo() {
        const item: GridItem = this._getOneItem();
        // this._itemSize = item.node.getContentSize();
        this._itemSize = uiHelper.getNodeSizeWithScale(item.node);
        this._putOneItem(item);

        if (this._itemSize.width == 0 || this._itemSize.height == 0) {
            logger.warn('GridView', `item size must not be ZERO`);
            this._itemSize.width = Math.max(this._itemSize.width, 1);
            this._itemSize.height = Math.max(this._itemSize.height, 1);
        }

        // 计算一下每行以及每列应该展示的数量多少
        let containerSize = this.scroll.content.getContentSize();
        if (this.direction === Direction.VERTICAL) {
            if (containerSize.width < this.paddingLeft + this.paddingRight + this._itemSize.width) {
                containerSize.width = this.paddingLeft + this.paddingRight + this._itemSize.width;
                this.scroll.content.width = containerSize.width;
                this.spacingCol = 0;
                logger.warn('GridView', `Item's width is bigger than container width!!!!!!`);
            } else {
                this.spacingCol = Math.min(this.spacingCol, containerSize.width - this.paddingLeft - this.paddingRight - this._itemSize.width);
            }
        } else {
            if (containerSize.height < this.paddingTop + this.paddingBottom + this._itemSize.height) {
                containerSize.height = this.paddingTop + this.paddingBottom + this._itemSize.height;
                this.scroll.content.height = containerSize.height;
                this.spacingRow = 0;
                logger.warn('GridView', `Item's width is bigger than container Height!!!!!!`);
            } else {
                this.spacingRow = Math.min(this.spacingRow, containerSize.height - this.paddingTop - this.paddingBottom - this._itemSize.height);
            }
        }

        // 计算每一行/列最多放多少个
        if (this.direction === Direction.VERTICAL) {
            this._numPerUnit = Math.floor((containerSize.width - (this.paddingLeft + this.paddingRight)) / (this._itemSize.width + this.varyingSpace));
        } else {
            this._numPerUnit = Math.floor((containerSize.height - (this.paddingTop + this.paddingBottom)) / (this._itemSize.height + this.varyingSpace));
        }

        // 根据Pad自动计算间距
        if (this.varyingSpace == 0) {
            // 要重新对间距进行修正
            if (this.direction === Direction.VERTICAL) {
                const allSpace = (containerSize.width - (this.paddingLeft + this.paddingRight) - this._itemSize.width * this._numPerUnit);
                if (this._numPerUnit > 1) {
                    this.spacingCol = allSpace / (this._numPerUnit - 1);
                } else {
                    this.spacingCol = 0;
                    this._marginLeft = allSpace / 2;
                    this._marginRight = allSpace / 2;
                }
            } else {
                const allSpace = (containerSize.height - (this.paddingTop + this.paddingBottom) - this._itemSize.height * this._numPerUnit);
                if (this._numPerUnit > 1) {
                    this.spacingRow = allSpace / (this._numPerUnit - 1);
                } else {
                    this.spacingRow = 0;
                    this._marginTop = allSpace / 2;
                    this._marginBottom = allSpace / 2;
                }
            }
        } else {
            // 根据间距自动计算marging
            if (this.direction === Direction.VERTICAL) {
                const allSpace = (containerSize.width - (this.paddingLeft + this.paddingRight) - this._itemSize.width * this._numPerUnit - (this._numPerUnit - 1) * this.varyingSpace);
                this._marginLeft = allSpace / 2;
                this._marginRight = allSpace / 2;
            } else {
                const allSpace = (containerSize.height - (this.paddingTop + this.paddingBottom) - this._itemSize.height * this._numPerUnit - (this._numPerUnit - 1) * this.varyingSpace);
                this._marginTop = allSpace / 2;
                this._marginBottom = allSpace / 2;
            }
        }
    }

    /**
     * @desc 重新根据datas来计算整个显示信息，最终要计算出 totalDisplayNum、startIndex信息；设置scroll.content.height
     * @param {boolean} [reset = false] 是否需要重置列表的位置到初始位置
     * @private
     * @memberof UIGridView
     */
    private _computeDisplayInfo(reset = false) {
        // 看看所有的数据，一共有多少行
        const totalUnit = Math.ceil(this._datas.length / this._numPerUnit);

        // 设置一下containerHeight
        let containerSize = 0;
        if (this.direction === Direction.VERTICAL) {
            containerSize = this.startPad + this.endPad + this._itemSize.height * totalUnit + (totalUnit - 1) * this.uniformSpace;
            if (this._extraUnits && this._extraUnits.length > 0) {
                this._extraUnits.forEach(unit => {
                    containerSize += unit.node.height * unit.node.scaleY + this.uniformSpace;
                });
            }
            this.scroll.content.height = containerSize;
        } else {
            containerSize = this.startPad + this.endPad + this._itemSize.width * totalUnit + (totalUnit - 1) * this.uniformSpace;
            if (this._extraUnits && this._extraUnits.length > 0) {
                this._extraUnits.forEach(unit => {
                    containerSize += unit.node.width * unit.node.scaleX + this.uniformSpace;
                });
            }
            this.scroll.content.width = containerSize;
        }

        // 计算一下总共需要显示的数量
        let totalDisplayNum = 0;
        const maskSize = this.scroll.content.parent.getContentSize();
        // 计算一下要放多少个
        const maxSize = this.direction === Direction.VERTICAL ? maskSize.height : maskSize.width;
        if (maxSize >= containerSize) {
            totalDisplayNum = this._datas.length;
        } else {
            let unitLength = (this.direction == Direction.VERTICAL ? this._itemSize.height : this._itemSize.width) + this.uniformSpace;
            let rowNum = Math.ceil(maxSize / unitLength) + 1;
            totalDisplayNum = Math.min(this._datas.length, rowNum * this._numPerUnit);
        }
        this._totalDisplayNum = totalDisplayNum;
        // if(this._extraUnits.length > 0) {
        //     this._totalDisplayNum += this._extraUnits.length;
        // }
        if (reset && !this.closeAutoAlign) {
            uiHelper.alignNode(this.scroll.content, cc.size(0, 0));
        }

        this._checkToAutoCenter();
    }

    private _checkToAutoCenter() {
        if (this._option.autoCenter) {
            const nowSize = this.getDisplaySize();
            const maskSize = this.scroll.content.parent.getContentSize();

            if (this.direction === Direction.VERTICAL) {
                if (nowSize.height < maskSize.height) {
                    const widght = this.scroll.content.parent.getComponent(cc.Widget);
                    if (widght) {
                        widght.enabled = false;
                    }

                    const padTop = (maskSize.height - nowSize.height) / 2;
                    const padLeft = (maskSize.width - nowSize.width) / 2;
                    if (!this.closeAutoAlign)
                        uiHelper.alignNode(this.scroll.content.parent, cc.size(padLeft, padTop));
                }
            } else {
                if (nowSize.width < maskSize.width) {
                    const widght = this.scroll.content.parent.getComponent(cc.Widget);
                    if (widght) {
                        widght.enabled = false;
                    }

                    const padTop = (maskSize.height - nowSize.height) / 2;
                    const padLeft = (maskSize.width - nowSize.width) / 2;
                    if (!this.closeAutoAlign)
                       uiHelper.alignNode(this.scroll.content.parent, cc.size(padLeft, padTop));
                }
            }
        }
    }

    /**
     * @desc 获取他的边界便宜对齐数据（左上角）；考虑中心点
     *
     * @private
     * @param {cc.Node} node
     * @returns {cc.Size}
     * @memberof UIGridView
     */
    private _getAlign(node: cc.Node): cc.Size {
        if (!cc.isValid(node) || !cc.isValid(node.parent)) {
            return cc.Size.ZERO;
        }

        const pSize = uiHelper.getNodeSizeWithScale(node.parent);
        const pOffsetX = pSize.width * node.parent.anchorX;
        const pOffsetY = pSize.height * (1 - node.parent.anchorY);

        const size = uiHelper.getNodeSizeWithScale(node);
        const padX = (node.x + pOffsetX) - size.width * node.anchorX;
        const padY = pOffsetY - (1 - node.anchorY) * size.height - node.y;

        return cc.size(padX, padY);
    }

    /**
     * @desc 根据当前的content位置以及大小，来计算应该展示的item的起始索引
     *
     * @private
     * @returns {number}
     * @memberof UIGridView
     */
    private _getStartIndex(): number {
        let ret = 0;
        if (this.direction === Direction.VERTICAL) {
            const offset = -this._getAlign(this.scroll.content).height;
            ret = Math.ceil((offset - this.startPad) / (this._itemSize.height + this.uniformSpace));
            return ret < 1 ? 0 : (ret - 1) * this._numPerUnit;
        } else {
            const offset = -this._getAlign(this.scroll.content).width;
            ret = Math.ceil((offset - this.startPad) / (this._itemSize.width + this.uniformSpace));
            return ret < 1 ? 0 : (ret - 1) * this._numPerUnit;
        }
    }

    /**
     * @desc 获取一个item；优先从itemPool中获取，没有的话再从其他地方获取
     *
     * @private
     * @returns {GridItem}
     * @memberof UIGridView
     */
    private _getOneItem(): GridItem {
        return this._option.getItem();
    }

    /**
     * @desc 释放一个item，将一个item放回itemPool
     *
     * @private
     * @param {GridItem} item
     * @memberof UIGridView
     */
    private _putOneItem(item: GridItem) {
        this._option.releaseItem(item);
    }

    updateScroll(reset = false) {
        this._computeDisplayInfo(reset);

        // 根据位置计算当前需要显示的起始位置
        this._startIndex = this._getStartIndex();

        // 要移除没用的item以及对item的位置和数据进行更新
        this._curShowItems.forEach((v, key) => {
            const index = this._keyToIndex(key);
            if (index == -1 || index < this._startIndex || index >= (this._startIndex + this._totalDisplayNum)) {
                this._curShowItems.delete(key);
                if (index >= 0) {
                    this._datas[index].uiState = v.uiState;
                }
                this._putOneItem(v);
            }
        });

        // 如果是需要延迟加载的，就放在延迟加载里边去
        if (this._delayUpdateInfo && this._delayUpdateInfo.updatePerFrame > 0) {
            return;
        }

        let now = 0;
        while (now < this._totalDisplayNum && (now + this._startIndex) < this._datas.length) {
            const index = now + this._startIndex;
            // let findExtraIndex: number = this._extraUnits.findIndex(item => {
            //     return item.index == index;
            // });
            // if (findExtraIndex > -1) {
            //     this._updateOneExtraUnit(findExtraIndex);
            // }
            this._updateOneItem(index);
            ++now;
        }
    }

    /**
     * @desc 初始化一个GridView
     *
     * @param {GridData[]} datas
     * @param {GridOption} option
     * @returns
     * @memberof UIGridView
     */
    init(datas: GridData[], option: GridOption) {
        this.clear();
        if (option.resetSpacingCol) this.spacingCol = option.resetSpacingCol;
        if (option.resetSpacingRow) this.spacingRow = option.resetSpacingRow;

        this._datas = [...datas];
        if (option.sortFunc) {
            this._datas.sort(option.sortFunc);
        }
        this._option = option;

        this._marginLeft = 0;
        this._marginRight = 0;
        this._marginTop = 0;
        this._marginBottom = 0;

        if (option.updatePerFrame && option.updatePerFrame > 0) {
            this._delayUpdateInfo = {
                updatePerFrame: option.updatePerFrame,
            };
        } else {
            this._delayUpdateInfo = null;
        }

        option.extraUnits && (this._extraUnits = option.extraUnits);

        this._computeBaseInfo();

        this.updateScroll(true);
    }

    private _getItemPosition(index: number): cc.Vec3 {
        if (this.direction === Direction.VERTICAL) {
            let row = Math.floor(index / this._numPerUnit);
            let col = Math.floor(index % this._numPerUnit);

            const px = this.paddingLeft + this._marginLeft + col * (this._itemSize.width + this.varyingSpace);
            const py = this.paddingTop + this._marginTop + row * (this._itemSize.height + this.uniformSpace);
            return cc.v3(px, py);
        } else {
            let col = Math.floor(index / this._numPerUnit);
            let row = Math.floor(index % this._numPerUnit);

            const px = this.paddingLeft + this._marginLeft + col * (this._itemSize.width + this.uniformSpace);
            const py = this.paddingTop + this._marginTop + row * (this._itemSize.height + this.varyingSpace);
            return cc.v3(px, py);
        }
    }

    /**
     * @desc 更新一个Item
     *
     * @private
     * @param {number} index data的index，在datas中的index
     * @returns {boolean} 返回是否有执行更新数据操作（更新数据操作会比较耗时）
     * @memberof UIGridView
     */
    private _updateOneItem(index: number): boolean {
        if (index < 0 || index >= this._datas.length) {
            return false;
        }

        let realUpdate = false;

        const itemData = this._datas[index];
        let item = this._curShowItems.get(itemData.key);
        if (!item) {
            item = this._getOneItem();
            this.scroll.content.addChild(item.node);
            this._option.onInit(item, itemData);
            itemData.dirty = false;
            this._curShowItems.set(itemData.key, item);
            if (item.uiState) {
                item.uiState = itemData.uiState;
            }

            realUpdate = true;

            const pos = this._getItemPosition(index);
            uiHelper.alignNode(item.node, cc.size(pos.x, pos.y));
        } else {
            const pos = this._getItemPosition(index);
            uiHelper.alignNode(item.node, cc.size(pos.x, pos.y));
        }

        // 更新位置
        if (itemData.dirty) {
            this._option.onInit(item, itemData);
            itemData.dirty = false;
            realUpdate = true;
        }

        return realUpdate;
    }

    private _updateOneExtraUnit(index: number) {
        // if (index < 0 || index >= this._datas.length) {
        //     return false;
        // }

        if (!this._extraUnits || this._extraUnits.length == 0) {
            return false;
        }

        let realUpdate = false;
        let extraUnit: ExtraUnit;
        this._extraUnits.forEach(unit => {
            if (unit && unit.index == index) {
                extraUnit = unit;
            }
        });

        if (extraUnit && cc.isValid(extraUnit.node)) {
            this.scroll.content.addChild(extraUnit.node);
            realUpdate = true;

            const pos = this._getItemPosition(index);
            if (!this.closeAutoAlign)
                uiHelper.alignNode(extraUnit.node, cc.size(pos.x, pos.y));
        }

        return realUpdate;
    }

    itemSize() {
        return this._itemSize;
    }

    /**
     * @desc 清空所有数据，包括各种itemPool；复位到init之前的状态
     *
     * @returns
     * @memberof UIGridView
     */
    clear() {
        this._datas = [];
        this._itemSize = cc.Size.ZERO;
        this._delayUpdateInfo = null;

        this.spacingCol = this._originSpacing.x;
        this.spacingRow = this._originSpacing.y;

        this._curShowItems.forEach((v, k) => {
            v.node.active = false;
            this._itemPool.push(v);
        });
        this._curShowItems.clear();

        this._itemPool.forEach(v => {
            if (this._option && this._option.releaseItem) {
                this._option.releaseItem(v);
            }
        })
        this._itemPool = [];

        this._extraUnits.forEach(v => {
            if (v && v.releaseExtra) {
                v.releaseExtra(v.node);
            }
        })
        this._extraUnits = [];
    }

    update() {
        if (this._option && this._delayUpdateInfo && this._delayUpdateInfo.updatePerFrame > 0) {
            let nowUpdateNum = 0;
            let now = 0;
            while (now < this._totalDisplayNum && (now + this._startIndex) < this._datas.length) {
                const index = now + this._startIndex;
                // let findExtraIndex: number = this._extraUnits.findIndex(item => {
                //     return item.index == index;
                // });
                // if(findExtraIndex > -1) {
                //     this._updateOneExtraUnit(findExtraIndex);
                // }
                if (this._updateOneItem(index)) {
                    ++nowUpdateNum;
                }
                ++now;
                if (nowUpdateNum >= this._delayUpdateInfo.updatePerFrame) {
                    break;
                }
            }
        }
    }
}

export {
    GridData,
    GridItem,
    GridOption,
    ExtraUnit
}
