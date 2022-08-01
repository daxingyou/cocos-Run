import re
def get_char_list():
    try:
        with open("bmfont.bmfc", 'rb+') as f:
            content = f.read();
            charStrList = re.findall(r'chars=(\S+?)[\\r\\n]', str(content))
            charList = [char for str in charStrList for char in str.split(",")]
            newList = []
            for i in range(len(charList)):
                char = charList[i]
                if char.find("-")!=-1:
                    matchIdx = char.split("-")
                    newList.extend([i for i in range(int(matchIdx[0]), int(matchIdx[1])+1)])
                else: 
                    newList.extend([int(char)])
            return newList
    except FileNotFoundError as e:
        print("Error: 未找到[bmfont.bmfc]文件")

def get_unique_char(list):
    try:
        with open("unique.txt", 'r+', encoding='utf-8') as f:
            uniqueCharList = []
            content = f.read()
            for char in str(content): 
                if (char!= '\n') & (ord(char) not in list):
                    uniqueCharList.insert(-1, ord(char))
            return uniqueCharList
    except FileNotFoundError as e:
        print("Error: 未找到[unique.txt]文件")

def write_chars_to_cfg(chars):
    cfgStr = ""
    for i in range(len(chars)):
        if (i%16) == 0:
            cfgStr = f"{cfgStr}chars={chars[i]},"
        elif(((i+1)%16) == 0):
            cfgStr = f"{cfgStr}{chars[i]}\n"
        else:
            cfgStr = f"{cfgStr}{chars[i]},"
    if (len(cfgStr)):
        if (cfgStr[-1]==","):
            cfgStr = cfgStr[:-1]
    else:
        return
    try:
        newContent = ""
        with open("bmfont.bmfc", 'r+') as f:
            content = f.read()
            matchObj = re.match(r'[\s\S]+?(chars=[\s\S]+)\s\s', str(content))
            newContent = content.replace(matchObj.group(0), f"{matchObj.group(0)}{cfgStr}\n")
            f.close()
        with open("bmfont.bmfc", 'w+') as f:
            f.write(newContent)
    except FileNotFoundError as e:
        print("Error: 未找到[bmfont.bmfc]文件")

if __name__ == '__main__':
    charList = get_char_list()
    uniqueCharList = get_unique_char(charList)
    write_chars_to_cfg(uniqueCharList)