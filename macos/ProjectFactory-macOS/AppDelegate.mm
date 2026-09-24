#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <Sparkle/Sparkle.h>

@interface AppDelegate ()
@property (nonatomic, strong) SPUStandardUpdaterController *updaterController;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"ProjectFactory";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  self.dependencyProvider = [RCTAppDependencyProvider new];

  self.updaterController = [[SPUStandardUpdaterController alloc] initWithStartingUpdater:YES
                                                                          updaterDelegate:nil
                                                                       userDriverDelegate:nil];
  [self installCheckForUpdatesMenuItem];

  return [super applicationDidFinishLaunching:notification];
}

// Sparkle's Info.plist keys drive silent background checks; this menu item is
// the standard manual trigger users expect to find in the app menu.
- (void)installCheckForUpdatesMenuItem
{
  NSMenu *appMenu = [[[NSApp mainMenu] itemAtIndex:0] submenu];
  NSString *aboutTitle = [NSString stringWithFormat:@"About %@", NSProcessInfo.processInfo.processName];
  NSInteger aboutIndex = [appMenu indexOfItemWithTitle:aboutTitle];
  NSInteger insertIndex = (aboutIndex == -1) ? 0 : aboutIndex + 1;

  NSMenuItem *checkForUpdatesItem = [[NSMenuItem alloc] initWithTitle:@"Check for Updates…"
                                                                action:@selector(checkForUpdates:)
                                                         keyEquivalent:@""];
  checkForUpdatesItem.target = self.updaterController;
  [appMenu insertItem:checkForUpdatesItem atIndex:insertIndex];
  [appMenu insertItem:[NSMenuItem separatorItem] atIndex:insertIndex + 1];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
