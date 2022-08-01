#!/usr/bin/env python
# coding:utf-8

import custom
from lib import compile_ipa

import platform
from optparse import OptionParser

# 产生iOS包，并且上传到AppStore
if __name__ == '__main__':
    # build ipa
    print ("== build ipa ===")
    if platform.system() == "Windows":
        print ("== ERROR! GOTO MAC PLATFORM BUILD ===")
    else:
        # 自动打包工具
        out_ipa_path = compile_ipa.run(custom.xcode_project_root, custom.project_name, custom.XCODE_TARGET, custom.product_name)
        print ("== finish build iOS ===")