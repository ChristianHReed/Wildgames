/* hyparquet 1.31.5 from https://github.com/hyparam/hyparquet (MIT licence, full text in builder/lib/LICENSES.md).
   Packed into one classic script by tools/bundle_lib.mjs for the AfterStreet Maps Builder; the code itself is unchanged. */
(window.BLIB = window.BLIB || {}).lib_hyparquet = function(L){
'use strict';
var __defs = [
/* index.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJson = exports.flatten = exports.cachedAsyncBuffer = exports.byteLengthFromUrl = exports.asyncBufferFromUrl = exports.snappyUncompress = exports.parquetQuery = exports.parquetScan = exports.rowIndex = exports.parquetReadObjects = exports.parquetRead = exports.parquetSchema = exports.parquetMetadataAsync = exports.parquetMetadata = exports.readOffsetIndex = exports.readColumnIndex = void 0;
var indexes_js_1 = __req(1);
Object.defineProperty(exports, "readColumnIndex", { enumerable: true, get: function () { return indexes_js_1.readColumnIndex; } });
Object.defineProperty(exports, "readOffsetIndex", { enumerable: true, get: function () { return indexes_js_1.readOffsetIndex; } });
var metadata_js_1 = __req(5);
Object.defineProperty(exports, "parquetMetadata", { enumerable: true, get: function () { return metadata_js_1.parquetMetadata; } });
Object.defineProperty(exports, "parquetMetadataAsync", { enumerable: true, get: function () { return metadata_js_1.parquetMetadataAsync; } });
Object.defineProperty(exports, "parquetSchema", { enumerable: true, get: function () { return metadata_js_1.parquetSchema; } });
var read_js_1 = __req(9);
Object.defineProperty(exports, "parquetRead", { enumerable: true, get: function () { return read_js_1.parquetRead; } });
Object.defineProperty(exports, "parquetReadObjects", { enumerable: true, get: function () { return read_js_1.parquetReadObjects; } });
Object.defineProperty(exports, "rowIndex", { enumerable: true, get: function () { return read_js_1.rowIndex; } });
var scan_js_1 = __req(25);
Object.defineProperty(exports, "parquetScan", { enumerable: true, get: function () { return scan_js_1.parquetScan; } });
var query_js_1 = __req(26);
Object.defineProperty(exports, "parquetQuery", { enumerable: true, get: function () { return query_js_1.parquetQuery; } });
var snappy_js_1 = __req(24);
Object.defineProperty(exports, "snappyUncompress", { enumerable: true, get: function () { return snappy_js_1.snappyUncompress; } });
var utils_js_1 = __req(13);
Object.defineProperty(exports, "asyncBufferFromUrl", { enumerable: true, get: function () { return utils_js_1.asyncBufferFromUrl; } });
Object.defineProperty(exports, "byteLengthFromUrl", { enumerable: true, get: function () { return utils_js_1.byteLengthFromUrl; } });
Object.defineProperty(exports, "cachedAsyncBuffer", { enumerable: true, get: function () { return utils_js_1.cachedAsyncBuffer; } });
Object.defineProperty(exports, "flatten", { enumerable: true, get: function () { return utils_js_1.flatten; } });
Object.defineProperty(exports, "toJson", { enumerable: true, get: function () { return utils_js_1.toJson; } });
/**
 * Explicitly export types for use in downstream typescript projects through
 * `import { ParquetReadOptions } from 'hyparquet'` for example.
 *
 * @template {any} T
 * @typedef {import('../src/types.d.ts').Awaitable<T>} Awaitable<T>
 */
/**
 * @typedef {import('../src/types.d.ts').AsyncBuffer} AsyncBuffer
 * @typedef {import('../src/types.d.ts').AsyncRowGroup} AsyncRowGroup
 * @typedef {import('../src/types.d.ts').DataReader} DataReader
 * @typedef {import('../src/types.d.ts').FileMetaData} FileMetaData
 * @typedef {import('../src/types.d.ts').SchemaTree} SchemaTree
 * @typedef {import('../src/types.d.ts').SchemaElement} SchemaElement
 * @typedef {import('../src/types.d.ts').ParquetType} ParquetType
 * @typedef {import('../src/types.d.ts').FieldRepetitionType} FieldRepetitionType
 * @typedef {import('../src/types.d.ts').ConvertedType} ConvertedType
 * @typedef {import('../src/types.d.ts').TimeUnit} TimeUnit
 * @typedef {import('../src/types.d.ts').LogicalType} LogicalType
 * @typedef {import('../src/types.d.ts').RowGroup} RowGroup
 * @typedef {import('../src/types.d.ts').ColumnChunk} ColumnChunk
 * @typedef {import('../src/types.d.ts').ColumnMetaData} ColumnMetaData
 * @typedef {import('../src/types.d.ts').Encoding} Encoding
 * @typedef {import('../src/types.d.ts').CompressionCodec} CompressionCodec
 * @typedef {import('../src/types.d.ts').Compressors} Compressors
 * @typedef {import('../src/types.d.ts').KeyValue} KeyValue
 * @typedef {import('../src/types.d.ts').Statistics} Statistics
 * @typedef {import('../src/types.d.ts').GeospatialStatistics} GeospatialStatistics
 * @typedef {import('../src/types.d.ts').BoundingBox} BoundingBox
 * @typedef {import('../src/types.d.ts').PageType} PageType
 * @typedef {import('../src/types.d.ts').PageHeader} PageHeader
 * @typedef {import('../src/types.d.ts').DataPageHeader} DataPageHeader
 * @typedef {import('../src/types.d.ts').DictionaryPageHeader} DictionaryPageHeader
 * @typedef {import('../src/types.d.ts').DecodedArray} DecodedArray
 * @typedef {import('../src/types.d.ts').OffsetIndex} OffsetIndex
 * @typedef {import('../src/types.d.ts').ColumnIndex} ColumnIndex
 * @typedef {import('../src/types.d.ts').BoundaryOrder} BoundaryOrder
 * @typedef {import('../src/types.d.ts').ColumnData} ColumnData
 * @typedef {import('../src/types.d.ts').SubColumnData} SubColumnData
 * @typedef {import('../src/types.d.ts').ParquetReadOptions} ParquetReadOptions
 * @typedef {import('../src/types.d.ts').ParquetRow} ParquetRow
 * @typedef {import('../src/types.d.ts').ParquetRowRange} ParquetRowRange
 * @typedef {import('../src/types.d.ts').ParquetScan} ParquetScan
 * @typedef {import('../src/types.d.ts').ParquetScanColumnOptions} ParquetScanColumnOptions
 * @typedef {import('../src/types.d.ts').ParquetScanOptions} ParquetScanOptions
 * @typedef {import('../src/types.d.ts').MetadataOptions} MetadataOptions
 * @typedef {import('../src/types.d.ts').ParquetParsers} ParquetParsers
 * @typedef {import('../src/types.d.ts').ParquetQueryFilter} ParquetQueryFilter
 */

},
/* indexes.js */ function(module, exports, __req){
"use strict";
/**
 * @import {ColumnIndex, DataReader, OffsetIndex, PageLocation, ParquetParsers, SchemaElement} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readColumnIndex = readColumnIndex;
exports.readOffsetIndex = readOffsetIndex;
const constants_js_1 = __req(2);
const convert_js_1 = __req(3);
const metadata_js_1 = __req(5);
const thrift_js_1 = __req(7);
/**
 * @param {DataReader} reader
 * @param {SchemaElement} schema
 * @param {Partial<ParquetParsers> | undefined} parsers
 * @returns {ColumnIndex}
 */
function readColumnIndex(reader, schema, parsers = undefined) {
    const allParsers = { ...convert_js_1.DEFAULT_PARSERS, ...parsers };
    const thrift = (0, thrift_js_1.deserializeTCompactProtocol)(reader);
    return {
        null_pages: thrift.field_1,
        min_values: thrift.field_2.map((/** @type {any} */ m) => (0, metadata_js_1.convertMetadata)(m, schema, allParsers)),
        max_values: thrift.field_3.map((/** @type {any} */ m) => (0, metadata_js_1.convertMetadata)(m, schema, allParsers)),
        boundary_order: constants_js_1.BoundaryOrders[thrift.field_4],
        null_counts: thrift.field_5,
        repetition_level_histograms: thrift.field_6,
        definition_level_histograms: thrift.field_7,
    };
}
/**
 * @param {DataReader} reader
 * @returns {OffsetIndex}
 */
function readOffsetIndex(reader) {
    const thrift = (0, thrift_js_1.deserializeTCompactProtocol)(reader);
    return {
        // @ts-ignore
        page_locations: thrift.field_1.map(loc => ({
            offset: loc.field_1,
            compressed_page_size: loc.field_2,
            first_row_index: loc.field_3,
        })),
        unencoded_byte_array_data_bytes: thrift.field_2,
    };
}

},
/* constants.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeInterpolationAlgorithms = exports.BoundaryOrders = exports.PageTypes = exports.CompressionCodecs = exports.ConvertedTypes = exports.FieldRepetitionTypes = exports.Encodings = exports.ParquetTypes = void 0;
/** @type {import('../src/types.d.ts').ParquetType[]} */
exports.ParquetTypes = [
    'BOOLEAN',
    'INT32',
    'INT64',
    'INT96', // deprecated
    'FLOAT',
    'DOUBLE',
    'BYTE_ARRAY',
    'FIXED_LEN_BYTE_ARRAY',
];
/** @type {import('../src/types.d.ts').Encoding[]} */
exports.Encodings = [
    'PLAIN',
    'GROUP_VAR_INT', // deprecated
    'PLAIN_DICTIONARY',
    'RLE',
    'BIT_PACKED', // deprecated
    'DELTA_BINARY_PACKED',
    'DELTA_LENGTH_BYTE_ARRAY',
    'DELTA_BYTE_ARRAY',
    'RLE_DICTIONARY',
    'BYTE_STREAM_SPLIT',
    'ALP',
];
/** @type {import('../src/types.d.ts').FieldRepetitionType[]} */
exports.FieldRepetitionTypes = [
    'REQUIRED',
    'OPTIONAL',
    'REPEATED',
];
/** @type {import('../src/types.d.ts').ConvertedType[]} */
exports.ConvertedTypes = [
    'UTF8',
    'MAP',
    'MAP_KEY_VALUE',
    'LIST',
    'ENUM',
    'DECIMAL',
    'DATE',
    'TIME_MILLIS',
    'TIME_MICROS',
    'TIMESTAMP_MILLIS',
    'TIMESTAMP_MICROS',
    'UINT_8',
    'UINT_16',
    'UINT_32',
    'UINT_64',
    'INT_8',
    'INT_16',
    'INT_32',
    'INT_64',
    'JSON',
    'BSON',
    'INTERVAL',
];
/** @type {import('../src/types.d.ts').CompressionCodec[]} */
exports.CompressionCodecs = [
    'UNCOMPRESSED',
    'SNAPPY',
    'GZIP',
    'LZO',
    'BROTLI',
    'LZ4',
    'ZSTD',
    'LZ4_RAW',
];
/** @type {import('../src/types.d.ts').PageType[]} */
exports.PageTypes = [
    'DATA_PAGE',
    'INDEX_PAGE',
    'DICTIONARY_PAGE',
    'DATA_PAGE_V2',
];
/** @type {import('../src/types.d.ts').BoundaryOrder[]} */
exports.BoundaryOrders = [
    'UNORDERED',
    'ASCENDING',
    'DESCENDING',
];
/** @type {import('../src/types.d.ts').EdgeInterpolationAlgorithm[]} */
exports.EdgeInterpolationAlgorithms = [
    'SPHERICAL',
    'VINCENTY',
    'THOMAS',
    'ANDOYER',
    'KARNEY',
];

},
/* convert.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PARSERS = void 0;
exports.convertWithDictionary = convertWithDictionary;
exports.convert = convert;
exports.parseDecimal = parseDecimal;
exports.parseFloat16 = parseFloat16;
const wkb_js_1 = __req(4);
/**
 * @import {ColumnDecoder, DecodedArray, Encoding, ParquetParsers} from '../src/types.js'
 */
const decoder = new TextDecoder();
/**
 * Default type parsers when no custom ones are given
 * @type ParquetParsers
 */
exports.DEFAULT_PARSERS = {
    timestampFromMilliseconds(millis) {
        return new Date(Number(millis));
    },
    timestampFromMicroseconds(micros) {
        return new Date(Number(micros / 1000n));
    },
    timestampFromNanoseconds(nanos) {
        return new Date(Number(nanos / 1000000n));
    },
    dateFromDays(days) {
        return new Date(days * 86400000);
    },
    stringFromBytes(bytes) {
        return bytes && decoder.decode(bytes);
    },
    jsonFromBytes(bytes) {
        return bytes && JSON.parse(decoder.decode(bytes));
    },
    geometryFromBytes(bytes) {
        return bytes && (0, wkb_js_1.wkbToGeojson)({ view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), offset: 0 });
    },
    geographyFromBytes(bytes) {
        return bytes && (0, wkb_js_1.wkbToGeojson)({ view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), offset: 0 });
    },
    uuidFromBytes(bytes) {
        if (!bytes)
            return undefined;
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20, 32);
    },
};
/**
 * Convert known types from primitive to rich, and dereference dictionary.
 *
 * @param {DecodedArray} data series of primitive types
 * @param {DecodedArray | undefined} dictionary
 * @param {Encoding} encoding
 * @param {ColumnDecoder} columnDecoder
 * @returns {DecodedArray} series of rich types
 */
function convertWithDictionary(data, dictionary, encoding, columnDecoder) {
    if (dictionary && encoding.endsWith('_DICTIONARY')) {
        let output = data;
        if (data instanceof Uint8Array && !(dictionary instanceof Uint8Array)) {
            // @ts-expect-error upgrade data to match dictionary type with fancy constructor
            output = new dictionary.constructor(data.length);
        }
        for (let i = 0; i < data.length; i++) {
            output[i] = dictionary[data[i]];
        }
        return output;
    }
    else {
        return convert(data, columnDecoder);
    }
}
/**
 * Convert known types from primitive to rich.
 *
 * @param {DecodedArray} data series of primitive types
 * @param {ColumnDecoder} columnDecoder
 * @returns {DecodedArray} series of rich types
 */
function convert(data, columnDecoder) {
    const { element, parsers, utf8 = true, schemaPath } = columnDecoder;
    const { type, converted_type: ctype, logical_type: ltype } = element;
    const nullable = element.repetition_type !== 'REQUIRED';
    // Skip utf8 conversion for plain BYTE_ARRAY inside VARIANT
    const isVariant = schemaPath === null || schemaPath === void 0 ? void 0 : schemaPath.some(s => { var _a; return ((_a = s.element.logical_type) === null || _a === void 0 ? void 0 : _a.type) === 'VARIANT'; });
    if (isVariant && type === 'BYTE_ARRAY' && ctype !== 'UTF8' && (ltype === null || ltype === void 0 ? void 0 : ltype.type) !== 'STRING') {
        return data;
    }
    if (ctype === 'DECIMAL') {
        const scale = element.scale || 0;
        const factor = 10 ** -scale;
        const arr = new Array(data.length);
        for (let i = 0; i < arr.length; i++) {
            if (data[i] instanceof Uint8Array) {
                arr[i] = parseDecimal(data[i]) * factor;
            }
            else {
                arr[i] = Number(data[i]) * factor;
            }
        }
        return arr;
    }
    if (!ctype && type === 'INT96') {
        return Array.from(data).map(v => parsers.timestampFromNanoseconds(parseInt96Nanos(v)));
    }
    if (ctype === 'DATE') {
        return Array.from(data).map(v => parsers.dateFromDays(v));
    }
    if (ctype === 'TIMESTAMP_MILLIS') {
        return Array.from(data).map(v => parsers.timestampFromMilliseconds(v));
    }
    if (ctype === 'TIMESTAMP_MICROS') {
        return Array.from(data).map(v => parsers.timestampFromMicroseconds(v));
    }
    if (ctype === 'JSON') {
        return data.map(v => parsers.jsonFromBytes(v));
    }
    if (ctype === 'BSON') {
        throw new Error('parquet bson not supported');
    }
    if (ctype === 'INTERVAL') {
        throw new Error('parquet interval not supported');
    }
    if ((ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'GEOMETRY') {
        return data.map(v => parsers.geometryFromBytes(v));
    }
    if ((ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'GEOGRAPHY') {
        return data.map(v => parsers.geographyFromBytes(v));
    }
    if ((ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'UUID') {
        return data.map(v => parsers.uuidFromBytes(v));
    }
    if (ctype === 'UTF8' || (ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'STRING' || utf8 && type === 'BYTE_ARRAY') {
        return data.map(v => parsers.stringFromBytes(v));
    }
    if (ctype === 'UINT_64' || (ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'INTEGER' && ltype.bitWidth === 64 && !ltype.isSigned) {
        if (data instanceof BigInt64Array)
            return new BigUint64Array(data.buffer, data.byteOffset, data.length);
        const arr = nullable ? new Array(data.length) : new BigUint64Array(data.length);
        for (let i = 0; i < arr.length; i++)
            arr[i] = data[i];
        return arr;
    }
    if (ctype === 'UINT_32' || (ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'INTEGER' && ltype.bitWidth === 32 && !ltype.isSigned) {
        if (data instanceof Int32Array)
            return new Uint32Array(data.buffer, data.byteOffset, data.length);
        const arr = nullable ? new Array(data.length) : new Uint32Array(data.length);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = data[i] < 0 ? 4294967296 + data[i] : data[i];
        }
        return arr;
    }
    if ((ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'FLOAT16') {
        return Array.from(data).map(parseFloat16);
    }
    if ((ltype === null || ltype === void 0 ? void 0 : ltype.type) === 'TIMESTAMP') {
        const { unit } = ltype;
        /** @type {ParquetParsers[keyof ParquetParsers]} */
        let parser = parsers.timestampFromMilliseconds;
        if (unit === 'MICROS')
            parser = parsers.timestampFromMicroseconds;
        if (unit === 'NANOS')
            parser = parsers.timestampFromNanoseconds;
        const arr = new Array(data.length);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = parser(data[i]);
        }
        return arr;
    }
    return data;
}
/**
 * @param {Uint8Array} bytes
 * @returns {number}
 */
function parseDecimal(bytes) {
    if (!bytes.length)
        return 0;
    let value = 0n;
    for (const byte of bytes) {
        value = value * 256n + BigInt(byte);
    }
    // handle signed
    const bits = bytes.length * 8;
    if (value >= 2n ** BigInt(bits - 1)) {
        value -= 2n ** BigInt(bits);
    }
    return Number(value);
}
/**
 * Converts INT96 date format (hi 32bit days, lo 64bit nanos) to nanos since epoch
 * @param {bigint} value
 * @returns {bigint}
 */
function parseInt96Nanos(value) {
    const days = (value >> 64n) - 2440588n;
    const nano = value & 0xffffffffffffffffn;
    return days * 86400000000000n + nano;
}
/**
 * @param {Uint8Array | undefined} bytes
 * @returns {number | undefined}
 */
function parseFloat16(bytes) {
    if (!bytes)
        return undefined;
    const int16 = bytes[1] << 8 | bytes[0];
    const sign = int16 >> 15 ? -1 : 1;
    const exp = int16 >> 10 & 0x1f;
    const frac = int16 & 0x3ff;
    if (exp === 0)
        return sign * 2 ** -14 * (frac / 1024); // subnormals
    if (exp === 0x1f)
        return frac ? NaN : sign * Infinity;
    return sign * 2 ** (exp - 15) * (1 + frac / 1024);
}

},
/* wkb.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wkbToGeojson = wkbToGeojson;
/**
 * WKB (Well-Known Binary) decoder for geometry objects.
 *
 * @param {DataReader} reader
 * @returns {Geometry} geometry object
 */
function wkbToGeojson(reader) {
    const flags = getFlags(reader);
    if (flags.type === 1) { // Point
        return { type: 'Point', coordinates: readPosition(reader, flags) };
    }
    else if (flags.type === 2) { // LineString
        return { type: 'LineString', coordinates: readLine(reader, flags) };
    }
    else if (flags.type === 3) { // Polygon
        return { type: 'Polygon', coordinates: readPolygon(reader, flags) };
    }
    else if (flags.type === 4) { // MultiPoint
        const points = [];
        for (let i = 0; i < flags.count; i++) {
            points.push(readPosition(reader, getFlags(reader)));
        }
        return { type: 'MultiPoint', coordinates: points };
    }
    else if (flags.type === 5) { // MultiLineString
        const lines = [];
        for (let i = 0; i < flags.count; i++) {
            lines.push(readLine(reader, getFlags(reader)));
        }
        return { type: 'MultiLineString', coordinates: lines };
    }
    else if (flags.type === 6) { // MultiPolygon
        const polygons = [];
        for (let i = 0; i < flags.count; i++) {
            polygons.push(readPolygon(reader, getFlags(reader)));
        }
        return { type: 'MultiPolygon', coordinates: polygons };
    }
    else if (flags.type === 7) { // GeometryCollection
        const geometries = [];
        for (let i = 0; i < flags.count; i++) {
            geometries.push(wkbToGeojson(reader));
        }
        return { type: 'GeometryCollection', geometries };
    }
    else {
        throw new Error(`Unsupported geometry type: ${flags.type}`);
    }
}
/**
 * Extract ISO WKB flags and base geometry type.
 *
 * @param {DataReader} reader
 * @returns {WkbFlags}
 */
function getFlags(reader) {
    const { view } = reader;
    const littleEndian = view.getUint8(reader.offset++) === 1;
    const rawType = view.getUint32(reader.offset, littleEndian);
    reader.offset += 4;
    const type = rawType % 1000;
    const flags = Math.floor(rawType / 1000);
    let count = 0;
    if (type > 1 && type <= 7) {
        count = view.getUint32(reader.offset, littleEndian);
        reader.offset += 4;
    }
    // XY, XYZ, XYM, XYZM
    let dim = 2;
    if (flags)
        dim++;
    if (flags === 3)
        dim++;
    return { littleEndian, type, dim, count };
}
/**
 * @param {DataReader} reader
 * @param {WkbFlags} flags
 * @returns {number[]}
 */
function readPosition(reader, flags) {
    const points = [];
    for (let i = 0; i < flags.dim; i++) {
        const coord = reader.view.getFloat64(reader.offset, flags.littleEndian);
        reader.offset += 8;
        points.push(coord);
    }
    return points;
}
/**
 * @param {DataReader} reader
 * @param {WkbFlags} flags
 * @returns {number[][]}
 */
function readLine(reader, flags) {
    const points = [];
    for (let i = 0; i < flags.count; i++) {
        points.push(readPosition(reader, flags));
    }
    return points;
}
/**
 * @param {DataReader} reader
 * @param {WkbFlags} flags
 * @returns {number[][][]}
 */
function readPolygon(reader, flags) {
    const { view } = reader;
    const rings = [];
    for (let r = 0; r < flags.count; r++) {
        const count = view.getUint32(reader.offset, flags.littleEndian);
        reader.offset += 4;
        rings.push(readLine(reader, { ...flags, count }));
    }
    return rings;
}
/**
 * @typedef {object} WkbFlags
 * @property {boolean} littleEndian
 * @property {number} type
 * @property {number} dim
 * @property {number} count
 */
/**
 * @import {DataReader, Geometry} from '../src/types.js'
 */

},
/* metadata.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultInitialFetchSize = void 0;
exports.parquetMetadataAsync = parquetMetadataAsync;
exports.parquetMetadata = parquetMetadata;
exports.parquetSchema = parquetSchema;
exports.convertMetadata = convertMetadata;
const constants_js_1 = __req(2);
const convert_js_1 = __req(3);
const schema_js_1 = __req(6);
const thrift_js_1 = __req(7);
const geoparquet_js_1 = __req(8);
/**
 * @import {AsyncBuffer, FileMetaData, KeyValue, LogicalType, MetadataOptions, MinMaxType, ParquetParsers, SchemaElement, SchemaTree, Statistics, TimeUnit} from '../src/types.js'
 */
exports.defaultInitialFetchSize = 1 << 19; // 512kb
const decoder = new TextDecoder();
function decode(/** @type {Uint8Array} */ value) {
    return value && decoder.decode(value);
}
/**
 * Read parquet metadata from an async buffer.
 *
 * An AsyncBuffer is like an ArrayBuffer, but the slices are loaded
 * asynchronously, possibly over the network.
 *
 * You must provide the byteLength of the buffer, typically from a HEAD request.
 *
 * In theory, you could use suffix-range requests to fetch the end of the file,
 * and save a round trip. But in practice, this doesn't work because chrome
 * deems suffix-range requests as a not-safe-listed header, and will require
 * a pre-flight. So the byteLength is required.
 *
 * To make this efficient, we initially request the last 512kb of the file,
 * which is likely to contain the metadata. If the metadata length exceeds the
 * initial fetch, 512kb, we request the rest of the metadata from the AsyncBuffer.
 *
 * This ensures that we either make one 512kb initial request for the metadata,
 * or a second request for up to the metadata size.
 *
 * @param {AsyncBuffer} asyncBuffer parquet file contents
 * @param {MetadataOptions & { initialFetchSize?: number }} options initial fetch size in bytes (default 512kb)
 * @returns {Promise<FileMetaData>} parquet metadata object
 */
async function parquetMetadataAsync(asyncBuffer, { parsers, initialFetchSize = exports.defaultInitialFetchSize, geoparquet = true } = {}) {
    if (!asyncBuffer || !(asyncBuffer.byteLength >= 0))
        throw new Error('parquet expected AsyncBuffer');
    // fetch last bytes (footer) of the file
    const footerOffset = Math.max(0, asyncBuffer.byteLength - initialFetchSize);
    const footerBuffer = await asyncBuffer.slice(footerOffset, asyncBuffer.byteLength);
    // Check for parquet magic number "PAR1"
    const footerView = new DataView(footerBuffer);
    if (footerView.getUint32(footerBuffer.byteLength - 4, true) !== 0x31524150) {
        throw new Error('parquet file invalid (footer != PAR1)');
    }
    // Parquet files store metadata at the end of the file
    // Metadata length is 4 bytes before the last PAR1
    const metadataLength = footerView.getUint32(footerBuffer.byteLength - 8, true);
    if (metadataLength > asyncBuffer.byteLength - 8) {
        throw new Error(`parquet metadata length ${metadataLength} exceeds available buffer ${asyncBuffer.byteLength - 8}`);
    }
    // check if metadata size fits inside the initial fetch
    if (metadataLength + 8 > initialFetchSize) {
        // fetch the rest of the metadata
        const metadataOffset = asyncBuffer.byteLength - metadataLength - 8;
        const metadataBuffer = await asyncBuffer.slice(metadataOffset, footerOffset);
        // combine initial fetch with the new slice
        const combinedBuffer = new ArrayBuffer(metadataLength + 8);
        const combinedView = new Uint8Array(combinedBuffer);
        combinedView.set(new Uint8Array(metadataBuffer));
        combinedView.set(new Uint8Array(footerBuffer), footerOffset - metadataOffset);
        return parquetMetadata(combinedBuffer, { parsers, geoparquet });
    }
    else {
        // parse metadata from the footer
        return parquetMetadata(footerBuffer, { parsers, geoparquet });
    }
}
/**
 * Read parquet metadata from a buffer synchronously.
 *
 * @param {ArrayBuffer | Uint8Array} arrayBuffer parquet file footer
 * @param {MetadataOptions} options metadata parsing options
 * @returns {FileMetaData} parquet metadata object
 */
function parquetMetadata(arrayBuffer, { parsers, geoparquet = true } = {}) {
    var _a;
    let view;
    if (arrayBuffer instanceof ArrayBuffer) {
        view = new DataView(arrayBuffer);
    }
    else if (arrayBuffer instanceof Uint8Array) {
        view = new DataView(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
    }
    else {
        throw new Error('parquet expected ArrayBuffer or Uint8Array');
    }
    // Use default parsers if not given
    const allParsers = { ...convert_js_1.DEFAULT_PARSERS, ...parsers };
    // Validate footer magic number "PAR1"
    if (view.byteLength < 8) {
        throw new Error('parquet file is too short');
    }
    if (view.getUint32(view.byteLength - 4, true) !== 0x31524150) {
        throw new Error('parquet file invalid (footer != PAR1)');
    }
    // Parquet files store metadata at the end of the file
    // Metadata length is 4 bytes before the last PAR1
    const metadataLengthOffset = view.byteLength - 8;
    const metadataLength = view.getUint32(metadataLengthOffset, true);
    if (metadataLength > view.byteLength - 8) {
        // {metadata}, metadata_length, PAR1
        throw new Error(`parquet metadata length ${metadataLength} exceeds available buffer ${view.byteLength - 8}`);
    }
    const metadataOffset = metadataLengthOffset - metadataLength;
    const reader = { view, offset: metadataOffset };
    const metadata = (0, thrift_js_1.deserializeTCompactProtocol)(reader);
    // Parse metadata from thrift data
    const version = metadata.field_1;
    /** @type {SchemaElement[]} */
    const schema = metadata.field_2.map((/** @type {any} */ field) => ({
        type: constants_js_1.ParquetTypes[field.field_1],
        type_length: field.field_2,
        repetition_type: constants_js_1.FieldRepetitionTypes[field.field_3],
        name: decode(field.field_4),
        num_children: field.field_5,
        converted_type: constants_js_1.ConvertedTypes[field.field_6],
        scale: field.field_7,
        precision: field.field_8,
        field_id: field.field_9,
        logical_type: logicalType(field.field_10),
    }));
    // schema element per column index
    const columnSchema = schema.filter(e => e.type);
    const num_rows = metadata.field_3;
    const row_groups = metadata.field_4.map((/** @type {any} */ rowGroup) => {
        var _a;
        return ({
            columns: rowGroup.field_1.map((/** @type {any} */ column, /** @type {number} */ columnIndex) => {
                var _a, _b, _c;
                return ({
                    file_path: decode(column.field_1),
                    file_offset: column.field_2,
                    meta_data: column.field_3 && {
                        type: constants_js_1.ParquetTypes[column.field_3.field_1],
                        encodings: (_a = column.field_3.field_2) === null || _a === void 0 ? void 0 : _a.map((/** @type {number} */ e) => constants_js_1.Encodings[e]),
                        path_in_schema: column.field_3.field_3.map(decode),
                        codec: constants_js_1.CompressionCodecs[column.field_3.field_4],
                        num_values: column.field_3.field_5,
                        total_uncompressed_size: column.field_3.field_6,
                        total_compressed_size: column.field_3.field_7,
                        key_value_metadata: (_b = column.field_3.field_8) === null || _b === void 0 ? void 0 : _b.map((/** @type {any} */ kv) => ({
                            key: decode(kv.field_1),
                            value: decode(kv.field_2),
                        })),
                        data_page_offset: column.field_3.field_9,
                        index_page_offset: column.field_3.field_10,
                        dictionary_page_offset: column.field_3.field_11,
                        statistics: convertStats(column.field_3.field_12, columnSchema[columnIndex], allParsers),
                        encoding_stats: (_c = column.field_3.field_13) === null || _c === void 0 ? void 0 : _c.map((/** @type {any} */ encodingStat) => ({
                            page_type: constants_js_1.PageTypes[encodingStat.field_1],
                            encoding: constants_js_1.Encodings[encodingStat.field_2],
                            count: encodingStat.field_3,
                        })),
                        bloom_filter_offset: column.field_3.field_14,
                        bloom_filter_length: column.field_3.field_15,
                        size_statistics: column.field_3.field_16 && {
                            unencoded_byte_array_data_bytes: column.field_3.field_16.field_1,
                            repetition_level_histogram: column.field_3.field_16.field_2,
                            definition_level_histogram: column.field_3.field_16.field_3,
                        },
                        geospatial_statistics: column.field_3.field_17 && {
                            bbox: column.field_3.field_17.field_1 && {
                                xmin: column.field_3.field_17.field_1.field_1,
                                xmax: column.field_3.field_17.field_1.field_2,
                                ymin: column.field_3.field_17.field_1.field_3,
                                ymax: column.field_3.field_17.field_1.field_4,
                                zmin: column.field_3.field_17.field_1.field_5,
                                zmax: column.field_3.field_17.field_1.field_6,
                                mmin: column.field_3.field_17.field_1.field_7,
                                mmax: column.field_3.field_17.field_1.field_8,
                            },
                            geospatial_types: column.field_3.field_17.field_2,
                        },
                    },
                    offset_index_offset: column.field_4,
                    offset_index_length: column.field_5,
                    column_index_offset: column.field_6,
                    column_index_length: column.field_7,
                    crypto_metadata: column.field_8,
                    encrypted_column_metadata: column.field_9,
                });
            }),
            total_byte_size: rowGroup.field_2,
            num_rows: rowGroup.field_3,
            sorting_columns: (_a = rowGroup.field_4) === null || _a === void 0 ? void 0 : _a.map((/** @type {any} */ sortingColumn) => ({
                column_idx: sortingColumn.field_1,
                descending: sortingColumn.field_2,
                nulls_first: sortingColumn.field_3,
            })),
            file_offset: rowGroup.field_5,
            total_compressed_size: rowGroup.field_6,
            ordinal: rowGroup.field_7,
        });
    });
    /** @type {KeyValue[] | undefined} */
    const key_value_metadata = (_a = metadata.field_5) === null || _a === void 0 ? void 0 : _a.map((/** @type {any} */ kv) => ({
        key: decode(kv.field_1),
        value: decode(kv.field_2),
    }));
    const created_by = decode(metadata.field_6);
    if (geoparquet) {
        (0, geoparquet_js_1.markGeoColumns)(schema, key_value_metadata);
    }
    return {
        version,
        schema,
        num_rows,
        row_groups,
        key_value_metadata,
        created_by,
        metadata_length: metadataLength,
    };
}
/**
 * Return a tree of schema elements from parquet metadata.
 *
 * @param {{schema: SchemaElement[]}} metadata parquet metadata object
 * @returns {SchemaTree} tree of schema elements
 */
function parquetSchema({ schema }) {
    return (0, schema_js_1.getSchemaPath)(schema, [])[0];
}
/**
 * @param {any} logicalType
 * @returns {LogicalType | undefined}
 */
function logicalType(logicalType) {
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_1)
        return { type: 'STRING' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_2)
        return { type: 'MAP' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_3)
        return { type: 'LIST' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_4)
        return { type: 'ENUM' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_5)
        return {
            type: 'DECIMAL',
            scale: logicalType.field_5.field_1,
            precision: logicalType.field_5.field_2,
        };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_6)
        return { type: 'DATE' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_7)
        return {
            type: 'TIME',
            isAdjustedToUTC: logicalType.field_7.field_1,
            unit: timeUnit(logicalType.field_7.field_2),
        };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_8)
        return {
            type: 'TIMESTAMP',
            isAdjustedToUTC: logicalType.field_8.field_1,
            unit: timeUnit(logicalType.field_8.field_2),
        };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_10)
        return {
            type: 'INTEGER',
            bitWidth: logicalType.field_10.field_1,
            isSigned: logicalType.field_10.field_2,
        };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_11)
        return { type: 'NULL' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_12)
        return { type: 'JSON' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_13)
        return { type: 'BSON' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_14)
        return { type: 'UUID' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_15)
        return { type: 'FLOAT16' };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_16)
        return {
            type: 'VARIANT',
            specification_version: logicalType.field_16.field_1,
        };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_17)
        return {
            type: 'GEOMETRY',
            crs: decode(logicalType.field_17.field_1),
        };
    if (logicalType === null || logicalType === void 0 ? void 0 : logicalType.field_18)
        return {
            type: 'GEOGRAPHY',
            crs: decode(logicalType.field_18.field_1),
            algorithm: constants_js_1.EdgeInterpolationAlgorithms[logicalType.field_18.field_2],
        };
    return logicalType;
}
/**
 * @param {any} unit
 * @returns {TimeUnit}
 */
