#!/usr/bin/env python
# coding:utf-8

import os
import re

def gen_ignores(ignore_file_path):
    ignores = []
    with open(ignore_file_path) as f:
        line = f.readline()
        while line:
            ignores.append(line.rstrip())
            line = f.readline()
    return ignores


def remove_in_folder(root_path, folder_path):
    removeFileList = gen_ignores(folder_path)

    for root, dirs, files in os.walk(root_path):
        for f in files:
            filePath = os.path.join(root, f)
            if f in removeFileList:
                os.remove(filePath)
                print("delete file: ", f)
