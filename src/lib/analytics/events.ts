import { logger } from './logger';

type EventName =
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'job_created'
  | 'bridge_inspected'
  | 'traffic_alert_viewed'
  | 'call_initiated'
  | 'call_ended'
  | 'document_uploaded'
  | 'error_occurred';

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private events: Array<{
    name: EventName;
    properties: EventProperties;
    timestamp: string;
  }> = [];

  track(eventName: EventName, properties?: EventProperties) {
    const event = {
      name: eventName,
      properties: properties || {},
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    logger.info(`Analytics Event: ${eventName}`, properties);

    if (typeof window !== 'undefined') {
      const win = window as unknown as Window & { gtag?: (...args: unknown[]) => void };
      if (win.gtag) {
        win.gtag('event', eventName, properties);
      }
    }
  }

  pageView(pageName: string, properties?: EventProperties) {
    this.track('page_view', {
      page_name: pageName,
      ...properties,
    });
  }

  buttonClick(buttonName: string, properties?: EventProperties) {
    this.track('button_click', {
      button_name: buttonName,
      ...properties,
    });
  }

  formSubmit(formName: string, properties?: EventProperties) {
    this.track('form_submit', {
      form_name: formName,
      ...properties,
    });
  }

  error(errorMessage: string, errorDetails?: EventProperties) {
    this.track('error_occurred', {
      error_message: errorMessage,
      ...errorDetails,
    });
  }

  getEvents() {
    return [...this.events];
  }

  clearEvents() {
    this.events = [];
  }
}

export const analytics = new Analytics();