function timeUnit(unit) {
    if (unit.field_1)
        return 'MILLIS';
    if (unit.field_2)
        return 'MICROS';
    if (unit.field_3)
        return 'NANOS';
    throw new Error('parquet time unit required');
}
/**
 * Convert column statistics based on column type.
 *
 * @param {any} stats
 * @param {SchemaElement} schema
 * @param {ParquetParsers} parsers
 * @returns {Statistics}
 */
function convertStats(stats, schema, parsers) {
    return stats && {
        max: convertMetadata(stats.field_1, schema, parsers),
        min: convertMetadata(stats.field_2, schema, parsers),
        null_count: stats.field_3,
        distinct_count: stats.field_4,
        max_value: convertMetadata(stats.field_5, schema, parsers),
        min_value: convertMetadata(stats.field_6, schema, parsers),
        is_max_value_exact: stats.field_7,
        is_min_value_exact: stats.field_8,
    };
}
/**
 * @param {Uint8Array | undefined} value
 * @param {SchemaElement} schema
 * @param {ParquetParsers} parsers
 * @returns {MinMaxType | undefined}
 */
function convertMetadata(value, schema, parsers) {
    const { type, converted_type, logical_type } = schema;
    if (value === undefined)
        return value;
    if (type === 'BOOLEAN')
        return value[0] === 1;
    if (type === 'BYTE_ARRAY')
        return parsers.stringFromBytes(value);
    const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
    if (type === 'FLOAT' && view.byteLength === 4)
        return view.getFloat32(0, true);
    if (type === 'DOUBLE' && view.byteLength === 8)
        return view.getFloat64(0, true);
    if (type === 'INT32' && converted_type === 'DECIMAL' && view.byteLength === 4) {
        return view.getInt32(0, true) * 10 ** -(schema.scale || 0);
    }
    if (type === 'INT64' && converted_type === 'DECIMAL' && view.byteLength === 8) {
        return Number(view.getBigInt64(0, true)) * 10 ** -(schema.scale || 0);
    }
    if (type === 'INT32' && converted_type === 'DATE')
        return parsers.dateFromDays(view.getInt32(0, true));
    if (type === 'INT64' && converted_type === 'TIMESTAMP_MILLIS')
        return parsers.timestampFromMilliseconds(view.getBigInt64(0, true));
    if (type === 'INT64' && converted_type === 'TIMESTAMP_MICROS')
        return parsers.timestampFromMicroseconds(view.getBigInt64(0, true));
    if (type === 'INT64' && (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'TIMESTAMP' && (logical_type === null || logical_type === void 0 ? void 0 : logical_type.unit) === 'NANOS')
        return parsers.timestampFromNanoseconds(view.getBigInt64(0, true));
    if (type === 'INT64' && (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'TIMESTAMP' && (logical_type === null || logical_type === void 0 ? void 0 : logical_type.unit) === 'MICROS')
        return parsers.timestampFromMicroseconds(view.getBigInt64(0, true));
    if (type === 'INT64' && (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'TIMESTAMP')
        return parsers.timestampFromMilliseconds(view.getBigInt64(0, true));
    const unsigned = (converted_type === null || converted_type === void 0 ? void 0 : converted_type.startsWith('UINT_')) ||
        (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'INTEGER' && !logical_type.isSigned;
    if (type === 'INT32' && unsigned && view.byteLength === 4)
        return view.getUint32(0, true);
    if (type === 'INT64' && unsigned && view.byteLength === 8)
        return view.getBigUint64(0, true);
    if (type === 'INT32' && view.byteLength === 4)
        return view.getInt32(0, true);
    if (type === 'INT64' && view.byteLength === 8)
        return view.getBigInt64(0, true);
    if (converted_type === 'DECIMAL')
        return (0, convert_js_1.parseDecimal)(value) * 10 ** -(schema.scale || 0);
    if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'FLOAT16')
        return (0, convert_js_1.parseFloat16)(value);
    if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'UUID')
        return parsers.uuidFromBytes(value);
    if (type === 'FIXED_LEN_BYTE_ARRAY')
        return value;
    // assert(false)
    return value;
}

},
/* schema.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaPath = getSchemaPath;
exports.getTreePath = getTreePath;
exports.getPhysicalColumns = getPhysicalColumns;
exports.getMaxRepetitionLevel = getMaxRepetitionLevel;
exports.getMaxDefinitionLevel = getMaxDefinitionLevel;
exports.isListLike = isListLike;
exports.isMapLike = isMapLike;
exports.isFlatColumn = isFlatColumn;
/**
 * Build a tree from the schema elements.
 *
 * @param {SchemaElement[]} schema
 * @param {number} rootIndex index of the root element
 * @param {string[]} path path to the element
 * @returns {SchemaTree} tree of schema elements
 */
function schemaTree(schema, rootIndex, path) {
    const element = schema[rootIndex];
    const children = [];
    let count = 1;
    // Read the specified number of children
    if (element.num_children) {
        while (children.length < element.num_children) {
            const childElement = schema[rootIndex + count];
            const child = schemaTree(schema, rootIndex + count, [...path, childElement.name]);
            count += child.count;
            children.push(child);
        }
    }
    return { count, element, children, path };
}
/**
 * Get schema elements from the root to the given element name.
 *
 * @param {SchemaElement[]} schema
 * @param {string[]} name path to the element
 * @returns {SchemaTree[]} list of schema elements
 */
function getSchemaPath(schema, name) {
    return getTreePath(schemaTree(schema, 0, []), name);
}
/**
 * Get schema tree nodes from the root of a prebuilt tree to the given element name.
 *
 * @param {SchemaTree} tree root of the schema tree
 * @param {string[]} name path to the element
 * @returns {SchemaTree[]} list of schema elements
 */
function getTreePath(tree, name) {
    const path = [tree];
    for (const part of name) {
        const child = tree.children.find(child => child.element.name === part);
        if (!child)
            throw new Error(`parquet schema element not found: ${name}`);
        path.push(child);
        tree = child;
    }
    return path;
}
/**
 * Get all physical (leaf) column names.
 *
 * @param {SchemaTree} schemaTree
 * @returns {string[]} list of physical column names
 */
function getPhysicalColumns(schemaTree) {
    /** @type {string[]} */
    const columns = [];
    /** @param {SchemaTree} node */
    function traverse(node) {
        if (node.children.length) {
            for (const child of node.children) {
                traverse(child);
            }
        }
        else {
            columns.push(node.path.join('.'));
        }
    }
    traverse(schemaTree);
    return columns;
}
/**
 * Get the max repetition level for a given schema path.
 *
 * @param {SchemaTree[]} schemaPath
 * @returns {number} max repetition level
 */
function getMaxRepetitionLevel(schemaPath) {
    let maxLevel = 0;
    for (const { element } of schemaPath) {
        if (element.repetition_type === 'REPEATED') {
            maxLevel++;
        }
    }
    return maxLevel;
}
/**
 * Get the max definition level for a given schema path.
 *
 * @param {SchemaTree[]} schemaPath
 * @returns {number} max definition level
 */
function getMaxDefinitionLevel(schemaPath) {
    let maxLevel = 0;
    for (const { element } of schemaPath.slice(1)) {
        if (element.repetition_type !== 'REQUIRED') {
            maxLevel++;
        }
    }
    return maxLevel;
}
/**
 * Check if a column is list-like.
 *
 * @param {SchemaTree} schema
 * @returns {boolean} true if list-like
 */
function isListLike(schema) {
    if (!schema)
        return false;
    if (schema.element.converted_type !== 'LIST')
        return false;
    if (schema.children.length > 1)
        return false;
    const firstChild = schema.children[0];
    if (firstChild.children.length > 1)
        return false;
    if (firstChild.element.repetition_type !== 'REPEATED')
        return false;
    return true;
}
/**
 * Check if a column is map-like.
 *
 * @param {SchemaTree} schema
 * @returns {boolean} true if map-like
 */
function isMapLike(schema) {
    if (!schema)
        return false;
    if (schema.element.converted_type !== 'MAP')
        return false;
    if (schema.children.length > 1)
        return false;
    const firstChild = schema.children[0];
    if (firstChild.children.length !== 2)
        return false;
    if (firstChild.element.repetition_type !== 'REPEATED')
        return false;
    const keyChild = firstChild.children.find(child => child.element.name === 'key');
    if ((keyChild === null || keyChild === void 0 ? void 0 : keyChild.element.repetition_type) === 'REPEATED')
        return false;
    const valueChild = firstChild.children.find(child => child.element.name === 'value');
    if ((valueChild === null || valueChild === void 0 ? void 0 : valueChild.element.repetition_type) === 'REPEATED')
        return false;
    return true;
}
/**
 * Returns true if a column is non-nested.
 *
 * @param {SchemaTree[]} schemaPath
 * @returns {boolean}
 */
function isFlatColumn(schemaPath) {
    if (schemaPath.length !== 2)
        return false;
    const [, column] = schemaPath;
    if (column.element.repetition_type === 'REPEATED')
        return false;
    if (column.children.length)
        return false;
    return true;
}
/**
 * @import {SchemaElement, SchemaTree} from '../src/types.js'
 */

},
/* thrift.js */ function(module, exports, __req){
"use strict";
/**
 * @import {DataReader, ThriftObject, ThriftType} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializeTCompactProtocol = deserializeTCompactProtocol;
exports.readVarInt = readVarInt;
exports.readZigZag = readZigZag;
exports.readZigZagBigInt = readZigZagBigInt;
// TCompactProtocol types
const STOP = 0;
const TRUE = 1;
const FALSE = 2;
const BYTE = 3;
const I16 = 4;
const I32 = 5;
const I64 = 6;
const DOUBLE = 7;
const BINARY = 8;
const LIST = 9;
const STRUCT = 12;
/**
 * Parse TCompactProtocol
 *
 * @param {DataReader} reader
 * @returns {{ [key: `field_${number}`]: any }}
 */
function deserializeTCompactProtocol(reader) {
    /** @type {ThriftObject} */
    const value = {};
    let fid = 0;
    while (true) {
        if (reader.offset >= reader.view.byteLength)
            throw new Error('thrift struct ended without STOP');
        // Parse each field based on its type and add to the result object
        const byte = reader.view.getUint8(reader.offset++);
        const type = byte & 0x0f;
        if (type === STOP)
            break;
        const delta = byte >> 4;
        fid = delta ? fid + delta : readZigZag(reader);
        value[`field_${fid}`] = readElement(reader, type);
    }
    return value;
}
/**
 * Read a single element based on its type
 *
 * @param {DataReader} reader
 * @param {number} type
 * @returns {ThriftType}
 */
function readElement(reader, type) {
    switch (type) {
        case TRUE:
            return true;
        case FALSE:
            return false;
        case BYTE:
            return reader.view.getInt8(reader.offset++);
        case I16:
        case I32:
            return readZigZag(reader);
        case I64:
            return readZigZagBigInt(reader);
        case DOUBLE: {
            const value = reader.view.getFloat64(reader.offset, true);
            reader.offset += 8;
            return value;
        }
        case BINARY: {
            const stringLength = readVarInt(reader);
            if (reader.offset + stringLength > reader.view.byteLength) {
                throw new Error(`thrift binary length ${stringLength} exceeds remaining ${reader.view.byteLength - reader.offset} bytes`);
            }
            const strBytes = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, stringLength);
            reader.offset += stringLength;
            return strBytes;
        }
        case LIST: {
            const byte = reader.view.getUint8(reader.offset++);
            const elemType = byte & 0x0f;
            let listSize = byte >> 4;
            if (listSize === 15) {
                listSize = readVarInt(reader);
            }
            const boolType = elemType === TRUE || elemType === FALSE;
            const values = new Array(listSize);
            for (let i = 0; i < listSize; i++) {
                values[i] = boolType ? readElement(reader, BYTE) === 1 : readElement(reader, elemType);
            }
            return values;
        }
        case STRUCT:
            // main function handles struct parsing
            return deserializeTCompactProtocol(reader);
        default:
            // MAP, SET, UUID not used by parquet
            throw new Error(`thrift unhandled type: ${type}`);
    }
}
/**
 * Read varint aka Unsigned LEB128.
 *
 * @param {DataReader} reader
 * @returns {number}
 */
function readVarInt(reader) {
    let result = 0;
    let shift = 0;
    while (true) {
        // Read groups of 7 low bits until high bit is 0
        const byte = reader.view.getUint8(reader.offset++);
        result |= (byte & 0x7f) << shift;
        if (!(byte & 0x80)) {
            return result;
        }
        shift += 7;
    }
}
/**
 * Read a varint as a bigint.
 *
 * @param {DataReader} reader
 * @returns {bigint}
 */
function readVarBigInt(reader) {
    let result = 0n;
    let shift = 0n;
    while (true) {
        const byte = reader.view.getUint8(reader.offset++);
        result |= BigInt(byte & 0x7f) << shift;
        if (!(byte & 0x80)) {
            return result;
        }
        shift += 7n;
    }
}
/**
 * Read a zigzag number.
 * Zigzag folds positive and negative numbers into the positive number space.
 *
 * @param {DataReader} reader
 * @returns {number}
 */
function readZigZag(reader) {
    const zigzag = readVarInt(reader);
    return zigzag >>> 1 ^ -(zigzag & 1);
}
/**
 * Read a zigzag bigint.
 *
 * @param {DataReader} reader
 * @returns {bigint}
 */
function readZigZagBigInt(reader) {
    const zigzag = readVarBigInt(reader);
    return zigzag >> 1n ^ -(zigzag & 1n);
}

},
/* geoparquet.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markGeoColumns = markGeoColumns;
/**
 * @param {SchemaElement[]} schema
 * @param {KeyValue[] | undefined} key_value_metadata
 * @returns {void}
 */
