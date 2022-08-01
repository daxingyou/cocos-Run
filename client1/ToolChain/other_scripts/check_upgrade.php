<?php
// 包标识为ios的更新配置
$ios_config=array(
    "purl"=>"www.baidu.com",
    "pversion"=>"0.0.1",
    "min_pversion"=>"0.0.1",
    "rurl"=>"http://139.159.160.130:8080/upgrade/manifest.json",
    "rversion"=>"0",
    "min_rversion"=>"0",
);

// 包标识为android的更新配置
$android_config=array(
    "purl"=>"www.baidu.com",
    "pversion"=>"0.0.1",
    "min_pversion"=>"0.0.1",
    "rurl"=>"http://139.159.160.130:8080/upgrade/manifest.json",
    "rversion"=>"0",
    "min_rversion"=>"0",
);

// 审核版本列表, 包标识+包版本作为key
$audits=array(
    "android.0.0.2"=>"124.71.115.38"
);

// 体验版本是否可用，包标识+包版本+资源版本作为key
$experience=array(
    "android.0.0.2.256"=>false
)

// 当local_check_timeout不为0的时候, 
// 客户端应该去local_check上下载和与本机设备标识相等的文件作为更新信息
$local_check_timeout=0;
$local_check="http://192.168.55.52:8080/upgrade/local/";

// 设备白名单, 在这个列表里面的设备的应该上报更新日志
$white_devices=array(
);

$device=isset($_GET["device"])?$_GET["device"]:""; // 设备id
$ptag=isset($_GET["package_tag"])?$_GET["package_tag"]:""; // 包标识 package_tag
$pversion=isset($_GET["package_version"])?$_GET["package_version"]:"0.0.0"; // 包版本 package_version
$rversion=isset($_GET["res_version"])?$_GET["res_version"]:"0"; // 资源版本 res_version

// 包版本转成数字, eg: "1.2.3" 返回 1002003
function trans_pversion ($version) {
    $nums=explode(".", $version);
    return intval($nums[0])*1000000+intval($nums[1])*1000+intval($nums[2]);
}

// 资源版本转成数字, eg: "20101001" 返回 20101001
function trans_rversion ($version) {
    return intval($version);
}

// 当前策略: 包版本低于最低包版本, 才整包更新
function need_package_upgrade ($version, $min) {
    $version_val=trans_pversion($version);
    $min_val=trans_pversion($min);
    
    return $version_val < $min_val;
}

// 当前策略: 资源版本低于资源版本, 才热更新
function need_res_upgrade ($version, $curr) {
    $version_val=trans_rversion($version);
    $curr_val=trans_rversion($curr);

    return $version_val < $curr_val;
}

function append_by_config (&$result, $config, $pversion, $rversion) {
    if (need_package_upgrade($pversion, $config["min_pversion"])) {
        $result["upgrade"]="package";
        $result["url"]=$config["purl"];
    } else if (need_res_upgrade($rversion, $config["rversion"])) {
        $result["upgrade"]="res";
        if (trans_rversion($config["min_rversion"]) <= trans_rversion($rversion)) {
            $result["optional"]=true;
        }
        $result["url"]=$config["rurl"];
    } else {
        $result["upgrade"]="none";
    }
}

// 返回结果通知：
// 1. white: 是否白名单
// 2. local_check: local_check_timeout 不为0时，到此地址获取热更
// 3. upgrade: [audit, experience, none, package, res] 分别对应审核、不用热更、整包、资源更新
// 4. url: 整包地址、资源mainfest地址
// 5. optional: 是否可选热更与否
// 4. server: 如果upgrade==audit, server登录此服务器
// 5. experience: 是否可以体验
$result = array();

if (in_array($device, $white_devices)) {
    $result["white"]=true;
}

if ($local_check_timeout > 0) {
    $result["local_check_timeout"]=$local_check_timeout;
    $result["local_check"]=$local_check;
}

if (array_key_exists($ptag.$pversion, $audits)) {
    $result["upgrade"]="audit";
    $result["server"]=$audits[$ptag.$pversion];
} else if (array_key_exists($ptag.$pversion.$rversion, $experience)) {
    $result["upgrade"]="experience";
    $result["experience"]=$experience[$ptag.$pversion.$rversion];
} else if ($ptag=="ios") {
    append_by_config($result, $ios_config, $pversion, $rversion);
} else if ($ptag=="android") {
    append_by_config($result, $android_config, $pversion, $rversion);
} else {
    $result["upgrade"]="none";
}

echo json_encode($result);
?>
