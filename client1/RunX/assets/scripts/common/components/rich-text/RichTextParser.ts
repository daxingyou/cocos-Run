/**
 * File: RichTextParser.ts
 * Created Date: Mon Aug 25 2021
 * Author: Dex
 * Description: RichText的html格式解析类，来自于cocos::html-text-parser
 * 
 * Copyright (c) 2021 @zqGame
 */

const eventRegx = /^(click)(\s)*=|(param)(\s)*=/;
const imageAttrReg = /(\s)*src(\s)*=|(\s)*height(\s)*=|(\s)*width(\s)*=|(\s)*click(\s)*=|(\s)*param(\s)*=/;

interface SpecialSymbol {
    key: RegExp;
    value: string;
}

interface EventHandler {
    param?: string;
    [eventName: string]: string;
}

interface OutlineInfo {
    color: string;
    width: number;    
}

interface BlockStyle {
    color?: string;
    size?: number;
    event?: EventHandler;
    isNewLine?: boolean;
    isImage?: boolean;
    imageWidth?: number;
    imageHeight?: number;
    outline?: OutlineInfo;
    underline?: boolean;
    italic?: boolean;
    bold?: boolean;

    [index: string]: any;
}

interface LabelBlock {
    text: string;
    style?: BlockStyle;
}

class HtmlTextParser {
    private _arrSpecialSymbol: SpecialSymbol[] = [];
    private _arrResult: LabelBlock[] = [];
    private _stack: BlockStyle[] = [];

    constructor () {
        this._arrSpecialSymbol.push({key: /&lt;/g, value:'<'});
        this._arrSpecialSymbol.push({key: /&gt;/g  , value: '>'});
        this._arrSpecialSymbol.push({key: /&amp;/g , value: '&'});
        this._arrSpecialSymbol.push({key: /&quot;/g, value: '"'});
        this._arrSpecialSymbol.push({key: /&apos;/g, value: '\''});
    }

    parse (htmlString: string): LabelBlock[] {
        this._arrResult = [];
        this._stack = [];

        let startIndex = 0;
        const length = htmlString.length;
        while (startIndex < length) {
            const tagBeginIndex = htmlString.indexOf('<', startIndex);
            if (tagBeginIndex < 0) {
                this._stack.pop();
                this._processResult(htmlString.substring(startIndex));
                startIndex = length;
            } else {
                this._processResult(htmlString.substring(startIndex, tagBeginIndex));

                let tagEndIndex = htmlString.indexOf('>', startIndex);
                if (tagEndIndex === -1) {
                    tagEndIndex = tagBeginIndex;
                } else if (htmlString.charAt(tagBeginIndex + 1) === '\/'){
                    this._stack.pop();
                } else {
                    this._addToStack(htmlString.substring(tagBeginIndex + 1, tagEndIndex));
                }
                startIndex = tagEndIndex + 1;
            }
        }
        return this._arrResult;
    }