function markGeoColumns(schema, key_value_metadata) {
    var _a, _b, _c, _d, _e, _f, _g;
    // Prepare the list of GeoParquet columns
    /** @type {Map<string, LogicalType>} */
    const columns = new Map();
    const geo = (_a = key_value_metadata === null || key_value_metadata === void 0 ? void 0 : key_value_metadata.find(({ key }) => key === 'geo')) === null || _a === void 0 ? void 0 : _a.value;
    const decodedColumns = (_c = (geo && ((_b = JSON.parse(geo)) === null || _b === void 0 ? void 0 : _b.columns))) !== null && _c !== void 0 ? _c : {};
    for (const [name, column] of Object.entries(decodedColumns)) {
        if (column.encoding !== 'WKB')
            continue;
        const type = column.edges === 'spherical' ? 'GEOGRAPHY' : 'GEOMETRY';
        const id = (_e = (_d = column.crs) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : (_g = (_f = column.crs) === null || _f === void 0 ? void 0 : _f.ids) === null || _g === void 0 ? void 0 : _g[0];
        const crs = id ? `${id.authority}:${id.code.toString()}` : undefined;
        // Note: we can't infer GEOGRAPHY's algorithm from GeoParquet
        columns.set(name, { type, crs });
    }
    // Mark schema elements with logical type
    // Only look at root-level columns of type BYTE_ARRAY without existing logical_type
    for (let i = 1; i < schema.length; i++) { // skip root
        const { logical_type, name, num_children, type } = schema[i];
        if (num_children) {
            i += num_children;
            continue; // skip the element and its children
        }
        if (type === 'BYTE_ARRAY' && !logical_type) {
            schema[i].logical_type = columns.get(name);
        }
    }
}
/**
 * @import {KeyValue, LogicalType, SchemaElement} from '../src/types.js'
 */

},
/* read.js */ function(module, exports, __req){
"use strict";
/**
 * @import {AsyncRowGroup, BaseParquetReadOptions, DecodedArray, ParquetReadOptions, ParquetRow} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowIndex = void 0;
exports.parquetRead = parquetRead;
exports.parquetReadAsync = parquetReadAsync;
exports.parquetReadColumn = parquetReadColumn;
exports.parquetReadObjects = parquetReadObjects;
const filter_js_1 = __req(10);
const metadata_js_1 = __req(5);
const plan_js_1 = __req(14);
const rowgroup_js_1 = __req(15);
const scan_js_1 = __req(25);
const utils_js_1 = __req(13);
/**
 * Symbol for the absolute, zero-based physical position of an object row.
 * @type {typeof import('../src/types.js').rowIndex}
 */
// eslint-disable-next-line no-extra-parens
exports.rowIndex = (Symbol('rowIndex'));
/**
 * Read parquet data rows from a file-like object.
 * Reads the minimal number of row groups and columns to satisfy the request.
 *
 * Returns a void promise when complete.
 * Errors are thrown on the returned promise.
 * Data is returned in callbacks onComplete, onChunk, onPage, NOT the return promise.
 * See parquetReadObjects for a more convenient API.
 *
 * @param {ParquetReadOptions} options read options
 * @returns {Promise<void>} resolves when all requested rows and columns are parsed, all errors are thrown here
 */
async function parquetRead(options) {
    var _a, _b, _c;
    // load metadata if not provided
    (_a = options.metadata) !== null && _a !== void 0 ? _a : (options.metadata = await (0, metadata_js_1.parquetMetadataAsync)(options.file, options));
    const { rowStart = 0, rowEnd, columns, onChunk, onComplete, rowFormat, filter, filterStrict = true } = options;
    // Filter requires object format to match column names
    if (filter && rowFormat !== 'object') {
        throw new Error('parquet filter requires rowFormat: "object"');
    }
    if (options.includeRowIndex && rowFormat !== 'object') {
        throw new Error('parquet includeRowIndex requires rowFormat: "object"');
    }
    const filterColumns = (0, filter_js_1.columnsNeededForFilter)(filter);
    let readColumns = columns;
    if (columns && filterColumns.length) {
        const selectedColumns = new Set(columns);
        const extraColumns = filterColumns.filter(column => !selectedColumns.has(column));
        if (extraColumns.length)
            readColumns = [...columns, ...extraColumns];
    }
    const readOptions = readColumns === columns ? options : { ...options, columns: readColumns };
    const prepared = await (0, scan_js_1.prepareParquetRead)(readOptions);
    const preparedOptions = prepared.options;
    const requiresProjection = readColumns !== columns;
    const asyncGroups = (0, scan_js_1.readParquetPlan)(preparedOptions, prepared.plan);
    // skip assembly if no onComplete or onChunk, but wait for reading to finish
    if (!onComplete && !onChunk) {
        await awaitAllColumns(asyncGroups);
        return;
    }
    // assemble struct columns
    if (!preparedOptions.metadata)
        throw new Error('parquet requires metadata');
    const schemaTree = (0, metadata_js_1.parquetSchema)(preparedOptions.metadata);
    const assembled = asyncGroups.map(arg => (0, rowgroup_js_1.assembleAsync)(arg, schemaTree, options.parsers));
    // onChunk emit all chunks (don't await). Rejection is surfaced by awaitAllColumns below.
    if (onChunk) {
        for (const asyncGroup of assembled) {
            for (const asyncColumn of asyncGroup.asyncColumns) {
                asyncColumn.data.then(({ data, skipped }) => {
                    let rowStart = asyncGroup.groupStart + skipped;
                    for (const columnData of data) {
                        onChunk({
                            columnName: asyncColumn.pathInSchema[0],
                            columnData,
                            rowStart,
                            rowEnd: rowStart + columnData.length,
                        });
                        rowStart += columnData.length;
                    }
                }, () => { });
            }
        }
    }
    // onComplete transpose column chunks to rows
    if (onComplete) {
        // wait for all reads to settle so a sibling rejection cannot leak
        await awaitAllColumns(assembled);
        // loosen the types to avoid duplicate code
        /** @type {any[]} */
        const rows = [];
        for (const asyncGroup of assembled) {
            // filter to rows in range (the plan may have narrowed the selection to
            // a sub-range of the group via page index pushdown)
            const selectStart = (_b = asyncGroup.selectStart) !== null && _b !== void 0 ? _b : Math.max(rowStart - asyncGroup.groupStart, 0);
            const selectEnd = (_c = asyncGroup.selectEnd) !== null && _c !== void 0 ? _c : Math.min((rowEnd !== null && rowEnd !== void 0 ? rowEnd : Infinity) - asyncGroup.groupStart, asyncGroup.groupRows);
            // transpose column chunks to rows in output
            const groupData = rowFormat === 'object' ?
                await (0, rowgroup_js_1.asyncGroupToRows)(asyncGroup, selectStart, selectEnd, readColumns, 'object') :
                await (0, rowgroup_js_1.asyncGroupToRows)(asyncGroup, selectStart, selectEnd, columns, 'array');
            // Attach positions before filtering compacts rows. selectStart accounts
            // for both requested ranges and page-index pruning within the group.
            if (options.includeRowIndex) {
                for (let i = 0; i < groupData.length; i++) {
                    Object.defineProperty(groupData[i], exports.rowIndex, {
                        value: asyncGroup.groupStart + selectStart + i,
                    });
                }
            }
            // Apply filter and projection
            if (filter) {
                // eslint-disable-next-line no-extra-parens
                for (const row of /** @type {Record<string, any>[]} */ (groupData)) {
                    if ((0, filter_js_1.matchFilter)(row, filter, filterStrict)) {
                        if (requiresProjection && columns) {
                            for (const col of filterColumns) {
                                if (!columns.includes(col))
                                    delete row[col];
                            }
                        }
                        rows.push(row);
                    }
                }
            }
            else {
                (0, utils_js_1.concat)(rows, groupData);
            }
        }
        onComplete(rows);
    }
    else {
        // wait for all async groups to finish (complete takes care of this)
        await awaitAllColumns(assembled);
    }
}
/**
 * Await every column promise across the given row groups via Promise.allSettled
 * so no rejection escapes as an unhandledRejection. Throws the first rejection.
 *
 * @param {AsyncRowGroup[]} asyncGroups
 * @returns {Promise<void>}
 */
async function awaitAllColumns(asyncGroups) {
    const all = asyncGroups.flatMap(g => g.asyncColumns.map(c => c.data));
    const results = await Promise.allSettled(all);
    const failed = results.find(r => r.status === 'rejected');
    if (failed)
        throw failed.reason;
}
/**
 * @param {ParquetReadOptions} options read options
 * @returns {AsyncRowGroup[]}
 */
function parquetReadAsync(options) {
    if (!options.metadata)
        throw new Error('parquet requires metadata');
    // TODO: validate options (start, end, columns, etc)
    return (0, scan_js_1.readParquetPlan)(options, (0, plan_js_1.parquetPlan)(options));
}
/**
 * Reads a single column from a parquet file.
 *
 * @param {BaseParquetReadOptions} options
 * @returns {Promise<DecodedArray>}
 */
async function parquetReadColumn(options) {
    var _a, _b;
    if (((_a = options.columns) === null || _a === void 0 ? void 0 : _a.length) !== 1) {
        throw new Error('parquetReadColumn expected columns: [columnName]');
    }
    (_b = options.metadata) !== null && _b !== void 0 ? _b : (options.metadata = await (0, metadata_js_1.parquetMetadataAsync)(options.file, options));
    const column = options.columns[0];
    const prepared = await (0, scan_js_1.prepareParquetRead)(options);
    const asyncGroups = (0, scan_js_1.readParquetPlan)(prepared.options, prepared.plan);
    if (!prepared.options.metadata)
        throw new Error('parquet requires metadata');
    const schemaTree = (0, metadata_js_1.parquetSchema)(prepared.options.metadata);
    const assembled = asyncGroups.map(group => (0, rowgroup_js_1.assembleAsync)(group, schemaTree, options.parsers));
    // Keep one plan for the whole column so reads can be prefetched together.
    await awaitAllColumns(assembled);
    /** @type {DecodedArray} */
    const columnData = [];
    for (const group of assembled) {
        const asyncColumn = group.asyncColumns.find(candidate => candidate.pathInSchema[0] === column);
        if (!asyncColumn)
            throw new Error(`parquet column not found: ${column}`);
        const { data } = await asyncColumn.data;
        for (const chunk of data)
            (0, utils_js_1.concat)(columnData, chunk);
    }
    return columnData;
}
/**
 * This is a helper function to read parquet row data as a promise.
 * It is a wrapper around the more configurable parquetRead function.
 *
 * @param {Omit<ParquetReadOptions, 'onComplete'>} options
 * @returns {Promise<ParquetRow[]>} resolves when all requested rows and columns are parsed
 */
function parquetReadObjects(options) {
    return new Promise((onComplete, reject) => {
        parquetRead({
            ...options,
            rowFormat: 'object', // force object output
            onComplete,
        }).catch(reject);
    });
}

},
/* filter.js */ function(module, exports, __req){
"use strict";
/**
 * @import {BloomFilter, ColumnPageStats, PageRanges, ParquetQueryFilter, RowGroup, SchemaElement} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathsNeededForFilter = pathsNeededForFilter;
exports.columnsNeededForFilter = columnsNeededForFilter;
exports.matchFilter = matchFilter;
exports.canSkipRowGroup = canSkipRowGroup;
exports.filterPageRanges = filterPageRanges;
exports.intersectRanges = intersectRanges;
exports.unionRanges = unionRanges;
const bloom_js_1 = __req(11);
const utils_js_1 = __req(13);
const encoder = new TextEncoder();
/**
 * Returns the physical leaf paths referenced by a filter.
 *
 * @param {ParquetQueryFilter} [filter]
 * @returns {string[]}
 */
function pathsNeededForFilter(filter) {
    if (!filter)
        return [];
    /** @type {string[]} */
    const paths = [];
    if ('$and' in filter && Array.isArray(filter.$and)) {
        paths.push(...filter.$and.flatMap(pathsNeededForFilter));
    }
    else if ('$or' in filter && Array.isArray(filter.$or)) {
        paths.push(...filter.$or.flatMap(pathsNeededForFilter));
    }
    else if ('$nor' in filter && Array.isArray(filter.$nor)) {
        paths.push(...filter.$nor.flatMap(pathsNeededForFilter));
    }
    else {
        paths.push(...Object.keys(filter));
    }
    return [...new Set(paths)];
}
/**
 * Returns an array of top-level column names needed to evaluate the filter.
 *
 * @param {ParquetQueryFilter} [filter]
 * @returns {string[]}
 */
function columnsNeededForFilter(filter) {
    return [...new Set(pathsNeededForFilter(filter).map(path => path.split('.')[0]))];
}
/**
 * Match a record against a query filter
 *
 * @param {Record<string, any>} record
 * @param {ParquetQueryFilter} filter
 * @param {boolean} [strict]
 * @returns {boolean}
 */
function matchFilter(record, filter, strict = true) {
    if ('$and' in filter && Array.isArray(filter.$and)) {
        return filter.$and.every(subQuery => matchFilter(record, subQuery, strict));
    }
    if ('$or' in filter && Array.isArray(filter.$or)) {
        return filter.$or.some(subQuery => matchFilter(record, subQuery, strict));
    }
    if ('$nor' in filter && Array.isArray(filter.$nor)) {
        return !filter.$nor.some(subQuery => matchFilter(record, subQuery, strict));
    }
    return Object.entries(filter).every(([field, condition]) => {
        const value = resolve(record, field);
        // implicit $eq for non-object conditions
        if (typeof condition !== 'object' || condition === null || Array.isArray(condition)) {
            return (0, utils_js_1.equals)(value, condition, strict);
        }
        return Object.entries(condition || {}).every(([operator, target]) => {
            if (operator === '$gt')
                return value !== null && value !== undefined && value > target;
            if (operator === '$gte')
                return value !== null && value !== undefined && value >= target;
            if (operator === '$lt')
                return value !== null && value !== undefined && value < target;
            if (operator === '$lte')
                return value !== null && value !== undefined && value <= target;
            if (operator === '$eq')
                return (0, utils_js_1.equals)(value, target, strict);
            if (operator === '$ne')
                return !(0, utils_js_1.equals)(value, target, strict);
            if (operator === '$in')
                return Array.isArray(target) && matchesIn(value, target, strict);
            if (operator === '$nin')
                return Array.isArray(target) && !matchesIn(value, target, strict);
            // value is already resolved, so re-wrap it under a plain key. Reusing
            // field would send a dotted path back through resolve and lose the value.
            if (operator === '$not')
                return !matchFilter({ value }, { value: target }, strict);
            return true;
        });
    });
}
/**
 * Match a value or one of its immediate array elements against a list.
 *
 * @param {any} value
 * @param {any[]} targets
 * @param {boolean} strict
 * @returns {boolean}
 */
function matchesIn(value, targets, strict) {
    return targets.some(target => (0, utils_js_1.equals)(value, target, strict) ||
        Array.isArray(value) && value.some(element => (0, utils_js_1.equals)(element, target, strict)));
}
/**
 * Check if a row group can be skipped based on filter and column statistics,
 * optionally consulting per-column bloom filters for equality predicates that
 * statistics can't decide.
 *
 * @param {object} options
 * @param {RowGroup} options.rowGroup
 * @param {string[]} options.physicalColumns
 * @param {ParquetQueryFilter | undefined} options.filter
 * @param {boolean} [options.strict]
 * @param {Record<string, BloomFilter>} [options.bloomFilters] keyed by filter path
 * @param {Record<string, SchemaElement>} [options.schemaElements] keyed by physical leaf path
 * @returns {boolean} true if the row group can be skipped
 */
function canSkipRowGroup({ rowGroup, physicalColumns, filter, strict = true, bloomFilters, schemaElements }) {
    var _a;
    if (!filter)
        return false;
    // Handle logical operators
    if ('$and' in filter && Array.isArray(filter.$and)) {
        // For AND, we can skip if ANY condition allows skipping
        return filter.$and.some(subFilter => canSkipRowGroup({ rowGroup, physicalColumns, filter: subFilter, strict, bloomFilters, schemaElements }));
    }
    if ('$or' in filter && Array.isArray(filter.$or)) {
        // For OR, we can skip only if ALL conditions allow skipping
        return filter.$or.every(subFilter => canSkipRowGroup({ rowGroup, physicalColumns, filter: subFilter, strict, bloomFilters, schemaElements }));
    }
    if ('$nor' in filter && Array.isArray(filter.$nor)) {
        // For NOR, we can skip if none of the conditions allow skipping
        // This is complex, so we'll be conservative and not skip
        return false;
    }
    // Check column filters
    for (const [field, condition] of Object.entries(filter)) {
        // Find the column chunk for this field
        const columnIndex = physicalColumns.indexOf(field);
        if (columnIndex === -1)
            continue;
        const stats = (_a = rowGroup.columns[columnIndex].meta_data) === null || _a === void 0 ? void 0 : _a.statistics;
        const { min, max, min_value, max_value, null_count: nullCount } = stats || {};
        const minVal = min_value !== undefined ? min_value : min;
        const maxVal = max_value !== undefined ? max_value : max;
        const haveStats = minVal !== undefined && maxVal !== undefined;
        const bloom = bloomFilters === null || bloomFilters === void 0 ? void 0 : bloomFilters[field];
        const element = schemaElements === null || schemaElements === void 0 ? void 0 : schemaElements[field];
        const matchingNulls = matchFilter({ value: null }, { value: condition }, strict) &&
            (nullCount === undefined || nullCount > 0);
        if (haveStats && !matchingNulls && canSkipStats(condition, minVal, maxVal, strict, element)) {
            return true;
        }
        // Handle operators
        for (const [operator, target] of Object.entries(condition || {})) {
            // Bloom-filter skipping for equality predicates (proves absence, never presence)
            if (bloom && element) {
                if (operator === '$eq') {
                    const hash = (0, bloom_js_1.hashParquetValue)(target, element);
                    if (hash !== undefined && !(0, bloom_js_1.sbbfContains)(bloom.blocks, hash))
                        return true;
                }
                if (operator === '$in' && Array.isArray(target) && target.length > 0) {
                    let allAbsent = true;
                    for (const v of target) {
                        const h = (0, bloom_js_1.hashParquetValue)(v, element);
                        if (h === undefined || (0, bloom_js_1.sbbfContains)(bloom.blocks, h)) {
                            allAbsent = false;
                            break;
                        }
                    }
                    if (allAbsent)
                        return true;
                }
            }
        }
    }
    return false;
}
/**
 * Check if a page value range [minVal, maxVal] provably contains no value
 * matching the operator conditions.
 *
 * @param {any} condition operator object like { $gt: 5 }
 * @param {any} minVal lower bound (may be truncated, still a valid bound)
 * @param {any} maxVal upper bound (may be truncated, still a valid bound)
 * @param {boolean} strict
 * @param {SchemaElement} [element] physical schema element for the bounds
 * @returns {boolean} true if no value in the range can match
 */
function canSkipStats(condition, minVal, maxVal, strict, element) {
    var _a;
    if (minVal === undefined || maxVal === undefined)
        return false;
    const mayContainNaN = (element === null || element === void 0 ? void 0 : element.type) === 'FLOAT' || (element === null || element === void 0 ? void 0 : element.type) === 'DOUBLE' || ((_a = element === null || element === void 0 ? void 0 : element.logical_type) === null || _a === void 0 ? void 0 : _a.type) === 'FLOAT16';
    for (const [operator, target] of Object.entries(condition || {})) {
        const minComparison = compareParquetValues(minVal, target, strict, element);
        const maxComparison = compareParquetValues(maxVal, target, strict, element);
        // Row filtering uses JavaScript relational operators. For non-ASCII
        // strings their UTF-16 order can differ from Parquet's UTF-8 index order,
        // and binary values are string-coerced rather than byte-compared, so those
        // min/max bounds cannot safely prove a relational predicate impossible.
        const binaryBounds = minVal instanceof Uint8Array || maxVal instanceof Uint8Array;
        const relationalBoundsAreSafe = !binaryBounds && ((element === null || element === void 0 ? void 0 : element.type) !== 'BYTE_ARRAY' ||
            typeof target === 'string' && [...target].every(character => character.charCodeAt(0) <= 0x7f));
        if (operator === '$gt' && relationalBoundsAreSafe && maxComparison !== undefined && maxComparison <= 0)
            return true;
        if (operator === '$gte' && relationalBoundsAreSafe && maxComparison !== undefined && maxComparison < 0)
            return true;
        if (operator === '$lt' && relationalBoundsAreSafe && minComparison !== undefined && minComparison >= 0)
            return true;
        if (operator === '$lte' && relationalBoundsAreSafe && minComparison !== undefined && minComparison > 0)
            return true;
        if (operator === '$eq') {
            const targetMinComparison = compareParquetValues(target, minVal, strict, element);
            const targetMaxComparison = compareParquetValues(target, maxVal, strict, element);
            if (targetMinComparison !== undefined && targetMinComparison < 0 ||
                targetMaxComparison !== undefined && targetMaxComparison > 0)
                return true;
        }
        if (operator === '$ne' && !mayContainNaN && (0, utils_js_1.equals)(minVal, maxVal, strict) && (0, utils_js_1.equals)(minVal, target, strict))
            return true;
        if (operator === '$in' && Array.isArray(target) && target.every(value => {
            const valueMinComparison = compareParquetValues(value, minVal, strict, element);
            const valueMaxComparison = compareParquetValues(value, maxVal, strict, element);
            return valueMinComparison !== undefined && valueMinComparison < 0 ||
                valueMaxComparison !== undefined && valueMaxComparison > 0;
        }))
            return true;
        if (operator === '$nin' && !mayContainNaN && Array.isArray(target) && (0, utils_js_1.equals)(minVal, maxVal, strict) && target.some(value => (0, utils_js_1.equals)(minVal, value, strict)))
            return true;
    }
    return false;
}
/**
 * Compare values using Parquet's unsigned lexicographic ordering for binary
 * values. Returns undefined when values do not have a safely comparable order.
 *
 * @param {any} a
 * @param {any} b
 * @param {boolean} strict
 * @param {SchemaElement} [element]
 * @returns {-1 | 0 | 1 | undefined}
 */
function compareParquetValues(a, b, strict, element) {
    // BYTE_ARRAY values are decoded as UTF-8 strings by the default parser even
    // without an explicit UTF8/STRING annotation.
    if ((element === null || element === void 0 ? void 0 : element.type) === 'BYTE_ARRAY') {
        if (typeof a !== 'string' || typeof b !== 'string')
            return undefined;
        return compareBytes(encoder.encode(a), encoder.encode(b));
    }
    if (a instanceof Uint8Array || b instanceof Uint8Array) {
        if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array))
            return undefined;
        return compareBytes(a, b);
    }
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    if ((0, utils_js_1.equals)(a, b, strict))
        return 0;
    return undefined;
}
/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {-1 | 0 | 1}
 */
function compareBytes(a, b) {
    const length = Math.min(a.length, b.length);
    for (let i = 0; i < length; i++) {
        if (a[i] < b[i])
            return -1;
        if (a[i] > b[i])
            return 1;
    }
    if (a.length < b.length)
        return -1;
    if (a.length > b.length)
        return 1;
    return 0;
}
/**
 * Check whether the filter condition accepts a null value.
 *
 * @param {any} condition
 * @param {boolean} strict
 * @returns {boolean}
 */
function matchesNull(condition, strict) {
    return matchFilter({ value: null }, { value: condition }, strict);
}
/**
 * Compute candidate row ranges within a row group that could match the filter,
 * based on per-page column index statistics.
 *
 * Returns sorted disjoint [start, end) row ranges relative to the group.
 * An empty array means the filter provably matches no rows in the group.
 * Returns undefined when the page statistics give no pruning information
 * (the caller must read the whole selection).
 *
 * @param {ParquetQueryFilter | undefined} filter
 * @param {Record<string, ColumnPageStats>} columnPages keyed by physical leaf path
 * @param {number} groupRows number of rows in the row group
 * @param {boolean} [strict]
 * @returns {PageRanges | undefined}
 */
function filterPageRanges(filter, columnPages, groupRows, strict = true) {
    var _a;
    if (!filter)
        return undefined;
    if ('$and' in filter && Array.isArray(filter.$and)) {
        /** @type {PageRanges | undefined} */
        let ranges;
        for (const subFilter of filter.$and) {
            ranges = intersectRanges(ranges, filterPageRanges(subFilter, columnPages, groupRows, strict));
        }
        return ranges;
    }
    if ('$or' in filter && Array.isArray(filter.$or)) {
        /** @type {PageRanges} */
        let ranges = [];
        for (const subFilter of filter.$or) {
            const subRanges = filterPageRanges(subFilter, columnPages, groupRows, strict);
            // any un-prunable branch could match anywhere
            if (!subRanges)
                return undefined;
            ranges = unionRanges(ranges, subRanges);
        }
        return ranges;
    }
    if ('$nor' in filter && Array.isArray(filter.$nor)) {
        // Conservative: negations cannot be pruned by min/max bounds
        return undefined;
    }
    // Column conditions: all fields must match, so intersect their ranges
    /** @type {PageRanges | undefined} */
    let result;
    for (const [field, condition] of Object.entries(filter)) {
        const pages = columnPages[field];
        if (!pages)
            continue;
        const nullCanMatch = matchesNull(condition, strict);
        /** @type {PageRanges} */
        const keep = [];
        for (let i = 0; i < pages.pageStarts.length; i++) {
            const start = pages.pageStarts[i];
            const end = i + 1 < pages.pageStarts.length ? pages.pageStarts[i + 1] : groupRows;
            const nullCount = (_a = pages.nullCounts) === null || _a === void 0 ? void 0 : _a[i];
            // Keep pages with matching nulls, including pages whose null presence is
            // unknown because the optional null_counts index field was omitted.
            const matchingNulls = nullCanMatch && (nullCount === undefined || nullCount > 0);
            const skip = !pages.nullPages[i] && !matchingNulls &&
                canSkipStats(condition, pages.minValues[i], pages.maxValues[i], strict, pages.element);
            if (!skip) {
                const last = keep[keep.length - 1];
                if (last && last[1] === start)
                    last[1] = end;
                else
                    keep.push([start, end]);
            }
        }
        result = intersectRanges(result, keep);
    }
    return result;
}
/**
 * Intersect two sets of sorted disjoint ranges. Undefined means "everything".
 *
 * @param {PageRanges | undefined} a
 * @param {PageRanges | undefined} b
 * @returns {PageRanges | undefined}
 */
function intersectRanges(a, b) {
    if (!a)
        return b;
    if (!b)
        return a;
    /** @type {PageRanges} */
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        const start = Math.max(a[i][0], b[j][0]);
        const end = Math.min(a[i][1], b[j][1]);
        if (start < end)
            out.push([start, end]);
        if (a[i][1] < b[j][1])
            i++;
        else
            j++;
    }
    return out;
}
/**
 * Union two sets of sorted disjoint ranges.
 *
 * @param {PageRanges} a
 * @param {PageRanges} b
 * @returns {PageRanges}
 */
function unionRanges(a, b) {
    /** @type {PageRanges} */
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
        const next = j >= b.length || i < a.length && a[i][0] <= b[j][0] ? a[i++] : b[j++];
        const last = out[out.length - 1];
        if (last && next[0] <= last[1])
            last[1] = Math.max(last[1], next[1]);
        else
            out.push([next[0], next[1]]);
    }
    return out;
}
/**
 * Resolve a dot-notation path to a value in a nested object.
 *
 * @param {Record<string, any>} record
 * @param {string} path
 * @returns {any}
 */
function resolve(record, path) {
    let value = record;
    for (const part of path.split('.')) {
        value = value === null || value === void 0 ? void 0 : value[part];
    }
    return value;
}

},
/* bloom.js */ function(module, exports, __req){
"use strict";
// Split Block Bloom Filter (https://github.com/apache/parquet-format/blob/master/BloomFilter.md)
// A bloom filter is a sequence of 32-byte blocks. Each block holds 8 little-endian uint32 words.
// Insertion sets one bit per word, chosen by salting the low 32 bits of an xxhash64.
// Membership requires all 8 bits to be set; misses are exact, hits are probabilistic.
Object.defineProperty(exports, "__esModule", { value: true });
exports.sbbfInsert = sbbfInsert;
exports.sbbfContains = sbbfContains;
exports.readBloomFilter = readBloomFilter;
exports.hashParquetValue = hashParquetValue;
exports.bloomEligibleColumns = bloomEligibleColumns;
const thrift_js_1 = __req(7);
const xxhash_js_1 = __req(12);
/**
 * @import {BloomFilter, DataReader, ParquetQueryFilter, SchemaElement} from '../src/types.js'
 */
const textEncoder = new TextEncoder();
const SALT = new Uint32Array([
    0x47b6137b, 0x44974d91, 0x8824ad5b, 0xa2b7289d,
    0x705495c7, 0x2df1424b, 0x9efc4947, 0x5c6bfb31,
]);
/**
 * Map the high 32 bits of a hash to a block index in [0, numBlocks).
 *
 * @param {bigint} hash
 * @param {number} numBlocks
 * @returns {number}
 */
function blockIndex(hash, numBlocks) {
    return Number((hash >> 32n) * BigInt(numBlocks) >> 32n);
}
/**
 * Per-block mask: 8 uint32 words, each with a single bit set at position `(low32 * SALT[i]) >> 27`.
 *
 * @param {bigint} hash
 * @returns {Uint32Array}
 */
function blockMask(hash) {
    const m = new Uint32Array(8);
    const low = Number(hash & 0xffffffffn) | 0;
    for (let i = 0; i < 8; i++) {
        m[i] = 1 << (Math.imul(low, SALT[i]) >>> 27);
    }
    return m;
}
/**
 * Insert a hash into a Split Block Bloom Filter.
 *
 * @param {Uint32Array} blocks bloom filter words (8 * numBlocks long)
 * @param {bigint} hash 64-bit xxhash of the parquet-plain-encoded value
 */
function sbbfInsert(blocks, hash) {
    const offset = blockIndex(hash, blocks.length >> 3) << 3;
    const m = blockMask(hash);
    for (let i = 0; i < 8; i++) {
        blocks[offset + i] |= m[i];
    }
}
/**
 * Test whether a hash might be present in a Split Block Bloom Filter.
 * False positives are possible; false negatives are not.
 *
 * @param {Uint32Array} blocks bloom filter words (8 * numBlocks long)
 * @param {bigint} hash 64-bit xxhash of the parquet-plain-encoded value
 * @returns {boolean}
 */
function sbbfContains(blocks, hash) {
    const offset = blockIndex(hash, blocks.length >> 3) << 3;
    const m = blockMask(hash);
    for (let i = 0; i < 8; i++) {
        if ((blocks[offset + i] & m[i]) === 0)
            return false;
    }
    return true;
}
/**
 * Parse a Split Block Bloom Filter from a reader positioned at the BloomFilterHeader.
 * Returns undefined when the header advertises an unsupported algorithm, hash, or
 * compression — callers should treat that as "cannot use this bloom filter."
 *
 * @param {DataReader} reader
 * @returns {BloomFilter | undefined}
 */
function readBloomFilter(reader) {
    var _a, _b, _c;
    const header = (0, thrift_js_1.deserializeTCompactProtocol)(reader);
    const numBytes = header.field_1;
    if (typeof numBytes !== 'number' || numBytes <= 0 || numBytes % 32 !== 0)
        return undefined;
    // BloomFilterAlgorithm / Hash / Compression are unions with a single supported variant each.
    if (!((_a = header.field_2) === null || _a === void 0 ? void 0 : _a.field_1))
        return undefined; // algorithm must be BLOCK
    if (!((_b = header.field_3) === null || _b === void 0 ? void 0 : _b.field_1))
        return undefined; // hash must be XXHASH
    if (!((_c = header.field_4) === null || _c === void 0 ? void 0 : _c.field_1))
        return undefined; // compression must be UNCOMPRESSED
    const { view, offset } = reader;
    if (offset + numBytes > view.byteLength) {
        throw new Error(`parquet bloom filter truncated: need ${numBytes} bytes, have ${view.byteLength - offset}`);
    }
    // Reader offset is not 4-aligned in general, and we want endian-portable reads.
    const blocks = new Uint32Array(numBytes >> 2);
    for (let i = 0; i < blocks.length; i++) {
        blocks[i] = view.getUint32(offset + i * 4, true);
    }
    reader.offset = offset + numBytes;
    return { numBytes, blocks };
}
/**
 * Hash a JS filter value as its parquet PLAIN-encoded bytes, suitable for a
 * bloom filter lookup. Returns undefined when the column's parser is lossy or
 * ambiguous (DATE, TIMESTAMP_*, DECIMAL, JSON, BSON, INT96, FLOAT16, UUID,
 * GEOMETRY, GEOGRAPHY, INTERVAL) or when the JS value type doesn't match the
 * column. Callers must treat undefined as "bloom filter cannot help."
 *
 * @param {any} value
 * @param {SchemaElement} element
 * @returns {bigint | undefined}
 */
function hashParquetValue(value, element) {
    if (value === null || value === undefined)
        return undefined;
    const { type, converted_type, logical_type } = element;
    if (type === 'BOOLEAN') {
        if (typeof value !== 'boolean')
            return undefined;
        return (0, xxhash_js_1.xxhash64)(new Uint8Array([value ? 1 : 0]));
    }
    if (type === 'FLOAT') {
        if (typeof value !== 'number')
            return undefined;
        const buf = new ArrayBuffer(4);
        new DataView(buf).setFloat32(0, value, true);
        return (0, xxhash_js_1.xxhash64)(new Uint8Array(buf));
    }
    if (type === 'DOUBLE') {
        if (typeof value !== 'number')
            return undefined;
        const buf = new ArrayBuffer(8);
        new DataView(buf).setFloat64(0, value, true);
        return (0, xxhash_js_1.xxhash64)(new Uint8Array(buf));
    }
    if (type === 'INT32') {
        if (converted_type === 'DATE' || converted_type === 'DECIMAL' || converted_type === 'TIME_MILLIS')
            return undefined;
        if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'DATE' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'TIME' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'DECIMAL')
            return undefined;
        if (typeof value !== 'number' || !Number.isInteger(value))
            return undefined;
        const buf = new ArrayBuffer(4);
        new DataView(buf).setInt32(0, value | 0, true);
        return (0, xxhash_js_1.xxhash64)(new Uint8Array(buf));
    }
    if (type === 'INT64') {
        if (converted_type === 'TIMESTAMP_MILLIS' || converted_type === 'TIMESTAMP_MICROS')
            return undefined;
        if (converted_type === 'TIME_MICROS' || converted_type === 'DECIMAL')
            return undefined;
        if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'TIMESTAMP' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'TIME' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'DECIMAL')
            return undefined;
        let bigValue;
        if (typeof value === 'bigint')
            bigValue = value;
        else if (typeof value === 'number' && Number.isSafeInteger(value))
            bigValue = BigInt(value);
        else
            return undefined;
        const buf = new ArrayBuffer(8);
        new DataView(buf).setBigUint64(0, BigInt.asUintN(64, bigValue), true);
        return (0, xxhash_js_1.xxhash64)(new Uint8Array(buf));
    }
    if (type === 'BYTE_ARRAY') {
        if (converted_type === 'JSON' || converted_type === 'BSON' || converted_type === 'DECIMAL')
            return undefined;
        if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'JSON' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'BSON' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'VARIANT')
            return undefined;
        if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'GEOMETRY' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'GEOGRAPHY')
            return undefined;
        if (typeof value === 'string')
            return (0, xxhash_js_1.xxhash64)(textEncoder.encode(value));
        if (value instanceof Uint8Array)
            return (0, xxhash_js_1.xxhash64)(value);
        return undefined;
    }
    if (type === 'FIXED_LEN_BYTE_ARRAY') {
        if (converted_type === 'DECIMAL' || converted_type === 'INTERVAL')
            return undefined;
        if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'DECIMAL' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'UUID' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'FLOAT16')
            return undefined;
        if ((logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'GEOMETRY' || (logical_type === null || logical_type === void 0 ? void 0 : logical_type.type) === 'GEOGRAPHY')
            return undefined;
        if (value instanceof Uint8Array)
            return (0, xxhash_js_1.xxhash64)(value);
        return undefined;
    }
    // INT96 deprecated, or type missing on group columns
    return undefined;
}
/**
 * Top-level column names that appear in $eq or $in predicates within a filter.
 * These are the only columns where a bloom filter can prove a value's absence
 * and let us skip a row group; any other operator can't be helped by a bloom.
 *
 * @param {ParquetQueryFilter | undefined} filter
 * @returns {Set<string>}
 */
