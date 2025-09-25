import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      if (event.request?.headers) {
        const sanitized: Record<string, string> = {};
        for (const [key, value] of Object.entries(event.request.headers)) {
          if (key === 'authorization' || key === 'cookie') {
            continue;
          }
          if (typeof value === 'string') {
            sanitized[key] = value;
          }
        }
        event.request.headers = sanitized;
      }

      return event;
    },
  });

  Sentry.setTag('runtime', 'server');
}
