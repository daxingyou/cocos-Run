#!/usr/bin/python
#coding:utf-8

import os
import sys
import hashlib
import base64
import subprocess
from optparse import OptionParser
from lib import xxtea

ignores = []

type_filter = [
    'png',
    'jpg',
    'pkm',
    'wav'
]

cachePath = "/Users/zqb-m3/data/workspace/cacheEncryRes/"

def gen_tea_header(tea_key):
    temp_md5 = hashlib.md5(tea_key).hexdigest()[0:16]
    temp_base = base64.b16encode(temp_md5.encode('utf-8'))
    temp_md5 = hashlib.md5(temp_base).hexdigest()[0:16]
    return temp_md5.encode('utf-8')

def copy_file(source, dest):
    status = subprocess.call("cp" + " " + source + " " + dest, shell=True)
    if status != 0:
        if status < 0:
            print("Killed by signal", status)
        else:
            print("Command failed with return code - ", status)

def encrypt_file(file_path, encryth_key):
    with open(file_path, "rb") as file:
        file_content = file.read()
        md5 = hashlib.md5(file_content).hexdigest()
        if not os.path.exists(cachePath + md5):
            tea_head = gen_tea_header(encryth_key)
            file_data = tea_head + xxtea.encrypt(file_content, encryth_key)
        else:
            file_data = ""
    
    if file_data != "":
        with open(file_path, "wb") as new_file:
            new_file.write(file_data)
        copy_file(file_path, cachePath + md5)
        print("encry res: file_path = %s, cache_path = %s" % (file_path, cachePath + md5))
    else:
        copy_file(cachePath + md5, file_path)

def judge_encrypt(res_path, type_filter):
    for file in ignores:
        if os.path.basename(res_path) == file:
            return False
    
    res_type = (res_path.split(".")[-1]).lower()
    if res_type in type_filter:
        return True
    return False


def run(root_folder, encryth_key):
    assert_folder = os.path.join(root_folder, "assets", "resources")
    
    if not os.path.exists(cachePath):
        os.makedirs(cachePath)

    if not os.path.exists(assert_folder):
        print("[encryth_resource] 资源路径不存在")
    else:
        for root, dirs, files in os.walk(assert_folder):
            for f in files:
                res_path = os.path.join(root, f)
                need_encrypt = judge_encrypt(res_path, type_filter)
        
                if need_encrypt:
                    encrypt_file(res_path, encryth_key)