function bloomEligibleColumns(filter) {
    /** @type {Set<string>} */
    const out = new Set();
    walkBloomEligible(filter, out);
    return out;
}
/**
 * @param {ParquetQueryFilter | undefined} filter
 * @param {Set<string>} out
 */
function walkBloomEligible(filter, out) {
    if (!filter)
        return;
    if ('$and' in filter && Array.isArray(filter.$and)) {
        for (const sub of filter.$and)
            walkBloomEligible(sub, out);
        return;
    }
    if ('$or' in filter && Array.isArray(filter.$or)) {
        for (const sub of filter.$or)
            walkBloomEligible(sub, out);
        return;
    }
    // $nor would need to prove presence, not absence — bloom can't help.
    if ('$nor' in filter)
        return;
    for (const [field, condition] of Object.entries(filter)) {
        if (field.startsWith('$'))
            continue;
        if (typeof condition === 'object' && condition !== null && !Array.isArray(condition)) {
            if ('$eq' in condition || '$in' in condition)
                out.add(field);
        }
        else {
            // primitive / null / array condition is an implicit $eq
            out.add(field);
        }
    }
}

},
/* xxhash.js */ function(module, exports, __req){
"use strict";
// XxHash64 (https://github.com/Cyan4973/xxHash/blob/dev/doc/xxhash_spec.md)
// Used by parquet bloom filters: hashes the PLAIN encoding of column values with seed 0.
Object.defineProperty(exports, "__esModule", { value: true });
exports.xxhash64 = xxhash64;
const MASK = 0xffffffffffffffffn;
const PRIME1 = 0x9e3779b185ebca87n;
const PRIME2 = 0xc2b2ae3d27d4eb4fn;
const PRIME3 = 0x165667b19e3779f9n;
const PRIME4 = 0x85ebca77c2b2ae63n;
const PRIME5 = 0x27d4eb2f165667c5n;
/**
 * @param {bigint} x
 * @param {bigint} r rotation amount in bits (1..63)
 * @returns {bigint}
 */
function rotl64(x, r) {
    return (x << r | x >> 64n - r) & MASK;
}
/**
 * @param {bigint} acc
 * @param {bigint} val
 * @returns {bigint}
 */
function round(acc, val) {
    acc = acc + val * PRIME2 & MASK;
    acc = rotl64(acc, 31n);
    return acc * PRIME1 & MASK;
}
/**
 * @param {bigint} acc
 * @param {bigint} val
 * @returns {bigint}
 */
function mergeRound(acc, val) {
    acc ^= round(0n, val);
    return acc * PRIME1 + PRIME4 & MASK;
}
/**
 * Compute the 64-bit xxHash of a byte buffer.
 *
 * @param {Uint8Array} input
 * @param {bigint} [seed]
 * @returns {bigint} 64-bit hash
 */
function xxhash64(input, seed = 0n) {
    const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
    const len = input.byteLength;
    let offset = 0;
    let h64;
    if (len >= 32) {
        let v1 = seed + PRIME1 + PRIME2 & MASK;
        let v2 = seed + PRIME2 & MASK;
        let v3 = seed;
        let v4 = seed - PRIME1 & MASK;
        while (offset + 32 <= len) {
            v1 = round(v1, view.getBigUint64(offset, true));
            offset += 8;
            v2 = round(v2, view.getBigUint64(offset, true));
            offset += 8;
            v3 = round(v3, view.getBigUint64(offset, true));
            offset += 8;
            v4 = round(v4, view.getBigUint64(offset, true));
            offset += 8;
        }
        h64 = rotl64(v1, 1n) + rotl64(v2, 7n) + rotl64(v3, 12n) + rotl64(v4, 18n) & MASK;
        h64 = mergeRound(h64, v1);
        h64 = mergeRound(h64, v2);
        h64 = mergeRound(h64, v3);
        h64 = mergeRound(h64, v4);
    }
    else {
        h64 = seed + PRIME5 & MASK;
    }
    h64 = h64 + BigInt(len) & MASK;
    while (offset + 8 <= len) {
        h64 ^= round(0n, view.getBigUint64(offset, true));
        h64 = rotl64(h64, 27n) * PRIME1 + PRIME4 & MASK;
        offset += 8;
    }
    if (offset + 4 <= len) {
        h64 ^= BigInt(view.getUint32(offset, true)) * PRIME1 & MASK;
        h64 = rotl64(h64, 23n) * PRIME2 + PRIME3 & MASK;
        offset += 4;
    }
    while (offset < len) {
        h64 ^= BigInt(view.getUint8(offset)) * PRIME5 & MASK;
        h64 = rotl64(h64, 11n) * PRIME1 & MASK;
        offset += 1;
    }
    h64 ^= h64 >> 33n;
    h64 = h64 * PRIME2 & MASK;
    h64 ^= h64 >> 29n;
    h64 = h64 * PRIME3 & MASK;
    h64 ^= h64 >> 32n;
    return h64;
}

},
/* utils.js */ function(module, exports, __req){
"use strict";
/**
 * @import {AsyncBuffer, Awaitable, DecodedArray} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJson = toJson;
exports.concat = concat;
exports.equals = equals;
exports.byteLengthFromUrl = byteLengthFromUrl;
exports.asyncBufferFromUrl = asyncBufferFromUrl;
exports.cachedAsyncBuffer = cachedAsyncBuffer;
exports.flatten = flatten;
const metadata_js_1 = __req(5);
/**
 * Replace bigint, date, etc with legal JSON types.
 *
 * @param {any} obj object to convert
 * @returns {unknown} converted object
 */
function toJson(obj) {
    if (obj === undefined)
        return null;
    if (typeof obj === 'bigint')
        return Number(obj);
    if (Object.is(obj, -0))
        return 0;
    if (Array.isArray(obj))
        return obj.map(toJson);
    if (obj instanceof Uint8Array)
        return Array.from(obj);
    if (obj instanceof Date)
        return obj.toISOString();
    if (obj instanceof Object) {
        /** @type {Record<string, unknown>} */
        const newObj = {};
        for (const key of Object.keys(obj)) {
            if (obj[key] === undefined)
                continue;
            newObj[key] = toJson(obj[key]);
        }
        return newObj;
    }
    return obj;
}
/**
 * Concatenate two arrays fast.
 *
 * @param {any[]} aaa
 * @param {DecodedArray} bbb
 */
function concat(aaa, bbb) {
    const chunk = 10000;
    for (let i = 0; i < bbb.length; i += chunk) {
        aaa.push(...bbb.slice(i, i + chunk));
    }
}
/**
 * Deep equality.
 *
 * @param {any} a
 * @param {any} b
 * @param {boolean} [strict]
 * @returns {boolean}
 */
function equals(a, b, strict = true) {
    // eslint-disable-next-line eqeqeq
    if (strict ? a === b : a == b)
        return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object')
        return false;
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    if (a instanceof Date || b instanceof Date) {
        return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (!equals(a[i], b[i], strict))
                return false;
        }
        return true;
    }
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b).length)
        return false;
    for (const k of aKeys) {
        if (!equals(a[k], b[k], strict))
            return false;
    }
    return true;
}
/**
 * Get the byte length using fetch with a ranged GET request.
 * Aborts the request if server returns 200 instead of 206.
 *
 * @param {string} url
 * @param {RequestInit} [requestInit] fetch options
 * @param {typeof globalThis.fetch} [fetchFn] fetch function to use
 * @returns {Promise<number>}
 */
async function byteLengthFromUrlUsingGet(url, requestInit = {}, fetchFn = globalThis.fetch) {
    const controller = new AbortController();
    const headers = new Headers(requestInit.headers);
    headers.set('Range', 'bytes=0-0');
    const res = await fetchFn(url, {
        ...requestInit,
        headers,
        signal: controller.signal,
    });
    if (!res.ok)
        throw new Error(`fetch with range failed ${res.status}`);
    // Server supports Range requests (206 Partial Content)
    if (res.status === 206) {
        const contentRange = res.headers.get('Content-Range');
        if (!contentRange)
            throw new Error('missing content-range header');
        // Parse "bytes 0-0/9446073" to get total length
        const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
        if (!match)
            throw new Error(`invalid content-range header: ${contentRange}`);
        return parseInt(match[1]);
    }
    // Server ignored Range and returned 200 - get Content-Length and abort request
    if (res.status === 200) {
        const contentLength = res.headers.get('Content-Length');
        // Abort the request to stop any ongoing download
        controller.abort();
        if (contentLength)
            return parseInt(contentLength);
    }
    throw new Error('server does not support range requests and missing content-length');
}
/**
 * Get the byte length of a URL using a HEAD request.
 * If HEAD fails with 403 (e.g., with signed S3 URLs), falls back to a ranged GET request.
 * If HEAD succeeds but Content-Length is missing, falls back to GET with range.
 * If requestInit is provided, it will be passed to fetch.
 *
 * @param {string} url
 * @param {RequestInit} [requestInit] fetch options
 * @param {typeof globalThis.fetch} [customFetch] fetch function to use
 * @returns {Promise<number>}
 */
async function byteLengthFromUrl(url, requestInit, customFetch) {
    const fetch = customFetch !== null && customFetch !== void 0 ? customFetch : globalThis.fetch;
    const res = await fetch(url, { ...requestInit, method: 'HEAD' });
    // If HEAD request is forbidden (common with signed S3 URLs), try GET with range
    if (res.status === 403) {
        return byteLengthFromUrlUsingGet(url, requestInit, fetch);
    }
    if (!res.ok)
        throw new Error(`fetch head failed ${res.status}`);
    const length = res.headers.get('Content-Length');
    // If Content-Length is missing from HEAD, fallback to GET with range
    if (!length) {
        return byteLengthFromUrlUsingGet(url, requestInit, fetch);
    }
    return parseInt(length);
}
/**
 * Construct an AsyncBuffer for a URL.
 * If byteLength is not provided, will make a HEAD request to get the file size.
 * If fetch is provided, it will be used instead of the global fetch.
 * If requestInit is provided, it will be passed to fetch.
 *
 * @param {object} options
 * @param {string} options.url
 * @param {number} [options.byteLength]
 * @param {typeof globalThis.fetch} [options.fetch] fetch function to use
 * @param {RequestInit} [options.requestInit]
 * @returns {Promise<AsyncBuffer>}
 */
async function asyncBufferFromUrl({ url, byteLength, requestInit, fetch: customFetch }) {
    if (!url)
        throw new Error('missing url');
    const fetch = customFetch !== null && customFetch !== void 0 ? customFetch : globalThis.fetch;
    // byte length from HEAD request
    byteLength !== null && byteLength !== void 0 ? byteLength : (byteLength = await byteLengthFromUrl(url, requestInit, fetch));
    /**
     * A promise for the whole buffer, if range requests are not supported.
     * @type {Promise<ArrayBuffer>|undefined}
     */
    let buffer = undefined;
    const init = requestInit || {};
    return {
        byteLength,
        async slice(start, end) {
            if (buffer) {
                return buffer.then(buffer => buffer.slice(start, end));
            }
            const headers = new Headers(init.headers);
            const endStr = end === undefined ? '' : end - 1;
            headers.set('Range', `bytes=${start}-${endStr}`);
            const res = await fetch(url, { ...init, headers });
            if (!res.ok || !res.body)
                throw new Error(`fetch failed ${res.status}`);
            if (res.status === 200) {
                // Endpoint does not support range requests and returned the whole object
                buffer = res.arrayBuffer();
                return buffer.then(buffer => buffer.slice(start, end));
            }
            else if (res.status === 206) {
                // The endpoint supports range requests and sent us the requested range
                return res.arrayBuffer();
            }
            else {
                throw new Error(`fetch received unexpected status code ${res.status}`);
            }
        },
    };
}
/**
 * Returns a cached layer on top of an AsyncBuffer. For caching slices of a file
 * that are read multiple times, possibly over a network.
 *
 * @param {AsyncBuffer} file file-like object to cache
 * @param {{ minSize?: number }} [options]
 * @returns {AsyncBuffer} cached file-like object
 */
function cachedAsyncBuffer({ byteLength, slice }, { minSize = metadata_js_1.defaultInitialFetchSize } = {}) {
    if (byteLength < minSize) {
        // Cache whole file if it's small
        const buffer = slice(0, byteLength);
        return {
            byteLength,
            async slice(start, end) {
                return (await buffer).slice(start, end);
            },
        };
    }
    const cache = new Map();
    return {
        byteLength,
        /**
         * @param {number} start
         * @param {number} [end]
         * @returns {Awaitable<ArrayBuffer>}
         */
        slice(start, end) {
            const key = cacheKey(start, end, byteLength);
            const cached = cache.get(key);
            if (cached)
                return cached;
            // cache miss, read from file
            const promise = slice(start, end);
            cache.set(key, promise);
            return promise;
        },
    };
}
/**
 * Returns canonical cache key for a byte range 'start,end'.
 * Normalize int-range and suffix-range requests to the same key.
 *
 * @param {number} start start byte of range
 * @param {number} [end] end byte of range, or undefined for suffix range
 * @param {number} [size] size of file, or undefined for suffix range
 * @returns {string}
 */
function cacheKey(start, end, size) {
    if (start < 0) {
        if (end !== undefined)
            throw new Error(`invalid suffix range [${start}, ${end}]`);
        if (size === undefined)
            return `${start},`;
        return `${size + start},${size}`;
    }
    else if (end !== undefined) {
        if (start > end)
            throw new Error(`invalid empty range [${start}, ${end}]`);
        return `${start},${end}`;
    }
    else if (size === undefined) {
        return `${start},`;
    }
    else {
        return `${start},${size}`;
    }
}
/**
 * Flatten a list of lists into a single list.
 *
 * @param {DecodedArray[]} [chunks]
 * @returns {DecodedArray}
 */
function flatten(chunks) {
    if (!chunks)
        return [];
    if (chunks.length === 1)
        return chunks[0];
    /** @type {any[]} */
    const output = [];
    for (const chunk of chunks) {
        concat(output, chunk);
    }
    return output;
}

},
/* plan.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parquetPlan = parquetPlan;
exports.parquetPlanGroups = parquetPlanGroups;
exports.parquetPlanGroup = parquetPlanGroup;
exports.prefetchBloomFilters = prefetchBloomFilters;
exports.prefetchPageIndexes = prefetchPageIndexes;
exports.prefetchAsyncBuffer = prefetchAsyncBuffer;
const bloom_js_1 = __req(11);
const filter_js_1 = __req(10);
const indexes_js_1 = __req(1);
const metadata_js_1 = __req(5);
const schema_js_1 = __req(6);
/**
 * @import {AsyncBuffer, BloomFilter, ByteRange, ChunkPlan, ColumnPageStats, FileMetaData, GroupPlan, PageLocation, PageRanges, ParquetParsers, ParquetQueryFilter, ParquetReadOptions, QueryPlan, RowGroup, SchemaElement, SchemaTree} from '../src/types.js'
 */
// Combine column chunks if less than 2mb
const runLimit = 1 << 21; // 2mb
// When reading selected columns, combine chunks separated by at most this many unrequested bytes.
// Arrow C++ before 18 and Polars write a copy of each column's metadata after its chunk, leaving small gaps.
// Same default as Arrow's CacheOptions hole_size_limit.
const columnGapLimit = 1 << 13; // 8kb
/**
 * Plan which byte ranges to read to satisfy a read request.
 * Metadata must be non-null.
 *
 * @param {ParquetReadOptions & { bloomFiltersByGroup?: Record<string, BloomFilter>[], schemaElements?: Record<string, SchemaElement>, pageRangesByGroup?: (PageRanges | undefined)[], pageLocationsByGroup?: Record<string, PageLocation[]>[] }} options
 * @returns {QueryPlan}
 */
function parquetPlan(options) {
    const { metadata, rowStart = 0, columns, useOffsetIndex = false } = options;
    if (!metadata)
        throw new Error('parquetPlan requires metadata');
    /** @type {GroupPlan[]} */
    const groups = [];
    /** @type {ByteRange[]} */
    const fetches = [];
    /** @type {ByteRange[]} */
    const indexes = [];
    const scanPlan = parquetPlanGroups(options);
    for (const group of scanPlan.groups) {
        const groupPlan = parquetPlanGroup({ ...group, columns, useOffsetIndex });
        groups.push(...groupPlan.groups);
        fetches.push(...groupPlan.fetches);
        indexes.push(...groupPlan.indexes);
    }
    fetches.push(...indexes);
    return { metadata, rowStart, rowEnd: scanPlan.rowEnd, columns, fetches, groups };
}
/**
 * Select physical row-group ranges without planning column reads.
 *
 * @param {ParquetReadOptions & { bloomFiltersByGroup?: Record<string, BloomFilter>[], schemaElements?: Record<string, SchemaElement>, pageRangesByGroup?: (PageRanges | undefined)[], pageLocationsByGroup?: Record<string, PageLocation[]>[] }} options
 * @returns {{groups: {rowGroup: RowGroup, groupIndex: number, groupStart: number, groupRows: number, ranges: PageRanges, pageRanges?: PageRanges, pageLocations?: Record<string, PageLocation[]>}[], rowEnd: number}}
 */
function parquetPlanGroups({ metadata, rowStart = 0, rowEnd = Infinity, columns, filter, filterStrict = true, bloomFiltersByGroup, schemaElements, pageRangesByGroup, pageLocationsByGroup }) {
    if (!metadata)
        throw new Error('parquetPlan requires metadata');
    const schemaTree = (0, metadata_js_1.parquetSchema)(metadata);
    const physicalColumns = (0, schema_js_1.getPhysicalColumns)(schemaTree);
    const elementsByPath = filter ? {
        ...physicalSchemaElements(schemaTree),
        ...schemaElements,
    } : schemaElements;
    const groups = [];
    let groupStart = 0;
    for (let groupIndex = 0; groupIndex < metadata.row_groups.length; groupIndex++) {
        const rowGroup = metadata.row_groups[groupIndex];
        const groupRows = Number(rowGroup.num_rows);
        const groupEnd = groupStart + groupRows;
        if (groupRows > 0 && groupEnd > rowStart && groupStart < rowEnd && !(0, filter_js_1.canSkipRowGroup)({
            rowGroup,
            physicalColumns,
            filter,
            strict: filterStrict,
            bloomFilters: bloomFiltersByGroup === null || bloomFiltersByGroup === void 0 ? void 0 : bloomFiltersByGroup[groupIndex],
            schemaElements: elementsByPath,
        })) {
            const selectStart = Math.max(rowStart - groupStart, 0);
            const selectEnd = Math.min(rowEnd - groupStart, groupRows);
            const pageRanges = pageRangesByGroup === null || pageRangesByGroup === void 0 ? void 0 : pageRangesByGroup[groupIndex];
            const pageLocations = pageLocationsByGroup === null || pageLocationsByGroup === void 0 ? void 0 : pageLocationsByGroup[groupIndex];
            /** @type {PageRanges} */
            let ranges = pageRanges
                ? pageRanges
                    .map(([start, end]) => {
                    /** @type {[number, number]} */
                    const range = [Math.max(start, selectStart), Math.min(end, selectEnd)];
                    return range;
                })
                    .filter(([start, end]) => start < end)
                : [[selectStart, selectEnd]];
            if (ranges.length > 1) {
                const canSplit = rowGroup.columns.every(chunk => {
                    var _a, _b;
                    const columnName = (_a = chunk.meta_data) === null || _a === void 0 ? void 0 : _a.path_in_schema[0];
                    const columnPath = (_b = chunk.meta_data) === null || _b === void 0 ? void 0 : _b.path_in_schema.join('.');
                    if (columns && columnName && !columns.includes(columnName))
                        return true;
                    return !!(chunk.offset_index_offset && chunk.offset_index_length) || !!(columnPath && (pageLocations === null || pageLocations === void 0 ? void 0 : pageLocations[columnPath]));
                });
                ranges = canSplit
                    ? coalesceOverlappingPageRanges(ranges, rowGroup, columns, pageLocations)
                    : [[ranges[0][0], ranges[ranges.length - 1][1]]];
            }
            if (ranges.length) {
                groups.push({ rowGroup, groupIndex, groupStart, groupRows, ranges, pageRanges, pageLocations });
            }
        }
        groupStart = groupEnd;
    }
    return { groups, rowEnd: isFinite(rowEnd) ? rowEnd : groupStart };
}
/**
 * Build byte plans for retained ranges in one row group.
 *
 * @param {object} options
 * @param {RowGroup} options.rowGroup
 * @param {number} options.groupStart
 * @param {number} options.groupRows
 * @param {PageRanges} options.ranges
 * @param {string[]} [options.columns]
 * @param {boolean} [options.useOffsetIndex]
 * @param {PageRanges} [options.pageRanges]
 * @param {Record<string, PageLocation[]>} [options.pageLocations]
 * @returns {{groups: GroupPlan[], fetches: ByteRange[], indexes: ByteRange[]}}
 */
function parquetPlanGroup({ rowGroup, groupStart, groupRows, ranges, columns, useOffsetIndex = false, pageRanges, pageLocations }) {
    /** @type {ChunkPlan[]} */
    const chunks = [];
    /** @type {ByteRange[]} */
    const fetches = [];
    /** @type {ByteRange[]} */
    const indexes = [];
    const narrowed = ranges.length > 1 || ranges[0][0] > 0 || ranges[0][1] < groupRows;
    for (const chunk of rowGroup.columns) {
        const meta = chunk.meta_data;
        if (chunk.file_path)
            throw new Error('parquet file_path not supported');
        if (!meta)
            throw new Error('parquet column metadata is undefined');
        if (columns && !columns.includes(meta.path_in_schema[0]))
            continue;
        const columnOffset = meta.dictionary_page_offset || meta.data_page_offset;
        const startByte = Number(columnOffset);
        const endByte = Number(columnOffset + meta.total_compressed_size);
        const chunkPageLocations = pageLocations === null || pageLocations === void 0 ? void 0 : pageLocations[meta.path_in_schema.join('.')];
        if (chunkPageLocations && narrowed) {
            chunks.push({ columnMetadata: meta, pageLocations: chunkPageLocations, range: { startByte, endByte } });
        }
        else if ((useOffsetIndex || pageRanges) && chunk.offset_index_offset && chunk.offset_index_length && narrowed) {
            const startByte = Number(chunk.offset_index_offset);
            chunks.push({
                columnMetadata: meta,
                offsetIndex: { startByte, endByte: startByte + chunk.offset_index_length },
                range: { startByte: Number(columnOffset), endByte },
            });
        }
        else {
            chunks.push({ columnMetadata: meta, range: { startByte, endByte } });
        }
    }
    /** @type {ByteRange[]} */
    const columnRanges = [];
    /** @type {ByteRange | undefined} */
    let run;
    for (const chunk of chunks) {
        if ('pageLocations' in chunk)
            continue;
        if ('offsetIndex' in chunk) {
            indexes.push(chunk.offsetIndex);
        }
        else if (columns) {
            columnRanges.push(chunk.range);
        }
        else if (run && chunk.range.endByte - run.startByte <= runLimit) {
            run.endByte = chunk.range.endByte;
        }
        else {
            if (run)
                fetches.push(run);
            run = { ...chunk.range };
        }
    }
    if (run)
        fetches.push(run);
    // selected chunks are combined in file order, skipping only small gaps
    fetches.push(...coalesceByteRanges(columnRanges, columnGapLimit, runLimit));
    const groups = ranges.map(([selectStart, selectEnd]) => ({
        chunks,
        rowGroup,
        groupStart,
        groupRows,
        selectStart,
        selectEnd,
    }));
    return { groups, fetches, indexes };
}
/**
 * Merge candidate ranges when any selected column would read an overlapping
 * data page for both ranges. Unknown page layouts are merged conservatively.
 *
 * @param {PageRanges} ranges
 * @param {RowGroup} rowGroup
 * @param {string[] | undefined} columns
 * @param {Record<string, PageLocation[]> | undefined} pageLocations
 * @returns {PageRanges}
 */
function coalesceOverlappingPageRanges(ranges, rowGroup, columns, pageLocations) {
    const selectedPageLayouts = rowGroup.columns
        .filter(chunk => { var _a; return !columns || columns.includes(((_a = chunk.meta_data) === null || _a === void 0 ? void 0 : _a.path_in_schema[0]) || ''); })
        .map(chunk => { var _a; return pageLocations === null || pageLocations === void 0 ? void 0 : pageLocations[((_a = chunk.meta_data) === null || _a === void 0 ? void 0 : _a.path_in_schema.join('.')) || '']; });
    /** @type {PageRanges} */
    const merged = [];
    for (const range of ranges) {
        const last = merged[merged.length - 1];
        const overlapsPage = last && selectedPageLayouts.some(pages => {
            if (!pages)
                return true;
            const lastPages = pagesForRange(last, pages, Number(rowGroup.num_rows));
            const rangePages = pagesForRange(range, pages, Number(rowGroup.num_rows));
            return lastPages[0] <= rangePages[1] && rangePages[0] <= lastPages[1];
        });
        if (last && overlapsPage)
            last[1] = range[1];
        else
            merged.push([...range]);
    }
    return merged;
}
/**
 * Return the inclusive indexes of the first and last pages overlapping a row
 * range. Offset indexes cover every row, so a valid range always finds a page.
 *
 * @param {[number, number]} range
 * @param {PageLocation[]} pages
 * @param {number} groupRows
 * @returns {[number, number]}
 */
function pagesForRange([rangeStart, rangeEnd], pages, groupRows) {
    let first = Infinity;
    let last = -Infinity;
    for (let i = 0; i < pages.length; i++) {
        const pageStart = Number(pages[i].first_row_index);
        const pageEnd = i + 1 < pages.length ? Number(pages[i + 1].first_row_index) : groupRows;
        if (pageEnd > rangeStart && pageStart < rangeEnd) {
            first = Math.min(first, i);
            last = i;
        }
    }
    return [first, last];
}
/**
 * Fetch bloom filters for $eq / $in columns of row groups not already provably
 * skippable by statistics alone. Returns an array indexed by row-group ordinal;
 * each entry maps top-level column name → BloomFilter for any chunk whose
 * bloom filter we were able to parse. Adds one round-trip when at least one
 * bloom filter is fetched; otherwise returns synchronously.
 *
 * @param {object} options
 * @param {AsyncBuffer} options.file
 * @param {FileMetaData} options.metadata
 * @param {ParquetQueryFilter} options.filter
 * @param {boolean} [options.filterStrict]
 * @returns {Promise<Record<string, BloomFilter>[]>}
 */
