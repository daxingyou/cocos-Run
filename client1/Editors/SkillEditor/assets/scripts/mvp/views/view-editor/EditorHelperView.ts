import { ViewBaseComponent } from "../../../common/components/ViewBaseComponent";

const {ccclass, property} = cc._decorator;

@ccclass
export default class EditorHelperView extends ViewBaseComponent {
    @property(cc.RichText)
    text: cc.RichText = null;

    onInit () {
        this._appendText(`
        1. 操作说明
            1.1 右边效果编辑区域介绍
                1.1.1 顶部为ID，用来唯一标识动效模板。右边的黄色按钮为描述按钮，可以为该技能添加描述
                1.1.2 目标卡牌ID。用来标识这个动效模板的目标主效果类型（跟TARGET_XXX相关），有四种可选
                    a. none：不限定类型
                    b. attack：攻击类型（只有血量变化，或者格挡变化才会播放目标动效）
                    d. state: 状态类型（BUFF、力量、敏捷等属性变化为主的卡牌效果）
                1.1.3 动效模板的效果列表。一个动效模板，是由多个效果列表构成
                    a. 列表可以滚动
                    b. 点击可以选中。选中的效果可以进行编辑（在下方的效果编辑面板）
                    c. 单个效果右边的按钮，有删除按钮，可以点击删除
                    d. 标题最后边，有+号按钮；可以新增一个效果
                1.1.4 效果编辑页面。一个效果，由以下几部分构成
                    a. 效果标记类型
                        效果标记类型。是标记该效果是属于那些类型归属的。目前可选的有以下几种
                            SOURCE_ANIMATION
                            Target_anim
                            Source_gfx
                            Target_gfx
                        SOURCE_XXX 是发起方的动画，以及绑定的动效
                        TARGET_XXX 是目标方的动画，以及动效相关的绑定
                        TARGET_ANIMATION_WITHBLOCK 这个是有特殊的含义。在打击效果中，如果遇到完全格挡，是不会触发受击动画的
                        最终的效果是按照分组来的，分组一共有【两个】
                        SOURCE : SOURCE_ANIMATION | Source_gfx
                        TARGET : Target_anim | Target_gfx
                        这两个分组，是效果播放的过滤分组
                        播放的时候就取出来对应的组
                    b. 动画编辑部分
                        该部分会指定动画的播放，共有3个字段描述
                        动画目标：动画的播放主体。共有两个 actor-source、actor-target；一个是源，一个是目标
                        动画名称：动画的名称。常见的有：attack01、injured、dead、Idle、use
                        延时时间：动画播放的延时时间（从该效果模板的启动起）
                    c. 特效编辑部分
                        改部分指定该效果要绑定的特效信息
                        动画类型：共有三种可选
                            skeleton：spine的骨骼动画特效
                            cocos-animation：cocos creator编辑输出的动画，以prefab提供。比如粒子
                            cocos-prefab：cocos creator编辑输出的预制体资源，以prefab提供（没有动画信息），比如拖尾
                        AOE选项：共有两个选项。AOE会决定这个动效的绑定节点（默认是根据标记类型来，如果有AOE，就根据AOE来）
                            aoe-source：几方全部绑定
                            aoe-target：目标全部绑定
                        特效文件：资源文件路径，根据选择的动画类型不同，有不一样的选择列表
                        特效动画：指定动画的名称（可选）
                        特效皮肤：指定的动效的皮肤（可选，只针对spine动画有效）
                        延时时间：延迟播放的时间
                        大小缩放：指定的动效缩放系数
                        偏移尺寸：相对绑定节点的偏移位置（X、Y）
                        角色背后：可以指定是否在角色的前边还是后边的层级关系
                        随机旋转：可以指定动效是否具有随机旋转属性，以便每次都给玩家不一样的体验

                        下边是轨迹支持，动效支持按照指定的属性进行移动，以便实现一些特殊的效果
                        轨迹目标：轨迹运动的终点，相对终点目标的参考（target、source等）
                        目标偏移：针对参考目标的偏移位置
                        曲线类型：目前仅支持两种 line、bezier（直线、贝塞尔）。如果有需要可以扩展支持
                        持续时间：轨迹的运动时间（秒为单位）
                        控制点：贝塞尔曲线的控制点参数
                        缓动类型：目前支持三种：insine、outsine、inoutsine。根据需要可以扩展

                    d. 震屏配置
                        震屏目前支持的参数包括：次数、振幅、延时时间等等

                    e. 高光效果
                        支持配置目标的高光效果（根据标记类型来判定目标）。支持延时时间和持续时间

                    f. 音频配置
                        指定要配置的音频选项
                        音频路径和延时时间

            a. 右下角技能列表可以打开所有的技能动效模板列表。可以选中指定一个进行编辑、删除、复制等操作！
            b. 点击底部按钮栏区域的<color=#E1BB4C>播放</color>按钮，可以预览效果。（预览播放会自动保存，所以无需单独再点击保存）
            c. 底部播放按钮旁边，是慢速播放倍率调整按钮。最高可以以16倍的低速进行播放

        2. 知识库
            2.1 目标卡牌：目标卡牌决定了这个模板的目标动画（TARGET_GROUP）的播放敏感参数。比如一模板的受击动画是一个刀光加入一个受击，但是对应的卡牌是“获得8点
                格挡，造成8点伤害”。我们期望播放多个受击效果，是跟随着“8点伤害”来播放的，而不是跟着“8点护甲”来播放，我们就要设定这个模板动画，是attack类型

        3. 角色信息
            1.1 延时
                a. 每个角色可以单独设置延时的补偿时间，以调试不同角色放同一技能时候的节奏
                b. 对所有的动作和特效都生效
            1.2 尺寸
                a. 每个角色定制的大小，主要是用作改变spine动画的角色节点大小，以调整信息的位置（比如头上的buff，大boss的位置比普通小怪高）
        4. 事件
            暂时只有1个，可以后续补充
            1.1 hit-target
                a. 受击者播放的受击TARGET分组的效果时候，会在hit-target事件的时候显示
                    1) 扣血飘字
                    2) 血条变化
                    3) 通用的扣血特效
        
        5. 开发备注：
            minTime和maxTime是所有动作特效的最早的起始时间和最后的播放时间
        `);
    }

    private _appendText (info: string) {
        this.text.string = this.text.string + '\n' + info;
    }
}