    private _attributeToObject (attribute: string): BlockStyle {
        attribute = attribute.trim();

        let obj: BlockStyle = {};
        let header = attribute.match(/^(color|size|bold)(\s)*=/);
        let tagName;
        let nextSpace;
        let eventObj: EventHandler;
        let eventHanlderString: string;
        if (header) {
            tagName = header[0];
            attribute = attribute.substring(tagName.length).trim();
            if(attribute === "") return obj;

            //parse color
            nextSpace = attribute.indexOf(' ');
            switch(tagName[0]){
              case 'c':
                  if (nextSpace > -1) {
                      obj.color = attribute.substring(0, nextSpace).trim();
                  } else {
                      obj.color = attribute;
                  }
                  break;
              case 's':
                  obj.size = parseInt(attribute);
                  break;
              case 'b':
                  obj.bold = attribute == 'true'? true:false;
                  break;
            }

            //tag has event arguments
            if(nextSpace > -1) {
                eventHanlderString = attribute.substring(nextSpace+1).trim();
                eventObj = this._processEventHandler(eventHanlderString);
                obj.event = eventObj;
            }
            return obj;
        }

        header = attribute.match(/^(br(\s)*\/)/);
        if(header && header[0].length > 0) {
            tagName = header[0].trim();
            // @ts-ignore
            if(tagName.startsWith("br") && tagName[tagName.length-1] === "/") {
                obj.isNewLine = true;
                this._arrResult.push({text: "", style: {newline: true}});
                return obj;
            }
        }

        header = attribute.match(/^(img(\s)*src(\s)*=[^>]+\/)/);
        if(header && header[0].length > 0) {
            tagName = header[0].trim();
            // @ts-ignore
            if(tagName.startsWith("img") && tagName[tagName.length-1] === "/") {
                header = attribute.match(imageAttrReg);
                let tagValue;
                let remainingArgument;
                let isValidImageTag = false;
                while (header) {
                    //skip the invalid tags at first
                    attribute = attribute.substring(attribute.indexOf(header[0]));
                    tagName = attribute.substr(0, header[0].length);
                    //remove space and = character
                    remainingArgument = attribute.substring(tagName.length).trim();
                    nextSpace = remainingArgument.indexOf(' ');

                    tagValue = (nextSpace > -1) ? remainingArgument.substr(0, nextSpace) : remainingArgument;
                    tagName = tagName.replace(/[^a-zA-Z]/g, "").trim();
                    tagName = tagName.toLocaleLowerCase();

                    attribute = remainingArgument.substring(nextSpace).trim();
                    if (tagName === "src") {
                        obj.isImage = true
                        // @ts-ignore
                        if( tagValue.endsWith( '\/' ) ) tagValue = tagValue.substring( 0, tagValue.length - 1 );
                        if( tagValue.indexOf('\'')===0 ) {
                            isValidImageTag = true;
                            tagValue = tagValue.substring( 1, tagValue.length - 1 );
                        } else if( tagValue.indexOf('"')===0 ) {
                            isValidImageTag = true;
                            tagValue = tagValue.substring( 1, tagValue.length - 1 );
                        }
                        obj.src = tagValue;
                    } else if (tagName === "height") {
                        obj.imageHeight = parseInt(tagValue);
                    } else if (tagName === "width") {
                        obj.imageWidth = parseInt(tagValue);
                    } else if (tagName === "click") {
                        obj.event = this._processEventHandler(tagName + "=" + tagValue);
                    }

                    if (obj.event && tagName === 'param') {
                        obj.event.param = tagValue.replace(/^\"|\"$/g, '');
                    }

                    header = attribute.match(imageAttrReg);
                }

                if( isValidImageTag && obj.isImage )
                {
                    this._arrResult.push({text: "", style: obj});
                }

                return {};
            }
        }

        header = attribute.match(/^(outline(\s)*[^>]*)/);
        if (header) {
            attribute = header[0].substring("outline".length).trim();
            let defaultOutlineObject = {color: "#ffffff", width: 1};
            if (attribute) {
                let outlineAttrReg = /(\s)*color(\s)*=|(\s)*width(\s)*=|(\s)*click(\s)*=|(\s)*param(\s)*=/;
                header = attribute.match(outlineAttrReg);
                let tagValue;
                while (header) {
                    //skip the invalid tags at first
                    attribute = attribute.substring(attribute.indexOf(header[0]));
                    tagName = attribute.substr(0, header[0].length);
                    //remove space and = character
                    let remainingArgument = attribute.substring(tagName.length).trim();
                    nextSpace = remainingArgument.indexOf(' ');
                    if (nextSpace > -1) {
                        tagValue = remainingArgument.substr(0, nextSpace);
                    } else {
                        tagValue = remainingArgument;
                    }
                    tagName = tagName.replace(/[^a-zA-Z]/g, "").trim();
                    tagName = tagName.toLocaleLowerCase();

                    attribute = remainingArgument.substring(nextSpace).trim();
                    if (tagName === "click") {
                        obj.event = this._processEventHandler(tagName + "=" + tagValue);
                    } else if (tagName === "color") {
                        defaultOutlineObject.color = tagValue;
                    } else if (tagName === "width") {
                        defaultOutlineObject.width = parseInt(tagValue);
                    }

                    if (obj.event && tagName === 'param') {
                        obj.event.param = tagValue.replace(/^\"|\"$/g, '');
                    }

                    header = attribute.match(outlineAttrReg);
                }
            }
            obj.outline = defaultOutlineObject;
        }

        header = attribute.match(/^(on|u|b|i)(\s)*/);
        if(header && header[0].length > 0) {
            tagName = header[0];
            attribute = attribute.substring(tagName.length).trim();
            switch(tagName[0]){
              case 'u':
                  obj.underline = true;
                  break;
              case 'i':
                  obj.italic = true;
                  break;
              case 'b':
                  obj.bold = true;
                  break;
            }
            if(attribute === "") {
                return obj;
            }
            eventObj = this._processEventHandler(attribute);
            obj.event = eventObj;
        }

        return obj;
    }

    private _processEventHandler (eventString: string): EventHandler {
        let index = 0;
        let obj: EventHandler;
        let eventNames = eventString.match(eventRegx);
        let isValidTag = false;
        while(eventNames) {
            let eventName = eventNames[0];
            let eventValue = "";
            isValidTag = false;
            eventString = eventString.substring(eventName.length).trim();
            if(eventString.charAt(0) === "\"") {
                index = eventString.indexOf("\"", 1);
                if (index > -1) {
                    eventValue = eventString.substring(1, index).trim();
                    isValidTag = true;
                }
                index++;
            } else if(eventString.charAt(0) === "\'") {
                index = eventString.indexOf('\'', 1);
                if(index > -1) {
                    eventValue = eventString.substring(1, index).trim();
                    isValidTag = true;
                }
                index++;
            } else {
                //skip the invalid attribute value
                let match = eventString.match(/(\S)+/);
                if(match) {
                    eventValue = match[0];
                } else {
                    eventValue = "";
                }
                index = eventValue.length;
            }

            if(isValidTag) {
                eventName = eventName.substring(0, eventName.length-1).trim();
                obj[eventName] = eventValue;
            }

            eventString = eventString.substring(index).trim();
            eventNames = eventString.match(eventRegx);
        }

        return obj;
    }

    private _addToStack (attribute: string) {
        const obj = this._attributeToObject(attribute);

        if (this._stack.length === 0){
            this._stack.push(obj);
        } else {
            if(obj.isNewLine || obj.isImage) {
                return;
            }
            //for nested tags
            var previousTagObj = this._stack[this._stack.length - 1];
            for (var key in previousTagObj) {
                if (!(obj[key])) {
                    obj[key] = previousTagObj[key];
                }
            }
            this._stack.push(obj);
        }
    }

    private _processResult (value: string) {
        if (value === "") {
            return;
        }

        value = this._escapeSpecialSymbol(value);
        if (this._stack.length > 0) {
            this._arrResult.push({text: value, style: this._stack[this._stack.length - 1]});
        } else {
            this._arrResult.push({text: value});
        }
    }

    private _escapeSpecialSymbol (str: string): string {
        for(var i = 0; i < this._arrSpecialSymbol.length; ++i) {
            let {key, value} = this._arrSpecialSymbol[i];
            str = str.replace(key, value);
        }
        return str;
    }    
}

let htmlParser = new HtmlTextParser();

export {
    htmlParser,
    BlockStyle,
    LabelBlock,
}