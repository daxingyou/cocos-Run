import { gamesvr } from "../../../network/lib/protocol";

interface BaseOption {
    id: number;
}

class EffectOption <Type extends BaseOption> {
    private _options = new Map<number, Type> ();
    private _default: Type = null;
    constructor (defaultOption?: Type) {
        this._default = defaultOption;
    }

    add (opt: Type): EffectOption<Type> {
        this._options.set(opt.id, opt);
        return this;
    }

    get (id: number): Type {
        return this._options.has(id) ? this._options.get(id) : this._defaultOption(id);
    }

    private _defaultOption (id: number): Type {
        return {
            ...this._default,
            id: id
        };
    }
}

enum BUFF_EFFECT_OPPORTUNITY {
    GET         = 0,
    ACTIVATE    = 1,
}

/**
 * @desc Buff动画的配置选项
 * @param id buff的ID
 * @param opportunity Buff的Skill动画触发时机（获得时播放/激活时播放）
 * @param gfx Buff的特效资源
 * @interface BuffEffectOption
 */
interface BuffEffectOption extends BaseOption {
    opportunity: BUFF_EFFECT_OPPORTUNITY;
    gfx: string;
    gfxName: string;
}

const defaultBuffOption: BuffEffectOption = {
    id: 0,
    opportunity: BUFF_EFFECT_OPPORTUNITY.GET,
    gfx: "",
    gfxName: "",
}

const buffEffectOption = new EffectOption<BuffEffectOption>(defaultBuffOption);

interface ItemEffectOption extends BaseOption {
    durationRate: number;
}

const defaultItemOption: ItemEffectOption = {
    id: 0,
    durationRate: 1.0,
}

const itemEffectOption = new EffectOption<ItemEffectOption>();

// 多段攻击的时间得特殊处理一下
// itemEffectOption.add({id: 534311, durationRate: 0});

const autoEffectDurationRate = 2;

const getBuffEffectOption = (id: number): BuffEffectOption => {
    return buffEffectOption.get(id);
}

const getItemEffectOption = (id: number): ItemEffectOption => {
    return itemEffectOption.get(id);
}

const OtherStateItemResultType = new Set<number>();
OtherStateItemResultType.add(gamesvr.ResultType.RTPowerResult);

const hasStateInOtherResultType = (rtype: gamesvr.ResultType): boolean => {
    return OtherStateItemResultType.has(rtype);
}

export {
    BUFF_EFFECT_OPPORTUNITY,
    getBuffEffectOption,
    getItemEffectOption,
    hasStateInOtherResultType,
    autoEffectDurationRate,
}