async function prefetchBloomFilters({ file, metadata, filter, filterStrict = true }) {
    const result = metadata.row_groups.map(() => /** @type {Record<string, BloomFilter>} */ ({}));
    const eligibleCols = (0, bloom_js_1.bloomEligibleColumns)(filter);
    if (eligibleCols.size === 0)
        return result;
    const physicalColumns = (0, schema_js_1.getPhysicalColumns)((0, metadata_js_1.parquetSchema)(metadata));
    /** @type {Promise<void>[]} */
    const tasks = [];
    metadata.row_groups.forEach((rowGroup, rgIdx) => {
        var _a;
        if ((0, filter_js_1.canSkipRowGroup)({ rowGroup, physicalColumns, filter, strict: filterStrict }))
            return;
        for (const colName of eligibleCols) {
            const columnIdx = physicalColumns.indexOf(colName);
            if (columnIdx === -1)
                continue;
            const meta = (_a = rowGroup.columns[columnIdx]) === null || _a === void 0 ? void 0 : _a.meta_data;
            if (!(meta === null || meta === void 0 ? void 0 : meta.bloom_filter_offset) || !meta.bloom_filter_length)
                continue;
            const start = Number(meta.bloom_filter_offset);
            const end = start + meta.bloom_filter_length;
            tasks.push((async () => {
                const buffer = await file.slice(start, end);
                const bloom = (0, bloom_js_1.readBloomFilter)({ view: new DataView(buffer), offset: 0 });
                if (bloom)
                    result[rgIdx][colName] = bloom;
            })());
        }
    });
    if (tasks.length)
        await Promise.all(tasks);
    return result;
}
/**
 * Fetch page indexes (column index + offset index) for filter columns of row
 * groups that survive row-group-level pruning, and compute candidate row
 * ranges per group from the per-page min/max statistics.
 *
 * Returns pageRangesByGroup indexed by row-group ordinal: sorted disjoint
 * [start, end) row ranges (relative to the group) that could match the filter.
 * An empty array means the group provably contains no matching rows; undefined
 * means no page-level information was available for that group.
 * Also returns pageLocationsByGroup, mapping row-group ordinals and physical
 * leaf paths to page locations, so the read path can reuse the parsed offset
 * indexes without refetching them.
 *
 * @param {object} options
 * @param {AsyncBuffer} options.file
 * @param {FileMetaData} options.metadata
 * @param {ParquetQueryFilter} [options.filter]
 * @param {boolean} [options.filterStrict]
 * @param {number} [options.rowStart]
 * @param {number} [options.rowEnd]
 * @param {string[]} [options.columns]
 * @param {Record<string, BloomFilter>[]} [options.bloomFiltersByGroup]
 * @param {Record<string, SchemaElement>} [options.schemaElements]
 * @param {Partial<ParquetParsers>} [options.parsers]
 * @returns {Promise<{pageRangesByGroup: (PageRanges | undefined)[], pageLocationsByGroup: Record<string, PageLocation[]>[]}>}
 */
async function prefetchPageIndexes({ file, metadata, filter, filterStrict = true, rowStart = 0, rowEnd = Infinity, columns, bloomFiltersByGroup, schemaElements, parsers }) {
    /** @type {(PageRanges | undefined)[]} */
    const pageRangesByGroup = metadata.row_groups.map(() => undefined);
    const pageLocationsByGroup = metadata.row_groups.map(() => /** @type {Record<string, PageLocation[]>} */ ({}));
    if (filter && '$nor' in filter && Array.isArray(filter.$nor)) {
        return { pageRangesByGroup, pageLocationsByGroup };
    }
    const filterColumns = (0, filter_js_1.pathsNeededForFilter)(filter);
    if (!filterColumns.length)
        return { pageRangesByGroup, pageLocationsByGroup };
    const schemaTree = (0, metadata_js_1.parquetSchema)(metadata);
    const physicalColumns = (0, schema_js_1.getPhysicalColumns)(schemaTree);
    const elementsByPath = {
        ...physicalSchemaElements(schemaTree),
        ...schemaElements,
    };
    /** @type {ByteRange[]} */
    const indexRanges = [];
    /** @type {((file: AsyncBuffer) => Promise<void>)[]} */
    const indexTasks = [];
    /** @type {{rgIdx: number, groupRows: number, columnPages: Record<string, ColumnPageStats>}[]} */
    const candidateGroups = [];
    let groupStart = 0;
    metadata.row_groups.forEach((rowGroup, rgIdx) => {
        const groupRows = Number(rowGroup.num_rows);
        const groupEnd = groupStart + groupRows;
        const overlaps = groupRows > 0 && groupEnd > rowStart && groupStart < rowEnd;
        groupStart = groupEnd;
        if (!overlaps)
            return;
        if ((0, filter_js_1.canSkipRowGroup)({ rowGroup, physicalColumns, filter, strict: filterStrict, bloomFilters: bloomFiltersByGroup === null || bloomFiltersByGroup === void 0 ? void 0 : bloomFiltersByGroup[rgIdx], schemaElements: elementsByPath }))
            return;
        /** @type {Record<string, ColumnPageStats>} */
        const columnPages = {};
        let columnTaskCount = 0;
        const scheduledOffsetPaths = new Set();
        let hasFilterIndex = false;
        for (const columnName of filterColumns) {
            const columnIdx = physicalColumns.indexOf(columnName);
            if (columnIdx === -1)
                continue;
            const chunk = rowGroup.columns[columnIdx];
            const meta = chunk === null || chunk === void 0 ? void 0 : chunk.meta_data;
            if (!meta)
                continue;
            if (!chunk.column_index_offset || !chunk.column_index_length)
                continue;
            if (!chunk.offset_index_offset || !chunk.offset_index_length)
                continue;
            const element = elementsByPath[columnName];
            if (!element)
                continue;
            hasFilterIndex = true;
            scheduledOffsetPaths.add(columnName);
            const columnIndexStart = Number(chunk.column_index_offset);
            const offsetIndexStart = Number(chunk.offset_index_offset);
            const columnIndexEnd = columnIndexStart + chunk.column_index_length;
            const offsetIndexEnd = offsetIndexStart + chunk.offset_index_length;
            indexRanges.push({ startByte: columnIndexStart, endByte: columnIndexEnd }, { startByte: offsetIndexStart, endByte: offsetIndexEnd });
            columnTaskCount++;
            indexTasks.push(async (prefetchedFile) => {
                const [columnIndexBuffer, offsetIndexBuffer] = await Promise.all([
                    prefetchedFile.slice(columnIndexStart, columnIndexEnd),
                    prefetchedFile.slice(offsetIndexStart, offsetIndexEnd),
                ]);
                const columnIndex = (0, indexes_js_1.readColumnIndex)({ view: new DataView(columnIndexBuffer), offset: 0 }, element, parsers);
                const offsetIndex = (0, indexes_js_1.readOffsetIndex)({ view: new DataView(offsetIndexBuffer), offset: 0 });
                pageLocationsByGroup[rgIdx][columnName] = offsetIndex.page_locations;
                columnPages[columnName] = {
                    minValues: columnIndex.min_values,
                    maxValues: columnIndex.max_values,
                    nullPages: columnIndex.null_pages,
                    nullCounts: columnIndex.null_counts,
                    pageStarts: offsetIndex.page_locations.map(page => Number(page.first_row_index)),
                    element,
                };
            });
        }
        // Candidate ranges are shared by every selected column. Load their offset
        // indexes too so the planner can merge ranges that map to the same coarse
        // page instead of fetching and decoding that page more than once.
        if (hasFilterIndex) {
            for (const chunk of rowGroup.columns) {
                const meta = chunk.meta_data;
                if (!meta)
                    continue;
                const columnName = meta.path_in_schema[0];
                const columnPath = meta.path_in_schema.join('.');
                if (columns && !columns.includes(columnName))
                    continue;
                if (scheduledOffsetPaths.has(columnPath))
                    continue;
                if (!chunk.offset_index_offset || !chunk.offset_index_length)
                    continue;
                scheduledOffsetPaths.add(columnPath);
                const offsetIndexStart = Number(chunk.offset_index_offset);
                const offsetIndexEnd = offsetIndexStart + chunk.offset_index_length;
                indexRanges.push({ startByte: offsetIndexStart, endByte: offsetIndexEnd });
                columnTaskCount++;
                indexTasks.push(async (prefetchedFile) => {
                    const offsetIndexBuffer = await prefetchedFile.slice(offsetIndexStart, offsetIndexEnd);
                    const offsetIndex = (0, indexes_js_1.readOffsetIndex)({ view: new DataView(offsetIndexBuffer), offset: 0 });
                    pageLocationsByGroup[rgIdx][columnPath] = offsetIndex.page_locations;
                });
            }
        }
        if (columnTaskCount) {
            candidateGroups.push({ rgIdx, groupRows, columnPages });
        }
    });
    if (indexTasks.length) {
        const prefetchedFile = prefetchAsyncBuffer(file, { fetches: coalesceByteRanges(indexRanges) });
        await Promise.all(indexTasks.map(task => task(prefetchedFile)));
        for (const { rgIdx, groupRows, columnPages } of candidateGroups) {
            pageRangesByGroup[rgIdx] = (0, filter_js_1.filterPageRanges)(filter, columnPages, groupRows, filterStrict);
        }
    }
    return { pageRangesByGroup, pageLocationsByGroup };
}
/**
 * Merge overlapping or touching byte ranges. By default no bytes are added;
 * pass maxGap to also merge ranges separated by up to maxGap unrequested bytes,
 * as long as the merged range stays within maxSize.
 *
 * @param {ByteRange[]} ranges
 * @param {number} [maxGap]
 * @param {number} [maxSize]
 * @returns {ByteRange[]}
 */
function coalesceByteRanges(ranges, maxGap = 0, maxSize = Infinity) {
    const sorted = ranges
        .map(range => ({ ...range }))
        .sort((a, b) => a.startByte - b.startByte || a.endByte - b.endByte);
    /** @type {ByteRange[]} */
    const merged = [];
    for (const range of sorted) {
        const last = merged[merged.length - 1];
        if (last && range.startByte <= last.endByte + maxGap && Math.max(last.endByte, range.endByte) - last.startByte <= maxSize) {
            last.endByte = Math.max(last.endByte, range.endByte);
        }
        else {
            merged.push(range);
        }
    }
    return merged;
}
/**
 * Build a lookup from physical paths to leaf schema elements.
 *
 * @param {SchemaTree} schemaTree
 * @returns {Record<string, SchemaElement>}
 */
function physicalSchemaElements(schemaTree) {
    /** @type {Record<string, SchemaElement>} */
    const elements = {};
    /** @param {SchemaTree} node */
    function traverse(node) {
        if (node.children.length) {
            for (const child of node.children)
                traverse(child);
        }
        else {
            elements[node.path.join('.')] = node.element;
        }
    }
    traverse(schemaTree);
    return elements;
}
/**
 * Prefetch byte ranges from an AsyncBuffer.
 *
 * @param {AsyncBuffer} file
 * @param {{fetches: ByteRange[]}} options
 * @returns {AsyncBuffer}
 */
function prefetchAsyncBuffer(file, { fetches }) {
    // fetch byte ranges from the file
    const promises = fetches.map(({ startByte, endByte }) => file.slice(startByte, endByte));
    return {
        byteLength: file.byteLength,
        slice(start, end = file.byteLength) {
            // find matching slice
            const index = fetches.findIndex(({ startByte, endByte }) => startByte <= start && end <= endByte);
            if (index < 0) {
                // fallback to direct read
                return file.slice(start, end);
            }
            if (fetches[index].startByte !== start || fetches[index].endByte !== end) {
                // slice a subrange of the prefetch
                const startOffset = start - fetches[index].startByte;
                const endOffset = end - fetches[index].startByte;
                if (promises[index] instanceof Promise) {
                    return promises[index].then(buffer => buffer.slice(startOffset, endOffset));
                }
                else {
                    return promises[index].slice(startOffset, endOffset);
                }
            }
            else {
                return promises[index];
            }
        },
    };
}

},
/* rowgroup.js */ function(module, exports, __req){
"use strict";
/**
 * @import {AsyncColumn, AsyncRowGroup, ChunkPlan, ColumnDecoder, DecodedArray, GroupPlan, PageLocation, ParquetParsers, ParquetReadOptions, QueryPlan, SchemaTree} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRowGroup = readRowGroup;
exports.asyncGroupToRows = asyncGroupToRows;
exports.assembleAsync = assembleAsync;
const assemble_js_1 = __req(16);
const column_js_1 = __req(18);
const convert_js_1 = __req(3);
const indexes_js_1 = __req(1);
const metadata_js_1 = __req(5);
const schema_js_1 = __req(6);
const utils_js_1 = __req(13);
/**
 * Read a row group from a file-like object.
 *
 * @param {ParquetReadOptions} options
 * @param {QueryPlan} plan
 * @param {GroupPlan} groupPlan
 * @returns {AsyncRowGroup} resolves to column data
 */
function readRowGroup(options, { metadata }, groupPlan) {
    /** @type {AsyncColumn[]} */
    const asyncColumns = [];
    // build the schema tree once, not per column chunk
    const schemaTree = (0, metadata_js_1.parquetSchema)(metadata);
    // read column data
    for (const chunk of groupPlan.chunks) {
        const { path_in_schema: pathInSchema } = chunk.columnMetadata;
        const schemaPath = (0, schema_js_1.getTreePath)(schemaTree, pathInSchema);
        const columnDecoder = {
            pathInSchema,
            element: schemaPath[schemaPath.length - 1].element,
            schemaPath,
            ...options,
            ...chunk.columnMetadata,
            // merge after options, so a partial parsers object keeps the defaults
            parsers: { ...convert_js_1.DEFAULT_PARSERS, ...options.parsers },
        };
        const { startByte, endByte } = chunk.range;
        if ('pageLocations' in chunk) {
            // page locations already parsed from the offset index
            asyncColumns.push({
                pathInSchema,
                data: readSelectedPages(options, groupPlan, chunk, chunk.pageLocations, columnDecoder),
            });
        }
        else if ('offsetIndex' in chunk) {
            asyncColumns.push({
                pathInSchema,
                // fetch offset index
                data: Promise.resolve(options.file.slice(chunk.offsetIndex.startByte, chunk.offsetIndex.endByte))
                    .then(arrayBuffer => {
                    const pages = (0, indexes_js_1.readOffsetIndex)({ view: new DataView(arrayBuffer), offset: 0 }).page_locations;
                    return readSelectedPages(options, groupPlan, chunk, pages, columnDecoder);
                }),
            });
        }
        else {
            // full column chunk
            asyncColumns.push({
                pathInSchema,
                data: Promise.resolve(options.file.slice(startByte, endByte))
                    .then(buffer => {
                    const reader = { view: new DataView(buffer), offset: 0 };
                    return (0, column_js_1.readColumn)(reader, groupPlan, columnDecoder, options.onPage);
                }),
            });
        }
    }
    return {
        groupStart: groupPlan.groupStart,
        groupRows: groupPlan.groupRows,
        selectStart: groupPlan.selectStart,
        selectEnd: groupPlan.selectEnd,
        asyncColumns,
    };
}
/**
 * Read only the pages of a column chunk that overlap the group plan's select
 * range [selectStart, selectEnd), using page locations from the offset index.
 *
 * @param {ParquetReadOptions} options
 * @param {GroupPlan} groupPlan
 * @param {ChunkPlan} chunk
 * @param {PageLocation[]} pages
 * @param {ColumnDecoder} columnDecoder
 * @returns {Promise<{data: DecodedArray[], skipped: number}>}
 */
async function readSelectedPages(options, groupPlan, chunk, pages, columnDecoder) {
    const { data_page_offset, dictionary_page_offset } = chunk.columnMetadata;
    const { selectStart, selectEnd } = groupPlan;
    let { startByte, endByte } = chunk.range;
    let skipped = -1;
    // include dictionary if present, handle polars missing dictionary_page_offset
    const hasDict = dictionary_page_offset || data_page_offset < pages[0].offset;
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const pageStart = Number(page.first_row_index);
        const pageEnd = i + 1 < pages.length
            ? Number(pages[i + 1].first_row_index)
            : groupPlan.groupRows; // last page extends to end of row group
        // check if page overlaps with [selectStart, selectEnd)
        if (skipped < 0 && pageEnd > selectStart) {
            startByte = Number(page.offset);
            skipped = pageStart;
        }
        if (pageStart < selectEnd) {
            endByte = Number(page.offset) + page.compressed_page_size;
        }
    }
    if (skipped < 0)
        skipped = 0;
    /** @type {DataView} */
    let view;
    if (hasDict && skipped) {
        // fetch the dictionary page separately from the selected data pages so
        // the skipped leading pages are not transferred
        const dictLength = Number(pages[0].offset) - chunk.range.startByte;
        const [dictBuffer, dataBuffer] = await Promise.all([
            options.file.slice(chunk.range.startByte, Number(pages[0].offset)),
            options.file.slice(startByte, endByte),
        ]);
        // clamp in case the AsyncBuffer returned more bytes than requested
        const combined = new Uint8Array(dictLength + dataBuffer.byteLength);
        combined.set(new Uint8Array(dictBuffer, 0, dictLength));
        combined.set(new Uint8Array(dataBuffer), dictLength);
        view = new DataView(combined.buffer);
    }
    else if (hasDict) {
        // dictionary page is contiguous with the first selected page
        view = new DataView(await options.file.slice(chunk.range.startByte, endByte));
    }
    else {
        view = new DataView(await options.file.slice(startByte, endByte));
    }
    const reader = { view, offset: 0 };
    // adjust row selection for skipped pages
    const adjustedGroupPlan = skipped ? {
        ...groupPlan,
        groupStart: groupPlan.groupStart + skipped,
        selectStart: groupPlan.selectStart - skipped,
        selectEnd: groupPlan.selectEnd - skipped,
    } : groupPlan;
    const { data, skipped: columnSkipped } = (0, column_js_1.readColumn)(reader, adjustedGroupPlan, columnDecoder, options.onPage);
    return {
        data,
        skipped: skipped + columnSkipped,
    };
}
/**
 * @overload
 * @param {AsyncRowGroup} asyncGroup
 * @param {number} selectStart
 * @param {number} selectEnd
 * @param {string[] | undefined} columns
 * @param {'object'} rowFormat
 * @returns {Promise<Record<string, any>[]>} resolves to row data
 */
/**
 * @overload
 * @param {AsyncRowGroup} asyncGroup
 * @param {number} selectStart
 * @param {number} selectEnd
 * @param {string[] | undefined} columns
 * @param {'array'} [rowFormat]
 * @returns {Promise<any[][]>} resolves to row data
 */
/**
 * @param {AsyncRowGroup} asyncGroup
 * @param {number} selectStart
 * @param {number} selectEnd
 * @param {string[] | undefined} columns
 * @param {'object' | 'array'} [rowFormat]
 * @returns {Promise<Record<string, any>[] | any[][]>} resolves to row data
 */
async function asyncGroupToRows({ asyncColumns }, selectStart, selectEnd, columns, rowFormat) {
    // TODO: do it without flatten
    const asyncPages = await Promise.all(asyncColumns.map(column => column.data.then(({ skipped, data }) => ({ skipped, data: (0, utils_js_1.flatten)(data) }))));
    // transpose columns into rows
    const selectCount = selectEnd - selectStart;
    if (rowFormat === 'object') {
        /** @type {Record<string, any>[]} */
        const groupData = Array(selectCount);
        for (let selectRow = 0; selectRow < selectCount; selectRow++) {
            // return each row as an object
            /** @type {Record<string, any>} */
            const rowData = {};
            for (let i = 0; i < asyncColumns.length; i++) {
                const { data, skipped } = asyncPages[i];
                rowData[asyncColumns[i].pathInSchema[0]] = data[selectStart + selectRow - skipped];
            }
            groupData[selectRow] = rowData;
        }
        return groupData;
    }
    // careful mapping of column order for rowFormat: array
    const includedColumnNames = asyncColumns
        .map(child => child.pathInSchema[0])
        .filter(name => !columns || columns.includes(name));
    const columnOrder = columns !== null && columns !== void 0 ? columns : includedColumnNames;
    const columnIndexes = columnOrder.map(name => asyncColumns.findIndex(column => column.pathInSchema[0] === name));
    /** @type {any[][]} */
    const groupData = Array(selectCount);
    for (let selectRow = 0; selectRow < selectCount; selectRow++) {
        // return each row as an array
        const rowData = Array(asyncColumns.length);
        for (let i = 0; i < columnOrder.length; i++) {
            const colIdx = columnIndexes[i];
            if (colIdx < 0)
                throw new Error(`parquet column not found: ${columnOrder[i]}`);
            const { data, skipped } = asyncPages[colIdx];
            rowData[i] = data[selectStart + selectRow - skipped];
        }
        groupData[selectRow] = rowData;
    }
    return groupData;
}
/**
 * Assemble physical columns into top-level columns asynchronously.
 *
 * @param {AsyncRowGroup} asyncRowGroup
 * @param {SchemaTree} schemaTree
 * @param {Partial<ParquetParsers>} [parsers]
 * @returns {AsyncRowGroup}
 */
function assembleAsync(asyncRowGroup, schemaTree, parsers) {
    const { asyncColumns } = asyncRowGroup;
    const allParsers = { ...convert_js_1.DEFAULT_PARSERS, ...parsers };
    /** @type {AsyncColumn[]} */
    const assembled = [];
    for (const child of schemaTree.children) {
        if (child.children.length) {
            const childColumns = asyncColumns.filter(column => column.pathInSchema[0] === child.element.name);
            if (!childColumns.length)
                continue;
            assembled.push({
                pathInSchema: child.path,
                data: (async () => {
                    var _a, _b;
                    // collect subcolumn data — Promise.all observes every rejection so
                    // a sibling failure cannot leak as an unhandledRejection
                    const resolved = await Promise.all(childColumns.map(c => c.data));
                    /** @type {Map<string, DecodedArray>} */
                    const subcolumnData = new Map();
                    const flattened = resolved.map(({ data }) => (0, utils_js_1.flatten)(data));
                    // Physical pages can cover far more rows than the requested range.
                    // Clip before nested/VARIANT assembly, which expands compact binary
                    // values into independent object graphs and strings for every row.
                    const skipped = Math.max((_a = asyncRowGroup.selectStart) !== null && _a !== void 0 ? _a : 0, ...resolved.map(result => result.skipped));
                    const end = Math.min((_b = asyncRowGroup.selectEnd) !== null && _b !== void 0 ? _b : Infinity, ...resolved.map((result, i) => result.skipped + flattened[i].length));
                    for (let i = 0; i < childColumns.length; i++) {
                        // Offset-index reads may start each physical child at a different
                        // page boundary. Align them to their common absolute row range.
                        const start = skipped - resolved[i].skipped;
                        const length = Math.max(0, end - skipped);
                        subcolumnData.set(childColumns[i].pathInSchema.join('.'), flattened[i].slice(start, start + length));
                    }
                    // assemble the column
                    (0, assemble_js_1.assembleNested)(subcolumnData, child, allParsers);
                    const assembled = subcolumnData.get(child.element.name);
                    if (!assembled)
                        throw new Error('parquet column data not assembled');
                    return { data: [assembled], skipped };
                })(),
            });
        }
        else {
            // leaf node, return the column
            const asyncColumn = asyncColumns.find(column => column.pathInSchema[0] === child.element.name);
            if (asyncColumn)
                assembled.push(asyncColumn);
        }
    }
    return { ...asyncRowGroup, asyncColumns: assembled };
}

},
/* assemble.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assembleLists = assembleLists;
exports.assembleNested = assembleNested;
const schema_js_1 = __req(6);
const variant_js_1 = __req(17);
/**
 * Reconstructs a complex nested structure from flat arrays of values and
 * definition and repetition levels, according to Dremel encoding.
 *
 * @param {any[]} output
 * @param {number[] | undefined} definitionLevels
 * @param {number[]} repetitionLevels
 * @param {DecodedArray} values
 * @param {SchemaTree[]} schemaPath
 * @returns {DecodedArray}
 */
function assembleLists(output, definitionLevels, repetitionLevels, values, schemaPath) {
    const maxDefinitionLevel = (0, schema_js_1.getMaxDefinitionLevel)(schemaPath);
    // If no def/rep levels, synthesize def levels at max
    if (!(definitionLevels === null || definitionLevels === void 0 ? void 0 : definitionLevels.length) && !repetitionLevels.length) {
        if (!maxDefinitionLevel || !values.length)
            return values;
        definitionLevels = new Array(values.length).fill(maxDefinitionLevel);
    }
    const n = (definitionLevels === null || definitionLevels === void 0 ? void 0 : definitionLevels.length) || repetitionLevels.length;
    const repetitionPath = schemaPath.map(({ element }) => element.repetition_type);
    let valueIndex = 0;
    // Track state of nested structures
    const containerStack = [output];
    let currentContainer = output;
    let currentDepth = 0; // schema depth
    let currentDefLevel = 0; // list depth
    let currentRepLevel = 0;
    if (repetitionLevels[0]) {
        // continue previous row
        while (currentDepth < repetitionPath.length - 2 && currentRepLevel < repetitionLevels[0]) {
            currentDepth++;
            if (repetitionPath[currentDepth] !== 'REQUIRED') {
                // go into last list
                currentContainer = currentContainer.at(-1);
                containerStack.push(currentContainer);
                currentDefLevel++;
            }
            if (repetitionPath[currentDepth] === 'REPEATED')
                currentRepLevel++;
        }
    }
    for (let i = 0; i < n; i++) {
        // assert(currentDefLevel === containerStack.length - 1)
        const def = (definitionLevels === null || definitionLevels === void 0 ? void 0 : definitionLevels.length) ? definitionLevels[i] : maxDefinitionLevel;
        const rep = repetitionLevels[i];
        // Pop up to start of rep level
        while (currentDepth && (rep < currentRepLevel || repetitionPath[currentDepth] !== 'REPEATED')) {
            if (repetitionPath[currentDepth] !== 'REQUIRED') {
                containerStack.pop();
                currentDefLevel--;
            }
            if (repetitionPath[currentDepth] === 'REPEATED')
                currentRepLevel--;
            currentDepth--;
        }
        // @ts-expect-error won't be empty
        currentContainer = containerStack.at(-1);
        // Go deeper to end of definition level
        while ((currentDepth < repetitionPath.length - 2 || repetitionPath[currentDepth + 1] === 'REPEATED') &&
            (currentDefLevel < def || repetitionPath[currentDepth + 1] === 'REQUIRED')) {
            currentDepth++;
            if (repetitionPath[currentDepth] !== 'REQUIRED') {
                /** @type {any[]} */
                const newList = [];
                currentContainer.push(newList);
                currentContainer = newList;
                containerStack.push(newList);
                currentDefLevel++;
            }
            if (repetitionPath[currentDepth] === 'REPEATED')
                currentRepLevel++;
        }
        // Add value or null based on definition level
        if (def === maxDefinitionLevel) {
            // assert(currentDepth === maxDefinitionLevel || currentDepth === repetitionPath.length - 2)
            currentContainer.push(values[valueIndex++]);
        }
        else if (currentDepth === repetitionPath.length - 2) {
            currentContainer.push(null);
        }
        else {
            currentContainer.push([]);
        }
    }
    // Handle edge cases for empty inputs or single-level data
    if (!output.length) {
        // return max definition level of nested lists
        for (let i = 0; i < maxDefinitionLevel; i++) {
            /** @type {any[]} */
            const newList = [];
            currentContainer.push(newList);
            currentContainer = newList;
        }
    }
    return output;
}
/**
 * Assemble a nested structure from subcolumn data.
 *
 * @param {Map<string, DecodedArray>} subcolumnData
 * @param {SchemaTree} schema top-level schema element
 * @param {ParquetParsers} parsers
 * @param {number} [depth] depth of nested structure
 */
function assembleNested(subcolumnData, schema, parsers, depth = 0) {
    var _a;
    const path = schema.path.join('.');
    const optional = schema.element.repetition_type === 'OPTIONAL';
    const nextDepth = optional ? depth + 1 : depth;
    if ((0, schema_js_1.isListLike)(schema)) {
        let sublist = schema.children[0];
        let subDepth = nextDepth;
        if (sublist.children.length === 1) {
            sublist = sublist.children[0];
            subDepth++;
        }
        assembleNested(subcolumnData, sublist, parsers, subDepth);
        const subcolumn = sublist.path.join('.');
        const values = subcolumnData.get(subcolumn);
        if (!values)
            throw new Error('parquet list column missing values');
        if (optional)
            flattenAtDepth(values, depth);
        subcolumnData.set(path, values);
        subcolumnData.delete(subcolumn);
        return;
    }
    if ((0, schema_js_1.isMapLike)(schema)) {
        const mapName = schema.children[0].element.name;
        // Assemble keys and values
        assembleNested(subcolumnData, schema.children[0].children[0], parsers, nextDepth + 1);
        assembleNested(subcolumnData, schema.children[0].children[1], parsers, nextDepth + 1);
        const keys = subcolumnData.get(`${path}.${mapName}.key`);
        const values = subcolumnData.get(`${path}.${mapName}.value`);
        if (!keys)
            throw new Error('parquet map column missing keys');
        if (!values)
            throw new Error('parquet map column missing values');
        if (keys.length !== values.length) {
            throw new Error('parquet map column key/value length mismatch');
        }
        const out = assembleMaps(keys, values, nextDepth);
        if (optional)
            flattenAtDepth(out, depth);
        subcolumnData.delete(`${path}.${mapName}.key`);
        subcolumnData.delete(`${path}.${mapName}.value`);
        subcolumnData.set(path, out);
        return;
    }
    // Struct-like column
    if (schema.children.length) {
        // construct a meta struct and then invert
        const invertDepth = schema.element.repetition_type === 'REQUIRED' ? depth : depth + 1;
        /** @type {Record<string, any>} */
        const struct = {};
        for (const child of schema.children) {
            assembleNested(subcolumnData, child, parsers, invertDepth);
            const childData = subcolumnData.get(child.path.join('.'));
            if (!childData)
                throw new Error('parquet struct missing child data');
            struct[child.element.name] = childData;
        }
        // remove children
        for (const child of schema.children) {
            subcolumnData.delete(child.path.join('.'));
        }
        // invert struct by depth
        let inverted = invertStruct(struct, invertDepth);
        if (((_a = schema.element.logical_type) === null || _a === void 0 ? void 0 : _a.type) === 'VARIANT') {
            inverted = (0, variant_js_1.decodeVariantColumn)(inverted, parsers);
        }
        if (optional)
            flattenAtDepth(inverted, depth);
        subcolumnData.set(path, inverted);
    }
}
/**
 * @import {DecodedArray, ParquetParsers, SchemaTree} from '../src/types.js'
 * @param {DecodedArray} arr
 * @param {number} depth
 */
