#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from optparse import OptionParser

usage = \
"""
在Mac下通过xcrun发布ipa：

"""

appleId = "3520104439@qq.com"
password = ""
apiKey = "DQFDGYQVLY"
issuerId = "69a6de98-04b7-47e3-e053-5b8c7c11a4d1"

pwd = os.path.realpath(os.path.dirname(__file__))

def distrubute(ipaPath):
    cmdStr = "xcrun altool --validate-app -f %s -t iOS --apiKey %s --apiIssuer %s" % (ipaPath, apiKey, issuerId)
    print(cmdStr)
    os.system(cmdStr)

    cmdStr = "xcrun altool --upload-app -f %s -t iOS --apiKey %s --apiIssuer %s --verbose" % (ipaPath, apiKey, issuerId)
    print(cmdStr)
    os.system(cmdStr)
    print("=== distrubute succ! ===")
