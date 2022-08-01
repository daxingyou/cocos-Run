#!/usr/bin/env python
# coding:utf-8


import custom
import os
import re

def modify (version_name, version_code):
    with open(os.path.join(custom.android_gradle_path, "build.gradle"), "r") as apk_gradle_file:
        gradle_content = apk_gradle_file.read()

        if gradle_content != None:
            # 改gradle version name
            p = re.compile("versionName \"([\d\.]+?)\"", flags=re.M)
            gradle_content = p.sub(lambda m: m.group(0).replace(m.group(1), version_name), gradle_content)

            # 改gradle version code
            p = re.compile("versionCode ([\d\.]+?)\n", flags=re.M)
            gradle_content = p.sub(lambda m: m.group(0).replace(m.group(1), version_code), gradle_content)
            with open(os.path.join(custom.android_gradle_path, "build.gradle"), "w") as f:
                 f.write(gradle_content)