function flattenAtDepth(arr, depth) {
    for (let i = 0; i < arr.length; i++) {
        if (depth) {
            flattenAtDepth(arr[i], depth - 1);
        }
        else {
            arr[i] = arr[i][0];
        }
    }
}
/**
 * @param {DecodedArray} keys
 * @param {DecodedArray} values
 * @param {number} depth
 * @returns {any[]}
 */
function assembleMaps(keys, values, depth) {
    const out = [];
    for (let i = 0; i < keys.length; i++) {
        if (depth) {
            out.push(assembleMaps(keys[i], values[i], depth - 1)); // go deeper
        }
        else {
            if (keys[i]) {
                /** @type {Record<string, any>} */
                const obj = {};
                for (let j = 0; j < keys[i].length; j++) {
                    const value = values[i][j];
                    obj[keys[i][j]] = value === undefined ? null : value;
                }
                out.push(obj);
            }
            else {
                out.push(undefined);
            }
        }
    }
    return out;
}
/**
 * Invert a struct-like object by depth.
 *
 * @param {Record<string, any[]>} struct
 * @param {number} depth
 * @returns {any[]}
 */
function invertStruct(struct, depth) {
    var _a;
    const keys = Object.keys(struct);
    const length = (_a = struct[keys[0]]) === null || _a === void 0 ? void 0 : _a.length;
    const out = [];
    for (let i = 0; i < length; i++) {
        /** @type {Record<string, any>} */
        const obj = {};
        for (const key of keys) {
            if (struct[key].length !== length)
                throw new Error('parquet struct parsing error');
            obj[key] = struct[key][i];
        }
        if (depth) {
            out.push(invertStruct(obj, depth - 1)); // deeper
        }
        else {
            out.push(obj);
        }
    }
    return out;
}

},
/* variant.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeVariantColumn = decodeVariantColumn;
const convert_js_1 = __req(3);
/**
 * @import {DataReader, ParquetParsers, VariantMetadata} from '../src/types.js'
 */
const decoder = new TextDecoder();
/** @type {WeakMap<object, Map<string, VariantMetadata>>} */
const metadataCache = new WeakMap();
/**
 * Recursively decode variant structs into native values.
 *
 * @param {any} value
 * @param {ParquetParsers} [parsers]
 * @returns {any}
 */
function decodeVariantColumn(value, parsers = convert_js_1.DEFAULT_PARSERS) {
    if (Array.isArray(value)) {
        return value.map(entry => decodeVariantColumn(entry, parsers));
    }
    if (typeof value !== 'object')
        return value;
    if ('metadata' in value) {
        const metadata = parseVariantMetadata(value.metadata);
        // Decode shredded fields from typed_value
        const shreddedFields = value.typed_value && decodeTypedValue(value.typed_value, metadata, parsers);
        // Decode binary value (may contain additional fields for partially shredded objects)
        const binaryValue = value.value && readVariant(makeReader(value.value), metadata, parsers);
        // Merge shredded and binary values for partially shredded objects
        if (shreddedFields && binaryValue) {
            return { ...binaryValue, ...shreddedFields };
        }
        return shreddedFields !== null && shreddedFields !== void 0 ? shreddedFields : binaryValue;
    }
    return value;
}
/**
 * Decode a shredded variant typed_value field.
 *
 * @param {any} typedValue
 * @param {VariantMetadata} metadata
 * @param {ParquetParsers} parsers
 * @returns {any}
 */
function decodeTypedValue(typedValue, metadata, parsers) {
    if (typedValue instanceof Date)
        return typedValue;
    // Handle {typed_value, value} wrapper - unwrap and recurse
    if (typedValue && typeof typedValue === 'object' && !Array.isArray(typedValue) && !(typedValue instanceof Uint8Array)) {
        if ('typed_value' in typedValue && typedValue.typed_value !== null && typedValue.typed_value !== undefined) {
            return decodeTypedValue(typedValue.typed_value, metadata, parsers);
        }
        if ('value' in typedValue && typedValue.value instanceof Uint8Array) {
            return readVariant(makeReader(typedValue.value), metadata, parsers);
        }
        if ('typed_value' in typedValue || 'value' in typedValue) {
            // both null/missing → field is null
            return null;
        }
        // Shredded object: each field value gets decoded
        /** @type {Record<string, any>} */
        const result = {};
        for (const [key, field] of Object.entries(typedValue)) {
            if (!metadata.dictionary.includes(key))
                continue;
            result[key] = decodeTypedValue(field, metadata, parsers);
        }
        return result;
    }
    // Uint8Array: decode as binary variant
    if (typedValue instanceof Uint8Array) {
        return readVariant(makeReader(typedValue), metadata, parsers);
    }
    // Arrays
    if (Array.isArray(typedValue)) {
        return typedValue.map(element => decodeTypedValue(element, metadata, parsers));
    }
    return typedValue;
}
/**
 * @param {Uint8Array} bytes
 * @returns {DataReader}
 */
function makeReader(bytes) {
    return { view: new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), offset: 0 };
}
/**
 * Parse and cache variant metadata dictionary.
 *
 * @param {Uint8Array} bytes
 * @returns {VariantMetadata}
 */
function parseVariantMetadata(bytes) {
    let bufferCache = metadataCache.get(bytes.buffer);
    if (!bufferCache) {
        bufferCache = new Map();
        metadataCache.set(bytes.buffer, bufferCache);
    }
    const key = `${bytes.byteOffset}:${bytes.byteLength}`;
    const cached = bufferCache.get(key);
    if (cached)
        return cached;
    const reader = makeReader(bytes);
    const header = reader.view.getUint8(reader.offset++);
    const version = header & 0x0f;
    if (version !== 1)
        throw new Error(`parquet unsupported variant metadata version: ${version}`);
    const sorted = (header >> 4 & 0x1) === 1;
    const offsetSize = (header >> 6 & 0x3) + 1;
    const dictionarySize = readUnsigned(reader, offsetSize);
    const offsets = new Array(dictionarySize + 1);
    for (let i = 0; i < offsets.length; i++) {
        offsets[i] = readUnsigned(reader, offsetSize);
    }
    const base = reader.offset;
    const dictionary = new Array(dictionarySize);
    for (let i = 0; i < dictionarySize; i++) {
        const start = offsets[i];
        const end = offsets[i + 1];
        const strBytes = new Uint8Array(bytes.buffer, bytes.byteOffset + base + start, end - start);
        dictionary[i] = decoder.decode(strBytes);
    }
    const metadata = { dictionary, sorted };
    bufferCache.set(key, metadata);
    return metadata;
}
/**
 * @param {DataReader} reader
 * @param {number} byteWidth
 * @returns {number}
 */
function readUnsigned(reader, byteWidth) {
    let value = 0;
    for (let i = 0; i < byteWidth; i++) {
        value |= reader.view.getUint8(reader.offset + i) << i * 8;
    }
    reader.offset += byteWidth;
    return value;
}
/**
 * @param {DataReader} reader
 * @param {VariantMetadata} metadata
 * @param {ParquetParsers} parsers
 * @returns {any}
 */
function readVariant(reader, metadata, parsers) {
    const typeByte = reader.view.getUint8(reader.offset++);
    const basicType = typeByte & 0x3;
    const header = typeByte >> 2;
    if (basicType === 0)
        return readVariantPrimitive(reader, header, parsers);
    if (basicType === 2)
        return readVariantObject(reader, header, metadata, parsers);
    if (basicType === 3)
        return readVariantArray(reader, header, metadata, parsers);
    // else short string
    const bytes = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, header);
    reader.offset += header;
    return decoder.decode(bytes);
}
/**
 * @param {DataReader} reader
 * @param {number} typeId
 * @param {ParquetParsers} parsers
 * @returns {any}
 */
function readVariantPrimitive(reader, typeId, parsers) {
    switch (typeId) {
        case 0: return null;
        case 1: return true;
        case 2: return false;
        case 3: {
            const value = reader.view.getInt8(reader.offset);
            reader.offset += 1;
            return value;
        }
        case 4: {
            const value = reader.view.getInt16(reader.offset, true);
            reader.offset += 2;
            return value;
        }
        case 5: {
            const value = reader.view.getInt32(reader.offset, true);
            reader.offset += 4;
            return value;
        }
        case 6: {
            const value = reader.view.getBigInt64(reader.offset, true);
            reader.offset += 8;
            return value;
        }
        case 7: {
            const value = reader.view.getFloat64(reader.offset, true);
            reader.offset += 8;
            return value;
        }
        case 8:
            return readVariantDecimal(reader, 4);
        case 9:
            return readVariantDecimal(reader, 8);
        case 10:
            return readVariantDecimal(reader, 16);
        case 11: {
            const value = reader.view.getInt32(reader.offset, true);
            reader.offset += 4;
            return parsers.dateFromDays(value);
        }
        case 12: // timestamp_micros (utc)
        case 13: { // timestamp_micros_ntz (no timezone)
            const value = reader.view.getBigInt64(reader.offset, true);
            reader.offset += 8;
            return parsers.timestampFromMicroseconds(value);
        }
        case 14: {
            const value = reader.view.getFloat32(reader.offset, true);
            reader.offset += 4;
            return value;
        }
        case 15:
            return readVariantBinary(reader);
        case 16: {
            const bytes = readVariantBinary(reader);
            return decoder.decode(bytes);
        }
        case 17: {
            // time: microseconds since midnight
            const value = reader.view.getBigInt64(reader.offset, true);
            reader.offset += 8;
            return value;
        }
        case 18: // timestamp_nanos (utc)
        case 19: { // timestamp_nanos_ntz (no timezone)
            const value = reader.view.getBigInt64(reader.offset, true);
            reader.offset += 8;
            return parsers.timestampFromNanoseconds(value);
        }
        case 20: {
            const bytes = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, 16);
            reader.offset += 16;
            const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
            return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        }
        default:
            throw new Error(`parquet unsupported variant primitive type: ${typeId}`);
    }
}
/**
 * @param {DataReader} reader
 * @param {number} header
 * @param {VariantMetadata} metadata
 * @param {ParquetParsers} parsers
 * @returns {Record<string, any>}
 */
function readVariantObject(reader, header, metadata, parsers) {
    const offsetWidth = (header & 0x3) + 1;
    const idWidth = (header >> 2 & 0x3) + 1;
    const isLarge = header >> 4 & 0x1;
    const numElements = isLarge ? readUnsigned(reader, 4) : reader.view.getUint8(reader.offset++);
    /** @type {number[]} */
    const fieldIds = new Array(numElements);
    for (let i = 0; i < numElements; i++) {
        fieldIds[i] = readUnsigned(reader, idWidth);
    }
    const offsets = new Array(numElements + 1);
    for (let i = 0; i < offsets.length; i++) {
        offsets[i] = readUnsigned(reader, offsetWidth);
    }
    /** @type {Record<string, any>} */
    const out = {};
    for (let i = 0; i < numElements; i++) {
        const key = metadata.dictionary[fieldIds[i]];
        // Read value at the given offset
        const valueReader = {
            view: reader.view,
            offset: reader.offset + offsets[i],
        };
        out[key] = readVariant(valueReader, metadata, parsers);
    }
    reader.offset += offsets[offsets.length - 1];
    return out;
}
/**
 * @param {DataReader} reader
 * @param {number} header
 * @param {VariantMetadata} metadata
 * @param {ParquetParsers} parsers
 * @returns {any[]}
 */
function readVariantArray(reader, header, metadata, parsers) {
    const fieldOffsetSize = header & 0x3;
    const isLarge = header >> 2 & 0x1;
    const offsetWidth = fieldOffsetSize + 1;
    const numElements = readUnsigned(reader, isLarge ? 4 : 1);
    const offsets = new Array(numElements + 1);
    for (let i = 0; i < offsets.length; i++) {
        offsets[i] = readUnsigned(reader, offsetWidth);
    }
    const valuesStart = reader.offset;
    const result = new Array(numElements);
    for (let i = 0; i < numElements; i++) {
        const valueReader = {
            view: reader.view,
            offset: valuesStart + offsets[i],
        };
        result[i] = readVariant(valueReader, metadata, parsers);
    }
    reader.offset = valuesStart + offsets[offsets.length - 1];
    return result;
}
/**
 * @param {DataReader} reader
 * @param {number} width
 * @returns {number}
 */
function readVariantDecimal(reader, width) {
    const scale = reader.view.getUint8(reader.offset);
    reader.offset += 1;
    let unscaled;
    if (width === 4) {
        unscaled = BigInt(reader.view.getInt32(reader.offset, true));
        reader.offset += 4;
    }
    else if (width === 8) {
        unscaled = reader.view.getBigInt64(reader.offset, true);
        reader.offset += 8;
    }
    else {
        const low = reader.view.getBigUint64(reader.offset, true);
        const high = reader.view.getBigInt64(reader.offset + 8, true);
        unscaled = high << 64n | low;
        reader.offset += 16;
    }
    return Number(unscaled) * 10 ** -scale;
}
/**
 * @param {DataReader} reader
 * @returns {Uint8Array}
 */
function readVariantBinary(reader) {
    const length = reader.view.getUint32(reader.offset, true);
    reader.offset += 4;
    const bytes = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, length);
    reader.offset += length;
    return bytes;
}

},
/* column.js */ function(module, exports, __req){
"use strict";
/**
 * @import {ColumnDecoder, DataReader, DecodedArray, PageHeader, PageResult, RowGroupSelect, Statistics, SubColumnData} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readColumn = readColumn;
exports.readPage = readPage;
exports.parquetHeader = parquetHeader;
const assemble_js_1 = __req(16);
const constants_js_1 = __req(2);
const convert_js_1 = __req(3);
const datapage_js_1 = __req(19);
const plain_js_1 = __req(23);
const schema_js_1 = __req(6);
const thrift_js_1 = __req(7);
/**
 * Parse column data from a buffer.
 *
 * @param {DataReader} reader
 * @param {RowGroupSelect} rowGroupSelect row group selection
 * @param {ColumnDecoder} columnDecoder column decoder params
 * @param {(chunk: SubColumnData) => void} [onPage] callback for each page
 * @returns {{ data: DecodedArray[], skipped: number }}
 */
function readColumn(reader, { groupStart, selectStart, selectEnd }, columnDecoder, onPage) {
    const { pathInSchema, schemaPath } = columnDecoder;
    const isFlat = (0, schema_js_1.isFlatColumn)(schemaPath);
    /** @type {DecodedArray[]} */
    const chunks = [];
    /** @type {DecodedArray | undefined} */
    let dictionary = undefined;
    /** @type {DecodedArray | undefined} */
    let lastChunk = undefined;
    let rowCount = 0;
    let skipped = 0;
    const emitLastChunk = onPage && (() => {
        lastChunk && onPage({
            pathInSchema,
            columnData: lastChunk,
            rowStart: groupStart + rowCount - lastChunk.length,
            rowEnd: groupStart + rowCount,
        });
    });
    while (isFlat ? rowCount < selectEnd : reader.offset < reader.view.byteLength - 1) {
        if (reader.offset >= reader.view.byteLength - 1)
            break; // end of reader
        // read page header
        const header = parquetHeader(reader);
        if (header.type === 'DICTIONARY_PAGE') {
            const { data } = readPage(reader, header, columnDecoder, dictionary, undefined, 0);
            if (data)
                dictionary = (0, convert_js_1.convert)(data, columnDecoder);
        }
        else {
            const lastChunkLength = (lastChunk === null || lastChunk === void 0 ? void 0 : lastChunk.length) || 0;
            const result = readPage(reader, header, columnDecoder, dictionary, lastChunk, selectStart - rowCount);
            if (result.skipped) {
                // skipped page - just advance row count, don't add to chunks
                if (!chunks.length) {
                    skipped += result.skipped;
                }
                rowCount += result.skipped;
            }
            else if (result.data && lastChunk === result.data) {
                // continued from previous page
                rowCount += result.data.length - lastChunkLength;
            }
            else if (result.data && result.data.length) {
                emitLastChunk === null || emitLastChunk === void 0 ? void 0 : emitLastChunk();
                chunks.push(result.data);
                rowCount += result.data.length;
                lastChunk = result.data;
            }
        }
    }
    emitLastChunk === null || emitLastChunk === void 0 ? void 0 : emitLastChunk();
    return { data: chunks, skipped };
}
/**
 * Read a page (data or dictionary) from a buffer.
 *
 * @param {DataReader} reader
 * @param {PageHeader} header
 * @param {ColumnDecoder} columnDecoder
 * @param {DecodedArray | undefined} dictionary
 * @param {DecodedArray | undefined} previousChunk
 * @param {number} pageStart skip this many rows in the page
 * @returns {PageResult}
 */
function readPage(reader, header, columnDecoder, dictionary, previousChunk, pageStart) {
    const { type, element, schemaPath, codec, compressors } = columnDecoder;
    // read compressed_page_size bytes
    const compressedBytes = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, header.compressed_page_size);
    reader.offset += header.compressed_page_size;
    // parse page data by type
    if (header.type === 'DATA_PAGE') {
        const daph = header.data_page_header;
        if (!daph)
            throw new Error('parquet data page header is undefined');
        // skip unnecessary non-nested pages
        if (pageStart > daph.num_values && (0, schema_js_1.isFlatColumn)(schemaPath)) {
            return { skipped: daph.num_values };
        }
        const page = (0, datapage_js_1.decompressPage)(compressedBytes, Number(header.uncompressed_page_size), codec, compressors);
        const { definitionLevels, repetitionLevels, dataPage } = (0, datapage_js_1.readDataPage)(page, daph, columnDecoder);
        // assert(!daph.statistics?.null_count || daph.statistics.null_count === BigInt(daph.num_values - dataPage.length))
        // convert types, dereference dictionary, and assemble lists
        const values = (0, convert_js_1.convertWithDictionary)(dataPage, dictionary, daph.encoding, columnDecoder);
        const output = Array.isArray(previousChunk) ? previousChunk : [];
        const assembled = (0, assemble_js_1.assembleLists)(output, definitionLevels, repetitionLevels, values, schemaPath);
        return { skipped: 0, data: assembled };
    }
    else if (header.type === 'DATA_PAGE_V2') {
        const daph2 = header.data_page_header_v2;
        if (!daph2)
            throw new Error('parquet data page header v2 is undefined');
        // skip unnecessary pages
        if (pageStart > daph2.num_rows) {
            return { skipped: daph2.num_rows };
        }
        const { definitionLevels, repetitionLevels, dataPage } = (0, datapage_js_1.readDataPageV2)(compressedBytes, header, columnDecoder);
        // convert types, dereference dictionary, and assemble lists
        const values = (0, convert_js_1.convertWithDictionary)(dataPage, dictionary, daph2.encoding, columnDecoder);
        const output = Array.isArray(previousChunk) ? previousChunk : [];
        const assembled = (0, assemble_js_1.assembleLists)(output, definitionLevels, repetitionLevels, values, schemaPath);
        return { skipped: 0, data: assembled };
    }
    else if (header.type === 'DICTIONARY_PAGE') {
        const diph = header.dictionary_page_header;
        if (!diph)
            throw new Error('parquet dictionary page header is undefined');
        const page = (0, datapage_js_1.decompressPage)(compressedBytes, Number(header.uncompressed_page_size), codec, compressors);
        const reader = { view: new DataView(page.buffer, page.byteOffset, page.byteLength), offset: 0 };
        const dictArray = (0, plain_js_1.readPlain)(reader, type, diph.num_values, element.type_length);
        return { skipped: 0, data: dictArray };
    }
    else {
        throw new Error(`parquet unsupported page type: ${header.type}`);
    }
}
/**
 * Read a page header from a buffer, leaving the reader at the start of the page data.
 *
 * @param {DataReader} reader
 * @returns {PageHeader}
 */
function parquetHeader(reader) {
    const header = (0, thrift_js_1.deserializeTCompactProtocol)(reader);
    // Parse parquet header from thrift data
    const type = constants_js_1.PageTypes[header.field_1];
    const uncompressed_page_size = header.field_2;
    const compressed_page_size = header.field_3;
    const crc = header.field_4;
    const data_page_header = header.field_5 && {
        num_values: header.field_5.field_1,
        encoding: constants_js_1.Encodings[header.field_5.field_2],
        definition_level_encoding: constants_js_1.Encodings[header.field_5.field_3],
        repetition_level_encoding: constants_js_1.Encodings[header.field_5.field_4],
        statistics: pageStatistics(header.field_5.field_5),
    };
    const index_page_header = header.field_6;
    const dictionary_page_header = header.field_7 && {
        num_values: header.field_7.field_1,
        encoding: constants_js_1.Encodings[header.field_7.field_2],
        is_sorted: header.field_7.field_3,
    };
    const data_page_header_v2 = header.field_8 && {
        num_values: header.field_8.field_1,
        num_nulls: header.field_8.field_2,
        num_rows: header.field_8.field_3,
        encoding: constants_js_1.Encodings[header.field_8.field_4],
        definition_levels_byte_length: header.field_8.field_5,
        repetition_levels_byte_length: header.field_8.field_6,
        is_compressed: header.field_8.field_7 === undefined ? true : header.field_8.field_7, // default true
        statistics: pageStatistics(header.field_8.field_8),
    };
    return {
        type,
        uncompressed_page_size,
        compressed_page_size,
        crc,
        data_page_header,
        index_page_header,
        dictionary_page_header,
        data_page_header_v2,
    };
}
/**
 * @param {any} stats thrift Statistics struct
 * @returns {Statistics | undefined}
 */
function pageStatistics(stats) {
    return stats && {
        max: stats.field_1,
        min: stats.field_2,
        null_count: stats.field_3,
        distinct_count: stats.field_4,
        max_value: stats.field_5,
        min_value: stats.field_6,
        is_max_value_exact: stats.field_7,
        is_min_value_exact: stats.field_8,
    };
}

},
/* datapage.js */ function(module, exports, __req){
"use strict";
/**
 * @import {ColumnDecoder, CompressionCodec, Compressors, DataPage, DataPageHeader, DataPageHeaderV2, DataReader, DecodedArray, PageHeader, SchemaTree} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDataPage = readDataPage;
exports.decompressPage = decompressPage;
exports.readDataPageV2 = readDataPageV2;
const alp_js_1 = __req(20);
const delta_js_1 = __req(21);
const encoding_js_1 = __req(22);
const plain_js_1 = __req(23);
const schema_js_1 = __req(6);
const snappy_js_1 = __req(24);
/**
 * Read a data page from uncompressed reader.
 *
 * @param {Uint8Array} bytes raw page data (should already be decompressed)
 * @param {DataPageHeader} daph data page header
 * @param {ColumnDecoder} columnDecoder
 * @returns {DataPage} definition levels, repetition levels, and array of values
 */
function readDataPage(bytes, daph, { type, element, schemaPath }) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const reader = { view, offset: 0 };
    /** @type {DecodedArray} */
    let dataPage;
    // repetition and definition levels
    const repetitionLevels = readRepetitionLevels(reader, daph, schemaPath);
    // assert(!repetitionLevels.length || repetitionLevels.length === daph.num_values)
    const { definitionLevels, numNulls } = readDefinitionLevels(reader, daph, schemaPath);
    // assert(!definitionLevels.length || definitionLevels.length === daph.num_values)
    // read values based on encoding
    const nValues = daph.num_values - numNulls;
    if (daph.encoding === 'PLAIN') {
        dataPage = (0, plain_js_1.readPlain)(reader, type, nValues, element.type_length);
    }
    else if (daph.encoding === 'PLAIN_DICTIONARY' ||
        daph.encoding === 'RLE_DICTIONARY' ||
        daph.encoding === 'RLE') {
        const bitWidth = type === 'BOOLEAN' ? 1 : view.getUint8(reader.offset++);
        if (bitWidth) {
            dataPage = new Array(nValues);
            if (type === 'BOOLEAN') {
                (0, encoding_js_1.readRleBitPackedHybrid)(reader, bitWidth, dataPage);
                dataPage = dataPage.map(x => !!x); // convert to boolean
            }
            else {
                // assert(daph.encoding.endsWith('_DICTIONARY'))
                (0, encoding_js_1.readRleBitPackedHybrid)(reader, bitWidth, dataPage, view.byteLength - reader.offset);
            }
        }
        else {
            dataPage = new Uint8Array(nValues); // nValue zeroes
        }
    }
    else if (daph.encoding === 'BYTE_STREAM_SPLIT') {
        dataPage = (0, encoding_js_1.byteStreamSplit)(reader, nValues, type, element.type_length);
    }
    else if (daph.encoding === 'ALP') {
        dataPage = (0, alp_js_1.alpDecode)(reader, nValues, type);
    }
    else if (daph.encoding === 'DELTA_BINARY_PACKED') {
        const int32 = type === 'INT32';
        dataPage = int32 ? new Int32Array(nValues) : new BigInt64Array(nValues);
        (0, delta_js_1.deltaBinaryUnpack)(reader, nValues, dataPage);
    }
    else if (daph.encoding === 'DELTA_LENGTH_BYTE_ARRAY') {
        dataPage = new Array(nValues);
        (0, delta_js_1.deltaLengthByteArray)(reader, nValues, dataPage);
    }
    else if (daph.encoding === 'DELTA_BYTE_ARRAY') {
        dataPage = new Array(nValues);
        (0, delta_js_1.deltaByteArray)(reader, nValues, dataPage);
    }
    else {
        throw new Error(`parquet unsupported encoding: ${daph.encoding}`);
    }
    return { definitionLevels, repetitionLevels, dataPage };
}
/**
 * @param {DataReader} reader data view for the page
 * @param {DataPageHeader} daph data page header
 * @param {SchemaTree[]} schemaPath
 * @returns {any[]} repetition levels and number of bytes read
 */
function readRepetitionLevels(reader, daph, schemaPath) {
    if (schemaPath.length > 1) {
        const maxRepetitionLevel = (0, schema_js_1.getMaxRepetitionLevel)(schemaPath);
        if (maxRepetitionLevel) {
            const values = new Array(daph.num_values);
            (0, encoding_js_1.readRleBitPackedHybrid)(reader, bitWidth(maxRepetitionLevel), values);
            return values;
        }
    }
    return [];
}
/**
 * @param {DataReader} reader data view for the page
 * @param {DataPageHeader} daph data page header
 * @param {SchemaTree[]} schemaPath
 * @returns {{ definitionLevels: number[], numNulls: number }} definition levels
 */
function readDefinitionLevels(reader, daph, schemaPath) {
    const maxDefinitionLevel = (0, schema_js_1.getMaxDefinitionLevel)(schemaPath);
    if (!maxDefinitionLevel)
        return { definitionLevels: [], numNulls: 0 };
    const definitionLevels = new Array(daph.num_values);
    (0, encoding_js_1.readRleBitPackedHybrid)(reader, bitWidth(maxDefinitionLevel), definitionLevels);
    // count nulls
    let numNulls = daph.num_values;
    for (const def of definitionLevels) {
        if (def === maxDefinitionLevel)
            numNulls--;
    }
    if (numNulls === 0)
        definitionLevels.length = 0;
    return { definitionLevels, numNulls };
}
/**
 * @param {Uint8Array} compressedBytes
 * @param {number} uncompressed_page_size
 * @param {CompressionCodec} codec
 * @param {Compressors | undefined} compressors
 * @returns {Uint8Array}
 */
