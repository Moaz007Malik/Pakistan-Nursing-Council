const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const allowed = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ...(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ].filter(Boolean);

  if (allowed.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (/\.vercel\.app$/i.test(hostname)) return true;
    if (process.env.NODE_ENV !== 'production' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

const applyCorsHeaders = (req, res) => {
  const { origin } = req.headers;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
};

const handleOptions = (req, res) => {
  applyCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).end();
};

const sendJson = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).end(JSON.stringify(body));
};

module.exports = {
  isOriginAllowed,
  applyCorsHeaders,
  handleOptions,
  sendJson,
};
