/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API where available.
 */

type HapticType = 'light' | 'medium' | 'heavy';

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50
};

/**
 * Triggers haptic feedback if the device supports it.
 * @param type - The intensity of the haptic feedback
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  // Check if the Vibration API is available
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(vibrationPatterns[type]);
    } catch (e) {
      // Silently fail if vibration is not supported
      console.debug('Haptic feedback not available:', e);
    }
  }
}

/**
 * Wrapper to add haptic feedback to a click handler
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  type: HapticType = 'light'
): T {
  return ((...args: Parameters<T>) => {
    triggerHaptic(type);
    return handler(...args);
  }) as T;
}
