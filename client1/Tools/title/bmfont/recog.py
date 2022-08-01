# -*- coding:utf-8 -*-
if __name__ == '__main__':
	string = input("汉字输入：")[:1]
	while(string!="q"):
		print(ord(string))
		string = input("汉字输入：")[:1]