function decompressPage(compressedBytes, uncompressed_page_size, codec, compressors) {
    /** @type {Uint8Array} */
    let page;
    const customDecompressor = compressors === null || compressors === void 0 ? void 0 : compressors[codec];
    if (codec === 'UNCOMPRESSED') {
        page = compressedBytes;
    }
    else if (customDecompressor) {
        page = customDecompressor(compressedBytes, uncompressed_page_size);
    }
    else if (codec === 'SNAPPY') {
        page = new Uint8Array(uncompressed_page_size);
        (0, snappy_js_1.snappyUncompress)(compressedBytes, page);
    }
    else {
        throw new Error(`parquet unsupported compression codec: ${codec}`);
    }
    if ((page === null || page === void 0 ? void 0 : page.length) !== uncompressed_page_size) {
        throw new Error(`parquet decompressed page length ${page === null || page === void 0 ? void 0 : page.length} does not match header ${uncompressed_page_size}`);
    }
    return page;
}
/**
 * Read a data page from the given Uint8Array.
 *
 * @param {Uint8Array} compressedBytes raw page data
 * @param {PageHeader} ph page header
 * @param {ColumnDecoder} columnDecoder
 * @returns {DataPage} definition levels, repetition levels, and array of values
 */
function readDataPageV2(compressedBytes, ph, columnDecoder) {
    const view = new DataView(compressedBytes.buffer, compressedBytes.byteOffset, compressedBytes.byteLength);
    const reader = { view, offset: 0 };
    const { type, element, schemaPath, codec, compressors } = columnDecoder;
    const daph2 = ph.data_page_header_v2;
    if (!daph2)
        throw new Error('parquet data page header v2 is undefined');
    // repetition levels
    const repetitionLevels = readRepetitionLevelsV2(reader, daph2, schemaPath);
    reader.offset = daph2.repetition_levels_byte_length; // readVarInt() => len for boolean v2?
    // definition levels
    const definitionLevels = readDefinitionLevelsV2(reader, daph2, schemaPath);
    // assert(reader.offset === daph2.repetition_levels_byte_length + daph2.definition_levels_byte_length)
    const uncompressedPageSize = ph.uncompressed_page_size - daph2.definition_levels_byte_length - daph2.repetition_levels_byte_length;
    let page = compressedBytes.subarray(reader.offset);
    if (daph2.is_compressed !== false) {
        page = decompressPage(page, uncompressedPageSize, codec, compressors);
    }
    const pageView = new DataView(page.buffer, page.byteOffset, page.byteLength);
    const pageReader = { view: pageView, offset: 0 };
    // read values based on encoding
    /** @type {DecodedArray} */
    let dataPage;
    const nValues = daph2.num_values - daph2.num_nulls;
    if (daph2.encoding === 'PLAIN') {
        dataPage = (0, plain_js_1.readPlain)(pageReader, type, nValues, element.type_length);
    }
    else if (daph2.encoding === 'RLE') {
        // assert(type === 'BOOLEAN')
        dataPage = new Array(nValues);
        (0, encoding_js_1.readRleBitPackedHybrid)(pageReader, 1, dataPage);
        dataPage = dataPage.map(x => !!x);
    }
    else if (daph2.encoding === 'PLAIN_DICTIONARY' ||
        daph2.encoding === 'RLE_DICTIONARY') {
        const bitWidth = pageView.getUint8(pageReader.offset++);
        dataPage = new Array(nValues);
        (0, encoding_js_1.readRleBitPackedHybrid)(pageReader, bitWidth, dataPage, uncompressedPageSize - 1);
    }
    else if (daph2.encoding === 'DELTA_BINARY_PACKED') {
        const int32 = type === 'INT32';
        dataPage = int32 ? new Int32Array(nValues) : new BigInt64Array(nValues);
        (0, delta_js_1.deltaBinaryUnpack)(pageReader, nValues, dataPage);
    }
    else if (daph2.encoding === 'DELTA_LENGTH_BYTE_ARRAY') {
        dataPage = new Array(nValues);
        (0, delta_js_1.deltaLengthByteArray)(pageReader, nValues, dataPage);
    }
    else if (daph2.encoding === 'DELTA_BYTE_ARRAY') {
        dataPage = new Array(nValues);
        (0, delta_js_1.deltaByteArray)(pageReader, nValues, dataPage);
    }
    else if (daph2.encoding === 'BYTE_STREAM_SPLIT') {
        dataPage = (0, encoding_js_1.byteStreamSplit)(pageReader, nValues, type, element.type_length);
    }
    else if (daph2.encoding === 'ALP') {
        dataPage = (0, alp_js_1.alpDecode)(pageReader, nValues, type);
    }
    else {
        throw new Error(`parquet unsupported encoding: ${daph2.encoding}`);
    }
    return { definitionLevels, repetitionLevels, dataPage };
}
/**
 * @param {DataReader} reader
 * @param {DataPageHeaderV2} daph2 data page header v2
 * @param {SchemaTree[]} schemaPath
 * @returns {any[]} repetition levels
 */
function readRepetitionLevelsV2(reader, daph2, schemaPath) {
    const maxRepetitionLevel = (0, schema_js_1.getMaxRepetitionLevel)(schemaPath);
    if (!maxRepetitionLevel)
        return [];
    const values = new Array(daph2.num_values);
    (0, encoding_js_1.readRleBitPackedHybrid)(reader, bitWidth(maxRepetitionLevel), values, daph2.repetition_levels_byte_length);
    return values;
}
/**
 * @param {DataReader} reader
 * @param {DataPageHeaderV2} daph2 data page header v2
 * @param {SchemaTree[]} schemaPath
 * @returns {number[] | undefined} definition levels
 */
function readDefinitionLevelsV2(reader, daph2, schemaPath) {
    const maxDefinitionLevel = (0, schema_js_1.getMaxDefinitionLevel)(schemaPath);
    if (maxDefinitionLevel) {
        // V2 we know the length
        const values = new Array(daph2.num_values);
        (0, encoding_js_1.readRleBitPackedHybrid)(reader, bitWidth(maxDefinitionLevel), values, daph2.definition_levels_byte_length);
        return values;
    }
}
/**
 * Minimum bits needed to store value.
 *
 * @param {number} value
 * @returns {number}
 */
function bitWidth(value) {
    return 32 - Math.clz32(value);
}

},
/* alp.js */ function(module, exports, __req){
"use strict";
/**
 * ALP (Adaptive Lossless floating-Point) encoding decoder.
 * Supports FLOAT and DOUBLE types.
 *
 * ALP encodes floating-point values by converting them to integers using
 * decimal scaling, then applying frame of reference (FOR) encoding and
 * bit-packing. Values that cannot be losslessly converted are stored as exceptions.
 *
 * See https://github.com/apache/parquet-format/blob/master/AlpEncoding.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.alpDecode = alpDecode;
exports.alpDecodeFloat = alpDecodeFloat;
exports.alpDecodeDouble = alpDecodeDouble;
// Correctly-rounded powers of ten (all exactly representable as doubles)
const POW10 = [
    1e0, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9,
    1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18,
];
const POW10_NEG = [
    1e0, 1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9,
    1e-10, 1e-11, 1e-12, 1e-13, 1e-14, 1e-15, 1e-16, 1e-17, 1e-18,
];
// float32 versions for FLOAT decoding (exponent range [0, 10])
const POW10F = POW10.slice(0, 11).map(Math.fround);
const POW10F_NEG = POW10_NEG.slice(0, 11).map(Math.fround);
/**
 * Decode ALP encoded data.
 *
 * @import {DataReader, DecodedArray, ParquetType} from '../src/types.d.ts'
 * @param {DataReader} reader - data reader positioned at start of ALP data
 * @param {number} count - number of values to decode
 * @param {ParquetType} type - FLOAT or DOUBLE
 * @returns {DecodedArray} decoded float or double array
 */
function alpDecode(reader, count, type) {
    if (type === 'FLOAT') {
        return alpDecodeFloat(reader, count);
    }
    else if (type === 'DOUBLE') {
        return alpDecodeDouble(reader, count);
    }
    else {
        throw new Error(`ALP encoding unsupported type: ${type}`);
    }
}
/**
 * Read the ALP page header and offset array, returning vector layout info.
 *
 * @param {DataReader} reader
 * @returns {{ vectorSize: number, numElements: number, numVectors: number, offsetArrayStart: number }}
 */
function readAlpHeader(reader) {
    const { view } = reader;
    const compressionMode = view.getUint8(reader.offset++);
    if (compressionMode !== 0) {
        throw new Error(`ALP unsupported compression mode: ${compressionMode}`);
    }
    const integerEncoding = view.getUint8(reader.offset++);
    if (integerEncoding !== 0) {
        throw new Error(`ALP unsupported integer encoding: ${integerEncoding}`);
    }
    const logVectorSize = view.getUint8(reader.offset++);
    if (logVectorSize < 3 || logVectorSize > 15) {
        throw new Error(`ALP invalid log_vector_size: ${logVectorSize}`);
    }
    const vectorSize = 1 << logVectorSize;
    const numElements = view.getInt32(reader.offset, true);
    reader.offset += 4;
    const numVectors = Math.ceil(numElements / vectorSize);
    const offsetArrayStart = reader.offset;
    reader.offset += numVectors * 4;
    return { vectorSize, numElements, numVectors, offsetArrayStart };
}
/**
 * Decode ALP encoded float data.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {Float32Array}
 */
function alpDecodeFloat(reader, count) {
    const { view } = reader;
    const { vectorSize, numElements, numVectors, offsetArrayStart } = readAlpHeader(reader);
    if (numElements !== count) {
        throw new Error(`ALP num_elements ${numElements} does not match expected ${count}`);
    }
    const output = new Float32Array(count);
    const outputBytes = new Uint8Array(output.buffer);
    for (let v = 0; v < numVectors; v++) {
        reader.offset = offsetArrayStart + view.getUint32(offsetArrayStart + v * 4, true);
        const outputOffset = v * vectorSize;
        const n = Math.min(vectorSize, numElements - outputOffset);
        // AlpInfo (4 bytes)
        const exponent = view.getUint8(reader.offset++);
        const factor = view.getUint8(reader.offset++);
        const numExceptions = view.getUint16(reader.offset, true);
        reader.offset += 2;
        // ForInfo (5 bytes)
        const frameOfReference = view.getInt32(reader.offset, true);
        reader.offset += 4;
        const bitWidth = view.getUint8(reader.offset++);
        // PackedValues
        const deltas = unpackBits(reader, n, bitWidth);
        // Reverse FOR (wrapping int32) and decimal decode in float32 arithmetic
        const mulFactor = POW10F[factor];
        const mulExponent = POW10F_NEG[exponent];
        for (let i = 0; i < n; i++) {
            const encoded = deltas[i] + frameOfReference | 0;
            output[outputOffset + i] = Math.fround(Math.fround(encoded) * mulFactor) * mulExponent;
        }
        patchExceptions(reader, numExceptions, 4, outputBytes, outputOffset);
    }
    return output;
}
/**
 * Decode ALP encoded double data.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {Float64Array}
 */
function alpDecodeDouble(reader, count) {
    const { view } = reader;
    const { vectorSize, numElements, numVectors, offsetArrayStart } = readAlpHeader(reader);
    if (numElements !== count) {
        throw new Error(`ALP num_elements ${numElements} does not match expected ${count}`);
    }
    const output = new Float64Array(count);
    const outputBytes = new Uint8Array(output.buffer);
    for (let v = 0; v < numVectors; v++) {
        reader.offset = offsetArrayStart + view.getUint32(offsetArrayStart + v * 4, true);
        const outputOffset = v * vectorSize;
        const n = Math.min(vectorSize, numElements - outputOffset);
        // AlpInfo (4 bytes)
        const exponent = view.getUint8(reader.offset++);
        const factor = view.getUint8(reader.offset++);
        const numExceptions = view.getUint16(reader.offset, true);
        reader.offset += 2;
        // ForInfo (9 bytes)
        const frameOfReference = view.getBigInt64(reader.offset, true);
        reader.offset += 8;
        const bitWidth = view.getUint8(reader.offset++);
        const mulFactor = POW10[factor];
        const mulExponent = POW10_NEG[exponent];
        const forNumber = Number(frameOfReference);
        if (bitWidth <= 32 && Number.isSafeInteger(forNumber)) {
            // Fast path: deltas and frame of reference are exact as doubles,
            // so delta + FOR rounds identically to an int64 -> double cast.
            const deltas = unpackBits(reader, n, bitWidth);
            for (let i = 0; i < n; i++) {
                output[outputOffset + i] = (deltas[i] + forNumber) * mulFactor * mulExponent;
            }
        }
        else {
            // Wide values: use BigInt for exact wrapping int64 arithmetic
            const deltas = unpackBitsBig(reader, n, bitWidth);
            for (let i = 0; i < n; i++) {
                const encoded = BigInt.asIntN(64, deltas[i] + frameOfReference);
                output[outputOffset + i] = Number(encoded) * mulFactor * mulExponent;
            }
        }
        patchExceptions(reader, numExceptions, 8, outputBytes, outputOffset);
    }
    return output;
}
/**
 * Read exception positions and values, and copy the raw IEEE-754 bytes
 * into the output (preserving NaN payloads bit-for-bit).
 *
 * @param {DataReader} reader
 * @param {number} numExceptions
 * @param {number} byteSize - 4 for float, 8 for double
 * @param {Uint8Array} outputBytes - byte view of the output array
 * @param {number} outputOffset - element index of the current vector
 */
function patchExceptions(reader, numExceptions, byteSize, outputBytes, outputOffset) {
    if (!numExceptions)
        return;
    const { view } = reader;
    const positionsStart = reader.offset;
    const valuesStart = positionsStart + numExceptions * 2;
    const source = new Uint8Array(view.buffer, view.byteOffset + valuesStart, numExceptions * byteSize);
    for (let e = 0; e < numExceptions; e++) {
        const pos = view.getUint16(positionsStart + e * 2, true);
        const dest = (outputOffset + pos) * byteSize;
        outputBytes.set(source.subarray(e * byteSize, (e + 1) * byteSize), dest);
    }
    reader.offset = valuesStart + numExceptions * byteSize;
}
/**
 * Unpack LSB-first bit-packed unsigned values with bitWidth <= 32.
 * Consumes ceil(count * bitWidth / 8) bytes from the reader.
 *
 * @param {DataReader} reader
 * @param {number} count - number of values to unpack
 * @param {number} bitWidth - bits per value
 * @returns {Uint32Array}
 */
function unpackBits(reader, count, bitWidth) {
    const output = new Uint32Array(count);
    if (!bitWidth)
        return output;
    const { view } = reader;
    const start = reader.offset;
    const modulus = 2 ** bitWidth;
    let bitPos = 0;
    for (let i = 0; i < count; i++) {
        let byteIndex = start + (bitPos >>> 3);
        const shift = bitPos & 7;
        // accumulate as a double to avoid 32-bit overflow (at most 40 bits needed)
        let value = view.getUint8(byteIndex++) >>> shift;
        let bits = 8 - shift;
        while (bits < bitWidth) {
            value += view.getUint8(byteIndex++) * 2 ** bits;
            bits += 8;
        }
        output[i] = value % modulus;
        bitPos += bitWidth;
    }
    reader.offset = start + Math.ceil(count * bitWidth / 8);
    return output;
}
/**
 * Unpack LSB-first bit-packed unsigned values with bitWidth <= 64 as BigInts.
 * Consumes ceil(count * bitWidth / 8) bytes from the reader.
 *
 * @param {DataReader} reader
 * @param {number} count - number of values to unpack
 * @param {number} bitWidth - bits per value
 * @returns {BigUint64Array}
 */
function unpackBitsBig(reader, count, bitWidth) {
    const output = new BigUint64Array(count);
    if (!bitWidth)
        return output;
    const { view } = reader;
    const start = reader.offset;
    const mask = (1n << BigInt(bitWidth)) - 1n;
    let buffer = 0n;
    let bitsInBuffer = 0;
    let byteIndex = start;
    for (let i = 0; i < count; i++) {
        while (bitsInBuffer < bitWidth) {
            buffer |= BigInt(view.getUint8(byteIndex++)) << BigInt(bitsInBuffer);
            bitsInBuffer += 8;
        }
        output[i] = buffer & mask;
        buffer >>= BigInt(bitWidth);
        bitsInBuffer -= bitWidth;
    }
    reader.offset = start + Math.ceil(count * bitWidth / 8);
    return output;
}

},
/* delta.js */ function(module, exports, __req){
"use strict";
/**
 * @import {DataReader} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deltaBinaryUnpack = deltaBinaryUnpack;
exports.deltaLengthByteArray = deltaLengthByteArray;
exports.deltaByteArray = deltaByteArray;
const thrift_js_1 = __req(7);
/**
 * @param {DataReader} reader
 * @param {number} count number of values to read
 * @param {Int32Array | BigInt64Array} output
 */
function deltaBinaryUnpack(reader, count, output) {
    if (output instanceof Int32Array) {
        deltaBinaryUnpackInt32(reader, count, output);
        return;
    }
    const blockSize = (0, thrift_js_1.readVarInt)(reader);
    const miniblockPerBlock = (0, thrift_js_1.readVarInt)(reader);
    (0, thrift_js_1.readVarInt)(reader); // assert(=== count)
    let value = (0, thrift_js_1.readZigZagBigInt)(reader); // first value
    let outputIndex = 0;
    output[outputIndex++] = value;
    const valuesPerMiniblock = blockSize / miniblockPerBlock;
    while (outputIndex < count) {
        // new block
        const minDelta = (0, thrift_js_1.readZigZagBigInt)(reader);
        const bitWidths = new Uint8Array(miniblockPerBlock);
        for (let i = 0; i < miniblockPerBlock; i++) {
            bitWidths[i] = reader.view.getUint8(reader.offset++);
        }
        for (let i = 0; i < miniblockPerBlock && outputIndex < count; i++) {
            // new miniblock
            const bitWidth = bitWidths[i];
            if (bitWidth) {
                // Miniblock data lengths are multiples of four bytes.
                let bitpackPos = 0;
                let miniblockCount = valuesPerMiniblock;
                const mask = (1n << BigInt(bitWidth)) - 1n;
                while (miniblockCount && outputIndex < count) {
                    let bits = BigInt(reader.view.getUint32(reader.offset, true) >>> bitpackPos) & mask; // TODO: don't re-read value every time
                    bitpackPos += bitWidth;
                    while (bitpackPos >= 32) {
                        bitpackPos -= 32;
                        reader.offset += 4;
                        if (bitpackPos) {
                            bits |= BigInt(reader.view.getUint32(reader.offset, true)) << BigInt(bitWidth - bitpackPos) & mask;
                        }
                    }
                    const delta = minDelta + bits;
                    value += delta;
                    output[outputIndex++] = value;
                    miniblockCount--;
                }
                if (miniblockCount) {
                    // consume leftover miniblock
                    reader.offset += Math.ceil((miniblockCount * bitWidth + bitpackPos) / 8);
                }
            }
            else {
                for (let j = 0; j < valuesPerMiniblock && outputIndex < count; j++) {
                    value += minDelta;
                    output[outputIndex++] = value;
                }
            }
        }
    }
}
/**
 * Decode INT32 without BigInt arithmetic in the per-value loop.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @param {Int32Array} output
 */
function deltaBinaryUnpackInt32(reader, count, output) {
    const blockSize = (0, thrift_js_1.readVarInt)(reader);
    const miniblockPerBlock = (0, thrift_js_1.readVarInt)(reader);
    (0, thrift_js_1.readVarInt)(reader);
    let value = (0, thrift_js_1.readZigZag)(reader);
    let outputIndex = 0;
    output[outputIndex++] = value;
    const valuesPerMiniblock = blockSize / miniblockPerBlock;
    const { view } = reader;
    while (outputIndex < count) {
        const minDelta = readZigZagInt33(reader);
        const bitWidthsOffset = reader.offset;
        let offset = bitWidthsOffset + miniblockPerBlock;
        for (let i = 0; i < miniblockPerBlock && outputIndex < count; i++) {
            const bitWidth = view.getUint8(bitWidthsOffset + i);
            const end = offset + valuesPerMiniblock * bitWidth / 8;
            let bitOffset = 0;
            for (let j = 0; j < valuesPerMiniblock && outputIndex < count; j++) {
                let residual = 0;
                let bitsRead = 0;
                while (bitsRead < bitWidth) {
                    const bitsToRead = Math.min(8 - bitOffset, bitWidth - bitsRead);
                    // Residual bits at 32 and above vanish modulo 2^32.
                    if (bitsRead < 32) {
                        residual |= (view.getUint8(offset) >>> bitOffset & (1 << bitsToRead) - 1) << bitsRead;
                    }
                    bitsRead += bitsToRead;
                    bitOffset += bitsToRead;
                    if (bitOffset === 8) {
                        bitOffset = 0;
                        offset++;
                    }
                }
                // Parquet INT32 delta arithmetic wraps in two's complement.
                value = value + minDelta + residual | 0;
                output[outputIndex++] = value;
            }
            // Consume the entire padded miniblock, but not unused miniblock bodies.
            offset = end;
        }
        reader.offset = offset;
    }
}
/**
 * Read a zigzag varint modulo 2^32. INT32 deltas can need 33 bits, which
 * readZigZag truncates, but only the low 32 bits of the decoded value matter.
 * readVarInt keeps the low 32 zigzag bits of a 5-byte varint; bit 32 is bit 4
 * of the fifth byte. Reusing readVarInt keeps the caller's hot loop fast.
 *
 * @param {DataReader} reader
 * @returns {number}
 */
function readZigZagInt33(reader) {
    const start = reader.offset;
    const low = (0, thrift_js_1.readVarInt)(reader);
    const high = reader.offset - start === 5 ? reader.view.getUint8(start + 4) >>> 4 & 1 : 0;
    return (low >>> 1 | high << 31) ^ -(low & 1);
}
/**
 * @param {DataReader} reader
 * @param {number} count
 * @param {Uint8Array[]} output
 */
function deltaLengthByteArray(reader, count, output) {
    const lengths = new Int32Array(count);
    deltaBinaryUnpack(reader, count, lengths);
    for (let i = 0; i < count; i++) {
        output[i] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, lengths[i]);
        reader.offset += lengths[i];
    }
}
/**
 * @param {DataReader} reader
 * @param {number} count
 * @param {Uint8Array[]} output
 */
function deltaByteArray(reader, count, output) {
    const prefixData = new Int32Array(count);
    deltaBinaryUnpack(reader, count, prefixData);
    const suffixData = new Int32Array(count);
    deltaBinaryUnpack(reader, count, suffixData);
    for (let i = 0; i < count; i++) {
        const suffix = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, suffixData[i]);
        if (prefixData[i]) {
            // copy from previous value
            output[i] = new Uint8Array(prefixData[i] + suffixData[i]);
            output[i].set(output[i - 1].subarray(0, prefixData[i]));
            output[i].set(suffix, prefixData[i]);
        }
        else {
            output[i] = suffix;
        }
        reader.offset += suffixData[i];
    }
}

},
/* encoding.js */ function(module, exports, __req){
"use strict";
/**
 * @import {DataReader, DecodedArray, ParquetType} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRleBitPackedHybrid = readRleBitPackedHybrid;
exports.byteStreamSplit = byteStreamSplit;
const thrift_js_1 = __req(7);
/**
 * Read values from a run-length encoded/bit-packed hybrid encoding.
 *
 * If length is zero, then read int32 length at the start.
 *
 * @param {DataReader} reader
 * @param {number} width - bitwidth
 * @param {DecodedArray} output
 * @param {number} [length] - length of the encoded data
 */
function readRleBitPackedHybrid(reader, width, output, length) {
    if (length === undefined) {
        length = reader.view.getUint32(reader.offset, true);
        reader.offset += 4;
    }
    const startOffset = reader.offset;
    let seen = 0;
    while (seen < output.length) {
        const header = (0, thrift_js_1.readVarInt)(reader);
        if (header & 1) {
            // bit-packed
            seen = readBitPacked(reader, header, width, output, seen);
        }
        else {
            // rle
            const count = header >>> 1;
            readRle(reader, count, width, output, seen);
            seen += count;
        }
    }
    reader.offset = startOffset + length; // duckdb writes an empty block
}
/**
 * Run-length encoding: read value with bitWidth and repeat it count times.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @param {number} bitWidth
 * @param {DecodedArray} output
 * @param {number} seen
 */
function readRle(reader, count, bitWidth, output, seen) {
    const width = bitWidth + 7 >> 3;
    let value = 0;
    for (let i = 0; i < width; i++) {
        value |= reader.view.getUint8(reader.offset++) << (i << 3);
    }
    // assert(value < 1 << bitWidth)
    // repeat value count times
    for (let i = 0; i < count; i++) {
        output[seen + i] = value;
    }
}
/**
 * Read a bit-packed run of the rle/bitpack hybrid.
 * Supports width > 8 (crossing bytes).
 *
 * @param {DataReader} reader
 * @param {number} header - bit-pack header
 * @param {number} bitWidth
 * @param {DecodedArray} output
 * @param {number} seen
 * @returns {number} total output values so far
 */
function readBitPacked(reader, header, bitWidth, output, seen) {
    let count = header >> 1 << 3; // values to read
    const mask = (1 << bitWidth) - 1;
    let data = 0;
    if (reader.offset < reader.view.byteLength) {
        data = reader.view.getUint8(reader.offset++);
    }
    else if (mask) {
        // sometimes out-of-bounds reads are masked out
        throw new Error(`parquet bitpack offset ${reader.offset} out of range`);
    }
    let left = 8;
    let right = 0;
    // read values
    while (count) {
        // if we have crossed a byte boundary, shift the data
        if (right > 8) {
            right -= 8;
            left -= 8;
            data >>>= 8;
        }
        else if (left - right < bitWidth) {
            // if we don't have bitWidth number of bits to read, read next byte
            data |= reader.view.getUint8(reader.offset) << left;
            reader.offset++;
            left += 8;
        }
        else {
            if (seen < output.length) {
                // emit value
                output[seen++] = data >> right & mask;
            }
            count--;
            right += bitWidth;
        }
    }
    return seen;
}
/**
 * @param {DataReader} reader
 * @param {number} count
 * @param {ParquetType} type
 * @param {number | undefined} typeLength
 * @returns {DecodedArray}
 */
function byteStreamSplit(reader, count, type, typeLength) {
    const width = byteWidth(type, typeLength);
    const bytes = new Uint8Array(count * width);
    for (let b = 0; b < width; b++) {
        for (let i = 0; i < count; i++) {
            bytes[i * width + b] = reader.view.getUint8(reader.offset++);
        }
    }
    // interpret bytes as typed array
    if (type === 'FLOAT')
        return new Float32Array(bytes.buffer);
    else if (type === 'DOUBLE')
        return new Float64Array(bytes.buffer);
    else if (type === 'INT32')
        return new Int32Array(bytes.buffer);
    else if (type === 'INT64')
        return new BigInt64Array(bytes.buffer);
    else if (type === 'FIXED_LEN_BYTE_ARRAY') {
        // split into arrays of typeLength
        const split = new Array(count);
        for (let i = 0; i < count; i++) {
            split[i] = bytes.subarray(i * width, (i + 1) * width);
        }
        return split;
    }
    throw new Error(`parquet byte_stream_split unsupported type: ${type}`);
}
/**
 * @param {ParquetType} type
 * @param {number | undefined} typeLength
 * @returns {number}
 */
function byteWidth(type, typeLength) {
    switch (type) {
        case 'INT32':
        case 'FLOAT':
            return 4;
        case 'INT64':
        case 'DOUBLE':
            return 8;
        case 'FIXED_LEN_BYTE_ARRAY':
            if (!typeLength)
                throw new Error('parquet byteWidth missing type_length');
            return typeLength;
        default:
            throw new Error(`parquet unsupported type: ${type}`);
    }
}

},
/* plain.js */ function(module, exports, __req){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPlain = readPlain;
/**
 * Read `count` values of the given type from the reader.view.
 *
 * @param {DataReader} reader - buffer to read data from
 * @param {ParquetType} type - parquet type of the data
 * @param {number} count - number of values to read
 * @param {number | undefined} fixedLength - length of each fixed length byte array
 * @returns {DecodedArray} array of values
 */
function readPlain(reader, type, count, fixedLength) {
    if (count === 0)
        return [];
    if (type === 'BOOLEAN') {
        return readPlainBoolean(reader, count);
    }
    else if (type === 'INT32') {
        return readPlainInt32(reader, count);
    }
    else if (type === 'INT64') {
        return readPlainInt64(reader, count);
    }
    else if (type === 'INT96') {
        return readPlainInt96(reader, count);
    }
    else if (type === 'FLOAT') {
        return readPlainFloat(reader, count);
    }
    else if (type === 'DOUBLE') {
        return readPlainDouble(reader, count);
    }
    else if (type === 'BYTE_ARRAY') {
        return readPlainByteArray(reader, count);
    }
    else if (type === 'FIXED_LEN_BYTE_ARRAY') {
        if (!fixedLength)
            throw new Error('parquet missing fixed length');
        return readPlainByteArrayFixed(reader, count, fixedLength);
    }
    else {
        throw new Error(`parquet unhandled type: ${type}`);
    }
}
/**
 * Read `count` boolean values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {boolean[]}
 */
function readPlainBoolean(reader, count) {
    const values = new Array(count);
    for (let i = 0; i < count; i++) {
        const byteOffset = reader.offset + (i / 8 | 0);
        const bitOffset = i % 8;
        const byte = reader.view.getUint8(byteOffset);
        values[i] = (byte & 1 << bitOffset) !== 0;
    }
    reader.offset += Math.ceil(count / 8);
    return values;
}
/**
 * Read `count` int32 values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {Int32Array}
 */
function readPlainInt32(reader, count) {
    const values = (reader.view.byteOffset + reader.offset) % 4
        ? new Int32Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 4))
        : new Int32Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
    reader.offset += count * 4;
    return values;
}
/**
 * Read `count` int64 values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {BigInt64Array}
 */
