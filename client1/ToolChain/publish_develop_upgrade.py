#!/usr/bin/env python
# coding:utf-8

import custom
from lib import file_utils, cocos_native_build, manifest, zip_with_version, compress_texture_config, encryth_resource, remove_debug_lines

import os
import shutil
from optparse import OptionParser

# 构建原生资源，并且产生热更包：
if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-r", "--res_version", dest="res_version", type="int", default=0, help="special the resources version for the build result")
    parser.add_option("-e", "--res_encrypt", dest="res_encrypt", type="string", default="false", help="if need encrypt res. true or false")
    parser.add_option("-d", "--is_Debug", dest="is_Debug", type="string", default="false", help="if need debug version res. true or false")
    (options, args) = parser.parse_args()

    custom.show()

    res_version = str(options.res_version)
    res_encrypt = options.res_encrypt == "true"
    is_Debug = options.is_Debug == "true"
    print("the resources version is:", res_version)
    print("debug mode", is_Debug)
    print("============================================================")

    os.makedirs(custom.res_output_root, exist_ok=True)

    # 构建前删除不需要打到包里的文件
    print("== remove files ===")
    file_utils.remove_in_folder(custom.client_script_root, custom.filters_file)

    # 消除debug代码
    if is_Debug == False:
        print ("== remove debug lines")
        remove_debug_lines.remove_in_folder(custom.client_script_root)

    # 压缩纹理配置 主要是自动配置特效的压缩纹理参数
    print("== compress texture config ==")
    root_assert = os.path.join(custom.client_project_root, "assets")
    compress_texture_config.modify_compress_config(root_assert, custom.compress_json)

    # 产生src, res到jsb-default
    print("== cocos creator build ===")
    cocos_native_build.run(custom.cocos_creator_exe,
                           custom.package_name,
                           custom.client_project_root,
                           custom.native_build_path,
                           "android",
                           "true")

    # 资源加密
    if res_encrypt:
        print("== encryth resources ===")
        encryth_resource.run(custom.jsb_project_root, custom.encrypt_key)

    # 将生成的sourceMap文件移走
    print ("== move sourceMap ===")
    for root, dirs, files in os.walk(os.path.join(custom.jsb_project_root, "assets", "main")):
        for file in files:
            if file.split(".")[-1] == "map":
                shutil.move(os.path.join(root, file), os.path.join(custom.res_output_root, file+"."+res_version))

    #获取bundle-md5
    # print('======  get BuildBundle info =======')
    # remote_bundle_name = []
    # #所有的bundle
    # for dirname in os.listdir(os.path.join(custom.client_project_root,"build","jsb-default","remote")):
    #     remote_bundle_name.append(dirname)


    #比较bundle md5
    # for bundle in remote_bundle_name:
    #     for root,dirs,files in os.walk(os.path.join(custom.client_project_root,"build","jsb-default","remote",bundle)):
    #         for file in files:
    #             if(file.find("index")>=0):
    #                 file_md5 = file.split(".")[1]
    #                 custom.writeBundleJson(bundle,file_md5)

    #复制bundle_version文件
    # shutil.copy(custom.remote_bundle_version_file, os.path.join(custom.client_project_root,"build","jsb-default"))

    # 产生manifest文件
    print ("== generate manifest.json ===")
    manifest_result = manifest.gen(custom.jsb_project_root, custom.cdn_url + res_version, res_version)
    with open(os.path.join(custom.jsb_project_root, "manifest.json"), "w") as manifest_file:
        manifest_file.write(manifest_result)

    # 产生热更新资源包
    zip_with_version.gen(res_version, custom.jsb_project_root, custom.res_output_root)
