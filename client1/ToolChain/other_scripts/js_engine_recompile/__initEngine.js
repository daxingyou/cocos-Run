
const fs = require('fs');
const process = require('child_process');
const os = require('os');
const events = require('events');

let content = fs.readFileSync('./env.json', {encoding: 'utf8', flag: 'r'});
let envCfg = JSON.parse(content);
let defaultEnginePath = os.platform() == 'win32' ? envCfg.engineDir_WinOS : envCfg.engineDir_MacOS;
let versionCode = envCfg.versionCode;
defaultEnginePath += (os.platform() == 'win32' ? envCfg.Win_OS : envCfg.Mac_OS);
defaultEnginePath = defaultEnginePath.replace(/\${version}/, versionCode);

const customJSDir = '../../../RunX/customEngine';
let stat = fs.statSync(customJSDir);
if(!stat || !stat.isDirectory()){
    console.log('引擎JS部分没有自定义模块,无需重新编译');
    return;
}

let willMoveFiles = [];
let splitStartIdx = customJSDir.length;

function visitDir(parentPath){
    if(!parentPath || !fs.existsSync(parentPath)) return;
    let stat = fs.statSync(parentPath);
    if(!stat) return;
    if(stat.isFile()){
        willMoveFiles.push(parentPath);
    }else{
        let files = fs.readdirSync(parentPath);
        files.forEach((ele) => {
            let path = `${parentPath}/${ele}`
            visitDir(path);
        });
    }
}

function replaceEngineFiles(files){
    if(!files || files.length == 0){
        console.log('没有要替换的文件');
        return;
    }

    files.forEach((ele) => {
        let relativePath = ele.slice(splitStartIdx);
        let replaceFilePath = `${defaultEnginePath}${relativePath}`;
        if(!fs.existsSync(replaceFilePath)){
            let path = replaceFilePath.slice(0, replaceFilePath.lastIndexOf('/'));
            fs.mkdirSync(path, {recursive: true});
        }
        console.log(`正在替换的文件：${replaceFilePath}`);
        fs.writeFileSync(replaceFilePath, fs.readFileSync(ele));
    });
}

function compileEngine(){
    console.log('正在编译引擎脚本，请稍后。。。');
    let cmd = os.platform() == 'win32' ? 'gulp.cmd' : 'gulp';
    let jsCompareProcess = process.spawn(cmd, ['build-dev', '--max-old-space-size=8192'], {cwd: `${defaultEnginePath}/engine`});
    jsCompareProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    jsCompareProcess.stderr.on('data', (data) => {
        console.log(data.toString());
    });
    jsCompareProcess.on('error', (data) =>{
      console.error(data.toString());
    });
    jsCompareProcess.on('close', (code) => {
        if(code != 0) return;
        console.log('JS引擎编译完成!!!');
    });
}

function checkCompileEnv(cmd, option, cmdTag){
    let gulpInstallPro = process.exec(cmd, option);
    gulpInstallPro.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    gulpInstallPro.stderr.on('data', (data) =>{
        console.log(data.toString());
    });
    gulpInstallPro.on('error', (error) => {
       console.error(error);
    });
    gulpInstallPro.on('close', (code) => {
        if(code != 0) return;
        eventEmitter.emit('check-env', cmdTag);
    });  
}

function checkcompileEnvHandler(cmd){
    if(cmd == SET_NODE_TAOBAO_REPO){
        checkCompileEnv('npm install -g gulp', {cwd:`${defaultEnginePath}/engine`}, INSTALL_GULP_TAG);
    }

    if(cmd == INSTALL_GULP_TAG){
        checkCompileEnv('npm install', {cwd:`${defaultEnginePath}/engine`}, INSTALL_NPM_TAG);
    }

    if(cmd == INSTALL_NPM_TAG){
        compileEngine();
    }
}

const SET_NODE_TAOBAO_REPO = 'npm-set-taobao-repo';
const INSTALL_GULP_TAG = 'gulp-install';
const INSTALL_NPM_TAG = 'npm-install';

visitDir(customJSDir);
replaceEngineFiles(willMoveFiles);
let eventEmitter = new events.EventEmitter();
eventEmitter.on('check-env', checkcompileEnvHandler);
checkCompileEnv('npm config set registry https://registry.npm.taobao.org', {cwd:`${defaultEnginePath}/engine`}, SET_NODE_TAOBAO_REPO)