function readPlainInt64(reader, count) {
    const values = (reader.view.byteOffset + reader.offset) % 8
        ? new BigInt64Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 8))
        : new BigInt64Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
    reader.offset += count * 8;
    return values;
}
/**
 * Read `count` int96 values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {bigint[]}
 */
function readPlainInt96(reader, count) {
    const values = new Array(count);
    for (let i = 0; i < count; i++) {
        const low = reader.view.getBigInt64(reader.offset + i * 12, true);
        const high = reader.view.getInt32(reader.offset + i * 12 + 8, true);
        values[i] = BigInt(high) << 64n | low;
    }
    reader.offset += count * 12;
    return values;
}
/**
 * Read `count` float values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {Float32Array}
 */
function readPlainFloat(reader, count) {
    const values = (reader.view.byteOffset + reader.offset) % 4
        ? new Float32Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 4))
        : new Float32Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
    reader.offset += count * 4;
    return values;
}
/**
 * Read `count` double values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {Float64Array}
 */
function readPlainDouble(reader, count) {
    const values = (reader.view.byteOffset + reader.offset) % 8
        ? new Float64Array(align(reader.view.buffer, reader.view.byteOffset + reader.offset, count * 8))
        : new Float64Array(reader.view.buffer, reader.view.byteOffset + reader.offset, count);
    reader.offset += count * 8;
    return values;
}
/**
 * Read `count` byte array values.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @returns {Uint8Array[]}
 */
function readPlainByteArray(reader, count) {
    const values = new Array(count);
    for (let i = 0; i < count; i++) {
        const length = reader.view.getUint32(reader.offset, true);
        reader.offset += 4;
        values[i] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, length);
        reader.offset += length;
    }
    return values;
}
/**
 * Read a fixed length byte array.
 *
 * @param {DataReader} reader
 * @param {number} count
 * @param {number} fixedLength
 * @returns {Uint8Array[]}
 */
function readPlainByteArrayFixed(reader, count, fixedLength) {
    // assert(reader.view.byteLength - reader.offset >= count * fixedLength)
    const values = new Array(count);
    for (let i = 0; i < count; i++) {
        values[i] = new Uint8Array(reader.view.buffer, reader.view.byteOffset + reader.offset, fixedLength);
        reader.offset += fixedLength;
    }
    return values;
}
/**
 * Create a new buffer with the offset and size.
 *
 * @import {DataReader, DecodedArray, ParquetType} from '../src/types.js'
 * @param {ArrayBufferLike} buffer
 * @param {number} offset
 * @param {number} size
 * @returns {ArrayBuffer}
 */
function align(buffer, offset, size) {
    const aligned = new ArrayBuffer(size);
    new Uint8Array(aligned).set(new Uint8Array(buffer, offset, size));
    return aligned;
}

},
/* snappy.js */ function(module, exports, __req){
"use strict";
/**
 * The MIT License (MIT)
 * Copyright (c) 2016 Zhipeng Jia
 * https://github.com/zhipeng-jia/snappyjs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.snappyUncompress = snappyUncompress;
const WORD_MASK = [0, 0xff, 0xffff, 0xffffff, 0xffffffff];
/**
 * Copy bytes from one array to another
 *
 * @param {Uint8Array} fromArray source array
 * @param {number} fromPos source position
 * @param {Uint8Array} toArray destination array
 * @param {number} toPos destination position
 * @param {number} length number of bytes to copy
 */
function copyBytes(fromArray, fromPos, toArray, toPos, length) {
    for (let i = 0; i < length; i++) {
        toArray[toPos + i] = fromArray[fromPos + i];
    }
}
/**
 * Decompress snappy data.
 * Accepts an output buffer to avoid allocating a new buffer for each call.
 *
 * @param {Uint8Array} input compressed data
 * @param {Uint8Array} output output buffer
 */
function snappyUncompress(input, output) {
    const inputLength = input.byteLength;
    const outputLength = output.byteLength;
    let pos = 0;
    let outPos = 0;
    // skip preamble (contains uncompressed length as varint)
    while (pos < inputLength) {
        const c = input[pos];
        pos++;
        if (c < 128) {
            break;
        }
    }
    if (outputLength && pos >= inputLength) {
        throw new Error('invalid snappy length header');
    }
    while (pos < inputLength) {
        const c = input[pos];
        let len = 0;
        pos++;
        if (pos >= inputLength) {
            throw new Error('missing eof marker');
        }
        // There are two types of elements, literals and copies (back references)
        if ((c & 0x3) === 0) {
            // Literals are uncompressed data stored directly in the byte stream
            let len = (c >>> 2) + 1;
            // Longer literal length is encoded in multiple bytes
            if (len > 60) {
                if (pos + 3 >= inputLength) {
                    throw new Error('snappy error literal pos + 3 >= inputLength');
                }
                const lengthSize = len - 60; // length bytes - 1
                len = input[pos]
                    + (input[pos + 1] << 8)
                    + (input[pos + 2] << 16)
                    + (input[pos + 3] << 24);
                len = (len & WORD_MASK[lengthSize]) + 1;
                pos += lengthSize;
            }
            if (pos + len > inputLength) {
                throw new Error('snappy error literal exceeds input length');
            }
            copyBytes(input, pos, output, outPos, len);
            pos += len;
            outPos += len;
        }
        else {
            // Copy elements
            let offset = 0; // offset back from current position to read
            switch (c & 0x3) {
                case 1:
                    // Copy with 1-byte offset
                    len = (c >>> 2 & 0x7) + 4;
                    offset = input[pos] + (c >>> 5 << 8);
                    pos++;
                    break;
                case 2:
                    // Copy with 2-byte offset
                    if (inputLength <= pos + 1) {
                        throw new Error('snappy error end of input');
                    }
                    len = (c >>> 2) + 1;
                    offset = input[pos] + (input[pos + 1] << 8);
                    pos += 2;
                    break;
                case 3:
                    // Copy with 4-byte offset
                    if (inputLength <= pos + 3) {
                        throw new Error('snappy error end of input');
                    }
                    len = (c >>> 2) + 1;
                    offset = input[pos]
                        + (input[pos + 1] << 8)
                        + (input[pos + 2] << 16)
                        + (input[pos + 3] << 24);
                    pos += 4;
                    break;
                default:
                    break;
            }
            if (offset === 0 || isNaN(offset)) {
                throw new Error(`invalid offset ${offset} pos ${pos} inputLength ${inputLength}`);
            }
            if (offset > outPos) {
                throw new Error('cannot copy from before start of buffer');
            }
            copyBytes(output, outPos - offset, output, outPos, len);
            outPos += len;
        }
    }
    if (outPos !== outputLength)
        throw new Error('premature end of input');
}

},
/* scan.js */ function(module, exports, __req){
"use strict";
/**
 * @import {AsyncRowGroup, BaseParquetReadOptions, BloomFilter, DecodedArray, PageLocation, PageRanges, ParquetScan, ParquetScanOptions, QueryPlan, SchemaElement} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parquetScan = parquetScan;
exports.prepareParquetRead = prepareParquetRead;
exports.readParquetPlan = readParquetPlan;
/**
 * @typedef {BaseParquetReadOptions & {
 *   bloomFiltersByGroup?: Record<string, BloomFilter>[],
 *   schemaElements?: Record<string, SchemaElement>,
 *   pageRangesByGroup?: (PageRanges | undefined)[],
 *   pageLocationsByGroup?: Record<string, PageLocation[]>[],
 * }} PreparedParquetReadOptions
 */
const filter_js_1 = __req(10);
const metadata_js_1 = __req(5);
const plan_js_1 = __req(14);
const rowgroup_js_1 = __req(15);
const utils_js_1 = __req(13);
/**
 * Prepare a lazy column-oriented scan of a parquet file.
 *
 * The returned ranges are physical, zero-based row ranges in the file. A
 * `pruningFilter` may narrow them using row-group statistics, bloom filters,
 * and page indexes, but does not filter individual values returned by
 * `readColumn`. This makes the scan suitable for query engines that maintain
 * their own row selections while retaining parquet-level I/O pushdown.
 *
 * `columns`, when supplied, limits the columns available to `readColumn`.
 * Columns referenced by `pruningFilter` are included automatically.
 *
 * @param {ParquetScanOptions} options
 * @returns {Promise<ParquetScan>}
 */
async function parquetScan(options) {
    var _a, _b;
    (_a = options.metadata) !== null && _a !== void 0 ? _a : (options.metadata = await (0, metadata_js_1.parquetMetadataAsync)(options.file, options));
    const { pruningFilter, ...readOptions } = options;
    let { columns } = readOptions;
    if (columns && pruningFilter) {
        const selectedColumns = new Set(columns);
        const extraColumns = (0, filter_js_1.columnsNeededForFilter)(pruningFilter)
            .filter(column => !selectedColumns.has(column));
        if (extraColumns.length)
            columns = [...columns, ...extraColumns];
    }
    const preparedOptions = await prepareParquetOptions({
        ...readOptions,
        columns,
        filter: pruningFilter,
        useOffsetIndex: (_b = readOptions.useOffsetIndex) !== null && _b !== void 0 ? _b : true,
    });
    const { metadata } = preparedOptions;
    if (!metadata)
        throw new Error('parquet requires metadata');
    const schemaTree = (0, metadata_js_1.parquetSchema)(metadata);
    const availableColumns = new Set(columns !== null && columns !== void 0 ? columns : schemaTree.children.map(child => child.element.name));
    const plan = (0, plan_js_1.parquetPlanGroups)(preparedOptions);
    const candidates = plan.groups.flatMap(group => group.ranges.map(([selectStart, selectEnd]) => ({
        rowStart: group.groupStart + selectStart,
        rowEnd: group.groupStart + selectEnd,
        group,
    })));
    const ranges = candidates.map(({ rowStart, rowEnd }) => ({ rowStart, rowEnd }));
    /** @type {Map<string, {rowStart: number, rowEnd: number, data: Promise<DecodedArray>}>} */
    const cache = new Map();
    /**
     * @param {import('../src/types.js').ParquetScanColumnOptions} columnOptions
     * @returns {Promise<DecodedArray>}
     */
    function readColumn({ column, rowStart, rowEnd }) {
        if (!availableColumns.has(column)) {
            throw new Error(`parquet column not found in scan: ${column}`);
        }
        validateRange(rowStart, rowEnd);
        if (rowStart === rowEnd)
            return Promise.resolve([]);
        const candidateIndex = findCandidate(candidates, rowStart, rowEnd);
        if (candidateIndex < 0) {
            throw new RangeError(`parquet row range [${rowStart}, ${rowEnd}) is outside scan ranges`);
        }
        const { group } = candidates[candidateIndex];
        const cached = cache.get(column);
        if (cached && rowStart >= cached.rowStart && rowEnd <= cached.rowEnd) {
            return cached.data.then(data => sliceDecodedArray(data, rowStart - cached.rowStart, rowEnd - cached.rowStart));
        }
        const data = readColumnRange({
            options: preparedOptions,
            schemaTree,
            group,
            column,
            rowStart,
            rowEnd,
        });
        cache.set(column, { rowStart, rowEnd, data });
        return data;
    }
    return {
        metadata,
        ranges,
        readColumn,
    };
}
/**
 * Load optional indexes and build the canonical physical read plan.
 * Shared by row-oriented reads and lazy scans so pruning behavior cannot
 * diverge between APIs.
 *
 * @param {BaseParquetReadOptions} options
 * @returns {Promise<{options: PreparedParquetReadOptions, plan: QueryPlan}>}
 */
async function prepareParquetRead(options) {
    const prepared = await prepareParquetOptions(options);
    return {
        options: prepared,
        plan: (0, plan_js_1.parquetPlan)(prepared),
    };
}
/**
 * Load optional indexes and validate read options without planning data reads.
 *
 * @param {BaseParquetReadOptions} options
 * @returns {Promise<PreparedParquetReadOptions>}
 */
async function prepareParquetOptions(options) {
    var _a;
    const metadata = (_a = options.metadata) !== null && _a !== void 0 ? _a : await (0, metadata_js_1.parquetMetadataAsync)(options.file, options);
    const schemaColumns = (0, metadata_js_1.parquetSchema)(metadata).children.map(child => child.element.name);
    const filterColumns = (0, filter_js_1.columnsNeededForFilter)(options.filter);
    const missingFilterColumns = filterColumns.filter(column => !schemaColumns.includes(column));
    if (missingFilterColumns.length) {
        throw new Error(`parquet filter columns not found: ${missingFilterColumns.join(', ')}`);
    }
    if (options.columns) {
        const missingColumns = options.columns.filter(column => !schemaColumns.includes(column));
        if (missingColumns.length)
            throw new Error(`parquet column not found: ${missingColumns[0]}`);
    }
    /** @type {PreparedParquetReadOptions} */
    let prepared = { ...options, metadata };
    prepared = await withBloomFilters(prepared);
    prepared = await withPageIndexes(prepared);
    return prepared;
}
/**
 * Read all planned row groups, prefetching their coalesced byte ranges.
 *
 * @param {BaseParquetReadOptions} options
 * @param {QueryPlan} plan
 * @returns {AsyncRowGroup[]}
 */
function readParquetPlan(options, plan) {
    const readOptions = { ...options, file: (0, plan_js_1.prefetchAsyncBuffer)(options.file, plan) };
    return plan.groups.map(group => (0, rowgroup_js_1.readRowGroup)(readOptions, plan, group));
}
/**
 * @param {object} input
 * @param {PreparedParquetReadOptions} input.options
 * @param {import('../src/types.js').SchemaTree} input.schemaTree
 * @param {ReturnType<typeof parquetPlanGroups>['groups'][number]} input.group
 * @param {string} input.column
 * @param {number} input.rowStart
 * @param {number} input.rowEnd
 * @returns {Promise<DecodedArray>}
 */
async function readColumnRange({ options, schemaTree, group, column, rowStart, rowEnd }) {
    var _a, _b, _c;
    const columnOptions = {
        ...options,
        columns: [column],
        filter: undefined,
        rowStart,
        rowEnd,
        useBloomFilters: false,
        useOffsetIndex: (_a = options.useOffsetIndex) !== null && _a !== void 0 ? _a : true,
        usePageIndex: false,
        pageRangesByGroup: undefined,
    };
    const columnPlan = planCandidateColumn({ options, group, column, rowStart, rowEnd });
    const [asyncGroup] = readParquetPlan(columnOptions, columnPlan);
    if (!asyncGroup)
        throw new Error('parquet scan range not planned');
    const assembled = (0, rowgroup_js_1.assembleAsync)(asyncGroup, schemaTree, options.parsers);
    const asyncColumn = assembled.asyncColumns.find(child => child.pathInSchema[0] === column);
    if (!asyncColumn)
        throw new Error(`parquet column not found: ${column}`);
    const result = await asyncColumn.data;
    const data = (0, utils_js_1.flatten)(result.data);
    const selectStart = (_b = assembled.selectStart) !== null && _b !== void 0 ? _b : rowStart - assembled.groupStart;
    const selectEnd = (_c = assembled.selectEnd) !== null && _c !== void 0 ? _c : rowEnd - assembled.groupStart;
    return sliceDecodedArray(data, selectStart - result.skipped, selectEnd - result.skipped);
}
/**
 * Build a one-column plan from a retained candidate without scanning the
 * file's row groups again.
 *
 * @param {object} input
 * @param {PreparedParquetReadOptions} input.options
 * @param {ReturnType<typeof parquetPlanGroups>['groups'][number]} input.group
 * @param {string} input.column
 * @param {number} input.rowStart
 * @param {number} input.rowEnd
 * @returns {QueryPlan}
 */
function planCandidateColumn({ options, group, column, rowStart, rowEnd }) {
    var _a;
    if (!options.metadata)
        throw new Error('parquet requires metadata');
    const localPlan = (0, plan_js_1.parquetPlanGroup)({
        rowGroup: group.rowGroup,
        groupStart: group.groupStart,
        groupRows: group.groupRows,
        ranges: [[rowStart - group.groupStart, rowEnd - group.groupStart]],
        columns: [column],
        useOffsetIndex: (_a = options.useOffsetIndex) !== null && _a !== void 0 ? _a : true,
        pageLocations: group.pageLocations,
    });
    const [localGroupPlan] = localPlan.groups;
    if (!localGroupPlan)
        throw new Error(`parquet column not found: ${column}`);
    return {
        metadata: options.metadata,
        rowStart,
        rowEnd,
        columns: [column],
        fetches: [...localPlan.fetches, ...localPlan.indexes],
        groups: [localGroupPlan],
    };
}
/**
 * Find the one candidate that fully contains a requested non-empty range.
 * Candidates are sorted and disjoint, so lookup is logarithmic.
 *
 * @param {{rowStart: number, rowEnd: number}[]} candidates
 * @param {number} rowStart
 * @param {number} rowEnd
 * @returns {number}
 */
function findCandidate(candidates, rowStart, rowEnd) {
    let low = 0;
    let high = candidates.length - 1;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = candidates[middle];
        if (rowStart < candidate.rowStart) {
            high = middle - 1;
        }
        else if (rowStart >= candidate.rowEnd) {
            low = middle + 1;
        }
        else {
            return rowEnd <= candidate.rowEnd ? middle : -1;
        }
    }
    return -1;
}
/**
 * @param {number} rowStart
 * @param {number} rowEnd
 */
function validateRange(rowStart, rowEnd) {
    if (!Number.isSafeInteger(rowStart) || rowStart < 0) {
        throw new RangeError('parquet rowStart must be a non-negative safe integer');
    }
    if (!Number.isSafeInteger(rowEnd) || rowEnd < rowStart) {
        throw new RangeError('parquet rowEnd must be a safe integer greater than or equal to rowStart');
    }
}
/**
 * Return an exact view over decoded values. Typed arrays retain a zero-copy
 * subarray while ordinary arrays use their native slice.
 *
 * @param {DecodedArray} data
 * @param {number} start
 * @param {number} end
 * @returns {DecodedArray}
 */
function sliceDecodedArray(data, start, end) {
    if (start === 0 && end === data.length)
        return data;
    return Array.isArray(data) ? data.slice(start, end) : data.subarray(start, end);
}
/**
 * Conditionally fetch bloom filters and attach them to planner options.
 *
 * @param {PreparedParquetReadOptions} options
 * @returns {Promise<PreparedParquetReadOptions>}
 */
async function withBloomFilters(options) {
    if (!options.useBloomFilters || !options.filter || !options.metadata)
        return options;
    const schemaTree = (0, metadata_js_1.parquetSchema)(options.metadata);
    /** @type {Record<string, SchemaElement>} */
    const schemaElements = {};
    for (const child of schemaTree.children)
        schemaElements[child.element.name] = child.element;
    const bloomFiltersByGroup = await (0, plan_js_1.prefetchBloomFilters)({
        file: options.file,
        metadata: options.metadata,
        filter: options.filter,
        filterStrict: options.filterStrict,
    });
    return { ...options, bloomFiltersByGroup, schemaElements };
}
/**
 * Conditionally fetch page indexes and attach candidate ranges and layouts.
 *
 * @param {PreparedParquetReadOptions} options
 * @returns {Promise<PreparedParquetReadOptions>}
 */
async function withPageIndexes(options) {
    if (!options.usePageIndex || !options.filter || !options.metadata)
        return options;
    const { pageRangesByGroup, pageLocationsByGroup } = await (0, plan_js_1.prefetchPageIndexes)({
        file: options.file,
        metadata: options.metadata,
        filter: options.filter,
        filterStrict: options.filterStrict,
        rowStart: options.rowStart,
        rowEnd: options.rowEnd,
        columns: options.columns,
        bloomFiltersByGroup: options.bloomFiltersByGroup,
        schemaElements: options.schemaElements,
        parsers: options.parsers,
    });
    return { ...options, pageRangesByGroup, pageLocationsByGroup };
}

},
/* query.js */ function(module, exports, __req){
"use strict";
/**
 * @import {BaseParquetReadOptions, ParquetRow} from '../src/types.js'
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parquetQuery = parquetQuery;
const metadata_js_1 = __req(5);
const read_js_1 = __req(9);
/**
 * Wraps parquetRead with orderBy support.
 * This is a parquet-aware query engine that can read a subset of rows and columns.
 * Accepts optional orderBy column name to sort the results.
 * Note that using orderBy may SIGNIFICANTLY increase the query time.
 *
 * @param {BaseParquetReadOptions & { orderBy?: string }} options
 * @returns {Promise<ParquetRow[]>} resolves when all requested rows and columns are parsed
 */
async function parquetQuery(options) {
    var _a, _b;
    if (!options.file || !(options.file.byteLength >= 0)) {
        throw new Error('parquet expected AsyncBuffer');
    }
    (_a = options.metadata) !== null && _a !== void 0 ? _a : (options.metadata = await (0, metadata_js_1.parquetMetadataAsync)(options.file, options));
    const { metadata, rowStart = 0, columns, orderBy, filter } = options;
    if (rowStart < 0)
        throw new Error('parquet rowStart must be positive');
    const rowEnd = (_b = options.rowEnd) !== null && _b !== void 0 ? _b : Number(metadata.num_rows);
    // Validate orderBy column exists
    if (orderBy) {
        const allColumns = (0, metadata_js_1.parquetSchema)(options.metadata).children.map(c => c.element.name);
        if (!allColumns.includes(orderBy)) {
            throw new Error(`parquet orderBy column not found: ${orderBy}`);
        }
    }
    if (filter && !orderBy && rowEnd < metadata.num_rows) {
        // iterate through row groups and filter until we have enough rows
        /** @type {ParquetRow[]} */
        const filteredRows = [];
        let groupStart = 0;
        for (const group of metadata.row_groups) {
            const groupEnd = groupStart + Number(group.num_rows);
            // TODO: if expected > group size, start fetching next groups
            const groupData = await (0, read_js_1.parquetReadObjects)({
                ...options, rowStart: groupStart, rowEnd: groupEnd,
            });
            filteredRows.push(...groupData);
            if (filteredRows.length >= rowEnd)
                break;
            groupStart = groupEnd;
        }
        return filteredRows.slice(rowStart, rowEnd);
    }
    else if (filter && orderBy) {
        // read all rows with orderBy column included for sorting
        const readColumns = columns && !columns.includes(orderBy)
            ? [...columns, orderBy]
            : columns;
        const results = await (0, read_js_1.parquetReadObjects)({
            ...options, rowStart: undefined, rowEnd: undefined, columns: readColumns,
        });
        // sort by orderBy column
        results.sort((a, b) => compare(a[orderBy], b[orderBy]));
        // project out orderBy column if not originally requested
        if (readColumns !== columns) {
            for (const row of results) {
                delete row[orderBy];
            }
        }
        return results.slice(rowStart, rowEnd);
    }
    else if (filter) {
        // filter without orderBy, read all matching rows
        const results = await (0, read_js_1.parquetReadObjects)({
            ...options, rowStart: undefined, rowEnd: undefined,
        });
        return results.slice(rowStart, rowEnd);
    }
    else if (typeof orderBy === 'string') {
        // sorted but unfiltered: fetch orderBy column first
        const orderColumn = await (0, read_js_1.parquetReadColumn)({
            ...options, rowStart: undefined, rowEnd: undefined, columns: [orderBy],
        });
        // compute row groups to fetch
        const sortedIndices = Array.from(orderColumn, (_, index) => index)
            .sort((a, b) => compare(orderColumn[a], orderColumn[b]))
            .slice(rowStart, rowEnd);
        const sparseData = await parquetReadRows({ ...options, rows: sortedIndices });
        // warning: the type Record<string, any> & {__index__: number})[] is simplified into Record<string, any>[]
        // when returning. The data contains the __index__ property, but it's not exposed as such.
        const data = sortedIndices.map(index => sparseData[index]);
        return data;
    }
    else {
        return await (0, read_js_1.parquetReadObjects)(options);
    }
}
/**
 * Reads a list rows from a parquet file, reading only the row groups that contain the rows.
 * Returns a sparse array of rows.
 * @param {BaseParquetReadOptions & { rows: number[] }} options
 * @returns {Promise<(ParquetRow & {__index__: number})[]>}
 */
async function parquetReadRows(options) {
    var _a;
    const { file, rows } = options;
    (_a = options.metadata) !== null && _a !== void 0 ? _a : (options.metadata = await (0, metadata_js_1.parquetMetadataAsync)(file, options));
    const { row_groups: rowGroups } = options.metadata;
    // Compute row groups to fetch
    const groupIncluded = Array(rowGroups.length).fill(false);
    let groupStart = 0;
    const groupEnds = rowGroups.map(group => groupStart += Number(group.num_rows));
    for (const index of rows) {
        const groupIndex = groupEnds.findIndex(end => index < end);
        groupIncluded[groupIndex] = true;
    }
    // Compute row ranges to fetch
    const rowRanges = [];
    let rangeStart;
    groupStart = 0;
    for (let i = 0; i < groupIncluded.length; i++) {
        const groupEnd = groupStart + Number(rowGroups[i].num_rows);
        if (groupIncluded[i]) {
            if (rangeStart === undefined) {
                rangeStart = groupStart;
            }
        }
        else {
            if (rangeStart !== undefined) {
                rowRanges.push([rangeStart, groupStart]);
                rangeStart = undefined;
            }
        }
        groupStart = groupEnd;
    }
    if (rangeStart !== undefined) {
        rowRanges.push([rangeStart, groupStart]);
    }
    // Fetch by row group and map to rows
    /** @type {(ParquetRow & {__index__: number})[]} */
    const sparseData = Array(Number(options.metadata.num_rows));
    for (const [rangeStart, rangeEnd] of rowRanges) {
        // TODO: fetch in parallel
        const groupData = await (0, read_js_1.parquetReadObjects)({ ...options, rowStart: rangeStart, rowEnd: rangeEnd });
        for (let i = rangeStart; i < rangeEnd; i++) {
            // warning: if the row contains a column named __index__, it will overwrite the index.
            sparseData[i] = { __index__: i, ...groupData[i - rangeStart] };
            if (options.includeRowIndex) {
                Object.defineProperty(sparseData[i], read_js_1.rowIndex, { value: groupData[i - rangeStart][read_js_1.rowIndex] });
            }
        }
    }
    return sparseData;
}
/**
 * @param {any} a
 * @param {any} b
 * @returns {number}
 */
function compare(a, b) {
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    return 0; // TODO: null handling
}

}
], __cache = [];
function __req(i){ if (__cache[i]) return __cache[i].exports; var m = __cache[i] = {exports:{}}; __defs[i](m, m.exports, __req); return m.exports; }
L.hyparquet = __req(0);
};
