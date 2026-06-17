const dns = require('dns');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/pnmc';

const isTruthy = (value) => ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase());
const isFalsy = (value) => ['false', '0', 'no', 'off'].includes(String(value || '').toLowerCase());

/** Apply custom DNS servers before any MongoDB SRV lookup (fixes querySrv ECONNREFUSED on some networks). */
const configureMongoDns = () => {
  const servers = process.env.MONGODB_DNS_SERVERS;
  if (!servers?.trim()) return;

  const list = servers
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length) {
    dns.setServers(list);
  }
};

const parseMongoSrvUri = (uri) => {
  if (!uri.startsWith('mongodb+srv://')) return null;

  const withoutScheme = uri.slice('mongodb+srv://'.length);
  const atIdx = withoutScheme.lastIndexOf('@');
  let credentials = '';
  let rest = withoutScheme;

  if (atIdx !== -1) {
    credentials = `${withoutScheme.slice(0, atIdx)}@`;
    rest = withoutScheme.slice(atIdx + 1);
  }

  const qIdx = rest.indexOf('?');
  const slashIdx = rest.indexOf('/');

  let host;
  let database = '';
  let query = '';

  if (slashIdx !== -1 && (qIdx === -1 || slashIdx < qIdx)) {
    host = rest.slice(0, slashIdx);
    const afterSlash = rest.slice(slashIdx + 1);
    if (qIdx !== -1) {
      database = afterSlash.slice(0, afterSlash.indexOf('?'));
      query = afterSlash.slice(afterSlash.indexOf('?') + 1);
    } else {
      database = afterSlash;
    }
  } else if (qIdx !== -1) {
    host = rest.slice(0, qIdx);
    query = rest.slice(qIdx + 1);
  } else {
    host = rest;
  }

  return { credentials, host, database, query };
};

const convertSrvToDirect = async (srvUri) => {
  const parsed = parseMongoSrvUri(srvUri);
  if (!parsed) return srvUri;

  const { credentials, host, database, query } = parsed;
  const srvName = `_mongodb._tcp.${host}`;
  const records = await dns.promises.resolveSrv(srvName);

  if (!records.length) {
    throw new Error(`No SRV records found for ${srvName}`);
  }

  const hosts = records
    .map((record) => `${record.name.replace(/\.$/, '')}:${record.port}`)
    .join(',');

  const params = new URLSearchParams(query);
  if (!params.has('ssl') && !params.has('tls')) params.set('tls', 'true');
  if (!params.has('authSource')) params.set('authSource', 'admin');

  const path = database ? `/${database}` : '/';
  const queryString = params.toString();
  return `mongodb://${credentials}${hosts}${path}${queryString ? `?${queryString}` : ''}`;
};

const isSrvLookupError = (error) => {
  const message = String(error?.message || error || '').toLowerCase();
  return (
    message.includes('querysrv')
    || message.includes('_mongodb._tcp')
    || message.includes('enotfound')
    || message.includes('econnrefused')
  );
};

/** Driver uses mongodb+srv:// and performs SRV lookup at connect time. */
const useSrvDns = ({ forceDirect = false } = {}) => {
  if (forceDirect) return false;
  if (isFalsy(process.env.MONGODB_DNS_SRV)) return false;
  return true;
};

/** App should connect with a standard mongodb:// URI (no driver SRV lookup). */
const prefersDirectConnection = () => (
  isFalsy(process.env.MONGODB_DNS_SRV)
  || Boolean(process.env.MONGODB_URI_DIRECT?.trim())
);

/**
 * Resolve the MongoDB URI used by the app and seed script.
 *
 * MONGODB_DNS_SRV=true  → mongodb+srv://… (driver SRV lookup)
 * MONGODB_DNS_SRV=false → MUST use MONGODB_URI_DIRECT (no SRV lookups at runtime)
 *                         Run once locally: npm run mongo:direct-uri
 */
const resolveMongoUri = async ({ forceDirect = false, allowSrvConversion = false } = {}) => {
  configureMongoDns();

  const baseUri = process.env.MONGODB_URI || DEFAULT_URI;
  const directUri = process.env.MONGODB_URI_DIRECT?.trim();
  const srvDisabled = isFalsy(process.env.MONGODB_DNS_SRV);
  const cacheKey = `${forceDirect}:${allowSrvConversion}:${srvDisabled}:${directUri || ''}:${baseUri}`;

  if (global.__mongoResolvedUri?.[cacheKey]) {
    return global.__mongoResolvedUri[cacheKey];
  }

  let resolved;
  let source;

  if (!useSrvDns({ forceDirect })) {
    if (directUri) {
      resolved = directUri;
      source = 'MONGODB_URI_DIRECT';
    } else if (srvDisabled && !allowSrvConversion) {
      throw new Error(
        'MONGODB_DNS_SRV is false but MONGODB_URI_DIRECT is not set. '
        + 'Run locally: npm run mongo:direct-uri — then add the output to your host env vars.'
      );
    } else if (baseUri.startsWith('mongodb+srv://')) {
      resolved = await convertSrvToDirect(baseUri);
      source = allowSrvConversion ? 'generated from MONGODB_URI (one-time SRV lookup)' : 'converted from MONGODB_URI';
    } else {
      resolved = baseUri;
      source = 'MONGODB_URI';
    }
  } else {
    resolved = baseUri;
    source = 'MONGODB_URI (mongodb+srv)';
  }

  const mode = resolved.startsWith('mongodb+srv://') ? 'srv' : 'direct';

  global.__mongoResolvedUri = global.__mongoResolvedUri || {};
  global.__mongoResolvedUri[cacheKey] = { uri: resolved, source, mode };

  return global.__mongoResolvedUri[cacheKey];
};

const getMongoConnectOptions = () => {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const options = {
    serverSelectionTimeoutMS: isServerless ? 5000 : 15000,
    connectTimeoutMS: isServerless ? 5000 : 30000,
    socketTimeoutMS: isServerless ? 10000 : 45000,
    maxPoolSize: isServerless ? 1 : 10,
    minPoolSize: isServerless ? 0 : 1,
  };
  if (isTruthy(process.env.MONGODB_IPV4_ONLY)) {
    options.family = 4;
  }
  return options;
};

module.exports = {
  configureMongoDns,
  resolveMongoUri,
  convertSrvToDirect,
  getMongoConnectOptions,
  isSrvLookupError,
  useSrvDns,
  prefersDirectConnection,
  isFalsy,
};
