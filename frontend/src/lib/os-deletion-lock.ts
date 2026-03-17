/**
 * OS-Level API Hook – App Deletion Prevention (Placeholder)
 * ============================================================
 * 
 * PURPOSE:
 * Prevents the user from deleting/uninstalling The System application
 * before reaching Level 15. This is a placeholder for native OS integration.
 * 
 * IMPLEMENTATION NOTES:
 * ─────────────────────
 * This feature requires platform-specific native APIs and cannot be
 * implemented in a pure web context. The hooks below are stubs for
 * when the application is wrapped in a native shell (Electron, Tauri,
 * React Native, or a native mobile app).
 * 
 * PLATFORMS:
 * 
 * 1. Android (Kotlin/Java)
 *    - Use DeviceAdminReceiver to prevent uninstallation
 *    - Register as Device Administrator via AndroidManifest.xml
 *    - onDisableRequested() → block if playerLevel < 15
 * 
 * 2. iOS (Swift)
 *    - iOS does not allow apps to prevent their own deletion
 *    - Alternative: Use MDM (Mobile Device Management) profile
 *    - Or: Show persistent notification reminding user of commitment
 * 
 * 3. Desktop (Electron / Tauri)
 *    - Register a beforeunload / close handler
 *    - On Windows: Register as a startup application with Task Scheduler
 *    - On macOS: Use Launch Agent plist
 *    - On Linux: Use systemd user service
 * 
 * SECURITY CONSIDERATIONS:
 *    - All level data must be verified server-side (AES-256 encrypted)
 *    - The lock should be gracefully removable via server admin panel
 *    - GDPR compliance: User must consent during onboarding
 */

export interface DeletionLockConfig {
    playerLevel: number;
    lockThreshold: number; // Default: 15
    isLocked: boolean;
    consentGiven: boolean;
}

/**
 * Check if the app deletion lock should be active.
 * Returns true if the player has NOT reached the unlock level.
 */
export function isDeletionLocked(config: DeletionLockConfig): boolean {
    if (!config.consentGiven) return false;
    return config.playerLevel < config.lockThreshold;
}

/**
 * Placeholder: Register the OS-level deletion prevention hook.
 * In production, this would call native bridge APIs.
 */
export function registerDeletionLock(_config: DeletionLockConfig): void {
    // TODO: Implement native bridge call
    // 
    // Android example:
    //   NativeBridge.call('registerDeviceAdmin', { threshold: config.lockThreshold });
    //
    // Electron example:
    //   ipcRenderer.send('register-deletion-lock', config);
    //
    // Tauri example:
    //   invoke('register_deletion_lock', { config });

    console.info(
        "[System Hook] Deletion lock registered. Unlock at Level",
        _config.lockThreshold
    );
}

/**
 * Placeholder: Remove the OS-level deletion prevention hook.
 * Called when user reaches the threshold level.
 */
export function releaseDeletionLock(): void {
    // TODO: Implement native bridge call
    //
    // Android: DevicePolicyManager.removeActiveAdmin(componentName)
    // Electron: ipcRenderer.send('release-deletion-lock')
    // Tauri: invoke('release_deletion_lock')

    console.info("[System Hook] Deletion lock released. Player is free.");
}
