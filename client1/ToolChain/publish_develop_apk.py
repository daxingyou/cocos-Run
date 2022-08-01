#!/usr/bin/env python
# coding:utf-8

import custom

import os
import shutil
import platform
import re
from other_scripts import android_bugly_upload
from lib import modify_gradle_version
from optparse import OptionParser


# 产生Android包
if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-b", "--buildnum", dest="buildnum", type="int", default=0, help="special the version code for the apk")
    parser.add_option("-d", "--apk_debug", dest="apkDebug", type="string", default="debug", help="build apk version")
    
    (options, args) = parser.parse_args()

    custom.show()
    apkDebug = options.apkDebug == "debug"
    
    versioncode = str(options.buildnum)
    print ("the version code is:", versioncode, ", is debug = ", apkDebug)
    print ("============================================================")

    # 指定version name和version code
    versionname = custom.package_version_records["android"][-1]["version"]
    print ("== modify apk version name", versionname)
    modify_gradle_version.modify(versionname, versioncode)
      
    # build apk
    print ("== build apk ===")
    os.chdir(custom.android_project_root)
    os.system("chmod +x gradlew")
    if platform.system() == "Windows":
        if apkDebug: 
            ret = os.system("gradlew.bat assembleDebug")
        else:
            ret = os.system("gradlew.bat assembleRelease") # assembleRelease
        print ("== finish build apk ===", ret)
    else:
        if apkDebug: 
            ret = os.system("./gradlew assembleDebug")
        else:
            ret = os.system("./gradlew assembleRelease") # assembleRelease
        print ("== finish build apk ===", ret)

    # 上传androidBugly符号表
    # 把so文件移到符号表目录
    os.chdir(custom.path_script_root)
    print ("== move libcocos2djs.so ===")
    # 如果是release和develop的位置不一样，请注意
    buil_path = custom.android_debugso_path_release
    if apkDebug:
        buil_path = custom.android_debugso_path_dev
    for root, dirs, files in os.walk(buil_path):
        for file in files:
            if file == "libcocos2djs.so":
                targetFile = os.path.join(custom.android_bugly_tool_path_, file);
                shutil.copy(os.path.join(root, file), targetFile)
                print ("== find libcocos2djs.so ===", os.path.join(root, file))
                android_bugly_upload.run(versioncode, custom.package_name)
                break;
