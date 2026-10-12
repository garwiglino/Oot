// Installs the oot.o2r embedded in the app bundle into Documents before the engine starts,
// so the app never asks for a ROM. The archive is generated at build time on the builder's
// Mac from their own ROM (ios/build.sh) and is never committed to the repository.
#import <Foundation/Foundation.h>

// Runs at image load, before main(), so the engine and the first-run onboarding (which both
// look for *.o2r in Documents) already see the archive.
__attribute__((constructor)) static void SohOot_InstallBundledArchive(void) {
    @autoreleasepool {
        NSString* bundled = [NSBundle.mainBundle pathForResource:@"oot" ofType:@"o2r"];
        if (bundled == nil) {
            return;
        }

        NSFileManager* fm = NSFileManager.defaultManager;
        NSString* docs =
            NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES).firstObject;
        NSString* dest = [docs stringByAppendingPathComponent:@"oot.o2r"];

        // Same size means already installed; a different size means the app was rebuilt
        // with a new archive, so replace it.
        unsigned long long bundledSize = [[fm attributesOfItemAtPath:bundled error:nil] fileSize];
        NSDictionary* destAttrs = [fm attributesOfItemAtPath:dest error:nil];
        if (destAttrs != nil && destAttrs.fileSize == bundledSize) {
            return;
        }

        [fm createDirectoryAtPath:docs withIntermediateDirectories:YES attributes:nil error:nil];
        [fm removeItemAtPath:dest error:nil];
        NSError* err = nil;
        if (![fm copyItemAtPath:bundled toPath:dest error:&err]) {
            NSLog(@"[oot] could not install bundled oot.o2r: %@", err);
        }
    }
}
