// Phone-comfort defaults for camera, aiming and targeting (step 1: existing settings only).
// Called right after the port's own first-run defaults, at window creation, which is before
// ShipInit::InitAll(), so hook-based enhancements see these values on the very first launch.
// Versioned with its own marker: each version is seeded once and never overwrites a value the
// player changes later in the menu.
#import <Foundation/Foundation.h>
#include <stdint.h>

extern void CVarSave(void);
extern int32_t CVarGetInteger(const char* name, int32_t defaultValue);
extern void CVarSetInteger(const char* name, int32_t value);

void SohOot_SeedPhoneDefaults(void) {
    int32_t version = CVarGetInteger("gOot.PhoneDefaultsVersion", 0);
    if (version >= 1) {
        return;
    }

    // Camera: finger-driven free camera (drag on empty screen space). Turning "Free Look" off in
    // the menu gives back the original automatic N64 camera.
    CVarSetInteger("gSettings.FreeLook.Enabled", 1);
    // Stable camera: no slow drift or swing, no re-centering when Link stands still.
    CVarSetInteger("gEnhancements.FixCameraDrift", 1);
    CVarSetInteger("gEnhancements.FixCameraSwing", 1);
    CVarSetInteger("gSettings.A11yDisableIdleCam", 1);

    // Aiming: the first-person view stays where it was turned instead of snapping back.
    CVarSetInteger("gSettings.DisableFirstPersonAutoCenterView", 1);

    // Targeting: tap Z to lock, tap Z again to release, every time (SoH "Reworked Targeting"),
    // and a touch Z tap is always a single press (no double-tap hold that would undo the toggle).
    CVarSetInteger("gEnhancements.ReworkedTargeting.Enabled", 1);
    CVarSetInteger("gSohIos.ZDoubleTap", 0);

    CVarSetInteger("gOot.PhoneDefaultsVersion", 1);
    CVarSave();
    NSLog(@"[oot] phone defaults seeded v1");
}
