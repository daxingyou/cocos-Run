#!/usr/bin/env python
# coding:utf-8

import sys
import os
import hashlib
import subprocess

usage = \
"""
在Mac下替换cocos creator下的etcpack：
    - 先生成可执行文件再替换，源文件改名字为 etcpacktool
    - 一般的路径是Contents/Resources/static/tools/texture-compress/mail/OSX_x86

接收creator传递给etcpack的参数，根据参数获取原图路径分辨是否有MD5缓存

2021-7-21
直接把外面的2个可执行文件放到构建机的引擎目录下 或者用 pyinstaller -F etcpack.py 生成后替换
"""

cachePath = "/Users/zqb-m3/data/cacheTextures/"

textureTypes = ["etc1", "etc2"]

for textureType in textureTypes:
    if not os.path.exists(cachePath + textureType):
        os.makedirs(cachePath + textureType)

fromPath = sys.argv[1]
targetPath = sys.argv[2]
cacheDir = cachePath + sys.argv[4]
fileDir, fileName = os.path.split(fromPath)

md5 = hashlib.md5(open(fromPath, "rb").read()).hexdigest()
if not os.path.exists(cacheDir + "/" + md5 + ".pkm"):
    print("开始压缩",fileName, md5)
    # 缓存文件不存在, 压缩此图片
    res = subprocess.call(["./etcpacktool", fromPath, cacheDir] + sys.argv[3:])
    if res == 0:
        # 压缩成功, 根据 MD5 重命名
        os.rename(cacheDir + "/" + fileName.split(".")[0] + ".pkm", cacheDir + "/" + md5 + ".pkm")
else:
    print("文件存在")
# 拷贝文件
status = subprocess.call("cp" + " " + cacheDir + "/" + md5 + ".pkm" + " " + targetPath + "/" + fileName.split(".")[0] + ".pkm", shell=True)
if status != 0:
    if status < 0:
        print("Killed by signal", status)
    else:
        print("Command failed with return code - ", status)
else:
    print("拷贝成功")
