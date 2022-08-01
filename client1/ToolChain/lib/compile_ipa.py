#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from optparse import OptionParser

usage = \
"""
在Mac下通过xcodebuild产出ipa原生包文件：
-p ios project的根目录，就是含有**.xcodeproj文件的目录
-n  工程**.xcodeproj的工程名
-t ios 工程别名 这个别名 通过xcode打开 **.xcodeproj 在target下可看到


"""

pwd = os.path.realpath(os.path.dirname(__file__))

#配置
CONFIGURATION = "Release" # "Debug", "Release", "Distribute"

#设置SDK
SDK = "iphoneos"

 
#clean工程   
def cleanPro(PROJECT_PATH , PROJECT_NAME , TARGET):
    cmdStr = "xcodebuild -project \"%s/%s.xcodeproj\" -target \"%s\" -configuration \"%s\" clean" % \
    (PROJECT_PATH, PROJECT_NAME, TARGET, CONFIGURATION)
    print(cmdStr)
    os.system(cmdStr)

#编译获取.app文件和dsym -showBuildSettings 可以打印参数
def buildApp(PROJECT_PATH , PROJECT_NAME , TARGET , BUILD_FOLDER , DSYM_FOLDER):
    cmdStr = "xcodebuild archive -project %s/%s.xcodeproj -scheme %s -archivePath %s/%s.xcarchive" \
            % (PROJECT_PATH, PROJECT_NAME, TARGET, BUILD_FOLDER , TARGET)

    print(cmdStr)
    os.system(cmdStr)
    
#创建ipa
def createIPA(BUILD_FOLDER, TARGET):
    # -exportOptionsPlist参数是新出的，目前已知的参数有：

    # teamID
    # export_method：值为ad-hoc或者app-store，如果找不到该参数，就会使用dev证书签名。。。
    # uploadSymbols
    
    exportOptionsPlist = os.path.join(pwd, "..", "files", "ExportOptions.plist")
    cmdStr = "xcodebuild -exportArchive -archivePath %s/%s.xcarchive -exportPath %s -exportOptionsPlist %s" % (BUILD_FOLDER , TARGET , BUILD_FOLDER, exportOptionsPlist)
    print(cmdStr)
    os.system(cmdStr)

def run(xcode_project_root, projectName, target, productName):
    #project路径
    PROJECT_PATH = xcode_project_root

    #project名
    PROJECT_NAME = projectName

    #设置target
    TARGET = target

    #设置build文件夹的位置
    BUILD_FOLDER=os.path.realpath("%s/build/" % PROJECT_PATH)
    #设置dSYM文件夹的位置
    DSYM_FOLDER=os.path.realpath("%s/build/" % PROJECT_PATH)

    OutIpaFilePath = "%s/%s.ipa" % (BUILD_FOLDER, target)

    print("== build floder ==: ", BUILD_FOLDER)

    cleanPro(PROJECT_PATH , PROJECT_NAME , TARGET);
    buildApp(PROJECT_PATH , PROJECT_NAME , TARGET ,BUILD_FOLDER , DSYM_FOLDER);
    createIPA(BUILD_FOLDER , TARGET);
    return OutIpaFilePath