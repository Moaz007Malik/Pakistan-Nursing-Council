const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
const registry = new Map();

let isReady = false;
let readyPromise = null;

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const loadRaw = (collection) => {
  ensureDataDir();
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const saveRaw = (collection, rows) => {
  ensureDataDir();
  fs.writeFileSync(getFilePath(collection), `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
};

const getNested = (obj, dotPath) => {
  if (!dotPath) return obj;
  return dotPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
};

const setNested = (obj, dotPath, value) => {
  const keys = dotPath.split('.');
  let cur = obj;
  keys.slice(0, -1).forEach((key) => {
    if (cur[key] == null || typeof cur[key] !== 'object') cur[key] = {};
    cur = cur[key];
  });
  cur[keys[keys.length - 1]] = value;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const toId = (value) => (value == null ? value : String(value));

const matchValue = (docValue, filterValue) => {
  if (filterValue && typeof filterValue === 'object' && !Array.isArray(filterValue) && !(filterValue instanceof Date)) {
    const isOperatorObject = ['$in', '$ne', '$exists', '$gte', '$lte', '$gt', '$lt']
      .some((op) => Object.prototype.hasOwnProperty.call(filterValue, op));

    if (isOperatorObject) {
      if (Object.prototype.hasOwnProperty.call(filterValue, '$exists')) {
        const exists = docValue !== undefined && docValue !== null && docValue !== '';
        if (filterValue.$exists ? !exists : exists) return false;
      }
      if (Object.prototype.hasOwnProperty.call(filterValue, '$in')) {
        if (!filterValue.$in.map(toId).includes(toId(docValue))) return false;
      }
      if (Object.prototype.hasOwnProperty.call(filterValue, '$ne')) {
        if (toId(docValue) === toId(filterValue.$ne)) return false;
      }
      if (
        Object.prototype.hasOwnProperty.call(filterValue, '$gte')
        || Object.prototype.hasOwnProperty.call(filterValue, '$lte')
        || Object.prototype.hasOwnProperty.call(filterValue, '$gt')
        || Object.prototype.hasOwnProperty.call(filterValue, '$lt')
      ) {
        const left = new Date(docValue).getTime();
        if (Number.isNaN(left)) return false;
        if (filterValue.$gte != null && left < new Date(filterValue.$gte).getTime()) return false;
        if (filterValue.$lte != null && left > new Date(filterValue.$lte).getTime()) return false;
        if (filterValue.$gt != null && left <= new Date(filterValue.$gt).getTime()) return false;
        if (filterValue.$lt != null && left >= new Date(filterValue.$lt).getTime()) return false;
      }
      return true;
    }
    if (docValue == null || typeof docValue !== 'object') return false;
    return matchFilter(docValue, filterValue);
  }
  return toId(docValue) === toId(filterValue);
};

const matchFilter = (doc, filter = {}) => {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, value] of Object.entries(filter)) {
    if (key === '$text') {
      const search = String(value?.$search || '').toLowerCase().trim();
      if (!search) continue;
      if (!JSON.stringify(doc).toLowerCase().includes(search)) return false;
      continue;
    }
    if (key === '$or') {
      if (!value.some((clause) => matchFilter(doc, clause))) return false;
      continue;
    }
    if (!matchValue(getNested(doc, key), value)) return false;
  }
  return true;
};

const applySort = (rows, sort) => {
  if (!sort) return rows;
  const specs = String(sort).split(',').map((part) => {
    const trimmed = part.trim();
    if (trimmed.startsWith('-')) return { key: trimmed.slice(1), dir: -1 };
    return { key: trimmed, dir: 1 };
  });
  return [...rows].sort((a, b) => {
    for (const { key, dir } of specs) {
      const av = getNested(a, key);
      const bv = getNested(b, key);
      if (av === bv) continue;
      if (av == null) return -1 * dir;
      if (bv == null) return dir;
      if (av > bv) return dir;
      if (av < bv) return -dir;
    }
    return 0;
  });
};

const pickFields = (doc, select) => {
  if (!select) return clone(doc);
  const include = select.startsWith('-');
  const fields = select.split(/\s+/).filter(Boolean).map((f) => (f.startsWith('-') ? f.slice(1) : f));
  if (include) {
    const out = { _id: doc._id };
    fields.forEach((field) => {
      setNested(out, field, getNested(doc, field));
    });
    return out;
  }
  const out = clone(doc);
  fields.forEach((field) => {
    const keys = field.split('.');
    let cur = out;
    keys.slice(0, -1).forEach((key) => { cur = cur?.[key]; });
    if (cur) delete cur[keys[keys.length - 1]];
  });
  return out;
};

class JsonDocument {
  constructor(data, model, { isNew = false } = {}) {
    Object.assign(this, clone(data));
    this._model = model;
    this._isNew = isNew;
    this._modified = new Set(isNew ? Object.keys(data) : []);
    Object.defineProperty(this, '_model', { enumerable: false });
    Object.defineProperty(this, '_isNew', { enumerable: false, writable: true });
    Object.defineProperty(this, '_modified', { enumerable: false });
    model.attachMethods(this);
  }

  isModified(field) {
    return this._modified.has(field) || this._isNew;
  }

  toObject() {
    const out = clone(this);
    delete out._model;
    delete out._isNew;
    delete out._modified;
    return out;
  }

  async save() {
    await this._model.beforeSave(this, this._isNew, this._modified);
    const saved = await this._model.persistDocument(this.toObject(), { isNew: this._isNew });
    Object.assign(this, saved);
    this._isNew = false;
    this._modified.clear();
    return this;
  }
}

class JsonQuery {
  constructor(model, { filter = {}, op = 'find' } = {}) {
    this.model = model;
    this.filter = filter;
    this.op = op;
    this._select = null;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populate = [];
    this._lean = false;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  sort(sort) {
    this._sort = sort;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  lean() {
    this._lean = true;
    return this;
  }

  populate(path, select) {
    this._populate.push({ path, select });
    return this;
  }

  async exec() {
    const rows = this.model.getRows();
    let matched = rows.filter((row) => matchFilter(row, this.filter));

    if (this._sort) matched = applySort(matched, this._sort);
    if (this._skip) matched = matched.slice(this._skip);
    if (this._limit != null) matched = matched.slice(0, this._limit);

    const projected = matched.map((row) => {
      let doc = clone(row);
      if (this._select?.startsWith('+')) {
        const extras = this._select.slice(1).trim().split(/\s+/).filter(Boolean);
        const excluded = this.model.selectExclude.filter((field) => !extras.includes(field));
        if (excluded.length) doc = pickFields(row, `-${excluded.join(' -')}`);
      } else if (this._select) {
        doc = pickFields(row, this._select);
      } else if (this.model.selectExclude.length) {
        doc = pickFields(row, `-${this.model.selectExclude.join(' -')}`);
      }

      doc = this.model.applyPopulate(doc, this._populate);
      if (this.op === 'find' && !this._lean) {
        return new JsonDocument(doc, this.model);
      }
      if (this.op === 'findOne' && !this._lean && doc) {
        return new JsonDocument(doc, this.model);
      }
      return doc;
    });

    if (this.op === 'findOne') return projected[0] || null;
    return projected;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

const runAggregate = (rows, pipeline) => {
  let result = rows.map(clone);
  pipeline.forEach((stage) => {
    if (stage.$match) {
      result = result.filter((row) => matchFilter(row, stage.$match));
      return;
    }
    if (stage.$unwind) {
      const field = stage.$unwind.replace(/^\$/, '');
      const next = [];
      result.forEach((row) => {
        const arr = getNested(row, field) || [];
        if (!Array.isArray(arr) || arr.length === 0) return;
        arr.forEach((item) => {
          const copy = clone(row);
          setNested(copy, field, item);
          next.push(copy);
        });
      });
      result = next;
      return;
    }
    if (stage.$group) {
      const groups = new Map();
      result.forEach((row) => {
        const id = stage.$group._id == null ? '__all__' : getNested(row, String(stage.$group._id).replace(/^\$/, ''));
        const key = JSON.stringify(id);
        if (!groups.has(key)) {
          groups.set(key, { _id: id === '__all__' ? null : id });
        }
        const bucket = groups.get(key);
        Object.entries(stage.$group).forEach(([outKey, expr]) => {
          if (outKey === '_id') return;
          if (expr?.$sum != null) {
            const field = String(expr.$sum).replace(/^\$/, '');
            const add = field === '1' ? 1 : Number(getNested(row, field) || 0);
            bucket[outKey] = (bucket[outKey] || 0) + add;
          }
          if (expr?.$count) {
            bucket[outKey] = (bucket[outKey] || 0) + 1;
          }
        });
      });
      result = [...groups.values()];
      return;
    }
    if (stage.$count) {
      result = [{ [stage.$count]: result.length }];
    }
  });
  return result;
};

class JsonModel {
  constructor(options) {
    this.modelName = options.name;
    this.collection = options.collection;
    this.refs = options.refs || {};
    this.selectExclude = options.selectExclude || [];
    this.uniqueFields = options.unique || [];
    this.methods = options.methods || {};
    this.beforeSaveHook = options.beforeSave || null;
    registry.set(this.modelName, this);
  }

  attachMethods(doc) {
    Object.entries(this.methods).forEach(([name, fn]) => {
      doc[name] = fn.bind(doc);
    });
  }

  getRows() {
    return loadRaw(this.collection);
  }

  setRows(rows) {
    saveRaw(this.collection, rows);
  }

  async beforeSave(doc, isNew, modified) {
    if (this.beforeSaveHook) {
      await this.beforeSaveHook(doc, isNew, modified);
    }
  }

  assertUnique(doc, existingId = null) {
    this.uniqueFields.forEach((field) => {
      const value = getNested(doc, field);
      if (value == null || value === '') return;
      const conflict = this.getRows().find(
        (row) => toId(getNested(row, field)) === toId(value) && toId(row._id) !== toId(existingId),
      );
      if (conflict) {
        const err = new Error(`${this.modelName} validation failed: duplicate ${field}`);
        err.code = 11000;
        throw err;
      }
    });
  }

  wrap(doc, { isNew = false } = {}) {
    return new JsonDocument(doc, this, { isNew });
  }

  applyPopulate(doc, populateSpecs) {
    if (!populateSpecs.length) return doc;
    const out = clone(doc);
    populateSpecs.forEach(({ path, select }) => {
      const refName = this.refs[path] || this.refs[path.split('.')[0]];
      const value = getNested(out, path);
      if (!refName || value == null) return;
      const refModel = registry.get(refName);
      if (!refModel) return;

      const attach = (id) => {
        const found = refModel.getRows().find((row) => toId(row._id) === toId(id));
        if (!found) return id;
        return select ? pickFields(found, select) : clone(found);
      };

      if (Array.isArray(value)) {
        setNested(out, path, value.map(attach));
      } else {
        setNested(out, path, attach(value));
      }
    });
    return out;
  }

  find(filter = {}) {
    return new JsonQuery(this, { filter, op: 'find' });
  }

  findOne(filter = {}) {
    return new JsonQuery(this, { filter, op: 'findOne' });
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  countDocuments(filter = {}) {
    return Promise.resolve(this.getRows().filter((row) => matchFilter(row, filter)).length);
  }

  async create(payload) {
    if (Array.isArray(payload)) {
      const results = [];
      for (const item of payload) {
        results.push(await this.create(item));
      }
      return results;
    }

    const now = new Date().toISOString();
    const doc = {
      _id: randomUUID(),
      ...clone(payload),
      createdAt: payload.createdAt || now,
      updatedAt: payload.updatedAt || now,
    };
    const wrapped = this.wrap(doc, { isNew: true });
    await wrapped.save();
    const saved = wrapped.toObject();
    if (this.selectExclude.includes('password')) delete saved.password;
    return this.wrap(saved);
  }

  async persistDocument(doc, { isNew }) {
    const rows = this.getRows();
    const now = new Date().toISOString();
    const payload = { ...doc, updatedAt: now };
    if (isNew) {
      payload._id = payload._id || randomUUID();
      payload.createdAt = payload.createdAt || now;
      this.assertUnique(payload);
      rows.push(payload);
      this.setRows(rows);
      return payload;
    }
    const idx = rows.findIndex((row) => toId(row._id) === toId(payload._id));
    if (idx === -1) throw new Error(`${this.modelName} not found`);
    this.assertUnique(payload, payload._id);
    rows[idx] = payload;
    this.setRows(rows);
    return payload;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const rows = this.getRows();
    let idx = rows.findIndex((row) => matchFilter(row, filter));
    const now = new Date().toISOString();
    let doc;

    if (idx === -1) {
      if (!options.upsert) return null;
      doc = { _id: randomUUID(), createdAt: now, ...clone(filter) };
      if (update.$setOnInsert) Object.assign(doc, clone(update.$setOnInsert));
      idx = rows.length;
      rows.push(doc);
    } else {
      doc = clone(rows[idx]);
    }

    if (update.$set) Object.assign(doc, clone(update.$set));
    if (update.$push) {
      Object.entries(update.$push).forEach(([key, value]) => {
        const arr = Array.isArray(doc[key]) ? doc[key] : [];
        doc[key] = [...arr, clone(value)];
      });
    }
    if (update.$pull) {
      Object.entries(update.$pull).forEach(([key, value]) => {
        const arr = Array.isArray(doc[key]) ? doc[key] : [];
        if (value && typeof value === 'object') {
          doc[key] = arr.filter((item) => !Object.entries(value).every(([k, v]) => toId(item[k]) === toId(v)));
        } else {
          doc[key] = arr.filter((item) => toId(item) !== toId(value));
        }
      });
    }
    if (!update.$set && !update.$push && !update.$pull && !update.$setOnInsert) {
      Object.assign(doc, clone(update));
    }
    doc.updatedAt = now;
    this.assertUnique(doc, doc._id);
    rows[idx] = doc;
    this.setRows(rows);
    const result = options.new === false ? rows[idx] : doc;
    return options.new === false ? this.wrap(result) : this.wrap(result);
  }

  async deleteOne(filter) {
    const rows = this.getRows();
    const next = rows.filter((row) => !matchFilter(row, filter));
    const removed = rows.length - next.length;
    this.setRows(next);
    return { deletedCount: removed };
  }

  async deleteMany(filter = {}) {
    return this.deleteOne(filter);
  }

  async findByIdAndDelete(id) {
    const rows = this.getRows();
    const found = rows.find((row) => toId(row._id) === toId(id));
    if (!found) return null;
    this.setRows(rows.filter((row) => toId(row._id) !== toId(id)));
    return this.wrap(found);
  }

  aggregate(pipeline = []) {
    return Promise.resolve(runAggregate(this.getRows(), pipeline));
  }
}

const createModel = (options) => new JsonModel(options);

const connectDB = async () => {
  if (isReady) return { status: 'connected', dir: DATA_DIR };
  if (!readyPromise) {
    readyPromise = Promise.resolve().then(() => {
      ensureDataDir();
      isReady = true;
      return { status: 'connected', dir: DATA_DIR };
    });
  }
  return readyPromise;
};

const getConnectionState = () => (isReady ? 'connected' : 'disconnected');

module.exports = {
  createModel,
  connectDB,
  getConnectionState,
  getModel: (name) => registry.get(name),
  DATA_DIR,
};
