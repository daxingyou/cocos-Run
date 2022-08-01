#!/usr/bin/env python
# coding:utf-8

import os
import re
from optparse import OptionParser


def remove(file_path):
    input_file = open(file_path, "rb")
    input_lines = input_file.read().decode()
    input_file.close()

    regex = r"//#ZQBDEBUG.*?//ZQBDEBUG#"
    transformed_lines = re.sub(regex, "", input_lines, flags=re.S | re.M)
    transformed_lines = transformed_lines.encode()

    with open(file_path, "wb+") as f:
        f.write(transformed_lines)


def remove_in_folder(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for f in files:
            if f.find(".js") >= 0 or f.find(".ts") >= 0:
                file_path = os.path.join(root, f)
                remove(file_path)


if __name__ == "__main__":
    parser = OptionParser()
    parser.add_option("-r", "--root", dest="root", help="directory that contain files that has debug code")

    (options, args) = parser.parse_args()

    if options.root is None:
        print ("invalid args, please use -h to show help.")
        exit(1)

    remove_in_folder(options.root)
