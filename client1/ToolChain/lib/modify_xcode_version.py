#!/usr/bin/env python
# coding:utf-8

import os
import platform
from optparse import OptionParser


def modify(plist_path, version, build):
    if platform.system() != "Windows":
        os.system('/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ' + version + '" ' + plist_path)
        os.system('/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ' + build + '" ' + plist_path)
