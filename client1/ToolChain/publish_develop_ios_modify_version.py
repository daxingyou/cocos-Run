#!/usr/bin/env python
# coding:utf-8

import custom
from lib import modify_xcode_version

from optparse import OptionParser

# 产生iOS包，并且上传到AppStore
if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option("-b", "--buildnum", dest="buildnum", type="int", default=0, help="special the build number for the ipa")
    (options, args) = parser.parse_args()

    custom.show()

    buildnum = str(options.buildnum)
    print("the build number is:", buildnum)
    print("============================================================")

    # 指定version和build
    version = custom.package_version_records["ios"][-1]["version"]
    print("== modify xcode version: ", version, buildnum)
    modify_xcode_version.modify(custom.xcode_info_file, version, buildnum)
