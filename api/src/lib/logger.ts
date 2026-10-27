// Google SDK errors carry the full request config (API key in url/params, user token in headers).
const REDACTED_PATHS = ['err.config', 'err.response.config'];

export function loggerOptions(nodeEnv: string) {
  return {
    level: nodeEnv === 'test' ? 'silent' : 'info',
    redact: { paths: REDACTED_PATHS, censor: '[Redacted]' },
  };
}
