/*
 * @Description: 检查资源重复
 * @Version: 1.0
 * @Autor: lixu
 * @Date: 2021-09-29 16:27:39
 * @LastEditors: lixu
 * @LastEditTime: 2021-09-29 21:14:01
 */

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let isFind = false;
let fileMap = new Map();
let repeatFileMap = new Map();
module.exports = {
    load: function(){

    },

    unload: function(){

    },

    messages: {
        'find': function(){
            realFind(true);
        },
        findByContent: function(){
            realFind(false);
        }
    }
}

function realFind(isByName){
    if(isFind) {
        Editor.log('正在检索，请稍后...');
        return;
    }

    let resPath = path.join(Editor.Project.path, '\assets');
    fileMap.clear();
    repeatFileMap.clear();
    isFind = true;
    let parentPath = resPath;
    new Promise((resolve, reject) => {
      visitFile(parentPath, null, isByName);
      resolve(true);
    }).then(() => {
        findSameFile().then(() => {
            printRepeatFilesLog();
            isFind = false;
            Editor.log('检索完成！');
        });
    }).catch(() => {
        isFind = false;
    });
}

function visitFile(filePath, fileName, isByName){
    if(!filePath || filePath.length == 0) return;
    let stat = fs.statSync(filePath);
    if(!stat) return null;
    if(stat.isFile()){
        if(filePath.match(/\.meta$/)) return;
        let fileSign = fileName;
        if(!isByName){
            fileSign = makeMD5(filePath, fs.readFileSync(filePath));
        }
      
        if(!fileMap.has(fileSign))
            fileMap.set(fileSign, []);
        fileMap.get(fileSign).push(filePath);
    }else if(stat.isDirectory()){
        let files = fs.readdirSync(filePath);
        if(!files || files.length == 0) return;
        files.forEach(ele => {
            let newFilePath = path.join(filePath, '/', ele);
            visitFile(newFilePath, ele, isByName);
        });
    }
}

function findSameFile(){
    return new Promise((resolve, reject) => {
        if(fileMap.size == 0) {
            resolve(true);
            return;
        }
        fileMap.forEach((files, key) =>{
            if(!files || files.length < 2) return;
            for(let i = 0, len = files.length; i < len; i++){
                for(let j = i + 1; j < len; j++){
                    let fileA = fs.readFileSync(files[i]);
                    let fileB = fs.readFileSync(files[j]);
                    if(fileA.equals(fileB)){
                        if(!repeatFileMap.has(key))
                            repeatFileMap.set(key, []);
                        repeatFileMap.get(key).indexOf(files[i]) == -1 && repeatFileMap.get(key).push(files[i]);
                        repeatFileMap.get(key).indexOf(files[j]) == -1 && repeatFileMap.get(key).push(files[j]);
                    }
                }
            }
        });
        resolve(true);
    });
}


function printRepeatFilesLog(){
    if(repeatFileMap.size == 0) return;
    repeatFileMap.forEach((files, key) => {
        Editor.warn(`文件${key}存在多份:`, files);
    });
}


function makeMD5(path, content){
    let md5 = crypto.createHash('md5');
    return md5.update(content).digest('hex');
}

