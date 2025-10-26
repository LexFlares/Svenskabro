export type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'notification'
  | 'selection'
  | 'impact';

export interface HapticOptions {
  pattern?: HapticPattern;
  duration?: number;
  intensity?: number;
}

export class HapticFeedbackService {
  private isSupported = false;
  private isEnabled = true;

  constructor() {
    this.checkSupport();
    this.loadSettings();
  }

  private checkSupport() {
    if (typeof window === 'undefined') {
      this.isSupported = false;
      return;
    }

    this.isSupported = !!(
      navigator.vibrate ||
      ('Vibration' in navigator) ||
      ('vibrate' in navigator)
    );

    console.log('📳 Haptic feedback supported:', this.isSupported);
  }

  trigger(pattern: HapticPattern = 'light') {
    if (!this.isSupported || !this.isEnabled) {
      return;
    }

    const vibrationPattern = this.getVibrationPattern(pattern);
    this.vibrate(vibrationPattern);
  }

  success() {
    this.trigger('success');
  }

  error() {
    this.trigger('error');
  }

  warning() {
    this.trigger('warning');
  }

  notification() {
    this.trigger('notification');
  }

  selection() {
    this.trigger('selection');
  }

  impact(intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    this.trigger(intensity as HapticPattern);
  }

  buttonPress() {
    this.trigger('light');
  }

  swipe() {
    this.trigger('selection');
  }

  longPress() {
    this.trigger('medium');
  }

  private getVibrationPattern(pattern: HapticPattern): number | number[] {
    switch (pattern) {
      case 'light':
        return 10;

      case 'medium':
        return 30;

      case 'heavy':
        return 50;

      case 'success':
        return [10, 50, 10];

      case 'warning':
        return [20, 80, 20];

      case 'error':
        return [50, 100, 50, 100, 50];

      case 'notification':
        return [20, 100, 20];

      case 'selection':
        return 5;

      case 'impact':
        return 15;

      default:
        return 10;
    }
  }

  private vibrate(pattern: number | number[]) {
    if (!this.isSupported) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Vibration failed:', error);
    }
  }

  stop() {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }

  enable() {
    this.isEnabled = true;
    this.saveSettings();
    console.log('📳 Haptic feedback enabled');
  }

  disable() {
    this.isEnabled = false;
    this.saveSettings();
    this.stop();
    console.log('🔇 Haptic feedback disabled');
  }

  toggle(): boolean {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }

  isHapticSupported(): boolean {
    return this.isSupported;
  }

  isHapticEnabled(): boolean {
    return this.isEnabled;
  }

  playCustomPattern(pattern: number[]) {
    if (!this.isSupported || !this.isEnabled) return;
    this.vibrate(pattern);
  }

  playCriticalAlert() {
    this.playCustomPattern([100, 50, 100, 50, 100, 50, 100]);
  }

  playCallIncoming() {
    const pattern: number[] = [];
    for (let i = 0; i < 5; i++) {
      pattern.push(200, 200);
    }
    this.playCustomPattern(pattern);
  }

  playMessageReceived() {
    this.playCustomPattern([10, 100, 20]);
  }

  private loadSettings() {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('haptic_enabled');
    if (stored !== null) {
      this.isEnabled = stored === 'true';
    }
  }

  private saveSettings() {
    if (typeof window === 'undefined') return;

    localStorage.setItem('haptic_enabled', String(this.isEnabled));
  }
}

export const hapticFeedback = new HapticFeedbackService();

export function useHapticFeedback() {
  return {
    trigger: hapticFeedback.trigger.bind(hapticFeedback),
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    warning: hapticFeedback.warning.bind(hapticFeedback),
    notification: hapticFeedback.notification.bind(hapticFeedback),
    selection: hapticFeedback.selection.bind(hapticFeedback),
    impact: hapticFeedback.impact.bind(hapticFeedback),
    buttonPress: hapticFeedback.buttonPress.bind(hapticFeedback),
    swipe: hapticFeedback.swipe.bind(hapticFeedback),
    longPress: hapticFeedback.longPress.bind(hapticFeedback),
    isSupported: hapticFeedback.isHapticSupported(),
    isEnabled: hapticFeedback.isHapticEnabled(),
    enable: hapticFeedback.enable.bind(hapticFeedback),
    disable: hapticFeedback.disable.bind(hapticFeedback),
    toggle: hapticFeedback.toggle.bind(hapticFeedback)
  };
}
