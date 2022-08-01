#!/usr/bin/env python
# coding:utf-8

import os
import platform
import json
from os.path import dirname, realpath, join

# CocosCreator可执行程序位置
if platform.system() == "Windows":
    cocos_creator_exe = os.path.join(os.environ.get("COCOS_CREATOR_ROOT") or "", "CocosCreator")
else:
    cocos_creator_exe = "/Applications/CocosCreator/Creator/2.4.7/CocosCreator.app/Contents/MacOS/CocosCreator"

# 项目名字
project_name = "RunX"
# 产品名称
product_name = "九州元意歌"
# 包名
package_name = "com.zqgame.RunX"
# 资源加密key，创建项目时产生
encrypt_key = b"3035730d-5e43-42"

# 本脚本所在目录的绝对路径
path_script_root = realpath(dirname(__file__))
# 客户端目录的绝对路径
client_project_root = realpath(join(path_script_root, "..", project_name))
# 客户端脚本的绝对路径
client_script_root = realpath(join(client_project_root, "assets", "scripts"))

# ======== 资源构建相关参数 ========
# 构建资源前需要删除的文件
filters_file = join(path_script_root, "files", "files.ignores")
# 构建资源前需要压缩配置的文件
compress_json = join(path_script_root, "files", "compress_texture.json")
# cdn目录
cdn_url = "https://updatepk.zqgame.com/upgrade/res/" #内网地址 "http://192.168.55.52:8080/upgrade/"

# ======== 原生构建通用参数 ========
# 包版本号记录文件
package_version_records_file = join(path_script_root, "files", "version.json")
# 包版本号记录
with open(package_version_records_file, "r", encoding="utf-8") as json_file:
    package_version_records = json.load(json_file)
    
# 远程Bundle版本号记录文件
remote_bundle_version_file = join(path_script_root, "files", "bundle_version.json")
with open(remote_bundle_version_file, "r", encoding="utf-8") as json_file:
    remote_bundle_version = json.load(json_file)
    
# native导出目录
native_build_path = realpath(join(os.path.expanduser("~"), "data", "build"))
# test path
# native_build_path = realpath(join(os.path.expanduser("~"), "data","workspace", "client", "RunX", "build"))
# local test path
# native_build_path = join(path_script_root, "..", "..", "..", "build")
# jsb项目的根目录
jsb_project_root = join(native_build_path, "jsb-default")
# 构建res的输出目录
res_output_root = join(native_build_path, "output")

# ======== 原生Android相关参数 ========
# android-studio工程的根目录
android_project_root = join(jsb_project_root, "frameworks", "runtime-src", "proj.android-studio")
# android-studio工程的build.gradle路径
android_gradle_file = join(android_project_root, "app", "build.gradle")
# android-studio工程的 bugly符号表生成工具 
android_bugly_tool_path_ = join(path_script_root, "lib", "androidBuglyUploader")
# android-studio工程的bugly debug.so 路径 
android_debugso_path_dev = join(android_project_root, "app", "build", "intermediates", "ndkBuild", "debug", "obj", "local")
android_debugso_path_release = join(android_project_root, "app", "build", "intermediates", "ndkBuild", "release", "obj", "local")
# 安卓buildTamplete gradle的绝对路径 
android_gradle_path = realpath(join(android_project_root, "app"))

# ======== 原生iOS相关参数 ========
#设置iOS构建的target
XCODE_TARGET = "RunX-mobile"
XCODE_RELEASE_TARGET = "RunX-mobile"
# xcode工程的根目录
xcode_project_root = join(jsb_project_root, "frameworks", "runtime-src", "proj.ios_mac")
# xcode工程的Info.plist路径
xcode_info_file = join(xcode_project_root, "ios", "Info.plist")

def show():
    print ("============================================================")
    print ("path_script_root =", path_script_root)
    print ("client_project_root =", client_project_root)
    print ("build_output_dir =", native_build_path)
    print ("============================================================")

#将构建的远程bundle 按照固定格式 {"NAME":xxx,"VER":XXX,"MD5":xxx} 写入file/bundleList.json
def writeBundleJson(name:str,md5:str):
    print(' 开始构建Bundle:',name,'md5:',md5)
    try:
        bundle_list = remote_bundle_version 
    except NameError:
        #不存在数据的情况
        print("Json文件不存在原始数据,埋入初始数据")
        bundle_list.append(addbundleInfo(name,md5,"1"))
    else :
        if len(bundle_list) == 0:
            bundle_list.append(addbundleInfo(name,md5,"1"))
        else:
            localFileHave = False;
            for file in bundle_list:
                #先从本地读取bundle信息，若bundle md5不一致，自动增加版本号
                if file["NAME"] == name:
                    localFileHave = True;
                    if file['MD5'] != md5:
                        print('bundle: ',name , "MD5 changed to change VER")
                        file["VER"] = str(int(file["VER"]) + 1)
                        file["MD5"] = md5
            if localFileHave == False:
                bundle_list.append(addbundleInfo(name,md5,"1"))
                

    with open(remote_bundle_version_file,"w",encoding="utf8") as version_write:
            w_version = json.dumps(bundle_list,indent=4);
            print('写入最新的bundle数据 ：',w_version)
            version_write.write(w_version)
            version_write.close()
    

def addbundleInfo(name:str,md5:str,ver:str): 
    return  { "NAME":name,"VER":ver,"MD5":md5 }