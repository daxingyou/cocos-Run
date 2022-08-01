//
//  PackageUtils.m
//
//  Created by zqGame on 2021/8/31.
//

#import <Foundation/Foundation.h>

NSString* PUIntentPath = @"";
NSString* PUIntentSearch = @"";
BOOL scriptEngineCreated = false;

@interface PackageUtils : NSObject
+ (BOOL) IsUseWIFI;
+ (CGFloat) GetBatteryLevel;
+ (NSString*) GetDeviceID;
+ (NSString*) GetPackageVersion;
+ (NSString*) GetPackageBuild;
@end

@implementation PackageUtils

+ (BOOL) IsUseWIFI {
    return true;
}

+ (CGFloat) GetBatteryLevel {
    return [UIDevice currentDevice].batteryLevel;
}

+ (NSString*) GetDeviceID {
    scriptEngineCreated = true;
    return [UIDevice currentDevice].identifierForVendor.UUIDString;
}

+ (NSString*) GetPackageVersion {
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
}

+ (NSString*) GetPackageBuild {
    return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
}

+ (NSString*) GetIntentPath {
    return PUIntentPath;
}

+ (NSString*) GetIntentSearch {
    return PUIntentSearch;
}

+ (NSNumber*) GetSdkInitStatus {
    return @1;
}

+ (void) GetIsAntiAddiction {
}

+ (NSString*) GetAccountAge {
    return @"18";
}

+ (void) Login {

}

+ (void) Logout {

}

+ (void) CreateRole:(NSNumber*)userid {

}

+ (void) EnterGame:(NSNumber*)userid {

}


@end
