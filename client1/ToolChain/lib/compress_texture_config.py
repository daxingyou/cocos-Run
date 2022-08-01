import os
import sys
import json
import shutil
import platform
from optparse import OptionParser

usage = \
"""
压缩纹理配置：
查找指定目录下所有的png，进行压缩纹理配置

"""

# 支持配置：etc2(slow/fast)、etc2-rgb(slow/fast)
# 默认etc2(slow)压缩格式
platformSettings = {
    "default": {
        "android": {
            "formats": [
            {
                "name": "etc2",
                "quality": "slow"
            }
            ]
        },
        "ios": {
            "formats": [
            {
                "name": "etc2",
                "quality": "slow"
            }
            ]
        },
    },
    "etc2-fast": {
        "android": {
            "formats": [
            {
                "name": "etc2",
                "quality": "fast"
            }
            ]
        },
        "ios": {
            "formats": [
            {
                "name": "etc2",
                "quality": "fast"
            }
            ]
        },
    },
    "etc2-slow": {
        "android": {
            "formats": [
            {
                "name": "etc2",
                "quality": "slow"
            }
            ]
        },
        "ios": {
            "formats": [
            {
                "name": "etc2",
                "quality": "slow"
            }
            ]
        },
    },
    "etc2-rgb-fast": {
        "android": {
            "formats": [
            {
                "name": "etc2_rgb",
                "quality": "fast"
            }
            ]
        },
        "ios": {
            "formats": [
            {
                "name": "etc2_rgb",
                "quality": "fast"
            }
            ]
        },
    },
    "etc2-rgb-slow": {
        "android": {
            "formats": [
            {
                "name": "etc2_rgb",
                "quality": "slow"
            }
            ]
        },
        "ios": {
            "formats": [
            {
                "name": "etc2_rgb",
                "quality": "slow"
            }
            ]
        },
    },
}

def modify_file (file, clean, setting):
    with open(file) as f:
        meta_content = json.load(f, strict=False)

    if not platformSettings[setting]:
        print ("platformSettings中不存在配置%s, 检查一下." % setting)
        setting = 'default'

    if not clean:
        # if (meta_content["platformSettings"]) == {}:
        meta_content["platformSettings"] = platformSettings[setting]
        with open(file, "w+") as f:
            f.write(json.dumps(meta_content, indent=2))
    else:
        # if (meta_content["platformSettings"]) != {}:
        meta_content["platformSettings"] = {}
        with open(file, "w+") as f:
            f.write(json.dumps(meta_content, indent=2))

def modify_compress_config (root_path, config_path, clean=False):
    with open(config_path, "r") as json_f:
        json_content = json.load(json_f)
        ignore_arr = json_content["ignores"]
        special_arr = json_content["specials"]
        compress_dirs = json_content["compressDirs"]
        
        for compress in compress_dirs:
            if compress == {}:
                continue
            compressdir = os.path.join(root_path, compress["dir"])
            for root, dirs, files in os.walk(compressdir):
                for file in files:
                    file_path = os.path.join(root, file)
                    if not file.endswith(".png.meta") and not file.endswith(".jpg.meta") and not file.endswith(".pac.meta"):
                        continue
                    if not os.path.exists(file_path):
                        continue
                    name = file.split(".")[0]
                    if name in ignore_arr:
                        continue
                    modify_file(file_path, clean, compress["settings"])

        for special in special_arr:
            if special != {}:
                file_path = os.path.join(root_path, "%s.png.meta"%special["file"])
                if os.path.exists(file_path):
                    modify_file(file_path, clean, special["settings"])
                else:
                    file_path = os.path.join(root_path, "%s.jpg.meta"%special["file"])
                    if os.path.exists(file_path):
                        modify_file(file_path, clean, special["settings"])


