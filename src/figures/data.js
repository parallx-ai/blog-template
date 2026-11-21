// Copyright 2026 Parallax
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
  Data for figures: load() fetches a file once per page and parses it by its
  extension (JSON, CSV, TSV, text, NumPy .npy, Parquet); npy() and parquet()
  parse buffers you already have.
*/

import { csvParse, tsvParse, autoType } from 'd3';
import { parquetReadObjects } from 'hyparquet';

const cache = new Map();

const TYPES = {
  json: 'json', csv: 'csv', tsv: 'tsv', txt: 'text', md: 'text',
  npy: 'npy', parquet: 'parquet', pq: 'parquet',
};

function typeOf(href) {
  let path = href;
  try {
    path = new URL(href).pathname;
  } catch (e) {
    path = href.split(/[?#]/)[0];
  }
  const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1];
  return (ext && TYPES[ext.toLowerCase()]) || 'buffer';
}

function absolute(url) {
  try {
    const base = typeof document !== 'undefined' ? document.baseURI : undefined;
    return new URL(url, base).href;
  } catch (e) {
    return String(url);
  }
}

async function fetchAs(href, type, opts) {
  const response = await fetch(href, opts.fetch);
  if (!response.ok) throw new Error('Could not load ' + href + ': ' + response.status + ' ' + response.statusText);
  switch (type) {
    case 'json': return response.json();
    case 'csv': return csvParse(await response.text(), autoType);
    case 'tsv': return tsvParse(await response.text(), autoType);
    case 'text': return response.text();
    case 'npy': return npy(await response.arrayBuffer(), opts);
    case 'parquet': return parquet(await response.arrayBuffer(), opts);
    case 'buffer': return response.arrayBuffer();
    default: throw new Error('Unknown data type "' + type + '"; use json, csv, tsv, text, npy, parquet or buffer.');
  }
}

/*
  load(url, {type, columns}) fetches url (relative to the page) once and
  parses it: .json, .csv and .tsv (numbers and dates typed), .txt and .md
  (text), .npy (see npy) and .parquet (rows as objects, see parquet). Other
  files, or type "buffer", give an ArrayBuffer. Returns a promise; asking
  again for the same file returns the same one.
*/
export function load(url, options) {
  const opts = options || {};
  const href = absolute(url);
  const type = opts.type || typeOf(href);
  const id = type + ' ' + href + (opts.columns ? ' ' + opts.columns.join(',') : '');
  if (!cache.has(id)) {
    const pending = fetchAs(href, type, opts);
    cache.set(id, pending);
    pending.catch(() => cache.delete(id));
  }
  return cache.get(id);
}

/* ---- NumPy .npy ---- */

const ARRAYS = {
  b1: Uint8Array, i1: Int8Array, u1: Uint8Array, i2: Int16Array, u2: Uint16Array,
  i4: Int32Array, u4: Uint32Array, f4: Float32Array, f8: Float64Array,
};

function float16(bits) {
  const sign = bits & 0x8000 ? -1 : 1;
  const exponent = (bits >> 10) & 0x1f;
  const fraction = bits & 0x3ff;
  if (exponent === 0) return sign * Math.pow(2, -14) * (fraction / 1024);
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
}

function headerValue(header, name) {
  const match = header.match(new RegExp('[\'"]' + name + '[\'"]\\s*:\\s*([^,}]+(?:,[^\'"}]*\\))?)'));
  if (!match) throw new Error('npy: the header has no ' + name + '.');
  return match[1].trim();
}

/*
  npy(buffer) reads a NumPy .npy file (np.save) into {data, shape, dtype,
  get(...index)}: data is a typed array in C order. Floats of 16, 32 and 64
  bits, signed and unsigned integers and booleans are read; 64-bit integers
  become numbers (exact up to 2^53) unless {bigint: true}, and float16 values
  become a Float32Array. Fortran-ordered arrays are reordered.
*/
export function npy(buffer, options) {
  const opts = options || {};
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x93 || String.fromCharCode.apply(null, bytes.subarray(1, 6)) !== 'NUMPY') {
    throw new Error('npy: not a NumPy .npy file.');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const major = bytes[6];
  const headerLength = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
  const headerStart = major === 1 ? 10 : 12;
  const header = new TextDecoder(major >= 3 ? 'utf-8' : 'latin1')
    .decode(bytes.subarray(headerStart, headerStart + headerLength));

  const descr = headerValue(header, 'descr').replace(/['"]/g, '');
  const fortran = headerValue(header, 'fortran_order') === 'True';
  const shape = (headerValue(header, 'shape').match(/\d+/g) || []).map(Number);
  const count = shape.reduce((a, b) => a * b, 1);
  const order = descr.charAt(0);
  const kind = descr.slice(1);
  const little = order !== '>';
  const offset = headerStart + headerLength;
  const size = Number(kind.slice(1));

  let data;
  if (kind === 'f2') {
    data = new Float32Array(count);
    for (let i = 0; i < count; i++) data[i] = float16(view.getUint16(offset + i * 2, little));
  } else if (kind === 'i8' || kind === 'u8') {
    const big = new (kind === 'i8' ? BigInt64Array : BigUint64Array)(count);
    for (let i = 0; i < count; i++) {
      big[i] = kind === 'i8' ? view.getBigInt64(offset + i * 8, little) : view.getBigUint64(offset + i * 8, little);
    }
    data = opts.bigint ? big : Float64Array.from(big, Number);
  } else if (ARRAYS[kind]) {
    const Type = ARRAYS[kind];
    if (little && (bytes.byteOffset + offset) % size === 0) {
      data = new Type(bytes.buffer.slice(bytes.byteOffset + offset, bytes.byteOffset + offset + count * size));
    } else {
      data = new Type(count);
      const read = {
        b1: i => view.getUint8(offset + i), i1: i => view.getInt8(offset + i), u1: i => view.getUint8(offset + i),
        i2: i => view.getInt16(offset + i * 2, little), u2: i => view.getUint16(offset + i * 2, little),
        i4: i => view.getInt32(offset + i * 4, little), u4: i => view.getUint32(offset + i * 4, little),
        f4: i => view.getFloat32(offset + i * 4, little), f8: i => view.getFloat64(offset + i * 8, little),
      }[kind];
      for (let i = 0; i < count; i++) data[i] = read(i);
    }
  } else {
    throw new Error('npy: unsupported dtype ' + descr + '.');
  }

  if (fortran && shape.length > 1) data = toCOrder(data, shape);

  const strides = shape.map((_, i) => shape.slice(i + 1).reduce((a, b) => a * b, 1));
  return {
    data,
    shape,
    dtype: descr,
    get(...index) {
      let i = 0;
      for (let k = 0; k < index.length; k++) i += index[k] * strides[k];
      return data[i];
    },
  };
}

function toCOrder(data, shape) {
  const out = new data.constructor(data.length);
  const n = shape.length;
  const fStrides = shape.map((_, i) => shape.slice(0, i).reduce((a, b) => a * b, 1));
  const index = new Array(n).fill(0);
  for (let c = 0; c < data.length; c++) {
    let f = 0;
    for (let k = 0; k < n; k++) f += index[k] * fStrides[k];
    out[c] = data[f];
    for (let k = n - 1; k >= 0; k--) {
      if (++index[k] < shape[k]) break;
      index[k] = 0;
    }
  }
  return out;
}

/* ---- Parquet ---- */

const SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function plain(value) {
  if (typeof value === 'bigint') return value <= SAFE && value >= -SAFE ? Number(value) : value;
  return value;
}

/*
  parquet(buffer, {columns}) reads a Parquet file into an array of row
  objects, with hyparquet. 64-bit integers become numbers when they fit
  exactly, unless {bigint: true}. Snappy-compressed and uncompressed files
  are read (the defaults of pandas and pyarrow).
*/
export async function parquet(buffer, options) {
  const opts = options || {};
  const rows = await parquetReadObjects({ file: buffer, columns: opts.columns });
  if (opts.bigint) return rows;
  for (const row of rows) {
    for (const k of Object.keys(row)) row[k] = plain(row[k]);
  }
  return rows;
}
