#!/usr/bin/env python
# coding:utf-8

import custom
from lib import distrubute_ipa
import os

# 产生iOS包，并且上传到AppStore
if __name__ == '__main__':
    # 上传ipa
    print ("==== distrubute ipa =====")
    #build文件夹的位置
    build_floder = os.path.realpath("%s/build/" % custom.xcode_project_root)
    out_ipa_path = "%s/%s.ipa" % (build_floder, custom.XCODE_TARGET)

    if os.path.exists(out_ipa_path):
        out_path = out_ipa_path.replace(custom.product_name, custom.project_name)
        os.rename(out_ipa_path, out_path)
        distrubute_ipa.distrubute(out_path)
        print ("== FINISH DISTRUBUTE IPA %s" % out_path)
    else:
        print ("== ERROR! IPA FILE IS NOT EXIST!")
