/**
 * NotificationManager - Handles both browser notifications and in-app notifications
 * for traffic alerts
 */

export interface TrafficEvent {
  Id: string;
  Header: string;
  Message: string;
  IconId?: string;
  Severity?: string;
  CreationTime: string;
}

export class NotificationManager {
  private hasRequestedPermission = false;

  constructor() {
    this.requestPermission();
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasRequestedPermission = true;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async show(event: TrafficEvent): Promise<void> {
    const title = this.getEventTitle(event);
    const body = event.Message || 'Ny trafikhändelse';

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: event.Id,
          requireInteraction: false,
          silent: false,
          data: {
            url: '/traffic-alerts',
            eventId: event.Id,
            creationTime: event.CreationTime
          }
        });

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        // Handle click to open traffic alerts page
        notification.onclick = () => {
          window.focus();
          window.location.href = '/traffic-alerts';
          notification.close();
        };
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    }

    // Always show in-app notification
    this.showInAppNotification(title, body, event.Id);
  }

  showInAppNotification(title: string, body: string, eventId: string): void {
    // Check if notification already exists
    const existingNotification = document.getElementById(`notification-${eventId}`);
    if (existingNotification) {
      console.log('In-app notification already shown for event:', eventId);
      return;
    }

    const notification = document.createElement('div');
    notification.id = `notification-${eventId}`;
    notification.className = 'in-app-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: rgba(17, 24, 39, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 20px;
      max-width: 400px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      animation: slideInRight 0.3s ease-out;
      backdrop-filter: blur(10px);
      display: flex;
      gap: 12px;
      align-items: flex-start;
    `;

    notification.innerHTML = `
      <div style="flex: 1;">
        <strong style="color: #fff; font-size: 16px; display: block; margin-bottom: 6px;">${title}</strong>
        <p style="color: #9ca3af; font-size: 14px; margin: 0; line-height: 1.4;">${body}</p>
      </div>
      <button 
        onclick="this.parentElement.remove()" 
        style="
          background: transparent;
          border: none;
          color: #6b7280;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        "
        onmouseover="this.style.color='#fff'"
        onmouseout="this.style.color='#6b7280'"
      >
        ×
      </button>
    `;

    // Add animation styles if not already present
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds with animation
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 10000);
  }

  getEventTitle(event: TrafficEvent): string {
    const message = event.Message?.toLowerCase() || '';
    const header = event.Header?.toLowerCase() || '';
    const iconId = event.IconId?.toLowerCase() || '';

    // Check for accidents
    if (
      iconId.includes('accident') || 
      header.includes('olycka') || 
      message.includes('olycka') ||
      header.includes('accident')
    ) {
      return '🚨 Olycka';
    }

    // Check for road work / obstacles
    if (
      iconId.includes('roadwork') || 
      iconId.includes('obstruction') ||
      header.includes('vägarbete') || 
      header.includes('hinder') ||
      header.includes('arbete') ||
      message.includes('avstängd') ||
      message.includes('stängd')
    ) {
      return '🚧 Vägarbete';
    }

    // Check for traffic congestion
    if (
      iconId.includes('congestion') || 
      iconId.includes('slowtraffic') ||
      header.includes('kö') || 
      header.includes('stockning') ||
      message.includes('stockning')
    ) {
      return '🚗 Trafikstockning';
    }

    // Check for road closures
    if (
      iconId.includes('closure') ||
      header.includes('avstängd') ||
      header.includes('stängd') ||
      message.includes('stängd väg')
    ) {
      return '⛔ Vägstängning';
    }

    // Check for weather conditions
    if (
      iconId.includes('weather') ||
      header.includes('väder') ||
      header.includes('halka') ||
      header.includes('snö') ||
      message.includes('halka')
    ) {
      return '❄️ Väglag';
    }

    // Check for public events
    if (
      iconId.includes('publicevent') ||
      header.includes('event') ||
      header.includes('marknad') ||
      header.includes('tävling')
    ) {
      return '🎪 Evenemang';
    }

    // Default
    return 'ℹ️ Trafikhändelse';
  }

  playNotificationSound(): void {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.error('Could not play notification sound:', error);
      });
    } catch (error) {
      console.error('Failed to create audio element:', error);
    }
  }

  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }
}

export const notificationManager = new NotificationManager();
