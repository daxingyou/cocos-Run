import { configManager } from "../../common/ConfigManager";
import { HEAD_TYPE } from "../../app/AppEnums"

interface ConfigHead {
    HeadFrameId: number,
    HeadFrameType: HEAD_TYPE,
    HeadFrameNum: number,
    HeadFrameName: string,
    HeadFrameOpenTask: number,
    HeadFramImage: string,
    HeadFrameLimit: string
}

/**
 * 暂存图片地址
 */
interface CACHE_URL {
    headUrl: string,
    frameUrl: string
}

export {
    ConfigHead,
    CACHE_URL
}

export default class HeadData {
    private _headCfg: ConfigHead[] = new Array<ConfigHead>();
    private _frameCfg: ConfigHead[] = new Array<ConfigHead>();

    init() {
        this.dueData();
    }

    dueData() {
        let headFrameData: any[] = configManager.getAnyConfig("ConfigHeadFrame");
        headFrameData.forEach((ele) => {
            let headItem: ConfigHead = {
                HeadFrameId: ele.HeadFrameId,
                HeadFrameType: ele.HeadFrameType,
                HeadFrameNum: ele.HeadFrameNum,
                HeadFrameName: ele.HeadFrameName,
                HeadFrameOpenTask: ele.HeadFrameOpenTask,
                HeadFramImage: ele.HeadFramImage,
                HeadFrameLimit: ele.HeadFrameLimit
            }
            switch (headItem.HeadFrameType) {
                case HEAD_TYPE.HEAD:
                    this._headCfg.push(headItem);
                    break;
                case HEAD_TYPE.FRAME:
                    this._frameCfg.push(headItem);
                    break;
            }
        })
    }
    /**
     * 获取头像配置
     */
    get headConfig() {
        return this._headCfg;
    }
    /**
     * 获取头像框配置
     */
    get frameConfig() {
        return this._frameCfg;
    }
    /**
     * 按照配置ID获取其在配置表中索引值
     * @param hID 配置ID
     * @returns 
     */
    getHeadIndex(hID: number) {
        for (let index = 0; index < this._headCfg.length; index++) {
            const ele = this._headCfg[index];
            if (ele.HeadFrameId == hID) {
                return index;
            }
        }
        return -1;
    }
    /**
     * 按照配置ID获取其在配置表中索引值
     * @param hID 配置ID
     * @returns 
     */
    getFrameIndex(hID: number) {
        for (let index = 0; index < this._frameCfg.length; index++) {
            const ele = this._frameCfg[index];
            if (ele.HeadFrameId == hID) {
                return index;
            }
        }
        return -1;
    }
    /**
     * 按照头像/头像框ID获取配置
     */
    getConfigByHeadId(hID: number) {
        return configManager.getConfigByKey("headFrame", hID);
    }
}