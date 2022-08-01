import { logger } from "../../common/log/Logger";

export default class BaseModel {

    init () { 
        let className = this.constructor.toString().match(/\w+/g)[1];
        logger.warn('BaseModel', `${className} maybe not init!`);
    }
    
    deInit () {
        let className = this.constructor.toString().match(/\w+/g)[1];
        logger.warn('BaseModel', `${className} maybe not deInit! `);
    }
}