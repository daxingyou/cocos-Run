#!/bin/sh

#  FrameworkCodeSign.sh
#  Particle Designer
#
#  Created by Mike Daley on 18/10/2013.
#  Copyright (c) 2013 71Squared Ltd. All rights reserved.

LOCATION="${BUILT_PRODUCTS_DIR}"/"${FRAMEWORKS_FOLDER_PATH}"
IDENTITY="Developer ID Application: 71 Squared Ltd"
codesign --verbose --force --sign "$IDENTITY" "$LOCATION/Sparkle.framework/Versions/A"

#LOCATION="${BUILT_PRODUCTS_DIR}"/"${FRAMEWORKS_FOLDER_PATH}"
#IDENTITY="Developer ID Application: 71 Squared Ltd"
#codesign --verbose --force --sign "$IDENTITY" "$LOCATION/BWToolkitFramework.framework/Versions/A"

LOCATION="${SRCROOT}"
IDENTITY="Developer ID Application: 71 Squared Ltd"
codesign --verbose --force --sign "$IDENTITY" "$LOCATION/GDCL"

