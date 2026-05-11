export function success(res, data, status = 200) {
  return res.status(status).json({ ok: true, ...data });
}

export function error(res, message, details = null, status = 400) {
  return res.status(status).json({ ok: false, error: message, details });
}
