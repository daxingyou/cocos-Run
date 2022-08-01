#!/usr/bin/env python
# coding:utf-8

import os
import platform
from os.path import dirname, realpath, join

cmd_paras = 'java' \
            ' -jar %s' \
            ' -appid 546747a831' \
            ' -appkey b9575915-5777-4fa3-9942-52fc5f4dfca5' \
            ' -bundleid %s' \
            ' -version %s' \
            ' -platform Android' \
            ' -inputSymbol %s'\


def run(version, package):
    local_path = realpath(dirname(__file__))
    tool_path = os.path.join(local_path, "..", "lib", "androidBuglyUploader")
    jar_file = "buglyqq-upload-symbol.jar"
    os.chdir(tool_path)
    
    abs_path = os.path.abspath(tool_path)
    cmd = cmd_paras % (jar_file, package, version, abs_path)
    os.system(cmd)

    print ("== delete bugly symbol file ===")
    output_path = os.path.join(abs_path, "..")
    for files in os.listdir(output_path):
        if files.startswith(('buglySymbol')):
            symbol_file = os.path.join(output_path, files)
            print ("== find bugly symbol file ===", symbol_file)
            if os.path.exists(symbol_file):
                os.remove(symbol_file)

    print ("== delete debugso file ===")
    for files in os.listdir(abs_path):
        if files == "libcocos2djs.so":
            debugSo = os.path.join(abs_path, files)
            print ("== find debugso file ===", debugSo)
            if os.path.exists(debugSo):
                os.remove(debugSo)

