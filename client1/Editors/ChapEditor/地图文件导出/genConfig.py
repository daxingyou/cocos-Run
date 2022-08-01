# -*- coding:utf-8 -*-
import sys
import os
import json

def mkdir_p(path):
    try:
        if(not os.path.exists(path) and not os.path.isdir(path)):
            os.makedirs(path)
    except OSError as exc:  # Python >2.5 (except OSError, exc: for Python <2.5)
            raise
def rm_file(file):
    if(os.path.exists(path) and not os.path.isdir(path)):
        os.remove(file)
if __name__ == '__main__':
    cwd = os.getcwd()
    jsonExt = ".json"
    tmpJson = "temp.json"
    outDir = os.path.join(os.path.split(cwd)[0],'assets', 'scripts', 'config','lessons')
    mkdir_p(outDir)
    for filename in os.listdir(cwd):
        path = os.path.join(cwd, filename)
        if os.path.isfile(path) and os.path.splitext(filename)[1] == jsonExt:
            with open(filename,"r+",encoding="utf-8") as f:
                jsonContent = json.loads(f.read())
            break
    for item in jsonContent:
        with open(tmpJson,"w+",encoding="utf-8") as f:
            formatJson = json.dumps(item,sort_keys=False, indent=4, ensure_ascii=False)
            outFileName = os.path.join(outDir,f"lesson_{item['name']}.js")
            content = 'module.exports = ' + str(formatJson) + '\n'
            targetFile = open(outFileName, "w", encoding='utf-8', newline='')
            targetFile.write(content)
            targetFile.close()
        rm_file(tmpJson)