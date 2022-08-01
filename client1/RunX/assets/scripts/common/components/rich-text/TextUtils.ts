/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

// Draw text the textBaseline ratio (Can adjust the appropriate baseline ratio based on the platform)

const  _BASELINE_RATIO = 0.26;

class TextUtils {    
    public static  BASELINE_RATIO = _BASELINE_RATIO;
    public static  MIDDLE_RATIO = (_BASELINE_RATIO + 1) / 2 - _BASELINE_RATIO;
    public static  label_wordRex = /([a-zA-Z0-9ÄÖÜäöüßéèçàùêâîôûа-яА-ЯЁё]+|\S)/;
    public static  label_symbolRex = /^[!,.:;'}\]%\?>、‘“》？。，！]/;
    public static  label_lastWordRex = /([a-zA-Z0-9ÄÖÜäöüßéèçàùêâîôûаíìÍÌïÁÀáàÉÈÒÓòóŐőÙÚŰúűñÑæÆœŒÃÂãÔõěščřžýáíéóúůťďňĚŠČŘŽÁÍÉÓÚŤżźśóńłęćąŻŹŚÓŃŁĘĆĄ-яА-ЯЁё]+|\S)$/;
    public static  label_lastEnglish = /[a-zA-Z0-9ÄÖÜäöüßéèçàùêâîôûаíìÍÌïÁÀáàÉÈÒÓòóŐőÙÚŰúűñÑæÆœŒÃÂãÔõěščřžýáíéóúůťďňĚŠČŘŽÁÍÉÓÚŤżźśóńłęćąŻŹŚÓŃŁĘĆĄ-яА-ЯЁё]+$/;
    public static  label_firstEnglish = /^[a-zA-Z0-9ÄÖÜäöüßéèçàùêâîôûаíìÍÌïÁÀáàÉÈÒÓòóŐőÙÚŰúűñÑæÆœŒÃÂãÔõěščřžýáíéóúůťďňĚŠČŘŽÁÍÉÓÚŤżźśóńłęćąŻŹŚÓŃŁĘĆĄ-яА-ЯЁё]/;
    public static  label_firstEmoji = /^[\uD83C\uDF00-\uDFFF\uDC00-\uDE4F]/;
    public static  label_lastEmoji = /([\uDF00-\uDFFF\uDC00-\uDE4F]+|\S)$/;
    public static  label_wrapinspection = true;
    public static  __CHINESE_REG = /^[\u4E00-\u9FFF\u3400-\u4DFF]+$/;
    public static  __JAPANESE_REG = /[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|\u203B/g;
    public static  __KOREAN_REG = /^[\u1100-\u11FF]|[\u3130-\u318F]|[\uA960-\uA97F]|[\uAC00-\uD7AF]|[\uD7B0-\uD7FF]+$/;

    public static isUnicodeCJK (ch: string) {
        return TextUtils.__CHINESE_REG.test(ch) || TextUtils.__JAPANESE_REG.test(ch) || TextUtils.__KOREAN_REG.test(ch);
    }

    //Checking whether the character is a whitespace
    public static isUnicodeSpace (chIn: string) {
        const ch = chIn.charCodeAt(0);
        return ((ch >= 9 && ch <= 13) || ch === 32 || ch === 133 || ch === 160 || ch === 5760 || (ch >= 8192 && ch <= 8202) || ch === 8232 || ch === 8233 || ch === 8239 || ch === 8287 || ch === 12288);
    }

    public static safeMeasureText (ctx: any, string: string) {
        const metric = ctx.measureText(string);
        return metric && metric.width || 0;
    }

    public static fragmentText (stringToken: string, allWidth: number, maxWidth: number, measureText: Function) {
        //check the first character
        var wrappedWords = [];
        //fast return if strArr is empty
        if(stringToken.length === 0 || maxWidth < 0) {
            wrappedWords.push('');
            return wrappedWords;
        }

        var text = stringToken;
        while (allWidth > maxWidth && text.length > 1) {

            var fuzzyLen = text.length * ( maxWidth / allWidth ) | 0;
            var tmpText = text.substr(fuzzyLen);
            var width = allWidth - measureText(tmpText);
            var sLine = tmpText;
            var pushNum = 0;

            var checkWhile = 0;
            var checkCount = 10;

            //Exceeded the size
            while (width > maxWidth && checkWhile++ < checkCount) {
                fuzzyLen *= maxWidth / width;
                fuzzyLen = fuzzyLen | 0;
                tmpText = text.substr(fuzzyLen);
                width = allWidth - measureText(tmpText);
            }

            checkWhile = 0;

            //Find the truncation point
            while (width <= maxWidth && checkWhile++ < checkCount) {
                if (tmpText) {
                    var exec = TextUtils.label_wordRex.exec(tmpText);
                    pushNum = exec ? exec[0].length : 1;
                    sLine = tmpText;
                }

                fuzzyLen = fuzzyLen + pushNum;
                tmpText = text.substr(fuzzyLen);
                width = allWidth - measureText(tmpText);
            }

            fuzzyLen -= pushNum;
            if (fuzzyLen === 0) {
                fuzzyLen = 1;
                sLine = sLine.substr(1);
            }

            var sText = text.substr(0, fuzzyLen), result;

            //symbol in the first
            if (TextUtils.label_wrapinspection) {
                if (TextUtils.label_symbolRex.test(sLine || tmpText)) {
                    result = TextUtils.label_lastWordRex.exec(sText);
                    fuzzyLen -= result ? result[0].length : 0;
                    if (fuzzyLen === 0) fuzzyLen = 1;

                    sLine = text.substr(fuzzyLen);
                    sText = text.substr(0, fuzzyLen);
                }
            }

            // To judge whether a Emoji words are truncated
            // todo Some Emoji are not well adapted, such as 🚗 and 🇨🇳
            if (TextUtils.label_firstEmoji.test(sLine)) {
                result = TextUtils.label_lastEmoji.exec(sText);
                if (result && sText !== result[0]) {
                    fuzzyLen -= result[0].length;
                    sLine = text.substr(fuzzyLen);
                    sText = text.substr(0, fuzzyLen);
                }
            }

            //To judge whether a English words are truncated
            if (TextUtils.label_firstEnglish.test(sLine)) {
                result = TextUtils.label_lastEnglish.exec(sText);
                if (result && sText !== result[0]) {
                    fuzzyLen -= result[0].length;
                    sLine = text.substr(fuzzyLen);
                    sText = text.substr(0, fuzzyLen);
                }
            }

            // The first line And do not wrap should not remove the space
            if (wrappedWords.length === 0) {
                wrappedWords.push(sText);
            }
            else {
                sText = sText.trim();
                if (sText.length > 0) {
                    wrappedWords.push(sText);
                }
            }
            text = sLine || tmpText;
            allWidth = measureText(text);
        }

        if (wrappedWords.length === 0) {
            wrappedWords.push(text);
        }
        else {
            text = text.trim();
            if (text.length > 0) {
                wrappedWords.push(text);
            }
        }
        return wrappedWords;
    }
};

export default TextUtils;
