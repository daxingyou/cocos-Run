#!/usr/bin/env python
# coding:utf-8

import os
import platform

cmd_paras = '%s' \
            ' --path "%s"' \
            ' --build' \
            ' "' \
            'buildPath=%s;' \
            'platform=%s;' \
            'debug=%s;' \
            'sourceMaps=true;' \
            'template=default;' \
            'packageName=%s;' \
            'inlineSpriteFrames=false;'\
            'optimizeHotUpdate=false;'\
            'useDebugKeystore=false;'\
            "keystorePath=/Users/zqb-m3/data/keystore/zqgame.keystore;"\
            "keystorePassword='zqgm3123';"\
            "keystoreAlias='zqgamem3';"\
            "keystoreAliasPassword='zqgm3123';"\
            'apiLevel="android-27";'\
            "appABIs=['arm64-v8a', 'armeabi-v7a'];"\
            '"'


def run(cmd_path, package_name, project_path, dest_path, appPlatform, is_debug):
    cmd = cmd_paras % (cmd_path, project_path, dest_path, appPlatform, is_debug, package_name)
    os.system(cmd)
