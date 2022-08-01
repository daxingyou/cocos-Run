#!/usr/bin/env python
# coding:utf-8

import os
import hashlib
import json


def gen(root_folder, cdn_prefix, version, configVersion = None , siteurl = None ):
    root_folder = os.path.realpath(root_folder)

    if root_folder[-1] != os.sep:
        root_folder += os.sep

    if cdn_prefix[-1] != "/":
        cdn_prefix += "/"

    manifest = {
        "root": cdn_prefix,
        "version": version,
        "files": {}
    }
    if configVersion :
        manifest['configVersion'] = configVersion

    if siteurl :
        manifest['site'] = siteurl

    for folder, subfolders, filenames in os.walk(os.path.join(root_folder, "assets")):
        for filename in filenames:
            if filename[0] == ".":
                continue

            fullpath = os.path.join(folder, filename)
            filekey = fullpath[len(root_folder):].replace("\\", "/")

            with open(fullpath, "rb") as fd:
                filedata = fd.read()
                md5 = hashlib.md5()
                md5.update(filedata)
                
                manifest["files"][filekey] = {"md5": md5.hexdigest(), "size": len(filedata)}
    if configVersion == None :
        for folder, subfolders, filenames in os.walk(os.path.join(root_folder, "src")):
            for filename in filenames:
                if filename[0] == ".":
                    continue

                fullpath = os.path.join(folder, filename)
                filekey = fullpath[len(root_folder):].replace("\\", "/")

                with open(fullpath, "rb") as fd:
                    filedata = fd.read()
                    md5 = hashlib.md5()
                    md5.update(filedata)

                    manifest["files"][filekey] = {"md5": md5.hexdigest(), "size": len(filedata)}

    return json.dumps(manifest, indent=4)
