#!/usr/bin/env python
# coding:utf-8

import custom
from lib import compile_ipa, distrubute_ipa, modify_xcode_version

import os
import shutil
import platform
from optparse import OptionParser

# 产生iOS包，并且上传到AppStore
if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-b", "--buildnum", dest="buildnum", type="int", default=0, help="special the build number for the ipa")
    (options, args) = parser.parse_args()

    custom.show()

    buildnum = str(options.buildnum)
    print("the build number is:", buildnum)
    print ("============================================================")

    # 指定version和build
    version = custom.package_version_records["ios"][-1]["version"]
    print ("== modify xcode version: ", version, buildnum)
    modify_xcode_version.modify(custom.xcode_info_file, version, buildnum)

    # build ipa
    print ("== build ipa ===")
    if platform.system() == "Windows":
        print ("== ERROR! GOTO MAC PLATFORM BUILD ===")
    else:
        # 自动打包工具
        out_ipa_path = compile_ipa.run(custom.xcode_project_root, custom.project_name, custom.XCODE_TARGET, custom.product_name)
        print ("== finish build iOS ===")

        # 上传ipa
        print ("====distrubute ipa=====")
        if os.path.exists(out_ipa_path):
            out_path = out_ipa_path.replace(custom.product_name, custom.project_name)
            os.rename(out_ipa_path, out_path)
            distrubute_ipa.distrubute(out_path)
            print ("== FINISH DISTRUBUTE IPA %s" % out_path)
        else:
            print ("== ERROR! IPA FILE IS NOT EXIST!")


