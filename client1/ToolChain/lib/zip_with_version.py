#!/usr/bin/env python
# coding:utf-8

import os
import zipfile
from optparse import OptionParser


def gen(version, target_dir, output_dir):
    if target_dir[-1] != os.sep:
        target_dir = target_dir + os.sep

    target_version_name = os.path.join(target_dir, "version_name")
    os.system("echo " + version + " > " + target_version_name)

    target_zip = os.path.join(output_dir, version + ".zip")
    f = zipfile.ZipFile(target_zip, "w", zipfile.ZIP_DEFLATED)

    f.write(os.path.join(target_dir, "version_name"), "version_name")
    f.write(os.path.join(target_dir, "manifest.json"), "manifest.json")
    
    if os.path.exists(os.path.join(target_dir, "cdn_distribute")):
        f.write(os.path.join(target_dir, "cdn_distribute"), "cdn_distribute")

    for folder, subfolders, filenames in os.walk(os.path.join(target_dir, "assets")):
        for filename in filenames:
            if filename[0] == ".":
                continue

            fullpath = os.path.join(folder, filename)
            filekey = fullpath[len(target_dir):].replace("\\", "/")
            f.write(fullpath, filekey)

    for folder, subfolders, filenames in os.walk(os.path.join(target_dir, "src")):
        for filename in filenames:
            if filename[0] == ".":
                continue

            fullpath = os.path.join(folder, filename)
            filekey = fullpath[len(target_dir):].replace("\\", "/")
            f.write(fullpath, filekey)

    f.close()


def genall(zipname, version, target_dir):
    if target_dir[-1] != os.sep:
        target_dir = target_dir + os.sep

    target_zip = os.path.join(target_dir, "..", zipname + ".zip")
    target_version_name = os.path.join(target_dir, "version_name")

    os.system("echo " + version + " > " + target_version_name)

    f = zipfile.ZipFile(target_zip, "w", zipfile.ZIP_DEFLATED)

    for folder, subfolders, filenames in os.walk(target_dir):
        for filename in filenames:
            if filename[0] == ".":
                continue

            fullpath = os.path.join(folder, filename)
            filekey = fullpath[len(target_dir):].replace("\\", "/")
            f.write(fullpath, filekey)

    f.close()


def gen_zipDir(dirname, zipfilename, exceptDirs=(), exceptFiles=()):
    filelist = []
    if os.path.isfile(dirname):
        filelist.append(dirname)
    else:
        for root, dirs, files in os.walk(dirname):
            if exceptDirs.count(os.path.basename(root)) > 0:
                dirs[:] = []
                continue
            for name in files:
                if exceptFiles.count(name) > 0:
                    continue
                filelist.append(os.path.join(root, name))
    zf = zipfile.ZipFile(zipfilename, "w", zipfile.zlib.DEFLATED)
    for tar in filelist:
        arcname = tar[len(dirname):]
        print("zip file %s" % arcname)
        zf.write(tar, arcname)

    zf.close()
    
