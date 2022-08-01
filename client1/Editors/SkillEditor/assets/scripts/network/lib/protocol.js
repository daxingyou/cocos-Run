/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.comm = (function() {

    /**
     * Namespace comm.
     * @exports comm
     * @namespace
     */
    var comm = {};

    comm.Request = (function() {

        /**
         * Properties of a Request.
         * @memberof comm
         * @interface IRequest
         * @property {number|Long|null} [Seq] Request Seq
         * @property {number|null} [CMD] Request CMD
         * @property {Uint8Array|null} [Msg] Request Msg
         */

        /**
         * Constructs a new Request.
         * @memberof comm
         * @classdesc Represents a Request.
         * @implements IRequest
         * @constructor
         * @param {comm.IRequest=} [properties] Properties to set
         */
        function Request(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Request Seq.
         * @member {number|Long} Seq
         * @memberof comm.Request
         * @instance
         */
        Request.prototype.Seq = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Request CMD.
         * @member {number} CMD
         * @memberof comm.Request
         * @instance
         */
        Request.prototype.CMD = 0;

        /**
         * Request Msg.
         * @member {Uint8Array} Msg
         * @memberof comm.Request
         * @instance
         */
        Request.prototype.Msg = $util.newBuffer([]);

        /**
         * Creates a new Request instance using the specified properties.
         * @function create
         * @memberof comm.Request
         * @static
         * @param {comm.IRequest=} [properties] Properties to set
         * @returns {comm.Request} Request instance
         */
        Request.create = function create(properties) {
            return new Request(properties);
        };

        /**
         * Encodes the specified Request message. Does not implicitly {@link comm.Request.verify|verify} messages.
         * @function encode
         * @memberof comm.Request
         * @static
         * @param {comm.IRequest} message Request message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Request.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Seq != null && Object.hasOwnProperty.call(message, "Seq"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.Seq);
            if (message.CMD != null && Object.hasOwnProperty.call(message, "CMD"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.CMD);
            if (message.Msg != null && Object.hasOwnProperty.call(message, "Msg"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.Msg);
            return writer;
        };

        /**
         * Encodes the specified Request message, length delimited. Does not implicitly {@link comm.Request.verify|verify} messages.
         * @function encodeDelimited
         * @memberof comm.Request
         * @static
         * @param {comm.IRequest} message Request message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Request.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Request message from the specified reader or buffer.
         * @function decode
         * @memberof comm.Request
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {comm.Request} Request
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Request.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.comm.Request();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Seq = reader.int64();
                    break;
                case 2:
                    message.CMD = reader.int32();
                    break;
                case 3:
                    message.Msg = reader.bytes();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Request message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof comm.Request
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {comm.Request} Request
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Request.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Request message.
         * @function verify
         * @memberof comm.Request
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Request.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Seq != null && message.hasOwnProperty("Seq"))
                if (!$util.isInteger(message.Seq) && !(message.Seq && $util.isInteger(message.Seq.low) && $util.isInteger(message.Seq.high)))
                    return "Seq: integer|Long expected";
            if (message.CMD != null && message.hasOwnProperty("CMD"))
                if (!$util.isInteger(message.CMD))
                    return "CMD: integer expected";
            if (message.Msg != null && message.hasOwnProperty("Msg"))
                if (!(message.Msg && typeof message.Msg.length === "number" || $util.isString(message.Msg)))
                    return "Msg: buffer expected";
            return null;
        };

        /**
         * Creates a Request message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof comm.Request
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {comm.Request} Request
         */
        Request.fromObject = function fromObject(object) {
            if (object instanceof $root.comm.Request)
                return object;
            var message = new $root.comm.Request();
            if (object.Seq != null)
                if ($util.Long)
                    (message.Seq = $util.Long.fromValue(object.Seq)).unsigned = false;
                else if (typeof object.Seq === "string")
                    message.Seq = parseInt(object.Seq, 10);
                else if (typeof object.Seq === "number")
                    message.Seq = object.Seq;
                else if (typeof object.Seq === "object")
                    message.Seq = new $util.LongBits(object.Seq.low >>> 0, object.Seq.high >>> 0).toNumber();
            if (object.CMD != null)
                message.CMD = object.CMD | 0;
            if (object.Msg != null)
                if (typeof object.Msg === "string")
                    $util.base64.decode(object.Msg, message.Msg = $util.newBuffer($util.base64.length(object.Msg)), 0);
                else if (object.Msg.length)
                    message.Msg = object.Msg;
            return message;
        };

        /**
         * Creates a plain object from a Request message. Also converts values to other types if specified.
         * @function toObject
         * @memberof comm.Request
         * @static
         * @param {comm.Request} message Request
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Request.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.Seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.Seq = options.longs === String ? "0" : 0;
                object.CMD = 0;
                if (options.bytes === String)
                    object.Msg = "";
                else {
                    object.Msg = [];
                    if (options.bytes !== Array)
                        object.Msg = $util.newBuffer(object.Msg);
                }
            }
            if (message.Seq != null && message.hasOwnProperty("Seq"))
                if (typeof message.Seq === "number")
                    object.Seq = options.longs === String ? String(message.Seq) : message.Seq;
                else
                    object.Seq = options.longs === String ? $util.Long.prototype.toString.call(message.Seq) : options.longs === Number ? new $util.LongBits(message.Seq.low >>> 0, message.Seq.high >>> 0).toNumber() : message.Seq;
            if (message.CMD != null && message.hasOwnProperty("CMD"))
                object.CMD = message.CMD;
            if (message.Msg != null && message.hasOwnProperty("Msg"))
                object.Msg = options.bytes === String ? $util.base64.encode(message.Msg, 0, message.Msg.length) : options.bytes === Array ? Array.prototype.slice.call(message.Msg) : message.Msg;
            return object;
        };

        /**
         * Converts this Request to JSON.
         * @function toJSON
         * @memberof comm.Request
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Request.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Request;
    })();

    comm.Response = (function() {

        /**
         * Properties of a Response.
         * @memberof comm
         * @interface IResponse
         * @property {number|Long|null} [Seq] Response Seq
         * @property {number|null} [CMD] Response CMD
         * @property {Uint8Array|null} [Msg] Response Msg
         * @property {number|null} [Errcode] Response Errcode
         * @property {string|null} [Desc] Response Desc
         * @property {boolean|null} [Compressed] Response Compressed
         */

        /**
         * Constructs a new Response.
         * @memberof comm
         * @classdesc Represents a Response.
         * @implements IResponse
         * @constructor
         * @param {comm.IResponse=} [properties] Properties to set
         */
        function Response(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Response Seq.
         * @member {number|Long} Seq
         * @memberof comm.Response
         * @instance
         */
        Response.prototype.Seq = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Response CMD.
         * @member {number} CMD
         * @memberof comm.Response
         * @instance
         */
        Response.prototype.CMD = 0;

        /**
         * Response Msg.
         * @member {Uint8Array} Msg
         * @memberof comm.Response
         * @instance
         */
        Response.prototype.Msg = $util.newBuffer([]);

        /**
         * Response Errcode.
         * @member {number} Errcode
         * @memberof comm.Response
         * @instance
         */
        Response.prototype.Errcode = 0;

        /**
         * Response Desc.
         * @member {string} Desc
         * @memberof comm.Response
         * @instance
         */
        Response.prototype.Desc = "";

        /**
         * Response Compressed.
         * @member {boolean} Compressed
         * @memberof comm.Response
         * @instance
         */
        Response.prototype.Compressed = false;

        /**
         * Creates a new Response instance using the specified properties.
         * @function create
         * @memberof comm.Response
         * @static
         * @param {comm.IResponse=} [properties] Properties to set
         * @returns {comm.Response} Response instance
         */
        Response.create = function create(properties) {
            return new Response(properties);
        };

        /**
         * Encodes the specified Response message. Does not implicitly {@link comm.Response.verify|verify} messages.
         * @function encode
         * @memberof comm.Response
         * @static
         * @param {comm.IResponse} message Response message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Response.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Seq != null && Object.hasOwnProperty.call(message, "Seq"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.Seq);
            if (message.CMD != null && Object.hasOwnProperty.call(message, "CMD"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.CMD);
            if (message.Msg != null && Object.hasOwnProperty.call(message, "Msg"))
                writer.uint32(/* id 3, wireType 2 =*/26).bytes(message.Msg);
            if (message.Errcode != null && Object.hasOwnProperty.call(message, "Errcode"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.Errcode);
            if (message.Desc != null && Object.hasOwnProperty.call(message, "Desc"))
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.Desc);
            if (message.Compressed != null && Object.hasOwnProperty.call(message, "Compressed"))
                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.Compressed);
            return writer;
        };

        /**
         * Encodes the specified Response message, length delimited. Does not implicitly {@link comm.Response.verify|verify} messages.
         * @function encodeDelimited
         * @memberof comm.Response
         * @static
         * @param {comm.IResponse} message Response message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Response.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Response message from the specified reader or buffer.
         * @function decode
         * @memberof comm.Response
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {comm.Response} Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Response.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.comm.Response();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Seq = reader.int64();
                    break;
                case 2:
                    message.CMD = reader.int32();
                    break;
                case 3:
                    message.Msg = reader.bytes();
                    break;
                case 4:
                    message.Errcode = reader.int32();
                    break;
                case 5:
                    message.Desc = reader.string();
                    break;
                case 6:
                    message.Compressed = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Response message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof comm.Response
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {comm.Response} Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Response.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Response message.
         * @function verify
         * @memberof comm.Response
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Response.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Seq != null && message.hasOwnProperty("Seq"))
                if (!$util.isInteger(message.Seq) && !(message.Seq && $util.isInteger(message.Seq.low) && $util.isInteger(message.Seq.high)))
                    return "Seq: integer|Long expected";
            if (message.CMD != null && message.hasOwnProperty("CMD"))
                if (!$util.isInteger(message.CMD))
                    return "CMD: integer expected";
            if (message.Msg != null && message.hasOwnProperty("Msg"))
                if (!(message.Msg && typeof message.Msg.length === "number" || $util.isString(message.Msg)))
                    return "Msg: buffer expected";
            if (message.Errcode != null && message.hasOwnProperty("Errcode"))
                if (!$util.isInteger(message.Errcode))
                    return "Errcode: integer expected";
            if (message.Desc != null && message.hasOwnProperty("Desc"))
                if (!$util.isString(message.Desc))
                    return "Desc: string expected";
            if (message.Compressed != null && message.hasOwnProperty("Compressed"))
                if (typeof message.Compressed !== "boolean")
                    return "Compressed: boolean expected";
            return null;
        };

        /**
         * Creates a Response message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof comm.Response
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {comm.Response} Response
         */
        Response.fromObject = function fromObject(object) {
            if (object instanceof $root.comm.Response)
                return object;
            var message = new $root.comm.Response();
            if (object.Seq != null)
                if ($util.Long)
                    (message.Seq = $util.Long.fromValue(object.Seq)).unsigned = false;
                else if (typeof object.Seq === "string")
                    message.Seq = parseInt(object.Seq, 10);
                else if (typeof object.Seq === "number")
                    message.Seq = object.Seq;
                else if (typeof object.Seq === "object")
                    message.Seq = new $util.LongBits(object.Seq.low >>> 0, object.Seq.high >>> 0).toNumber();
            if (object.CMD != null)
                message.CMD = object.CMD | 0;
            if (object.Msg != null)
                if (typeof object.Msg === "string")
                    $util.base64.decode(object.Msg, message.Msg = $util.newBuffer($util.base64.length(object.Msg)), 0);
                else if (object.Msg.length)
                    message.Msg = object.Msg;
            if (object.Errcode != null)
                message.Errcode = object.Errcode | 0;
            if (object.Desc != null)
                message.Desc = String(object.Desc);
            if (object.Compressed != null)
                message.Compressed = Boolean(object.Compressed);
            return message;
        };

        /**
         * Creates a plain object from a Response message. Also converts values to other types if specified.
         * @function toObject
         * @memberof comm.Response
         * @static
         * @param {comm.Response} message Response
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Response.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.Seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.Seq = options.longs === String ? "0" : 0;
                object.CMD = 0;
                if (options.bytes === String)
                    object.Msg = "";
                else {
                    object.Msg = [];
                    if (options.bytes !== Array)
                        object.Msg = $util.newBuffer(object.Msg);
                }
                object.Errcode = 0;
                object.Desc = "";
                object.Compressed = false;
            }
            if (message.Seq != null && message.hasOwnProperty("Seq"))
                if (typeof message.Seq === "number")
                    object.Seq = options.longs === String ? String(message.Seq) : message.Seq;
                else
                    object.Seq = options.longs === String ? $util.Long.prototype.toString.call(message.Seq) : options.longs === Number ? new $util.LongBits(message.Seq.low >>> 0, message.Seq.high >>> 0).toNumber() : message.Seq;
            if (message.CMD != null && message.hasOwnProperty("CMD"))
                object.CMD = message.CMD;
            if (message.Msg != null && message.hasOwnProperty("Msg"))
                object.Msg = options.bytes === String ? $util.base64.encode(message.Msg, 0, message.Msg.length) : options.bytes === Array ? Array.prototype.slice.call(message.Msg) : message.Msg;
            if (message.Errcode != null && message.hasOwnProperty("Errcode"))
                object.Errcode = message.Errcode;
            if (message.Desc != null && message.hasOwnProperty("Desc"))
                object.Desc = message.Desc;
            if (message.Compressed != null && message.hasOwnProperty("Compressed"))
                object.Compressed = message.Compressed;
            return object;
        };

        /**
         * Converts this Response to JSON.
         * @function toJSON
         * @memberof comm.Response
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Response.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Response;
    })();

    return comm;
})();

$root.data = (function() {

    /**
     * Namespace data.
     * @exports data
     * @namespace
     */
    var data = {};

    data.AccountData = (function() {

        /**
         * Properties of an AccountData.
         * @memberof data
         * @interface IAccountData
         * @property {string|null} [UserID] AccountData UserID
         * @property {number|Long|null} [RegisterTime] AccountData RegisterTime
         * @property {number|Long|null} [LastLoginTime] AccountData LastLoginTime
         * @property {string|null} [Name] AccountData Name
         * @property {number|null} [HeadID] AccountData HeadID
         * @property {number|null} [HeadFrameID] AccountData HeadFrameID
         * @property {number|null} [ChangeNameCounter] AccountData ChangeNameCounter
         * @property {number|null} [Exp] AccountData Exp
         * @property {number|null} [RealNameStatus] AccountData RealNameStatus
         * @property {boolean|null} [IsTeenager] AccountData IsTeenager
         */

        /**
         * Constructs a new AccountData.
         * @memberof data
         * @classdesc Represents an AccountData.
         * @implements IAccountData
         * @constructor
         * @param {data.IAccountData=} [properties] Properties to set
         */
        function AccountData(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AccountData UserID.
         * @member {string} UserID
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.UserID = "";

        /**
         * AccountData RegisterTime.
         * @member {number|Long} RegisterTime
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.RegisterTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * AccountData LastLoginTime.
         * @member {number|Long} LastLoginTime
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.LastLoginTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * AccountData Name.
         * @member {string} Name
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.Name = "";

        /**
         * AccountData HeadID.
         * @member {number} HeadID
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.HeadID = 0;

        /**
         * AccountData HeadFrameID.
         * @member {number} HeadFrameID
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.HeadFrameID = 0;

        /**
         * AccountData ChangeNameCounter.
         * @member {number} ChangeNameCounter
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.ChangeNameCounter = 0;

        /**
         * AccountData Exp.
         * @member {number} Exp
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.Exp = 0;

        /**
         * AccountData RealNameStatus.
         * @member {number} RealNameStatus
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.RealNameStatus = 0;

        /**
         * AccountData IsTeenager.
         * @member {boolean} IsTeenager
         * @memberof data.AccountData
         * @instance
         */
        AccountData.prototype.IsTeenager = false;

        /**
         * Creates a new AccountData instance using the specified properties.
         * @function create
         * @memberof data.AccountData
         * @static
         * @param {data.IAccountData=} [properties] Properties to set
         * @returns {data.AccountData} AccountData instance
         */
        AccountData.create = function create(properties) {
            return new AccountData(properties);
        };

        /**
         * Encodes the specified AccountData message. Does not implicitly {@link data.AccountData.verify|verify} messages.
         * @function encode
         * @memberof data.AccountData
         * @static
         * @param {data.IAccountData} message AccountData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserID != null && Object.hasOwnProperty.call(message, "UserID"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserID);
            if (message.RegisterTime != null && Object.hasOwnProperty.call(message, "RegisterTime"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.RegisterTime);
            if (message.LastLoginTime != null && Object.hasOwnProperty.call(message, "LastLoginTime"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.LastLoginTime);
            if (message.Name != null && Object.hasOwnProperty.call(message, "Name"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.Name);
            if (message.HeadID != null && Object.hasOwnProperty.call(message, "HeadID"))
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.HeadID);
            if (message.HeadFrameID != null && Object.hasOwnProperty.call(message, "HeadFrameID"))
                writer.uint32(/* id 12, wireType 0 =*/96).int32(message.HeadFrameID);
            if (message.ChangeNameCounter != null && Object.hasOwnProperty.call(message, "ChangeNameCounter"))
                writer.uint32(/* id 13, wireType 0 =*/104).int32(message.ChangeNameCounter);
            if (message.Exp != null && Object.hasOwnProperty.call(message, "Exp"))
                writer.uint32(/* id 14, wireType 0 =*/112).int32(message.Exp);
            if (message.RealNameStatus != null && Object.hasOwnProperty.call(message, "RealNameStatus"))
                writer.uint32(/* id 20, wireType 0 =*/160).int32(message.RealNameStatus);
            if (message.IsTeenager != null && Object.hasOwnProperty.call(message, "IsTeenager"))
                writer.uint32(/* id 21, wireType 0 =*/168).bool(message.IsTeenager);
            return writer;
        };

        /**
         * Encodes the specified AccountData message, length delimited. Does not implicitly {@link data.AccountData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.AccountData
         * @static
         * @param {data.IAccountData} message AccountData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AccountData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AccountData message from the specified reader or buffer.
         * @function decode
         * @memberof data.AccountData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.AccountData} AccountData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.AccountData();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserID = reader.string();
                    break;
                case 2:
                    message.RegisterTime = reader.int64();
                    break;
                case 3:
                    message.LastLoginTime = reader.int64();
                    break;
                case 10:
                    message.Name = reader.string();
                    break;
                case 11:
                    message.HeadID = reader.int32();
                    break;
                case 12:
                    message.HeadFrameID = reader.int32();
                    break;
                case 13:
                    message.ChangeNameCounter = reader.int32();
                    break;
                case 14:
                    message.Exp = reader.int32();
                    break;
                case 20:
                    message.RealNameStatus = reader.int32();
                    break;
                case 21:
                    message.IsTeenager = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AccountData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.AccountData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.AccountData} AccountData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AccountData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AccountData message.
         * @function verify
         * @memberof data.AccountData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AccountData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                if (!$util.isString(message.UserID))
                    return "UserID: string expected";
            if (message.RegisterTime != null && message.hasOwnProperty("RegisterTime"))
                if (!$util.isInteger(message.RegisterTime) && !(message.RegisterTime && $util.isInteger(message.RegisterTime.low) && $util.isInteger(message.RegisterTime.high)))
                    return "RegisterTime: integer|Long expected";
            if (message.LastLoginTime != null && message.hasOwnProperty("LastLoginTime"))
                if (!$util.isInteger(message.LastLoginTime) && !(message.LastLoginTime && $util.isInteger(message.LastLoginTime.low) && $util.isInteger(message.LastLoginTime.high)))
                    return "LastLoginTime: integer|Long expected";
            if (message.Name != null && message.hasOwnProperty("Name"))
                if (!$util.isString(message.Name))
                    return "Name: string expected";
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                if (!$util.isInteger(message.HeadID))
                    return "HeadID: integer expected";
            if (message.HeadFrameID != null && message.hasOwnProperty("HeadFrameID"))
                if (!$util.isInteger(message.HeadFrameID))
                    return "HeadFrameID: integer expected";
            if (message.ChangeNameCounter != null && message.hasOwnProperty("ChangeNameCounter"))
                if (!$util.isInteger(message.ChangeNameCounter))
                    return "ChangeNameCounter: integer expected";
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                if (!$util.isInteger(message.Exp))
                    return "Exp: integer expected";
            if (message.RealNameStatus != null && message.hasOwnProperty("RealNameStatus"))
                if (!$util.isInteger(message.RealNameStatus))
                    return "RealNameStatus: integer expected";
            if (message.IsTeenager != null && message.hasOwnProperty("IsTeenager"))
                if (typeof message.IsTeenager !== "boolean")
                    return "IsTeenager: boolean expected";
            return null;
        };

        /**
         * Creates an AccountData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.AccountData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.AccountData} AccountData
         */
        AccountData.fromObject = function fromObject(object) {
            if (object instanceof $root.data.AccountData)
                return object;
            var message = new $root.data.AccountData();
            if (object.UserID != null)
                message.UserID = String(object.UserID);
            if (object.RegisterTime != null)
                if ($util.Long)
                    (message.RegisterTime = $util.Long.fromValue(object.RegisterTime)).unsigned = false;
                else if (typeof object.RegisterTime === "string")
                    message.RegisterTime = parseInt(object.RegisterTime, 10);
                else if (typeof object.RegisterTime === "number")
                    message.RegisterTime = object.RegisterTime;
                else if (typeof object.RegisterTime === "object")
                    message.RegisterTime = new $util.LongBits(object.RegisterTime.low >>> 0, object.RegisterTime.high >>> 0).toNumber();
            if (object.LastLoginTime != null)
                if ($util.Long)
                    (message.LastLoginTime = $util.Long.fromValue(object.LastLoginTime)).unsigned = false;
                else if (typeof object.LastLoginTime === "string")
                    message.LastLoginTime = parseInt(object.LastLoginTime, 10);
                else if (typeof object.LastLoginTime === "number")
                    message.LastLoginTime = object.LastLoginTime;
                else if (typeof object.LastLoginTime === "object")
                    message.LastLoginTime = new $util.LongBits(object.LastLoginTime.low >>> 0, object.LastLoginTime.high >>> 0).toNumber();
            if (object.Name != null)
                message.Name = String(object.Name);
            if (object.HeadID != null)
                message.HeadID = object.HeadID | 0;
            if (object.HeadFrameID != null)
                message.HeadFrameID = object.HeadFrameID | 0;
            if (object.ChangeNameCounter != null)
                message.ChangeNameCounter = object.ChangeNameCounter | 0;
            if (object.Exp != null)
                message.Exp = object.Exp | 0;
            if (object.RealNameStatus != null)
                message.RealNameStatus = object.RealNameStatus | 0;
            if (object.IsTeenager != null)
                message.IsTeenager = Boolean(object.IsTeenager);
            return message;
        };

        /**
         * Creates a plain object from an AccountData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.AccountData
         * @static
         * @param {data.AccountData} message AccountData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AccountData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.UserID = "";
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.RegisterTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.RegisterTime = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.LastLoginTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.LastLoginTime = options.longs === String ? "0" : 0;
                object.Name = "";
                object.HeadID = 0;
                object.HeadFrameID = 0;
                object.ChangeNameCounter = 0;
                object.Exp = 0;
                object.RealNameStatus = 0;
                object.IsTeenager = false;
            }
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                object.UserID = message.UserID;
            if (message.RegisterTime != null && message.hasOwnProperty("RegisterTime"))
                if (typeof message.RegisterTime === "number")
                    object.RegisterTime = options.longs === String ? String(message.RegisterTime) : message.RegisterTime;
                else
                    object.RegisterTime = options.longs === String ? $util.Long.prototype.toString.call(message.RegisterTime) : options.longs === Number ? new $util.LongBits(message.RegisterTime.low >>> 0, message.RegisterTime.high >>> 0).toNumber() : message.RegisterTime;
            if (message.LastLoginTime != null && message.hasOwnProperty("LastLoginTime"))
                if (typeof message.LastLoginTime === "number")
                    object.LastLoginTime = options.longs === String ? String(message.LastLoginTime) : message.LastLoginTime;
                else
                    object.LastLoginTime = options.longs === String ? $util.Long.prototype.toString.call(message.LastLoginTime) : options.longs === Number ? new $util.LongBits(message.LastLoginTime.low >>> 0, message.LastLoginTime.high >>> 0).toNumber() : message.LastLoginTime;
            if (message.Name != null && message.hasOwnProperty("Name"))
                object.Name = message.Name;
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                object.HeadID = message.HeadID;
            if (message.HeadFrameID != null && message.hasOwnProperty("HeadFrameID"))
                object.HeadFrameID = message.HeadFrameID;
            if (message.ChangeNameCounter != null && message.hasOwnProperty("ChangeNameCounter"))
                object.ChangeNameCounter = message.ChangeNameCounter;
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                object.Exp = message.Exp;
            if (message.RealNameStatus != null && message.hasOwnProperty("RealNameStatus"))
                object.RealNameStatus = message.RealNameStatus;
            if (message.IsTeenager != null && message.hasOwnProperty("IsTeenager"))
                object.IsTeenager = message.IsTeenager;
            return object;
        };

        /**
         * Converts this AccountData to JSON.
         * @function toJSON
         * @memberof data.AccountData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AccountData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AccountData;
    })();

    data.Prize = (function() {

        /**
         * Properties of a Prize.
         * @memberof data
         * @interface IPrize
         * @property {number|null} [ID] Prize ID
         * @property {number|Long|null} [Count] Prize Count
         */

        /**
         * Constructs a new Prize.
         * @memberof data
         * @classdesc Represents a Prize.
         * @implements IPrize
         * @constructor
         * @param {data.IPrize=} [properties] Properties to set
         */
        function Prize(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Prize ID.
         * @member {number} ID
         * @memberof data.Prize
         * @instance
         */
        Prize.prototype.ID = 0;

        /**
         * Prize Count.
         * @member {number|Long} Count
         * @memberof data.Prize
         * @instance
         */
        Prize.prototype.Count = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new Prize instance using the specified properties.
         * @function create
         * @memberof data.Prize
         * @static
         * @param {data.IPrize=} [properties] Properties to set
         * @returns {data.Prize} Prize instance
         */
        Prize.create = function create(properties) {
            return new Prize(properties);
        };

        /**
         * Encodes the specified Prize message. Does not implicitly {@link data.Prize.verify|verify} messages.
         * @function encode
         * @memberof data.Prize
         * @static
         * @param {data.IPrize} message Prize message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Prize.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ID != null && Object.hasOwnProperty.call(message, "ID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.ID);
            if (message.Count != null && Object.hasOwnProperty.call(message, "Count"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.Count);
            return writer;
        };

        /**
         * Encodes the specified Prize message, length delimited. Does not implicitly {@link data.Prize.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.Prize
         * @static
         * @param {data.IPrize} message Prize message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Prize.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a Prize message from the specified reader or buffer.
         * @function decode
         * @memberof data.Prize
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.Prize} Prize
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Prize.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.Prize();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.ID = reader.int32();
                    break;
                case 2:
                    message.Count = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a Prize message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.Prize
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.Prize} Prize
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Prize.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Prize message.
         * @function verify
         * @memberof data.Prize
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Prize.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ID != null && message.hasOwnProperty("ID"))
                if (!$util.isInteger(message.ID))
                    return "ID: integer expected";
            if (message.Count != null && message.hasOwnProperty("Count"))
                if (!$util.isInteger(message.Count) && !(message.Count && $util.isInteger(message.Count.low) && $util.isInteger(message.Count.high)))
                    return "Count: integer|Long expected";
            return null;
        };

        /**
         * Creates a Prize message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.Prize
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.Prize} Prize
         */
        Prize.fromObject = function fromObject(object) {
            if (object instanceof $root.data.Prize)
                return object;
            var message = new $root.data.Prize();
            if (object.ID != null)
                message.ID = object.ID | 0;
            if (object.Count != null)
                if ($util.Long)
                    (message.Count = $util.Long.fromValue(object.Count)).unsigned = false;
                else if (typeof object.Count === "string")
                    message.Count = parseInt(object.Count, 10);
                else if (typeof object.Count === "number")
                    message.Count = object.Count;
                else if (typeof object.Count === "object")
                    message.Count = new $util.LongBits(object.Count.low >>> 0, object.Count.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a Prize message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.Prize
         * @static
         * @param {data.Prize} message Prize
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Prize.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.ID = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.Count = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.Count = options.longs === String ? "0" : 0;
            }
            if (message.ID != null && message.hasOwnProperty("ID"))
                object.ID = message.ID;
            if (message.Count != null && message.hasOwnProperty("Count"))
                if (typeof message.Count === "number")
                    object.Count = options.longs === String ? String(message.Count) : message.Count;
                else
                    object.Count = options.longs === String ? $util.Long.prototype.toString.call(message.Count) : options.longs === Number ? new $util.LongBits(message.Count.low >>> 0, message.Count.high >>> 0).toNumber() : message.Count;
            return object;
        };

        /**
         * Converts this Prize to JSON.
         * @function toJSON
         * @memberof data.Prize
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Prize.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return Prize;
    })();

    data.HeroUnit = (function() {

        /**
         * Properties of a HeroUnit.
         * @memberof data
         * @interface IHeroUnit
         * @property {number|null} [Exp] HeroUnit Exp
         * @property {number|null} [Star] HeroUnit Star
         * @property {Object.<string,data.IBagUnit>|null} [Equips] HeroUnit Equips
         */

        /**
         * Constructs a new HeroUnit.
         * @memberof data
         * @classdesc Represents a HeroUnit.
         * @implements IHeroUnit
         * @constructor
         * @param {data.IHeroUnit=} [properties] Properties to set
         */
        function HeroUnit(properties) {
            this.Equips = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HeroUnit Exp.
         * @member {number} Exp
         * @memberof data.HeroUnit
         * @instance
         */
        HeroUnit.prototype.Exp = 0;

        /**
         * HeroUnit Star.
         * @member {number} Star
         * @memberof data.HeroUnit
         * @instance
         */
        HeroUnit.prototype.Star = 0;

        /**
         * HeroUnit Equips.
         * @member {Object.<string,data.IBagUnit>} Equips
         * @memberof data.HeroUnit
         * @instance
         */
        HeroUnit.prototype.Equips = $util.emptyObject;

        /**
         * Creates a new HeroUnit instance using the specified properties.
         * @function create
         * @memberof data.HeroUnit
         * @static
         * @param {data.IHeroUnit=} [properties] Properties to set
         * @returns {data.HeroUnit} HeroUnit instance
         */
        HeroUnit.create = function create(properties) {
            return new HeroUnit(properties);
        };

        /**
         * Encodes the specified HeroUnit message. Does not implicitly {@link data.HeroUnit.verify|verify} messages.
         * @function encode
         * @memberof data.HeroUnit
         * @static
         * @param {data.IHeroUnit} message HeroUnit message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeroUnit.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Exp != null && Object.hasOwnProperty.call(message, "Exp"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.Exp);
            if (message.Star != null && Object.hasOwnProperty.call(message, "Star"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Star);
            if (message.Equips != null && Object.hasOwnProperty.call(message, "Equips"))
                for (var keys = Object.keys(message.Equips), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 3, wireType 2 =*/26).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.data.BagUnit.encode(message.Equips[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified HeroUnit message, length delimited. Does not implicitly {@link data.HeroUnit.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.HeroUnit
         * @static
         * @param {data.IHeroUnit} message HeroUnit message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeroUnit.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HeroUnit message from the specified reader or buffer.
         * @function decode
         * @memberof data.HeroUnit
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.HeroUnit} HeroUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeroUnit.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.HeroUnit(), key, value;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Exp = reader.int32();
                    break;
                case 2:
                    message.Star = reader.int32();
                    break;
                case 3:
                    if (message.Equips === $util.emptyObject)
                        message.Equips = {};
                    var end2 = reader.uint32() + reader.pos;
                    key = 0;
                    value = null;
                    while (reader.pos < end2) {
                        var tag2 = reader.uint32();
                        switch (tag2 >>> 3) {
                        case 1:
                            key = reader.int32();
                            break;
                        case 2:
                            value = $root.data.BagUnit.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag2 & 7);
                            break;
                        }
                    }
                    message.Equips[key] = value;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HeroUnit message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.HeroUnit
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.HeroUnit} HeroUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeroUnit.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HeroUnit message.
         * @function verify
         * @memberof data.HeroUnit
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeroUnit.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                if (!$util.isInteger(message.Exp))
                    return "Exp: integer expected";
            if (message.Star != null && message.hasOwnProperty("Star"))
                if (!$util.isInteger(message.Star))
                    return "Star: integer expected";
            if (message.Equips != null && message.hasOwnProperty("Equips")) {
                if (!$util.isObject(message.Equips))
                    return "Equips: object expected";
                var key = Object.keys(message.Equips);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "Equips: integer key{k:int32} expected";
                    {
                        var error = $root.data.BagUnit.verify(message.Equips[key[i]]);
                        if (error)
                            return "Equips." + error;
                    }
                }
            }
            return null;
        };

        /**
         * Creates a HeroUnit message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.HeroUnit
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.HeroUnit} HeroUnit
         */
        HeroUnit.fromObject = function fromObject(object) {
            if (object instanceof $root.data.HeroUnit)
                return object;
            var message = new $root.data.HeroUnit();
            if (object.Exp != null)
                message.Exp = object.Exp | 0;
            if (object.Star != null)
                message.Star = object.Star | 0;
            if (object.Equips) {
                if (typeof object.Equips !== "object")
                    throw TypeError(".data.HeroUnit.Equips: object expected");
                message.Equips = {};
                for (var keys = Object.keys(object.Equips), i = 0; i < keys.length; ++i) {
                    if (typeof object.Equips[keys[i]] !== "object")
                        throw TypeError(".data.HeroUnit.Equips: object expected");
                    message.Equips[keys[i]] = $root.data.BagUnit.fromObject(object.Equips[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a HeroUnit message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.HeroUnit
         * @static
         * @param {data.HeroUnit} message HeroUnit
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeroUnit.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.Equips = {};
            if (options.defaults) {
                object.Exp = 0;
                object.Star = 0;
            }
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                object.Exp = message.Exp;
            if (message.Star != null && message.hasOwnProperty("Star"))
                object.Star = message.Star;
            var keys2;
            if (message.Equips && (keys2 = Object.keys(message.Equips)).length) {
                object.Equips = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.Equips[keys2[j]] = $root.data.BagUnit.toObject(message.Equips[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this HeroUnit to JSON.
         * @function toJSON
         * @memberof data.HeroUnit
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeroUnit.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HeroUnit;
    })();

    data.EquipUnit = (function() {

        /**
         * Properties of an EquipUnit.
         * @memberof data
         * @interface IEquipUnit
         * @property {number|null} [Exp] EquipUnit Exp
         * @property {number|null} [Star] EquipUnit Star
         */

        /**
         * Constructs a new EquipUnit.
         * @memberof data
         * @classdesc Represents an EquipUnit.
         * @implements IEquipUnit
         * @constructor
         * @param {data.IEquipUnit=} [properties] Properties to set
         */
        function EquipUnit(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EquipUnit Exp.
         * @member {number} Exp
         * @memberof data.EquipUnit
         * @instance
         */
        EquipUnit.prototype.Exp = 0;

        /**
         * EquipUnit Star.
         * @member {number} Star
         * @memberof data.EquipUnit
         * @instance
         */
        EquipUnit.prototype.Star = 0;

        /**
         * Creates a new EquipUnit instance using the specified properties.
         * @function create
         * @memberof data.EquipUnit
         * @static
         * @param {data.IEquipUnit=} [properties] Properties to set
         * @returns {data.EquipUnit} EquipUnit instance
         */
        EquipUnit.create = function create(properties) {
            return new EquipUnit(properties);
        };

        /**
         * Encodes the specified EquipUnit message. Does not implicitly {@link data.EquipUnit.verify|verify} messages.
         * @function encode
         * @memberof data.EquipUnit
         * @static
         * @param {data.IEquipUnit} message EquipUnit message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EquipUnit.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Exp != null && Object.hasOwnProperty.call(message, "Exp"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.Exp);
            if (message.Star != null && Object.hasOwnProperty.call(message, "Star"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Star);
            return writer;
        };

        /**
         * Encodes the specified EquipUnit message, length delimited. Does not implicitly {@link data.EquipUnit.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.EquipUnit
         * @static
         * @param {data.IEquipUnit} message EquipUnit message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EquipUnit.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EquipUnit message from the specified reader or buffer.
         * @function decode
         * @memberof data.EquipUnit
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.EquipUnit} EquipUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EquipUnit.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.EquipUnit();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Exp = reader.int32();
                    break;
                case 2:
                    message.Star = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EquipUnit message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.EquipUnit
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.EquipUnit} EquipUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EquipUnit.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EquipUnit message.
         * @function verify
         * @memberof data.EquipUnit
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EquipUnit.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                if (!$util.isInteger(message.Exp))
                    return "Exp: integer expected";
            if (message.Star != null && message.hasOwnProperty("Star"))
                if (!$util.isInteger(message.Star))
                    return "Star: integer expected";
            return null;
        };

        /**
         * Creates an EquipUnit message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.EquipUnit
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.EquipUnit} EquipUnit
         */
        EquipUnit.fromObject = function fromObject(object) {
            if (object instanceof $root.data.EquipUnit)
                return object;
            var message = new $root.data.EquipUnit();
            if (object.Exp != null)
                message.Exp = object.Exp | 0;
            if (object.Star != null)
                message.Star = object.Star | 0;
            return message;
        };

        /**
         * Creates a plain object from an EquipUnit message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.EquipUnit
         * @static
         * @param {data.EquipUnit} message EquipUnit
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EquipUnit.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.Exp = 0;
                object.Star = 0;
            }
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                object.Exp = message.Exp;
            if (message.Star != null && message.hasOwnProperty("Star"))
                object.Star = message.Star;
            return object;
        };

        /**
         * Converts this EquipUnit to JSON.
         * @function toJSON
         * @memberof data.EquipUnit
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EquipUnit.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return EquipUnit;
    })();

    data.BagUnit = (function() {

        /**
         * Properties of a BagUnit.
         * @memberof data
         * @interface IBagUnit
         * @property {number|Long|null} [Seq] BagUnit Seq
         * @property {number|null} [ID] BagUnit ID
         * @property {number|Long|null} [Count] BagUnit Count
         * @property {number|Long|null} [UpdateTime] BagUnit UpdateTime
         * @property {boolean|null} [Combinable] BagUnit Combinable
         * @property {data.IHeroUnit|null} [HeroUnit] BagUnit HeroUnit
         * @property {data.IEquipUnit|null} [EquipUnit] BagUnit EquipUnit
         */

        /**
         * Constructs a new BagUnit.
         * @memberof data
         * @classdesc Represents a BagUnit.
         * @implements IBagUnit
         * @constructor
         * @param {data.IBagUnit=} [properties] Properties to set
         */
        function BagUnit(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BagUnit Seq.
         * @member {number|Long} Seq
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.Seq = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * BagUnit ID.
         * @member {number} ID
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.ID = 0;

        /**
         * BagUnit Count.
         * @member {number|Long} Count
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.Count = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * BagUnit UpdateTime.
         * @member {number|Long} UpdateTime
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.UpdateTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * BagUnit Combinable.
         * @member {boolean} Combinable
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.Combinable = false;

        /**
         * BagUnit HeroUnit.
         * @member {data.IHeroUnit|null|undefined} HeroUnit
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.HeroUnit = null;

        /**
         * BagUnit EquipUnit.
         * @member {data.IEquipUnit|null|undefined} EquipUnit
         * @memberof data.BagUnit
         * @instance
         */
        BagUnit.prototype.EquipUnit = null;

        /**
         * Creates a new BagUnit instance using the specified properties.
         * @function create
         * @memberof data.BagUnit
         * @static
         * @param {data.IBagUnit=} [properties] Properties to set
         * @returns {data.BagUnit} BagUnit instance
         */
        BagUnit.create = function create(properties) {
            return new BagUnit(properties);
        };

        /**
         * Encodes the specified BagUnit message. Does not implicitly {@link data.BagUnit.verify|verify} messages.
         * @function encode
         * @memberof data.BagUnit
         * @static
         * @param {data.IBagUnit} message BagUnit message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BagUnit.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Seq != null && Object.hasOwnProperty.call(message, "Seq"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.Seq);
            if (message.ID != null && Object.hasOwnProperty.call(message, "ID"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.ID);
            if (message.Count != null && Object.hasOwnProperty.call(message, "Count"))
                writer.uint32(/* id 3, wireType 0 =*/24).int64(message.Count);
            if (message.UpdateTime != null && Object.hasOwnProperty.call(message, "UpdateTime"))
                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.UpdateTime);
            if (message.Combinable != null && Object.hasOwnProperty.call(message, "Combinable"))
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.Combinable);
            if (message.HeroUnit != null && Object.hasOwnProperty.call(message, "HeroUnit"))
                $root.data.HeroUnit.encode(message.HeroUnit, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
            if (message.EquipUnit != null && Object.hasOwnProperty.call(message, "EquipUnit"))
                $root.data.EquipUnit.encode(message.EquipUnit, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified BagUnit message, length delimited. Does not implicitly {@link data.BagUnit.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.BagUnit
         * @static
         * @param {data.IBagUnit} message BagUnit message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BagUnit.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BagUnit message from the specified reader or buffer.
         * @function decode
         * @memberof data.BagUnit
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.BagUnit} BagUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BagUnit.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.BagUnit();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Seq = reader.int64();
                    break;
                case 2:
                    message.ID = reader.int32();
                    break;
                case 3:
                    message.Count = reader.int64();
                    break;
                case 4:
                    message.UpdateTime = reader.int64();
                    break;
                case 5:
                    message.Combinable = reader.bool();
                    break;
                case 12:
                    message.HeroUnit = $root.data.HeroUnit.decode(reader, reader.uint32());
                    break;
                case 13:
                    message.EquipUnit = $root.data.EquipUnit.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BagUnit message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.BagUnit
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.BagUnit} BagUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BagUnit.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BagUnit message.
         * @function verify
         * @memberof data.BagUnit
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BagUnit.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Seq != null && message.hasOwnProperty("Seq"))
                if (!$util.isInteger(message.Seq) && !(message.Seq && $util.isInteger(message.Seq.low) && $util.isInteger(message.Seq.high)))
                    return "Seq: integer|Long expected";
            if (message.ID != null && message.hasOwnProperty("ID"))
                if (!$util.isInteger(message.ID))
                    return "ID: integer expected";
            if (message.Count != null && message.hasOwnProperty("Count"))
                if (!$util.isInteger(message.Count) && !(message.Count && $util.isInteger(message.Count.low) && $util.isInteger(message.Count.high)))
                    return "Count: integer|Long expected";
            if (message.UpdateTime != null && message.hasOwnProperty("UpdateTime"))
                if (!$util.isInteger(message.UpdateTime) && !(message.UpdateTime && $util.isInteger(message.UpdateTime.low) && $util.isInteger(message.UpdateTime.high)))
                    return "UpdateTime: integer|Long expected";
            if (message.Combinable != null && message.hasOwnProperty("Combinable"))
                if (typeof message.Combinable !== "boolean")
                    return "Combinable: boolean expected";
            if (message.HeroUnit != null && message.hasOwnProperty("HeroUnit")) {
                var error = $root.data.HeroUnit.verify(message.HeroUnit);
                if (error)
                    return "HeroUnit." + error;
            }
            if (message.EquipUnit != null && message.hasOwnProperty("EquipUnit")) {
                var error = $root.data.EquipUnit.verify(message.EquipUnit);
                if (error)
                    return "EquipUnit." + error;
            }
            return null;
        };

        /**
         * Creates a BagUnit message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.BagUnit
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.BagUnit} BagUnit
         */
        BagUnit.fromObject = function fromObject(object) {
            if (object instanceof $root.data.BagUnit)
                return object;
            var message = new $root.data.BagUnit();
            if (object.Seq != null)
                if ($util.Long)
                    (message.Seq = $util.Long.fromValue(object.Seq)).unsigned = false;
                else if (typeof object.Seq === "string")
                    message.Seq = parseInt(object.Seq, 10);
                else if (typeof object.Seq === "number")
                    message.Seq = object.Seq;
                else if (typeof object.Seq === "object")
                    message.Seq = new $util.LongBits(object.Seq.low >>> 0, object.Seq.high >>> 0).toNumber();
            if (object.ID != null)
                message.ID = object.ID | 0;
            if (object.Count != null)
                if ($util.Long)
                    (message.Count = $util.Long.fromValue(object.Count)).unsigned = false;
                else if (typeof object.Count === "string")
                    message.Count = parseInt(object.Count, 10);
                else if (typeof object.Count === "number")
                    message.Count = object.Count;
                else if (typeof object.Count === "object")
                    message.Count = new $util.LongBits(object.Count.low >>> 0, object.Count.high >>> 0).toNumber();
            if (object.UpdateTime != null)
                if ($util.Long)
                    (message.UpdateTime = $util.Long.fromValue(object.UpdateTime)).unsigned = false;
                else if (typeof object.UpdateTime === "string")
                    message.UpdateTime = parseInt(object.UpdateTime, 10);
                else if (typeof object.UpdateTime === "number")
                    message.UpdateTime = object.UpdateTime;
                else if (typeof object.UpdateTime === "object")
                    message.UpdateTime = new $util.LongBits(object.UpdateTime.low >>> 0, object.UpdateTime.high >>> 0).toNumber();
            if (object.Combinable != null)
                message.Combinable = Boolean(object.Combinable);
            if (object.HeroUnit != null) {
                if (typeof object.HeroUnit !== "object")
                    throw TypeError(".data.BagUnit.HeroUnit: object expected");
                message.HeroUnit = $root.data.HeroUnit.fromObject(object.HeroUnit);
            }
            if (object.EquipUnit != null) {
                if (typeof object.EquipUnit !== "object")
                    throw TypeError(".data.BagUnit.EquipUnit: object expected");
                message.EquipUnit = $root.data.EquipUnit.fromObject(object.EquipUnit);
            }
            return message;
        };

        /**
         * Creates a plain object from a BagUnit message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.BagUnit
         * @static
         * @param {data.BagUnit} message BagUnit
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BagUnit.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.Seq = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.Seq = options.longs === String ? "0" : 0;
                object.ID = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.Count = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.Count = options.longs === String ? "0" : 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.UpdateTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.UpdateTime = options.longs === String ? "0" : 0;
                object.Combinable = false;
                object.HeroUnit = null;
                object.EquipUnit = null;
            }
            if (message.Seq != null && message.hasOwnProperty("Seq"))
                if (typeof message.Seq === "number")
                    object.Seq = options.longs === String ? String(message.Seq) : message.Seq;
                else
                    object.Seq = options.longs === String ? $util.Long.prototype.toString.call(message.Seq) : options.longs === Number ? new $util.LongBits(message.Seq.low >>> 0, message.Seq.high >>> 0).toNumber() : message.Seq;
            if (message.ID != null && message.hasOwnProperty("ID"))
                object.ID = message.ID;
            if (message.Count != null && message.hasOwnProperty("Count"))
                if (typeof message.Count === "number")
                    object.Count = options.longs === String ? String(message.Count) : message.Count;
                else
                    object.Count = options.longs === String ? $util.Long.prototype.toString.call(message.Count) : options.longs === Number ? new $util.LongBits(message.Count.low >>> 0, message.Count.high >>> 0).toNumber() : message.Count;
            if (message.UpdateTime != null && message.hasOwnProperty("UpdateTime"))
                if (typeof message.UpdateTime === "number")
                    object.UpdateTime = options.longs === String ? String(message.UpdateTime) : message.UpdateTime;
                else
                    object.UpdateTime = options.longs === String ? $util.Long.prototype.toString.call(message.UpdateTime) : options.longs === Number ? new $util.LongBits(message.UpdateTime.low >>> 0, message.UpdateTime.high >>> 0).toNumber() : message.UpdateTime;
            if (message.Combinable != null && message.hasOwnProperty("Combinable"))
                object.Combinable = message.Combinable;
            if (message.HeroUnit != null && message.hasOwnProperty("HeroUnit"))
                object.HeroUnit = $root.data.HeroUnit.toObject(message.HeroUnit, options);
            if (message.EquipUnit != null && message.hasOwnProperty("EquipUnit"))
                object.EquipUnit = $root.data.EquipUnit.toObject(message.EquipUnit, options);
            return object;
        };

        /**
         * Converts this BagUnit to JSON.
         * @function toJSON
         * @memberof data.BagUnit
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BagUnit.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BagUnit;
    })();

    data.BagItem = (function() {

        /**
         * Properties of a BagItem.
         * @memberof data
         * @interface IBagItem
         * @property {Array.<data.IBagUnit>|null} [Array] BagItem Array
         */

        /**
         * Constructs a new BagItem.
         * @memberof data
         * @classdesc Represents a BagItem.
         * @implements IBagItem
         * @constructor
         * @param {data.IBagItem=} [properties] Properties to set
         */
        function BagItem(properties) {
            this.Array = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BagItem Array.
         * @member {Array.<data.IBagUnit>} Array
         * @memberof data.BagItem
         * @instance
         */
        BagItem.prototype.Array = $util.emptyArray;

        /**
         * Creates a new BagItem instance using the specified properties.
         * @function create
         * @memberof data.BagItem
         * @static
         * @param {data.IBagItem=} [properties] Properties to set
         * @returns {data.BagItem} BagItem instance
         */
        BagItem.create = function create(properties) {
            return new BagItem(properties);
        };

        /**
         * Encodes the specified BagItem message. Does not implicitly {@link data.BagItem.verify|verify} messages.
         * @function encode
         * @memberof data.BagItem
         * @static
         * @param {data.IBagItem} message BagItem message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BagItem.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Array != null && message.Array.length)
                for (var i = 0; i < message.Array.length; ++i)
                    $root.data.BagUnit.encode(message.Array[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified BagItem message, length delimited. Does not implicitly {@link data.BagItem.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.BagItem
         * @static
         * @param {data.IBagItem} message BagItem message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BagItem.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BagItem message from the specified reader or buffer.
         * @function decode
         * @memberof data.BagItem
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.BagItem} BagItem
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BagItem.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.BagItem();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.Array && message.Array.length))
                        message.Array = [];
                    message.Array.push($root.data.BagUnit.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BagItem message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.BagItem
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.BagItem} BagItem
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BagItem.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BagItem message.
         * @function verify
         * @memberof data.BagItem
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BagItem.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Array != null && message.hasOwnProperty("Array")) {
                if (!Array.isArray(message.Array))
                    return "Array: array expected";
                for (var i = 0; i < message.Array.length; ++i) {
                    var error = $root.data.BagUnit.verify(message.Array[i]);
                    if (error)
                        return "Array." + error;
                }
            }
            return null;
        };

        /**
         * Creates a BagItem message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.BagItem
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.BagItem} BagItem
         */
        BagItem.fromObject = function fromObject(object) {
            if (object instanceof $root.data.BagItem)
                return object;
            var message = new $root.data.BagItem();
            if (object.Array) {
                if (!Array.isArray(object.Array))
                    throw TypeError(".data.BagItem.Array: array expected");
                message.Array = [];
                for (var i = 0; i < object.Array.length; ++i) {
                    if (typeof object.Array[i] !== "object")
                        throw TypeError(".data.BagItem.Array: object expected");
                    message.Array[i] = $root.data.BagUnit.fromObject(object.Array[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a BagItem message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.BagItem
         * @static
         * @param {data.BagItem} message BagItem
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BagItem.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Array = [];
            if (message.Array && message.Array.length) {
                object.Array = [];
                for (var j = 0; j < message.Array.length; ++j)
                    object.Array[j] = $root.data.BagUnit.toObject(message.Array[j], options);
            }
            return object;
        };

        /**
         * Converts this BagItem to JSON.
         * @function toJSON
         * @memberof data.BagItem
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BagItem.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BagItem;
    })();

    data.BagData = (function() {

        /**
         * Properties of a BagData.
         * @memberof data
         * @interface IBagData
         * @property {Object.<string,data.IBagItem>|null} [Items] BagData Items
         * @property {number|Long|null} [SeqCounter] BagData SeqCounter
         */

        /**
         * Constructs a new BagData.
         * @memberof data
         * @classdesc Represents a BagData.
         * @implements IBagData
         * @constructor
         * @param {data.IBagData=} [properties] Properties to set
         */
        function BagData(properties) {
            this.Items = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * BagData Items.
         * @member {Object.<string,data.IBagItem>} Items
         * @memberof data.BagData
         * @instance
         */
        BagData.prototype.Items = $util.emptyObject;

        /**
         * BagData SeqCounter.
         * @member {number|Long} SeqCounter
         * @memberof data.BagData
         * @instance
         */
        BagData.prototype.SeqCounter = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new BagData instance using the specified properties.
         * @function create
         * @memberof data.BagData
         * @static
         * @param {data.IBagData=} [properties] Properties to set
         * @returns {data.BagData} BagData instance
         */
        BagData.create = function create(properties) {
            return new BagData(properties);
        };

        /**
         * Encodes the specified BagData message. Does not implicitly {@link data.BagData.verify|verify} messages.
         * @function encode
         * @memberof data.BagData
         * @static
         * @param {data.IBagData} message BagData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BagData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Items != null && Object.hasOwnProperty.call(message, "Items"))
                for (var keys = Object.keys(message.Items), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.data.BagItem.encode(message.Items[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            if (message.SeqCounter != null && Object.hasOwnProperty.call(message, "SeqCounter"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.SeqCounter);
            return writer;
        };

        /**
         * Encodes the specified BagData message, length delimited. Does not implicitly {@link data.BagData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.BagData
         * @static
         * @param {data.IBagData} message BagData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BagData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BagData message from the specified reader or buffer.
         * @function decode
         * @memberof data.BagData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.BagData} BagData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BagData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.BagData(), key, value;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (message.Items === $util.emptyObject)
                        message.Items = {};
                    var end2 = reader.uint32() + reader.pos;
                    key = 0;
                    value = null;
                    while (reader.pos < end2) {
                        var tag2 = reader.uint32();
                        switch (tag2 >>> 3) {
                        case 1:
                            key = reader.int32();
                            break;
                        case 2:
                            value = $root.data.BagItem.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag2 & 7);
                            break;
                        }
                    }
                    message.Items[key] = value;
                    break;
                case 2:
                    message.SeqCounter = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BagData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.BagData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.BagData} BagData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BagData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BagData message.
         * @function verify
         * @memberof data.BagData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BagData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Items != null && message.hasOwnProperty("Items")) {
                if (!$util.isObject(message.Items))
                    return "Items: object expected";
                var key = Object.keys(message.Items);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "Items: integer key{k:int32} expected";
                    {
                        var error = $root.data.BagItem.verify(message.Items[key[i]]);
                        if (error)
                            return "Items." + error;
                    }
                }
            }
            if (message.SeqCounter != null && message.hasOwnProperty("SeqCounter"))
                if (!$util.isInteger(message.SeqCounter) && !(message.SeqCounter && $util.isInteger(message.SeqCounter.low) && $util.isInteger(message.SeqCounter.high)))
                    return "SeqCounter: integer|Long expected";
            return null;
        };

        /**
         * Creates a BagData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.BagData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.BagData} BagData
         */
        BagData.fromObject = function fromObject(object) {
            if (object instanceof $root.data.BagData)
                return object;
            var message = new $root.data.BagData();
            if (object.Items) {
                if (typeof object.Items !== "object")
                    throw TypeError(".data.BagData.Items: object expected");
                message.Items = {};
                for (var keys = Object.keys(object.Items), i = 0; i < keys.length; ++i) {
                    if (typeof object.Items[keys[i]] !== "object")
                        throw TypeError(".data.BagData.Items: object expected");
                    message.Items[keys[i]] = $root.data.BagItem.fromObject(object.Items[keys[i]]);
                }
            }
            if (object.SeqCounter != null)
                if ($util.Long)
                    (message.SeqCounter = $util.Long.fromValue(object.SeqCounter)).unsigned = false;
                else if (typeof object.SeqCounter === "string")
                    message.SeqCounter = parseInt(object.SeqCounter, 10);
                else if (typeof object.SeqCounter === "number")
                    message.SeqCounter = object.SeqCounter;
                else if (typeof object.SeqCounter === "object")
                    message.SeqCounter = new $util.LongBits(object.SeqCounter.low >>> 0, object.SeqCounter.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a BagData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.BagData
         * @static
         * @param {data.BagData} message BagData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BagData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.Items = {};
            if (options.defaults)
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.SeqCounter = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.SeqCounter = options.longs === String ? "0" : 0;
            var keys2;
            if (message.Items && (keys2 = Object.keys(message.Items)).length) {
                object.Items = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.Items[keys2[j]] = $root.data.BagItem.toObject(message.Items[keys2[j]], options);
            }
            if (message.SeqCounter != null && message.hasOwnProperty("SeqCounter"))
                if (typeof message.SeqCounter === "number")
                    object.SeqCounter = options.longs === String ? String(message.SeqCounter) : message.SeqCounter;
                else
                    object.SeqCounter = options.longs === String ? $util.Long.prototype.toString.call(message.SeqCounter) : options.longs === Number ? new $util.LongBits(message.SeqCounter.low >>> 0, message.SeqCounter.high >>> 0).toNumber() : message.SeqCounter;
            return object;
        };

        /**
         * Converts this BagData to JSON.
         * @function toJSON
         * @memberof data.BagData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BagData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BagData;
    })();

    data.LessonRecord = (function() {

        /**
         * Properties of a LessonRecord.
         * @memberof data
         * @interface ILessonRecord
         * @property {boolean|null} [Past] LessonRecord Past
         * @property {Array.<number>|null} [Heroes] LessonRecord Heroes
         */

        /**
         * Constructs a new LessonRecord.
         * @memberof data
         * @classdesc Represents a LessonRecord.
         * @implements ILessonRecord
         * @constructor
         * @param {data.ILessonRecord=} [properties] Properties to set
         */
        function LessonRecord(properties) {
            this.Heroes = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LessonRecord Past.
         * @member {boolean} Past
         * @memberof data.LessonRecord
         * @instance
         */
        LessonRecord.prototype.Past = false;

        /**
         * LessonRecord Heroes.
         * @member {Array.<number>} Heroes
         * @memberof data.LessonRecord
         * @instance
         */
        LessonRecord.prototype.Heroes = $util.emptyArray;

        /**
         * Creates a new LessonRecord instance using the specified properties.
         * @function create
         * @memberof data.LessonRecord
         * @static
         * @param {data.ILessonRecord=} [properties] Properties to set
         * @returns {data.LessonRecord} LessonRecord instance
         */
        LessonRecord.create = function create(properties) {
            return new LessonRecord(properties);
        };

        /**
         * Encodes the specified LessonRecord message. Does not implicitly {@link data.LessonRecord.verify|verify} messages.
         * @function encode
         * @memberof data.LessonRecord
         * @static
         * @param {data.ILessonRecord} message LessonRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LessonRecord.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Past != null && Object.hasOwnProperty.call(message, "Past"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.Past);
            if (message.Heroes != null && message.Heroes.length) {
                writer.uint32(/* id 10, wireType 2 =*/82).fork();
                for (var i = 0; i < message.Heroes.length; ++i)
                    writer.int32(message.Heroes[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified LessonRecord message, length delimited. Does not implicitly {@link data.LessonRecord.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.LessonRecord
         * @static
         * @param {data.ILessonRecord} message LessonRecord message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LessonRecord.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LessonRecord message from the specified reader or buffer.
         * @function decode
         * @memberof data.LessonRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.LessonRecord} LessonRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LessonRecord.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.LessonRecord();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Past = reader.bool();
                    break;
                case 10:
                    if (!(message.Heroes && message.Heroes.length))
                        message.Heroes = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.Heroes.push(reader.int32());
                    } else
                        message.Heroes.push(reader.int32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LessonRecord message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.LessonRecord
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.LessonRecord} LessonRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LessonRecord.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LessonRecord message.
         * @function verify
         * @memberof data.LessonRecord
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LessonRecord.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Past != null && message.hasOwnProperty("Past"))
                if (typeof message.Past !== "boolean")
                    return "Past: boolean expected";
            if (message.Heroes != null && message.hasOwnProperty("Heroes")) {
                if (!Array.isArray(message.Heroes))
                    return "Heroes: array expected";
                for (var i = 0; i < message.Heroes.length; ++i)
                    if (!$util.isInteger(message.Heroes[i]))
                        return "Heroes: integer[] expected";
            }
            return null;
        };

        /**
         * Creates a LessonRecord message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.LessonRecord
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.LessonRecord} LessonRecord
         */
        LessonRecord.fromObject = function fromObject(object) {
            if (object instanceof $root.data.LessonRecord)
                return object;
            var message = new $root.data.LessonRecord();
            if (object.Past != null)
                message.Past = Boolean(object.Past);
            if (object.Heroes) {
                if (!Array.isArray(object.Heroes))
                    throw TypeError(".data.LessonRecord.Heroes: array expected");
                message.Heroes = [];
                for (var i = 0; i < object.Heroes.length; ++i)
                    message.Heroes[i] = object.Heroes[i] | 0;
            }
            return message;
        };

        /**
         * Creates a plain object from a LessonRecord message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.LessonRecord
         * @static
         * @param {data.LessonRecord} message LessonRecord
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LessonRecord.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Heroes = [];
            if (options.defaults)
                object.Past = false;
            if (message.Past != null && message.hasOwnProperty("Past"))
                object.Past = message.Past;
            if (message.Heroes && message.Heroes.length) {
                object.Heroes = [];
                for (var j = 0; j < message.Heroes.length; ++j)
                    object.Heroes[j] = message.Heroes[j];
            }
            return object;
        };

        /**
         * Converts this LessonRecord to JSON.
         * @function toJSON
         * @memberof data.LessonRecord
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LessonRecord.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LessonRecord;
    })();

    data.PVEData = (function() {

        /**
         * Properties of a PVEData.
         * @memberof data
         * @interface IPVEData
         * @property {Object.<string,data.ILessonRecord>|null} [LessonRecords] PVEData LessonRecords
         */

        /**
         * Constructs a new PVEData.
         * @memberof data
         * @classdesc Represents a PVEData.
         * @implements IPVEData
         * @constructor
         * @param {data.IPVEData=} [properties] Properties to set
         */
        function PVEData(properties) {
            this.LessonRecords = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PVEData LessonRecords.
         * @member {Object.<string,data.ILessonRecord>} LessonRecords
         * @memberof data.PVEData
         * @instance
         */
        PVEData.prototype.LessonRecords = $util.emptyObject;

        /**
         * Creates a new PVEData instance using the specified properties.
         * @function create
         * @memberof data.PVEData
         * @static
         * @param {data.IPVEData=} [properties] Properties to set
         * @returns {data.PVEData} PVEData instance
         */
        PVEData.create = function create(properties) {
            return new PVEData(properties);
        };

        /**
         * Encodes the specified PVEData message. Does not implicitly {@link data.PVEData.verify|verify} messages.
         * @function encode
         * @memberof data.PVEData
         * @static
         * @param {data.IPVEData} message PVEData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PVEData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.LessonRecords != null && Object.hasOwnProperty.call(message, "LessonRecords"))
                for (var keys = Object.keys(message.LessonRecords), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.data.LessonRecord.encode(message.LessonRecords[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified PVEData message, length delimited. Does not implicitly {@link data.PVEData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.PVEData
         * @static
         * @param {data.IPVEData} message PVEData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PVEData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PVEData message from the specified reader or buffer.
         * @function decode
         * @memberof data.PVEData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.PVEData} PVEData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PVEData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.PVEData(), key, value;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (message.LessonRecords === $util.emptyObject)
                        message.LessonRecords = {};
                    var end2 = reader.uint32() + reader.pos;
                    key = 0;
                    value = null;
                    while (reader.pos < end2) {
                        var tag2 = reader.uint32();
                        switch (tag2 >>> 3) {
                        case 1:
                            key = reader.int32();
                            break;
                        case 2:
                            value = $root.data.LessonRecord.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag2 & 7);
                            break;
                        }
                    }
                    message.LessonRecords[key] = value;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PVEData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.PVEData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.PVEData} PVEData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PVEData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PVEData message.
         * @function verify
         * @memberof data.PVEData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PVEData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.LessonRecords != null && message.hasOwnProperty("LessonRecords")) {
                if (!$util.isObject(message.LessonRecords))
                    return "LessonRecords: object expected";
                var key = Object.keys(message.LessonRecords);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "LessonRecords: integer key{k:int32} expected";
                    {
                        var error = $root.data.LessonRecord.verify(message.LessonRecords[key[i]]);
                        if (error)
                            return "LessonRecords." + error;
                    }
                }
            }
            return null;
        };

        /**
         * Creates a PVEData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.PVEData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.PVEData} PVEData
         */
        PVEData.fromObject = function fromObject(object) {
            if (object instanceof $root.data.PVEData)
                return object;
            var message = new $root.data.PVEData();
            if (object.LessonRecords) {
                if (typeof object.LessonRecords !== "object")
                    throw TypeError(".data.PVEData.LessonRecords: object expected");
                message.LessonRecords = {};
                for (var keys = Object.keys(object.LessonRecords), i = 0; i < keys.length; ++i) {
                    if (typeof object.LessonRecords[keys[i]] !== "object")
                        throw TypeError(".data.PVEData.LessonRecords: object expected");
                    message.LessonRecords[keys[i]] = $root.data.LessonRecord.fromObject(object.LessonRecords[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a PVEData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.PVEData
         * @static
         * @param {data.PVEData} message PVEData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PVEData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.LessonRecords = {};
            var keys2;
            if (message.LessonRecords && (keys2 = Object.keys(message.LessonRecords)).length) {
                object.LessonRecords = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.LessonRecords[keys2[j]] = $root.data.LessonRecord.toObject(message.LessonRecords[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this PVEData to JSON.
         * @function toJSON
         * @memberof data.PVEData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PVEData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PVEData;
    })();

    data.RankUser = (function() {

        /**
         * Properties of a RankUser.
         * @memberof data
         * @interface IRankUser
         * @property {string|null} [UserID] RankUser UserID
         * @property {string|null} [Name] RankUser Name
         * @property {number|null} [HeadID] RankUser HeadID
         */

        /**
         * Constructs a new RankUser.
         * @memberof data
         * @classdesc Represents a RankUser.
         * @implements IRankUser
         * @constructor
         * @param {data.IRankUser=} [properties] Properties to set
         */
        function RankUser(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RankUser UserID.
         * @member {string} UserID
         * @memberof data.RankUser
         * @instance
         */
        RankUser.prototype.UserID = "";

        /**
         * RankUser Name.
         * @member {string} Name
         * @memberof data.RankUser
         * @instance
         */
        RankUser.prototype.Name = "";

        /**
         * RankUser HeadID.
         * @member {number} HeadID
         * @memberof data.RankUser
         * @instance
         */
        RankUser.prototype.HeadID = 0;

        /**
         * Creates a new RankUser instance using the specified properties.
         * @function create
         * @memberof data.RankUser
         * @static
         * @param {data.IRankUser=} [properties] Properties to set
         * @returns {data.RankUser} RankUser instance
         */
        RankUser.create = function create(properties) {
            return new RankUser(properties);
        };

        /**
         * Encodes the specified RankUser message. Does not implicitly {@link data.RankUser.verify|verify} messages.
         * @function encode
         * @memberof data.RankUser
         * @static
         * @param {data.IRankUser} message RankUser message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RankUser.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserID != null && Object.hasOwnProperty.call(message, "UserID"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserID);
            if (message.Name != null && Object.hasOwnProperty.call(message, "Name"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.Name);
            if (message.HeadID != null && Object.hasOwnProperty.call(message, "HeadID"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.HeadID);
            return writer;
        };

        /**
         * Encodes the specified RankUser message, length delimited. Does not implicitly {@link data.RankUser.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.RankUser
         * @static
         * @param {data.IRankUser} message RankUser message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RankUser.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RankUser message from the specified reader or buffer.
         * @function decode
         * @memberof data.RankUser
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.RankUser} RankUser
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RankUser.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.RankUser();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserID = reader.string();
                    break;
                case 2:
                    message.Name = reader.string();
                    break;
                case 3:
                    message.HeadID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RankUser message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.RankUser
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.RankUser} RankUser
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RankUser.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RankUser message.
         * @function verify
         * @memberof data.RankUser
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RankUser.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                if (!$util.isString(message.UserID))
                    return "UserID: string expected";
            if (message.Name != null && message.hasOwnProperty("Name"))
                if (!$util.isString(message.Name))
                    return "Name: string expected";
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                if (!$util.isInteger(message.HeadID))
                    return "HeadID: integer expected";
            return null;
        };

        /**
         * Creates a RankUser message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.RankUser
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.RankUser} RankUser
         */
        RankUser.fromObject = function fromObject(object) {
            if (object instanceof $root.data.RankUser)
                return object;
            var message = new $root.data.RankUser();
            if (object.UserID != null)
                message.UserID = String(object.UserID);
            if (object.Name != null)
                message.Name = String(object.Name);
            if (object.HeadID != null)
                message.HeadID = object.HeadID | 0;
            return message;
        };

        /**
         * Creates a plain object from a RankUser message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.RankUser
         * @static
         * @param {data.RankUser} message RankUser
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RankUser.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.UserID = "";
                object.Name = "";
                object.HeadID = 0;
            }
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                object.UserID = message.UserID;
            if (message.Name != null && message.hasOwnProperty("Name"))
                object.Name = message.Name;
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                object.HeadID = message.HeadID;
            return object;
        };

        /**
         * Converts this RankUser to JSON.
         * @function toJSON
         * @memberof data.RankUser
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RankUser.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RankUser;
    })();

    data.StageRank = (function() {

        /**
         * Properties of a StageRank.
         * @memberof data
         * @interface IStageRank
         * @property {data.IRankUser|null} [User] StageRank User
         * @property {number|null} [Score] StageRank Score
         * @property {number|null} [StageID] StageRank StageID
         * @property {number|null} [Level] StageRank Level
         * @property {number|null} [HeroID] StageRank HeroID
         */

        /**
         * Constructs a new StageRank.
         * @memberof data
         * @classdesc Represents a StageRank.
         * @implements IStageRank
         * @constructor
         * @param {data.IStageRank=} [properties] Properties to set
         */
        function StageRank(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageRank User.
         * @member {data.IRankUser|null|undefined} User
         * @memberof data.StageRank
         * @instance
         */
        StageRank.prototype.User = null;

        /**
         * StageRank Score.
         * @member {number} Score
         * @memberof data.StageRank
         * @instance
         */
        StageRank.prototype.Score = 0;

        /**
         * StageRank StageID.
         * @member {number} StageID
         * @memberof data.StageRank
         * @instance
         */
        StageRank.prototype.StageID = 0;

        /**
         * StageRank Level.
         * @member {number} Level
         * @memberof data.StageRank
         * @instance
         */
        StageRank.prototype.Level = 0;

        /**
         * StageRank HeroID.
         * @member {number} HeroID
         * @memberof data.StageRank
         * @instance
         */
        StageRank.prototype.HeroID = 0;

        /**
         * Creates a new StageRank instance using the specified properties.
         * @function create
         * @memberof data.StageRank
         * @static
         * @param {data.IStageRank=} [properties] Properties to set
         * @returns {data.StageRank} StageRank instance
         */
        StageRank.create = function create(properties) {
            return new StageRank(properties);
        };

        /**
         * Encodes the specified StageRank message. Does not implicitly {@link data.StageRank.verify|verify} messages.
         * @function encode
         * @memberof data.StageRank
         * @static
         * @param {data.IStageRank} message StageRank message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageRank.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.User != null && Object.hasOwnProperty.call(message, "User"))
                $root.data.RankUser.encode(message.User, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.Score != null && Object.hasOwnProperty.call(message, "Score"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Score);
            if (message.StageID != null && Object.hasOwnProperty.call(message, "StageID"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.StageID);
            if (message.Level != null && Object.hasOwnProperty.call(message, "Level"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.Level);
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.HeroID);
            return writer;
        };

        /**
         * Encodes the specified StageRank message, length delimited. Does not implicitly {@link data.StageRank.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.StageRank
         * @static
         * @param {data.IStageRank} message StageRank message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageRank.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageRank message from the specified reader or buffer.
         * @function decode
         * @memberof data.StageRank
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.StageRank} StageRank
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageRank.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.StageRank();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.User = $root.data.RankUser.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.Score = reader.int32();
                    break;
                case 3:
                    message.StageID = reader.int32();
                    break;
                case 4:
                    message.Level = reader.int32();
                    break;
                case 5:
                    message.HeroID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageRank message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.StageRank
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.StageRank} StageRank
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageRank.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageRank message.
         * @function verify
         * @memberof data.StageRank
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageRank.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.User != null && message.hasOwnProperty("User")) {
                var error = $root.data.RankUser.verify(message.User);
                if (error)
                    return "User." + error;
            }
            if (message.Score != null && message.hasOwnProperty("Score"))
                if (!$util.isInteger(message.Score))
                    return "Score: integer expected";
            if (message.StageID != null && message.hasOwnProperty("StageID"))
                if (!$util.isInteger(message.StageID))
                    return "StageID: integer expected";
            if (message.Level != null && message.hasOwnProperty("Level"))
                if (!$util.isInteger(message.Level))
                    return "Level: integer expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            return null;
        };

        /**
         * Creates a StageRank message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.StageRank
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.StageRank} StageRank
         */
        StageRank.fromObject = function fromObject(object) {
            if (object instanceof $root.data.StageRank)
                return object;
            var message = new $root.data.StageRank();
            if (object.User != null) {
                if (typeof object.User !== "object")
                    throw TypeError(".data.StageRank.User: object expected");
                message.User = $root.data.RankUser.fromObject(object.User);
            }
            if (object.Score != null)
                message.Score = object.Score | 0;
            if (object.StageID != null)
                message.StageID = object.StageID | 0;
            if (object.Level != null)
                message.Level = object.Level | 0;
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            return message;
        };

        /**
         * Creates a plain object from a StageRank message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.StageRank
         * @static
         * @param {data.StageRank} message StageRank
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageRank.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.User = null;
                object.Score = 0;
                object.StageID = 0;
                object.Level = 0;
                object.HeroID = 0;
            }
            if (message.User != null && message.hasOwnProperty("User"))
                object.User = $root.data.RankUser.toObject(message.User, options);
            if (message.Score != null && message.hasOwnProperty("Score"))
                object.Score = message.Score;
            if (message.StageID != null && message.hasOwnProperty("StageID"))
                object.StageID = message.StageID;
            if (message.Level != null && message.hasOwnProperty("Level"))
                object.Level = message.Level;
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            return object;
        };

        /**
         * Converts this StageRank to JSON.
         * @function toJSON
         * @memberof data.StageRank
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageRank.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageRank;
    })();

    data.StageRankList = (function() {

        /**
         * Properties of a StageRankList.
         * @memberof data
         * @interface IStageRankList
         * @property {Array.<data.IStageRank>|null} [Entries] StageRankList Entries
         */

        /**
         * Constructs a new StageRankList.
         * @memberof data
         * @classdesc Represents a StageRankList.
         * @implements IStageRankList
         * @constructor
         * @param {data.IStageRankList=} [properties] Properties to set
         */
        function StageRankList(properties) {
            this.Entries = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StageRankList Entries.
         * @member {Array.<data.IStageRank>} Entries
         * @memberof data.StageRankList
         * @instance
         */
        StageRankList.prototype.Entries = $util.emptyArray;

        /**
         * Creates a new StageRankList instance using the specified properties.
         * @function create
         * @memberof data.StageRankList
         * @static
         * @param {data.IStageRankList=} [properties] Properties to set
         * @returns {data.StageRankList} StageRankList instance
         */
        StageRankList.create = function create(properties) {
            return new StageRankList(properties);
        };

        /**
         * Encodes the specified StageRankList message. Does not implicitly {@link data.StageRankList.verify|verify} messages.
         * @function encode
         * @memberof data.StageRankList
         * @static
         * @param {data.IStageRankList} message StageRankList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageRankList.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Entries != null && message.Entries.length)
                for (var i = 0; i < message.Entries.length; ++i)
                    $root.data.StageRank.encode(message.Entries[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified StageRankList message, length delimited. Does not implicitly {@link data.StageRankList.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.StageRankList
         * @static
         * @param {data.IStageRankList} message StageRankList message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StageRankList.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a StageRankList message from the specified reader or buffer.
         * @function decode
         * @memberof data.StageRankList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.StageRankList} StageRankList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageRankList.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.StageRankList();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.Entries && message.Entries.length))
                        message.Entries = [];
                    message.Entries.push($root.data.StageRank.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a StageRankList message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.StageRankList
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.StageRankList} StageRankList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StageRankList.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StageRankList message.
         * @function verify
         * @memberof data.StageRankList
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StageRankList.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Entries != null && message.hasOwnProperty("Entries")) {
                if (!Array.isArray(message.Entries))
                    return "Entries: array expected";
                for (var i = 0; i < message.Entries.length; ++i) {
                    var error = $root.data.StageRank.verify(message.Entries[i]);
                    if (error)
                        return "Entries." + error;
                }
            }
            return null;
        };

        /**
         * Creates a StageRankList message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.StageRankList
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.StageRankList} StageRankList
         */
        StageRankList.fromObject = function fromObject(object) {
            if (object instanceof $root.data.StageRankList)
                return object;
            var message = new $root.data.StageRankList();
            if (object.Entries) {
                if (!Array.isArray(object.Entries))
                    throw TypeError(".data.StageRankList.Entries: array expected");
                message.Entries = [];
                for (var i = 0; i < object.Entries.length; ++i) {
                    if (typeof object.Entries[i] !== "object")
                        throw TypeError(".data.StageRankList.Entries: object expected");
                    message.Entries[i] = $root.data.StageRank.fromObject(object.Entries[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a StageRankList message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.StageRankList
         * @static
         * @param {data.StageRankList} message StageRankList
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StageRankList.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Entries = [];
            if (message.Entries && message.Entries.length) {
                object.Entries = [];
                for (var j = 0; j < message.Entries.length; ++j)
                    object.Entries[j] = $root.data.StageRank.toObject(message.Entries[j], options);
            }
            return object;
        };

        /**
         * Converts this StageRankList to JSON.
         * @function toJSON
         * @memberof data.StageRankList
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StageRankList.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return StageRankList;
    })();

    data.RankData = (function() {

        /**
         * Properties of a RankData.
         * @memberof data
         * @interface IRankData
         * @property {Object.<string,data.IStageRankList>|null} [RankLists] RankData RankLists
         */

        /**
         * Constructs a new RankData.
         * @memberof data
         * @classdesc Represents a RankData.
         * @implements IRankData
         * @constructor
         * @param {data.IRankData=} [properties] Properties to set
         */
        function RankData(properties) {
            this.RankLists = {};
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RankData RankLists.
         * @member {Object.<string,data.IStageRankList>} RankLists
         * @memberof data.RankData
         * @instance
         */
        RankData.prototype.RankLists = $util.emptyObject;

        /**
         * Creates a new RankData instance using the specified properties.
         * @function create
         * @memberof data.RankData
         * @static
         * @param {data.IRankData=} [properties] Properties to set
         * @returns {data.RankData} RankData instance
         */
        RankData.create = function create(properties) {
            return new RankData(properties);
        };

        /**
         * Encodes the specified RankData message. Does not implicitly {@link data.RankData.verify|verify} messages.
         * @function encode
         * @memberof data.RankData
         * @static
         * @param {data.IRankData} message RankData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RankData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.RankLists != null && Object.hasOwnProperty.call(message, "RankLists"))
                for (var keys = Object.keys(message.RankLists), i = 0; i < keys.length; ++i) {
                    writer.uint32(/* id 1, wireType 2 =*/10).fork().uint32(/* id 1, wireType 0 =*/8).int32(keys[i]);
                    $root.data.StageRankList.encode(message.RankLists[keys[i]], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim().ldelim();
                }
            return writer;
        };

        /**
         * Encodes the specified RankData message, length delimited. Does not implicitly {@link data.RankData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.RankData
         * @static
         * @param {data.IRankData} message RankData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RankData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RankData message from the specified reader or buffer.
         * @function decode
         * @memberof data.RankData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.RankData} RankData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RankData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.RankData(), key, value;
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (message.RankLists === $util.emptyObject)
                        message.RankLists = {};
                    var end2 = reader.uint32() + reader.pos;
                    key = 0;
                    value = null;
                    while (reader.pos < end2) {
                        var tag2 = reader.uint32();
                        switch (tag2 >>> 3) {
                        case 1:
                            key = reader.int32();
                            break;
                        case 2:
                            value = $root.data.StageRankList.decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag2 & 7);
                            break;
                        }
                    }
                    message.RankLists[key] = value;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RankData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.RankData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.RankData} RankData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RankData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RankData message.
         * @function verify
         * @memberof data.RankData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RankData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.RankLists != null && message.hasOwnProperty("RankLists")) {
                if (!$util.isObject(message.RankLists))
                    return "RankLists: object expected";
                var key = Object.keys(message.RankLists);
                for (var i = 0; i < key.length; ++i) {
                    if (!$util.key32Re.test(key[i]))
                        return "RankLists: integer key{k:int32} expected";
                    {
                        var error = $root.data.StageRankList.verify(message.RankLists[key[i]]);
                        if (error)
                            return "RankLists." + error;
                    }
                }
            }
            return null;
        };

        /**
         * Creates a RankData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.RankData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.RankData} RankData
         */
        RankData.fromObject = function fromObject(object) {
            if (object instanceof $root.data.RankData)
                return object;
            var message = new $root.data.RankData();
            if (object.RankLists) {
                if (typeof object.RankLists !== "object")
                    throw TypeError(".data.RankData.RankLists: object expected");
                message.RankLists = {};
                for (var keys = Object.keys(object.RankLists), i = 0; i < keys.length; ++i) {
                    if (typeof object.RankLists[keys[i]] !== "object")
                        throw TypeError(".data.RankData.RankLists: object expected");
                    message.RankLists[keys[i]] = $root.data.StageRankList.fromObject(object.RankLists[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a RankData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.RankData
         * @static
         * @param {data.RankData} message RankData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RankData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.objects || options.defaults)
                object.RankLists = {};
            var keys2;
            if (message.RankLists && (keys2 = Object.keys(message.RankLists)).length) {
                object.RankLists = {};
                for (var j = 0; j < keys2.length; ++j)
                    object.RankLists[keys2[j]] = $root.data.StageRankList.toObject(message.RankLists[keys2[j]], options);
            }
            return object;
        };

        /**
         * Converts this RankData to JSON.
         * @function toJSON
         * @memberof data.RankData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RankData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RankData;
    })();

    data.UserData = (function() {

        /**
         * Properties of a UserData.
         * @memberof data
         * @interface IUserData
         * @property {number|null} [Version] UserData Version
         * @property {number|Long|null} [FromDBTime] UserData FromDBTime
         * @property {data.IAccountData|null} [AccountData] UserData AccountData
         * @property {data.IBagData|null} [BagData] UserData BagData
         * @property {data.IPVEData|null} [PVEData] UserData PVEData
         */

        /**
         * Constructs a new UserData.
         * @memberof data
         * @classdesc Represents a UserData.
         * @implements IUserData
         * @constructor
         * @param {data.IUserData=} [properties] Properties to set
         */
        function UserData(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * UserData Version.
         * @member {number} Version
         * @memberof data.UserData
         * @instance
         */
        UserData.prototype.Version = 0;

        /**
         * UserData FromDBTime.
         * @member {number|Long} FromDBTime
         * @memberof data.UserData
         * @instance
         */
        UserData.prototype.FromDBTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * UserData AccountData.
         * @member {data.IAccountData|null|undefined} AccountData
         * @memberof data.UserData
         * @instance
         */
        UserData.prototype.AccountData = null;

        /**
         * UserData BagData.
         * @member {data.IBagData|null|undefined} BagData
         * @memberof data.UserData
         * @instance
         */
        UserData.prototype.BagData = null;

        /**
         * UserData PVEData.
         * @member {data.IPVEData|null|undefined} PVEData
         * @memberof data.UserData
         * @instance
         */
        UserData.prototype.PVEData = null;

        /**
         * Creates a new UserData instance using the specified properties.
         * @function create
         * @memberof data.UserData
         * @static
         * @param {data.IUserData=} [properties] Properties to set
         * @returns {data.UserData} UserData instance
         */
        UserData.create = function create(properties) {
            return new UserData(properties);
        };

        /**
         * Encodes the specified UserData message. Does not implicitly {@link data.UserData.verify|verify} messages.
         * @function encode
         * @memberof data.UserData
         * @static
         * @param {data.IUserData} message UserData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UserData.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Version != null && Object.hasOwnProperty.call(message, "Version"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.Version);
            if (message.FromDBTime != null && Object.hasOwnProperty.call(message, "FromDBTime"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.FromDBTime);
            if (message.AccountData != null && Object.hasOwnProperty.call(message, "AccountData"))
                $root.data.AccountData.encode(message.AccountData, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.BagData != null && Object.hasOwnProperty.call(message, "BagData"))
                $root.data.BagData.encode(message.BagData, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            if (message.PVEData != null && Object.hasOwnProperty.call(message, "PVEData"))
                $root.data.PVEData.encode(message.PVEData, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified UserData message, length delimited. Does not implicitly {@link data.UserData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof data.UserData
         * @static
         * @param {data.IUserData} message UserData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UserData.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a UserData message from the specified reader or buffer.
         * @function decode
         * @memberof data.UserData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {data.UserData} UserData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UserData.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.data.UserData();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Version = reader.int32();
                    break;
                case 2:
                    message.FromDBTime = reader.int64();
                    break;
                case 10:
                    message.AccountData = $root.data.AccountData.decode(reader, reader.uint32());
                    break;
                case 11:
                    message.BagData = $root.data.BagData.decode(reader, reader.uint32());
                    break;
                case 12:
                    message.PVEData = $root.data.PVEData.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a UserData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof data.UserData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {data.UserData} UserData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UserData.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a UserData message.
         * @function verify
         * @memberof data.UserData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        UserData.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Version != null && message.hasOwnProperty("Version"))
                if (!$util.isInteger(message.Version))
                    return "Version: integer expected";
            if (message.FromDBTime != null && message.hasOwnProperty("FromDBTime"))
                if (!$util.isInteger(message.FromDBTime) && !(message.FromDBTime && $util.isInteger(message.FromDBTime.low) && $util.isInteger(message.FromDBTime.high)))
                    return "FromDBTime: integer|Long expected";
            if (message.AccountData != null && message.hasOwnProperty("AccountData")) {
                var error = $root.data.AccountData.verify(message.AccountData);
                if (error)
                    return "AccountData." + error;
            }
            if (message.BagData != null && message.hasOwnProperty("BagData")) {
                var error = $root.data.BagData.verify(message.BagData);
                if (error)
                    return "BagData." + error;
            }
            if (message.PVEData != null && message.hasOwnProperty("PVEData")) {
                var error = $root.data.PVEData.verify(message.PVEData);
                if (error)
                    return "PVEData." + error;
            }
            return null;
        };

        /**
         * Creates a UserData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof data.UserData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {data.UserData} UserData
         */
        UserData.fromObject = function fromObject(object) {
            if (object instanceof $root.data.UserData)
                return object;
            var message = new $root.data.UserData();
            if (object.Version != null)
                message.Version = object.Version | 0;
            if (object.FromDBTime != null)
                if ($util.Long)
                    (message.FromDBTime = $util.Long.fromValue(object.FromDBTime)).unsigned = false;
                else if (typeof object.FromDBTime === "string")
                    message.FromDBTime = parseInt(object.FromDBTime, 10);
                else if (typeof object.FromDBTime === "number")
                    message.FromDBTime = object.FromDBTime;
                else if (typeof object.FromDBTime === "object")
                    message.FromDBTime = new $util.LongBits(object.FromDBTime.low >>> 0, object.FromDBTime.high >>> 0).toNumber();
            if (object.AccountData != null) {
                if (typeof object.AccountData !== "object")
                    throw TypeError(".data.UserData.AccountData: object expected");
                message.AccountData = $root.data.AccountData.fromObject(object.AccountData);
            }
            if (object.BagData != null) {
                if (typeof object.BagData !== "object")
                    throw TypeError(".data.UserData.BagData: object expected");
                message.BagData = $root.data.BagData.fromObject(object.BagData);
            }
            if (object.PVEData != null) {
                if (typeof object.PVEData !== "object")
                    throw TypeError(".data.UserData.PVEData: object expected");
                message.PVEData = $root.data.PVEData.fromObject(object.PVEData);
            }
            return message;
        };

        /**
         * Creates a plain object from a UserData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof data.UserData
         * @static
         * @param {data.UserData} message UserData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        UserData.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.Version = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.FromDBTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.FromDBTime = options.longs === String ? "0" : 0;
                object.AccountData = null;
                object.BagData = null;
                object.PVEData = null;
            }
            if (message.Version != null && message.hasOwnProperty("Version"))
                object.Version = message.Version;
            if (message.FromDBTime != null && message.hasOwnProperty("FromDBTime"))
                if (typeof message.FromDBTime === "number")
                    object.FromDBTime = options.longs === String ? String(message.FromDBTime) : message.FromDBTime;
                else
                    object.FromDBTime = options.longs === String ? $util.Long.prototype.toString.call(message.FromDBTime) : options.longs === Number ? new $util.LongBits(message.FromDBTime.low >>> 0, message.FromDBTime.high >>> 0).toNumber() : message.FromDBTime;
            if (message.AccountData != null && message.hasOwnProperty("AccountData"))
                object.AccountData = $root.data.AccountData.toObject(message.AccountData, options);
            if (message.BagData != null && message.hasOwnProperty("BagData"))
                object.BagData = $root.data.BagData.toObject(message.BagData, options);
            if (message.PVEData != null && message.hasOwnProperty("PVEData"))
                object.PVEData = $root.data.PVEData.toObject(message.PVEData, options);
            return object;
        };

        /**
         * Converts this UserData to JSON.
         * @function toJSON
         * @memberof data.UserData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        UserData.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return UserData;
    })();

    return data;
})();

$root.evidencesvr = (function() {

    /**
     * Namespace evidencesvr.
     * @exports evidencesvr
     * @namespace
     */
    var evidencesvr = {};

    /**
     * CMD enum.
     * @name evidencesvr.CMD
     * @enum {number}
     * @property {number} INVALID=0 INVALID value
     * @property {number} CHECK_ACCOUNT_REQ=1 CHECK_ACCOUNT_REQ value
     * @property {number} CHECK_ACCOUNT_RES=2 CHECK_ACCOUNT_RES value
     */
    evidencesvr.CMD = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "INVALID"] = 0;
        values[valuesById[1] = "CHECK_ACCOUNT_REQ"] = 1;
        values[valuesById[2] = "CHECK_ACCOUNT_RES"] = 2;
        return values;
    })();

    /**
     * AccountType enum.
     * @name evidencesvr.AccountType
     * @enum {number}
     * @property {number} AT_SELF=0 AT_SELF value
     */
    evidencesvr.AccountType = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "AT_SELF"] = 0;
        return values;
    })();

    evidencesvr.CheckAccountReq = (function() {

        /**
         * Properties of a CheckAccountReq.
         * @memberof evidencesvr
         * @interface ICheckAccountReq
         * @property {evidencesvr.AccountType|null} [AccountType] CheckAccountReq AccountType
         * @property {string|null} [Account] CheckAccountReq Account
         * @property {string|null} [Password] CheckAccountReq Password
         */

        /**
         * Constructs a new CheckAccountReq.
         * @memberof evidencesvr
         * @classdesc Represents a CheckAccountReq.
         * @implements ICheckAccountReq
         * @constructor
         * @param {evidencesvr.ICheckAccountReq=} [properties] Properties to set
         */
        function CheckAccountReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CheckAccountReq AccountType.
         * @member {evidencesvr.AccountType} AccountType
         * @memberof evidencesvr.CheckAccountReq
         * @instance
         */
        CheckAccountReq.prototype.AccountType = 0;

        /**
         * CheckAccountReq Account.
         * @member {string} Account
         * @memberof evidencesvr.CheckAccountReq
         * @instance
         */
        CheckAccountReq.prototype.Account = "";

        /**
         * CheckAccountReq Password.
         * @member {string} Password
         * @memberof evidencesvr.CheckAccountReq
         * @instance
         */
        CheckAccountReq.prototype.Password = "";

        /**
         * Creates a new CheckAccountReq instance using the specified properties.
         * @function create
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {evidencesvr.ICheckAccountReq=} [properties] Properties to set
         * @returns {evidencesvr.CheckAccountReq} CheckAccountReq instance
         */
        CheckAccountReq.create = function create(properties) {
            return new CheckAccountReq(properties);
        };

        /**
         * Encodes the specified CheckAccountReq message. Does not implicitly {@link evidencesvr.CheckAccountReq.verify|verify} messages.
         * @function encode
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {evidencesvr.ICheckAccountReq} message CheckAccountReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CheckAccountReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.AccountType != null && Object.hasOwnProperty.call(message, "AccountType"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.AccountType);
            if (message.Account != null && Object.hasOwnProperty.call(message, "Account"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.Account);
            if (message.Password != null && Object.hasOwnProperty.call(message, "Password"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.Password);
            return writer;
        };

        /**
         * Encodes the specified CheckAccountReq message, length delimited. Does not implicitly {@link evidencesvr.CheckAccountReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {evidencesvr.ICheckAccountReq} message CheckAccountReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CheckAccountReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CheckAccountReq message from the specified reader or buffer.
         * @function decode
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {evidencesvr.CheckAccountReq} CheckAccountReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CheckAccountReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.evidencesvr.CheckAccountReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.AccountType = reader.int32();
                    break;
                case 2:
                    message.Account = reader.string();
                    break;
                case 3:
                    message.Password = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CheckAccountReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {evidencesvr.CheckAccountReq} CheckAccountReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CheckAccountReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CheckAccountReq message.
         * @function verify
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CheckAccountReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.AccountType != null && message.hasOwnProperty("AccountType"))
                switch (message.AccountType) {
                default:
                    return "AccountType: enum value expected";
                case 0:
                    break;
                }
            if (message.Account != null && message.hasOwnProperty("Account"))
                if (!$util.isString(message.Account))
                    return "Account: string expected";
            if (message.Password != null && message.hasOwnProperty("Password"))
                if (!$util.isString(message.Password))
                    return "Password: string expected";
            return null;
        };

        /**
         * Creates a CheckAccountReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {evidencesvr.CheckAccountReq} CheckAccountReq
         */
        CheckAccountReq.fromObject = function fromObject(object) {
            if (object instanceof $root.evidencesvr.CheckAccountReq)
                return object;
            var message = new $root.evidencesvr.CheckAccountReq();
            switch (object.AccountType) {
            case "AT_SELF":
            case 0:
                message.AccountType = 0;
                break;
            }
            if (object.Account != null)
                message.Account = String(object.Account);
            if (object.Password != null)
                message.Password = String(object.Password);
            return message;
        };

        /**
         * Creates a plain object from a CheckAccountReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof evidencesvr.CheckAccountReq
         * @static
         * @param {evidencesvr.CheckAccountReq} message CheckAccountReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CheckAccountReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.AccountType = options.enums === String ? "AT_SELF" : 0;
                object.Account = "";
                object.Password = "";
            }
            if (message.AccountType != null && message.hasOwnProperty("AccountType"))
                object.AccountType = options.enums === String ? $root.evidencesvr.AccountType[message.AccountType] : message.AccountType;
            if (message.Account != null && message.hasOwnProperty("Account"))
                object.Account = message.Account;
            if (message.Password != null && message.hasOwnProperty("Password"))
                object.Password = message.Password;
            return object;
        };

        /**
         * Converts this CheckAccountReq to JSON.
         * @function toJSON
         * @memberof evidencesvr.CheckAccountReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CheckAccountReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return CheckAccountReq;
    })();

    evidencesvr.CheckAccountRes = (function() {

        /**
         * Properties of a CheckAccountRes.
         * @memberof evidencesvr
         * @interface ICheckAccountRes
         * @property {string|null} [UserID] CheckAccountRes UserID
         * @property {number|Long|null} [TokenTime] CheckAccountRes TokenTime
         * @property {number|null} [TokenRandom] CheckAccountRes TokenRandom
         * @property {string|null} [Token] CheckAccountRes Token
         */

        /**
         * Constructs a new CheckAccountRes.
         * @memberof evidencesvr
         * @classdesc Represents a CheckAccountRes.
         * @implements ICheckAccountRes
         * @constructor
         * @param {evidencesvr.ICheckAccountRes=} [properties] Properties to set
         */
        function CheckAccountRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * CheckAccountRes UserID.
         * @member {string} UserID
         * @memberof evidencesvr.CheckAccountRes
         * @instance
         */
        CheckAccountRes.prototype.UserID = "";

        /**
         * CheckAccountRes TokenTime.
         * @member {number|Long} TokenTime
         * @memberof evidencesvr.CheckAccountRes
         * @instance
         */
        CheckAccountRes.prototype.TokenTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * CheckAccountRes TokenRandom.
         * @member {number} TokenRandom
         * @memberof evidencesvr.CheckAccountRes
         * @instance
         */
        CheckAccountRes.prototype.TokenRandom = 0;

        /**
         * CheckAccountRes Token.
         * @member {string} Token
         * @memberof evidencesvr.CheckAccountRes
         * @instance
         */
        CheckAccountRes.prototype.Token = "";

        /**
         * Creates a new CheckAccountRes instance using the specified properties.
         * @function create
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {evidencesvr.ICheckAccountRes=} [properties] Properties to set
         * @returns {evidencesvr.CheckAccountRes} CheckAccountRes instance
         */
        CheckAccountRes.create = function create(properties) {
            return new CheckAccountRes(properties);
        };

        /**
         * Encodes the specified CheckAccountRes message. Does not implicitly {@link evidencesvr.CheckAccountRes.verify|verify} messages.
         * @function encode
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {evidencesvr.ICheckAccountRes} message CheckAccountRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CheckAccountRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserID != null && Object.hasOwnProperty.call(message, "UserID"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserID);
            if (message.TokenTime != null && Object.hasOwnProperty.call(message, "TokenTime"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.TokenTime);
            if (message.TokenRandom != null && Object.hasOwnProperty.call(message, "TokenRandom"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.TokenRandom);
            if (message.Token != null && Object.hasOwnProperty.call(message, "Token"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.Token);
            return writer;
        };

        /**
         * Encodes the specified CheckAccountRes message, length delimited. Does not implicitly {@link evidencesvr.CheckAccountRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {evidencesvr.ICheckAccountRes} message CheckAccountRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CheckAccountRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a CheckAccountRes message from the specified reader or buffer.
         * @function decode
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {evidencesvr.CheckAccountRes} CheckAccountRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CheckAccountRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.evidencesvr.CheckAccountRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserID = reader.string();
                    break;
                case 2:
                    message.TokenTime = reader.int64();
                    break;
                case 3:
                    message.TokenRandom = reader.int32();
                    break;
                case 4:
                    message.Token = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a CheckAccountRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {evidencesvr.CheckAccountRes} CheckAccountRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CheckAccountRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CheckAccountRes message.
         * @function verify
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CheckAccountRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                if (!$util.isString(message.UserID))
                    return "UserID: string expected";
            if (message.TokenTime != null && message.hasOwnProperty("TokenTime"))
                if (!$util.isInteger(message.TokenTime) && !(message.TokenTime && $util.isInteger(message.TokenTime.low) && $util.isInteger(message.TokenTime.high)))
                    return "TokenTime: integer|Long expected";
            if (message.TokenRandom != null && message.hasOwnProperty("TokenRandom"))
                if (!$util.isInteger(message.TokenRandom))
                    return "TokenRandom: integer expected";
            if (message.Token != null && message.hasOwnProperty("Token"))
                if (!$util.isString(message.Token))
                    return "Token: string expected";
            return null;
        };

        /**
         * Creates a CheckAccountRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {evidencesvr.CheckAccountRes} CheckAccountRes
         */
        CheckAccountRes.fromObject = function fromObject(object) {
            if (object instanceof $root.evidencesvr.CheckAccountRes)
                return object;
            var message = new $root.evidencesvr.CheckAccountRes();
            if (object.UserID != null)
                message.UserID = String(object.UserID);
            if (object.TokenTime != null)
                if ($util.Long)
                    (message.TokenTime = $util.Long.fromValue(object.TokenTime)).unsigned = false;
                else if (typeof object.TokenTime === "string")
                    message.TokenTime = parseInt(object.TokenTime, 10);
                else if (typeof object.TokenTime === "number")
                    message.TokenTime = object.TokenTime;
                else if (typeof object.TokenTime === "object")
                    message.TokenTime = new $util.LongBits(object.TokenTime.low >>> 0, object.TokenTime.high >>> 0).toNumber();
            if (object.TokenRandom != null)
                message.TokenRandom = object.TokenRandom | 0;
            if (object.Token != null)
                message.Token = String(object.Token);
            return message;
        };

        /**
         * Creates a plain object from a CheckAccountRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof evidencesvr.CheckAccountRes
         * @static
         * @param {evidencesvr.CheckAccountRes} message CheckAccountRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CheckAccountRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.UserID = "";
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.TokenTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.TokenTime = options.longs === String ? "0" : 0;
                object.TokenRandom = 0;
                object.Token = "";
            }
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                object.UserID = message.UserID;
            if (message.TokenTime != null && message.hasOwnProperty("TokenTime"))
                if (typeof message.TokenTime === "number")
                    object.TokenTime = options.longs === String ? String(message.TokenTime) : message.TokenTime;
                else
                    object.TokenTime = options.longs === String ? $util.Long.prototype.toString.call(message.TokenTime) : options.longs === Number ? new $util.LongBits(message.TokenTime.low >>> 0, message.TokenTime.high >>> 0).toNumber() : message.TokenTime;
            if (message.TokenRandom != null && message.hasOwnProperty("TokenRandom"))
                object.TokenRandom = message.TokenRandom;
            if (message.Token != null && message.hasOwnProperty("Token"))
                object.Token = message.Token;
            return object;
        };

        /**
         * Converts this CheckAccountRes to JSON.
         * @function toJSON
         * @memberof evidencesvr.CheckAccountRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CheckAccountRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return CheckAccountRes;
    })();

    return evidencesvr;
})();

$root.gamesvr = (function() {

    /**
     * Namespace gamesvr.
     * @exports gamesvr
     * @namespace
     */
    var gamesvr = {};

    gamesvr.GetItemReq = (function() {

        /**
         * Properties of a GetItemReq.
         * @memberof gamesvr
         * @interface IGetItemReq
         * @property {number|null} [ID] GetItemReq ID
         * @property {number|Long|null} [Count] GetItemReq Count
         */

        /**
         * Constructs a new GetItemReq.
         * @memberof gamesvr
         * @classdesc Represents a GetItemReq.
         * @implements IGetItemReq
         * @constructor
         * @param {gamesvr.IGetItemReq=} [properties] Properties to set
         */
        function GetItemReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetItemReq ID.
         * @member {number} ID
         * @memberof gamesvr.GetItemReq
         * @instance
         */
        GetItemReq.prototype.ID = 0;

        /**
         * GetItemReq Count.
         * @member {number|Long} Count
         * @memberof gamesvr.GetItemReq
         * @instance
         */
        GetItemReq.prototype.Count = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new GetItemReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {gamesvr.IGetItemReq=} [properties] Properties to set
         * @returns {gamesvr.GetItemReq} GetItemReq instance
         */
        GetItemReq.create = function create(properties) {
            return new GetItemReq(properties);
        };

        /**
         * Encodes the specified GetItemReq message. Does not implicitly {@link gamesvr.GetItemReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {gamesvr.IGetItemReq} message GetItemReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetItemReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ID != null && Object.hasOwnProperty.call(message, "ID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.ID);
            if (message.Count != null && Object.hasOwnProperty.call(message, "Count"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.Count);
            return writer;
        };

        /**
         * Encodes the specified GetItemReq message, length delimited. Does not implicitly {@link gamesvr.GetItemReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {gamesvr.IGetItemReq} message GetItemReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetItemReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetItemReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.GetItemReq} GetItemReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetItemReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.GetItemReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.ID = reader.int32();
                    break;
                case 2:
                    message.Count = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetItemReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.GetItemReq} GetItemReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetItemReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetItemReq message.
         * @function verify
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetItemReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ID != null && message.hasOwnProperty("ID"))
                if (!$util.isInteger(message.ID))
                    return "ID: integer expected";
            if (message.Count != null && message.hasOwnProperty("Count"))
                if (!$util.isInteger(message.Count) && !(message.Count && $util.isInteger(message.Count.low) && $util.isInteger(message.Count.high)))
                    return "Count: integer|Long expected";
            return null;
        };

        /**
         * Creates a GetItemReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.GetItemReq} GetItemReq
         */
        GetItemReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.GetItemReq)
                return object;
            var message = new $root.gamesvr.GetItemReq();
            if (object.ID != null)
                message.ID = object.ID | 0;
            if (object.Count != null)
                if ($util.Long)
                    (message.Count = $util.Long.fromValue(object.Count)).unsigned = false;
                else if (typeof object.Count === "string")
                    message.Count = parseInt(object.Count, 10);
                else if (typeof object.Count === "number")
                    message.Count = object.Count;
                else if (typeof object.Count === "object")
                    message.Count = new $util.LongBits(object.Count.low >>> 0, object.Count.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a GetItemReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.GetItemReq
         * @static
         * @param {gamesvr.GetItemReq} message GetItemReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetItemReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.ID = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.Count = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.Count = options.longs === String ? "0" : 0;
            }
            if (message.ID != null && message.hasOwnProperty("ID"))
                object.ID = message.ID;
            if (message.Count != null && message.hasOwnProperty("Count"))
                if (typeof message.Count === "number")
                    object.Count = options.longs === String ? String(message.Count) : message.Count;
                else
                    object.Count = options.longs === String ? $util.Long.prototype.toString.call(message.Count) : options.longs === Number ? new $util.LongBits(message.Count.low >>> 0, message.Count.high >>> 0).toNumber() : message.Count;
            return object;
        };

        /**
         * Converts this GetItemReq to JSON.
         * @function toJSON
         * @memberof gamesvr.GetItemReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetItemReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetItemReq;
    })();

    gamesvr.GetItemRes = (function() {

        /**
         * Properties of a GetItemRes.
         * @memberof gamesvr
         * @interface IGetItemRes
         */

        /**
         * Constructs a new GetItemRes.
         * @memberof gamesvr
         * @classdesc Represents a GetItemRes.
         * @implements IGetItemRes
         * @constructor
         * @param {gamesvr.IGetItemRes=} [properties] Properties to set
         */
        function GetItemRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new GetItemRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {gamesvr.IGetItemRes=} [properties] Properties to set
         * @returns {gamesvr.GetItemRes} GetItemRes instance
         */
        GetItemRes.create = function create(properties) {
            return new GetItemRes(properties);
        };

        /**
         * Encodes the specified GetItemRes message. Does not implicitly {@link gamesvr.GetItemRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {gamesvr.IGetItemRes} message GetItemRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetItemRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified GetItemRes message, length delimited. Does not implicitly {@link gamesvr.GetItemRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {gamesvr.IGetItemRes} message GetItemRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetItemRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GetItemRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.GetItemRes} GetItemRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetItemRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.GetItemRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetItemRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.GetItemRes} GetItemRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetItemRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetItemRes message.
         * @function verify
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetItemRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a GetItemRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.GetItemRes} GetItemRes
         */
        GetItemRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.GetItemRes)
                return object;
            return new $root.gamesvr.GetItemRes();
        };

        /**
         * Creates a plain object from a GetItemRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.GetItemRes
         * @static
         * @param {gamesvr.GetItemRes} message GetItemRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetItemRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this GetItemRes to JSON.
         * @function toJSON
         * @memberof gamesvr.GetItemRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetItemRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GetItemRes;
    })();

    gamesvr.ItemChangeNotify = (function() {

        /**
         * Properties of an ItemChangeNotify.
         * @memberof gamesvr
         * @interface IItemChangeNotify
         * @property {Array.<data.IBagUnit>|null} [Units] ItemChangeNotify Units
         */

        /**
         * Constructs a new ItemChangeNotify.
         * @memberof gamesvr
         * @classdesc Represents an ItemChangeNotify.
         * @implements IItemChangeNotify
         * @constructor
         * @param {gamesvr.IItemChangeNotify=} [properties] Properties to set
         */
        function ItemChangeNotify(properties) {
            this.Units = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ItemChangeNotify Units.
         * @member {Array.<data.IBagUnit>} Units
         * @memberof gamesvr.ItemChangeNotify
         * @instance
         */
        ItemChangeNotify.prototype.Units = $util.emptyArray;

        /**
         * Creates a new ItemChangeNotify instance using the specified properties.
         * @function create
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {gamesvr.IItemChangeNotify=} [properties] Properties to set
         * @returns {gamesvr.ItemChangeNotify} ItemChangeNotify instance
         */
        ItemChangeNotify.create = function create(properties) {
            return new ItemChangeNotify(properties);
        };

        /**
         * Encodes the specified ItemChangeNotify message. Does not implicitly {@link gamesvr.ItemChangeNotify.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {gamesvr.IItemChangeNotify} message ItemChangeNotify message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ItemChangeNotify.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Units != null && message.Units.length)
                for (var i = 0; i < message.Units.length; ++i)
                    $root.data.BagUnit.encode(message.Units[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ItemChangeNotify message, length delimited. Does not implicitly {@link gamesvr.ItemChangeNotify.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {gamesvr.IItemChangeNotify} message ItemChangeNotify message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ItemChangeNotify.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an ItemChangeNotify message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ItemChangeNotify} ItemChangeNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ItemChangeNotify.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ItemChangeNotify();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.Units && message.Units.length))
                        message.Units = [];
                    message.Units.push($root.data.BagUnit.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ItemChangeNotify message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ItemChangeNotify} ItemChangeNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ItemChangeNotify.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ItemChangeNotify message.
         * @function verify
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ItemChangeNotify.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Units != null && message.hasOwnProperty("Units")) {
                if (!Array.isArray(message.Units))
                    return "Units: array expected";
                for (var i = 0; i < message.Units.length; ++i) {
                    var error = $root.data.BagUnit.verify(message.Units[i]);
                    if (error)
                        return "Units." + error;
                }
            }
            return null;
        };

        /**
         * Creates an ItemChangeNotify message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ItemChangeNotify} ItemChangeNotify
         */
        ItemChangeNotify.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ItemChangeNotify)
                return object;
            var message = new $root.gamesvr.ItemChangeNotify();
            if (object.Units) {
                if (!Array.isArray(object.Units))
                    throw TypeError(".gamesvr.ItemChangeNotify.Units: array expected");
                message.Units = [];
                for (var i = 0; i < object.Units.length; ++i) {
                    if (typeof object.Units[i] !== "object")
                        throw TypeError(".gamesvr.ItemChangeNotify.Units: object expected");
                    message.Units[i] = $root.data.BagUnit.fromObject(object.Units[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from an ItemChangeNotify message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ItemChangeNotify
         * @static
         * @param {gamesvr.ItemChangeNotify} message ItemChangeNotify
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ItemChangeNotify.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Units = [];
            if (message.Units && message.Units.length) {
                object.Units = [];
                for (var j = 0; j < message.Units.length; ++j)
                    object.Units[j] = $root.data.BagUnit.toObject(message.Units[j], options);
            }
            return object;
        };

        /**
         * Converts this ItemChangeNotify to JSON.
         * @function toJSON
         * @memberof gamesvr.ItemChangeNotify
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ItemChangeNotify.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ItemChangeNotify;
    })();

    gamesvr.LoginReq = (function() {

        /**
         * Properties of a LoginReq.
         * @memberof gamesvr
         * @interface ILoginReq
         * @property {string|null} [UserID] LoginReq UserID
         * @property {number|null} [Channel] LoginReq Channel
         * @property {number|Long|null} [TokenTime] LoginReq TokenTime
         * @property {number|null} [TokenRandom] LoginReq TokenRandom
         * @property {string|null} [Token] LoginReq Token
         */

        /**
         * Constructs a new LoginReq.
         * @memberof gamesvr
         * @classdesc Represents a LoginReq.
         * @implements ILoginReq
         * @constructor
         * @param {gamesvr.ILoginReq=} [properties] Properties to set
         */
        function LoginReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LoginReq UserID.
         * @member {string} UserID
         * @memberof gamesvr.LoginReq
         * @instance
         */
        LoginReq.prototype.UserID = "";

        /**
         * LoginReq Channel.
         * @member {number} Channel
         * @memberof gamesvr.LoginReq
         * @instance
         */
        LoginReq.prototype.Channel = 0;

        /**
         * LoginReq TokenTime.
         * @member {number|Long} TokenTime
         * @memberof gamesvr.LoginReq
         * @instance
         */
        LoginReq.prototype.TokenTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * LoginReq TokenRandom.
         * @member {number} TokenRandom
         * @memberof gamesvr.LoginReq
         * @instance
         */
        LoginReq.prototype.TokenRandom = 0;

        /**
         * LoginReq Token.
         * @member {string} Token
         * @memberof gamesvr.LoginReq
         * @instance
         */
        LoginReq.prototype.Token = "";

        /**
         * Creates a new LoginReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.LoginReq
         * @static
         * @param {gamesvr.ILoginReq=} [properties] Properties to set
         * @returns {gamesvr.LoginReq} LoginReq instance
         */
        LoginReq.create = function create(properties) {
            return new LoginReq(properties);
        };

        /**
         * Encodes the specified LoginReq message. Does not implicitly {@link gamesvr.LoginReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.LoginReq
         * @static
         * @param {gamesvr.ILoginReq} message LoginReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LoginReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserID != null && Object.hasOwnProperty.call(message, "UserID"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserID);
            if (message.Channel != null && Object.hasOwnProperty.call(message, "Channel"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Channel);
            if (message.TokenTime != null && Object.hasOwnProperty.call(message, "TokenTime"))
                writer.uint32(/* id 10, wireType 0 =*/80).int64(message.TokenTime);
            if (message.TokenRandom != null && Object.hasOwnProperty.call(message, "TokenRandom"))
                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.TokenRandom);
            if (message.Token != null && Object.hasOwnProperty.call(message, "Token"))
                writer.uint32(/* id 12, wireType 2 =*/98).string(message.Token);
            return writer;
        };

        /**
         * Encodes the specified LoginReq message, length delimited. Does not implicitly {@link gamesvr.LoginReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.LoginReq
         * @static
         * @param {gamesvr.ILoginReq} message LoginReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LoginReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LoginReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.LoginReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.LoginReq} LoginReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LoginReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.LoginReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserID = reader.string();
                    break;
                case 2:
                    message.Channel = reader.int32();
                    break;
                case 10:
                    message.TokenTime = reader.int64();
                    break;
                case 11:
                    message.TokenRandom = reader.int32();
                    break;
                case 12:
                    message.Token = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LoginReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.LoginReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.LoginReq} LoginReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LoginReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LoginReq message.
         * @function verify
         * @memberof gamesvr.LoginReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LoginReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                if (!$util.isString(message.UserID))
                    return "UserID: string expected";
            if (message.Channel != null && message.hasOwnProperty("Channel"))
                if (!$util.isInteger(message.Channel))
                    return "Channel: integer expected";
            if (message.TokenTime != null && message.hasOwnProperty("TokenTime"))
                if (!$util.isInteger(message.TokenTime) && !(message.TokenTime && $util.isInteger(message.TokenTime.low) && $util.isInteger(message.TokenTime.high)))
                    return "TokenTime: integer|Long expected";
            if (message.TokenRandom != null && message.hasOwnProperty("TokenRandom"))
                if (!$util.isInteger(message.TokenRandom))
                    return "TokenRandom: integer expected";
            if (message.Token != null && message.hasOwnProperty("Token"))
                if (!$util.isString(message.Token))
                    return "Token: string expected";
            return null;
        };

        /**
         * Creates a LoginReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.LoginReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.LoginReq} LoginReq
         */
        LoginReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.LoginReq)
                return object;
            var message = new $root.gamesvr.LoginReq();
            if (object.UserID != null)
                message.UserID = String(object.UserID);
            if (object.Channel != null)
                message.Channel = object.Channel | 0;
            if (object.TokenTime != null)
                if ($util.Long)
                    (message.TokenTime = $util.Long.fromValue(object.TokenTime)).unsigned = false;
                else if (typeof object.TokenTime === "string")
                    message.TokenTime = parseInt(object.TokenTime, 10);
                else if (typeof object.TokenTime === "number")
                    message.TokenTime = object.TokenTime;
                else if (typeof object.TokenTime === "object")
                    message.TokenTime = new $util.LongBits(object.TokenTime.low >>> 0, object.TokenTime.high >>> 0).toNumber();
            if (object.TokenRandom != null)
                message.TokenRandom = object.TokenRandom | 0;
            if (object.Token != null)
                message.Token = String(object.Token);
            return message;
        };

        /**
         * Creates a plain object from a LoginReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.LoginReq
         * @static
         * @param {gamesvr.LoginReq} message LoginReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LoginReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.UserID = "";
                object.Channel = 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.TokenTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.TokenTime = options.longs === String ? "0" : 0;
                object.TokenRandom = 0;
                object.Token = "";
            }
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                object.UserID = message.UserID;
            if (message.Channel != null && message.hasOwnProperty("Channel"))
                object.Channel = message.Channel;
            if (message.TokenTime != null && message.hasOwnProperty("TokenTime"))
                if (typeof message.TokenTime === "number")
                    object.TokenTime = options.longs === String ? String(message.TokenTime) : message.TokenTime;
                else
                    object.TokenTime = options.longs === String ? $util.Long.prototype.toString.call(message.TokenTime) : options.longs === Number ? new $util.LongBits(message.TokenTime.low >>> 0, message.TokenTime.high >>> 0).toNumber() : message.TokenTime;
            if (message.TokenRandom != null && message.hasOwnProperty("TokenRandom"))
                object.TokenRandom = message.TokenRandom;
            if (message.Token != null && message.hasOwnProperty("Token"))
                object.Token = message.Token;
            return object;
        };

        /**
         * Converts this LoginReq to JSON.
         * @function toJSON
         * @memberof gamesvr.LoginReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LoginReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LoginReq;
    })();

    gamesvr.LoginRes = (function() {

        /**
         * Properties of a LoginRes.
         * @memberof gamesvr
         * @interface ILoginRes
         * @property {data.IUserData|null} [UserData] LoginRes UserData
         * @property {number|Long|null} [ServerTime] LoginRes ServerTime
         */

        /**
         * Constructs a new LoginRes.
         * @memberof gamesvr
         * @classdesc Represents a LoginRes.
         * @implements ILoginRes
         * @constructor
         * @param {gamesvr.ILoginRes=} [properties] Properties to set
         */
        function LoginRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LoginRes UserData.
         * @member {data.IUserData|null|undefined} UserData
         * @memberof gamesvr.LoginRes
         * @instance
         */
        LoginRes.prototype.UserData = null;

        /**
         * LoginRes ServerTime.
         * @member {number|Long} ServerTime
         * @memberof gamesvr.LoginRes
         * @instance
         */
        LoginRes.prototype.ServerTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new LoginRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.LoginRes
         * @static
         * @param {gamesvr.ILoginRes=} [properties] Properties to set
         * @returns {gamesvr.LoginRes} LoginRes instance
         */
        LoginRes.create = function create(properties) {
            return new LoginRes(properties);
        };

        /**
         * Encodes the specified LoginRes message. Does not implicitly {@link gamesvr.LoginRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.LoginRes
         * @static
         * @param {gamesvr.ILoginRes} message LoginRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LoginRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserData != null && Object.hasOwnProperty.call(message, "UserData"))
                $root.data.UserData.encode(message.UserData, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            if (message.ServerTime != null && Object.hasOwnProperty.call(message, "ServerTime"))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.ServerTime);
            return writer;
        };

        /**
         * Encodes the specified LoginRes message, length delimited. Does not implicitly {@link gamesvr.LoginRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.LoginRes
         * @static
         * @param {gamesvr.ILoginRes} message LoginRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LoginRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LoginRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.LoginRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.LoginRes} LoginRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LoginRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.LoginRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserData = $root.data.UserData.decode(reader, reader.uint32());
                    break;
                case 2:
                    message.ServerTime = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LoginRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.LoginRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.LoginRes} LoginRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LoginRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LoginRes message.
         * @function verify
         * @memberof gamesvr.LoginRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LoginRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserData != null && message.hasOwnProperty("UserData")) {
                var error = $root.data.UserData.verify(message.UserData);
                if (error)
                    return "UserData." + error;
            }
            if (message.ServerTime != null && message.hasOwnProperty("ServerTime"))
                if (!$util.isInteger(message.ServerTime) && !(message.ServerTime && $util.isInteger(message.ServerTime.low) && $util.isInteger(message.ServerTime.high)))
                    return "ServerTime: integer|Long expected";
            return null;
        };

        /**
         * Creates a LoginRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.LoginRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.LoginRes} LoginRes
         */
        LoginRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.LoginRes)
                return object;
            var message = new $root.gamesvr.LoginRes();
            if (object.UserData != null) {
                if (typeof object.UserData !== "object")
                    throw TypeError(".gamesvr.LoginRes.UserData: object expected");
                message.UserData = $root.data.UserData.fromObject(object.UserData);
            }
            if (object.ServerTime != null)
                if ($util.Long)
                    (message.ServerTime = $util.Long.fromValue(object.ServerTime)).unsigned = false;
                else if (typeof object.ServerTime === "string")
                    message.ServerTime = parseInt(object.ServerTime, 10);
                else if (typeof object.ServerTime === "number")
                    message.ServerTime = object.ServerTime;
                else if (typeof object.ServerTime === "object")
                    message.ServerTime = new $util.LongBits(object.ServerTime.low >>> 0, object.ServerTime.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a LoginRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.LoginRes
         * @static
         * @param {gamesvr.LoginRes} message LoginRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LoginRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.UserData = null;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.ServerTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.ServerTime = options.longs === String ? "0" : 0;
            }
            if (message.UserData != null && message.hasOwnProperty("UserData"))
                object.UserData = $root.data.UserData.toObject(message.UserData, options);
            if (message.ServerTime != null && message.hasOwnProperty("ServerTime"))
                if (typeof message.ServerTime === "number")
                    object.ServerTime = options.longs === String ? String(message.ServerTime) : message.ServerTime;
                else
                    object.ServerTime = options.longs === String ? $util.Long.prototype.toString.call(message.ServerTime) : options.longs === Number ? new $util.LongBits(message.ServerTime.low >>> 0, message.ServerTime.high >>> 0).toNumber() : message.ServerTime;
            return object;
        };

        /**
         * Converts this LoginRes to JSON.
         * @function toJSON
         * @memberof gamesvr.LoginRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LoginRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LoginRes;
    })();

    gamesvr.HeartBeatReq = (function() {

        /**
         * Properties of a HeartBeatReq.
         * @memberof gamesvr
         * @interface IHeartBeatReq
         */

        /**
         * Constructs a new HeartBeatReq.
         * @memberof gamesvr
         * @classdesc Represents a HeartBeatReq.
         * @implements IHeartBeatReq
         * @constructor
         * @param {gamesvr.IHeartBeatReq=} [properties] Properties to set
         */
        function HeartBeatReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new HeartBeatReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {gamesvr.IHeartBeatReq=} [properties] Properties to set
         * @returns {gamesvr.HeartBeatReq} HeartBeatReq instance
         */
        HeartBeatReq.create = function create(properties) {
            return new HeartBeatReq(properties);
        };

        /**
         * Encodes the specified HeartBeatReq message. Does not implicitly {@link gamesvr.HeartBeatReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {gamesvr.IHeartBeatReq} message HeartBeatReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeartBeatReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified HeartBeatReq message, length delimited. Does not implicitly {@link gamesvr.HeartBeatReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {gamesvr.IHeartBeatReq} message HeartBeatReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeartBeatReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HeartBeatReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.HeartBeatReq} HeartBeatReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeartBeatReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.HeartBeatReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HeartBeatReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.HeartBeatReq} HeartBeatReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeartBeatReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HeartBeatReq message.
         * @function verify
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeartBeatReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a HeartBeatReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.HeartBeatReq} HeartBeatReq
         */
        HeartBeatReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.HeartBeatReq)
                return object;
            return new $root.gamesvr.HeartBeatReq();
        };

        /**
         * Creates a plain object from a HeartBeatReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.HeartBeatReq
         * @static
         * @param {gamesvr.HeartBeatReq} message HeartBeatReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeartBeatReq.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this HeartBeatReq to JSON.
         * @function toJSON
         * @memberof gamesvr.HeartBeatReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeartBeatReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HeartBeatReq;
    })();

    gamesvr.HeartBeatRes = (function() {

        /**
         * Properties of a HeartBeatRes.
         * @memberof gamesvr
         * @interface IHeartBeatRes
         * @property {number|Long|null} [ServerTime] HeartBeatRes ServerTime
         */

        /**
         * Constructs a new HeartBeatRes.
         * @memberof gamesvr
         * @classdesc Represents a HeartBeatRes.
         * @implements IHeartBeatRes
         * @constructor
         * @param {gamesvr.IHeartBeatRes=} [properties] Properties to set
         */
        function HeartBeatRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HeartBeatRes ServerTime.
         * @member {number|Long} ServerTime
         * @memberof gamesvr.HeartBeatRes
         * @instance
         */
        HeartBeatRes.prototype.ServerTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new HeartBeatRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {gamesvr.IHeartBeatRes=} [properties] Properties to set
         * @returns {gamesvr.HeartBeatRes} HeartBeatRes instance
         */
        HeartBeatRes.create = function create(properties) {
            return new HeartBeatRes(properties);
        };

        /**
         * Encodes the specified HeartBeatRes message. Does not implicitly {@link gamesvr.HeartBeatRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {gamesvr.IHeartBeatRes} message HeartBeatRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeartBeatRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.ServerTime != null && Object.hasOwnProperty.call(message, "ServerTime"))
                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.ServerTime);
            return writer;
        };

        /**
         * Encodes the specified HeartBeatRes message, length delimited. Does not implicitly {@link gamesvr.HeartBeatRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {gamesvr.IHeartBeatRes} message HeartBeatRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeartBeatRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HeartBeatRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.HeartBeatRes} HeartBeatRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeartBeatRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.HeartBeatRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.ServerTime = reader.int64();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HeartBeatRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.HeartBeatRes} HeartBeatRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeartBeatRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HeartBeatRes message.
         * @function verify
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeartBeatRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.ServerTime != null && message.hasOwnProperty("ServerTime"))
                if (!$util.isInteger(message.ServerTime) && !(message.ServerTime && $util.isInteger(message.ServerTime.low) && $util.isInteger(message.ServerTime.high)))
                    return "ServerTime: integer|Long expected";
            return null;
        };

        /**
         * Creates a HeartBeatRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.HeartBeatRes} HeartBeatRes
         */
        HeartBeatRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.HeartBeatRes)
                return object;
            var message = new $root.gamesvr.HeartBeatRes();
            if (object.ServerTime != null)
                if ($util.Long)
                    (message.ServerTime = $util.Long.fromValue(object.ServerTime)).unsigned = false;
                else if (typeof object.ServerTime === "string")
                    message.ServerTime = parseInt(object.ServerTime, 10);
                else if (typeof object.ServerTime === "number")
                    message.ServerTime = object.ServerTime;
                else if (typeof object.ServerTime === "object")
                    message.ServerTime = new $util.LongBits(object.ServerTime.low >>> 0, object.ServerTime.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a HeartBeatRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.HeartBeatRes
         * @static
         * @param {gamesvr.HeartBeatRes} message HeartBeatRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeartBeatRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.ServerTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                } else
                    object.ServerTime = options.longs === String ? "0" : 0;
            if (message.ServerTime != null && message.hasOwnProperty("ServerTime"))
                if (typeof message.ServerTime === "number")
                    object.ServerTime = options.longs === String ? String(message.ServerTime) : message.ServerTime;
                else
                    object.ServerTime = options.longs === String ? $util.Long.prototype.toString.call(message.ServerTime) : options.longs === Number ? new $util.LongBits(message.ServerTime.low >>> 0, message.ServerTime.high >>> 0).toNumber() : message.ServerTime;
            return object;
        };

        /**
         * Converts this HeartBeatRes to JSON.
         * @function toJSON
         * @memberof gamesvr.HeartBeatRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeartBeatRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HeartBeatRes;
    })();

    gamesvr.ChangeNameReq = (function() {

        /**
         * Properties of a ChangeNameReq.
         * @memberof gamesvr
         * @interface IChangeNameReq
         * @property {string|null} [Name] ChangeNameReq Name
         */

        /**
         * Constructs a new ChangeNameReq.
         * @memberof gamesvr
         * @classdesc Represents a ChangeNameReq.
         * @implements IChangeNameReq
         * @constructor
         * @param {gamesvr.IChangeNameReq=} [properties] Properties to set
         */
        function ChangeNameReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChangeNameReq Name.
         * @member {string} Name
         * @memberof gamesvr.ChangeNameReq
         * @instance
         */
        ChangeNameReq.prototype.Name = "";

        /**
         * Creates a new ChangeNameReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {gamesvr.IChangeNameReq=} [properties] Properties to set
         * @returns {gamesvr.ChangeNameReq} ChangeNameReq instance
         */
        ChangeNameReq.create = function create(properties) {
            return new ChangeNameReq(properties);
        };

        /**
         * Encodes the specified ChangeNameReq message. Does not implicitly {@link gamesvr.ChangeNameReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {gamesvr.IChangeNameReq} message ChangeNameReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeNameReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Name != null && Object.hasOwnProperty.call(message, "Name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Name);
            return writer;
        };

        /**
         * Encodes the specified ChangeNameReq message, length delimited. Does not implicitly {@link gamesvr.ChangeNameReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {gamesvr.IChangeNameReq} message ChangeNameReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeNameReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChangeNameReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ChangeNameReq} ChangeNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeNameReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ChangeNameReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Name = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChangeNameReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ChangeNameReq} ChangeNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeNameReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChangeNameReq message.
         * @function verify
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChangeNameReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Name != null && message.hasOwnProperty("Name"))
                if (!$util.isString(message.Name))
                    return "Name: string expected";
            return null;
        };

        /**
         * Creates a ChangeNameReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ChangeNameReq} ChangeNameReq
         */
        ChangeNameReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ChangeNameReq)
                return object;
            var message = new $root.gamesvr.ChangeNameReq();
            if (object.Name != null)
                message.Name = String(object.Name);
            return message;
        };

        /**
         * Creates a plain object from a ChangeNameReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ChangeNameReq
         * @static
         * @param {gamesvr.ChangeNameReq} message ChangeNameReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChangeNameReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.Name = "";
            if (message.Name != null && message.hasOwnProperty("Name"))
                object.Name = message.Name;
            return object;
        };

        /**
         * Converts this ChangeNameReq to JSON.
         * @function toJSON
         * @memberof gamesvr.ChangeNameReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChangeNameReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ChangeNameReq;
    })();

    gamesvr.ChangeNameRes = (function() {

        /**
         * Properties of a ChangeNameRes.
         * @memberof gamesvr
         * @interface IChangeNameRes
         * @property {string|null} [Name] ChangeNameRes Name
         */

        /**
         * Constructs a new ChangeNameRes.
         * @memberof gamesvr
         * @classdesc Represents a ChangeNameRes.
         * @implements IChangeNameRes
         * @constructor
         * @param {gamesvr.IChangeNameRes=} [properties] Properties to set
         */
        function ChangeNameRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChangeNameRes Name.
         * @member {string} Name
         * @memberof gamesvr.ChangeNameRes
         * @instance
         */
        ChangeNameRes.prototype.Name = "";

        /**
         * Creates a new ChangeNameRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {gamesvr.IChangeNameRes=} [properties] Properties to set
         * @returns {gamesvr.ChangeNameRes} ChangeNameRes instance
         */
        ChangeNameRes.create = function create(properties) {
            return new ChangeNameRes(properties);
        };

        /**
         * Encodes the specified ChangeNameRes message. Does not implicitly {@link gamesvr.ChangeNameRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {gamesvr.IChangeNameRes} message ChangeNameRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeNameRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Name != null && Object.hasOwnProperty.call(message, "Name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Name);
            return writer;
        };

        /**
         * Encodes the specified ChangeNameRes message, length delimited. Does not implicitly {@link gamesvr.ChangeNameRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {gamesvr.IChangeNameRes} message ChangeNameRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeNameRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChangeNameRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ChangeNameRes} ChangeNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeNameRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ChangeNameRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Name = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChangeNameRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ChangeNameRes} ChangeNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeNameRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChangeNameRes message.
         * @function verify
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChangeNameRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Name != null && message.hasOwnProperty("Name"))
                if (!$util.isString(message.Name))
                    return "Name: string expected";
            return null;
        };

        /**
         * Creates a ChangeNameRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ChangeNameRes} ChangeNameRes
         */
        ChangeNameRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ChangeNameRes)
                return object;
            var message = new $root.gamesvr.ChangeNameRes();
            if (object.Name != null)
                message.Name = String(object.Name);
            return message;
        };

        /**
         * Creates a plain object from a ChangeNameRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ChangeNameRes
         * @static
         * @param {gamesvr.ChangeNameRes} message ChangeNameRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChangeNameRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.Name = "";
            if (message.Name != null && message.hasOwnProperty("Name"))
                object.Name = message.Name;
            return object;
        };

        /**
         * Converts this ChangeNameRes to JSON.
         * @function toJSON
         * @memberof gamesvr.ChangeNameRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChangeNameRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ChangeNameRes;
    })();

    gamesvr.ChangeHeadReq = (function() {

        /**
         * Properties of a ChangeHeadReq.
         * @memberof gamesvr
         * @interface IChangeHeadReq
         * @property {number|null} [HeadID] ChangeHeadReq HeadID
         * @property {number|null} [HeadFrameID] ChangeHeadReq HeadFrameID
         */

        /**
         * Constructs a new ChangeHeadReq.
         * @memberof gamesvr
         * @classdesc Represents a ChangeHeadReq.
         * @implements IChangeHeadReq
         * @constructor
         * @param {gamesvr.IChangeHeadReq=} [properties] Properties to set
         */
        function ChangeHeadReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChangeHeadReq HeadID.
         * @member {number} HeadID
         * @memberof gamesvr.ChangeHeadReq
         * @instance
         */
        ChangeHeadReq.prototype.HeadID = 0;

        /**
         * ChangeHeadReq HeadFrameID.
         * @member {number} HeadFrameID
         * @memberof gamesvr.ChangeHeadReq
         * @instance
         */
        ChangeHeadReq.prototype.HeadFrameID = 0;

        /**
         * Creates a new ChangeHeadReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {gamesvr.IChangeHeadReq=} [properties] Properties to set
         * @returns {gamesvr.ChangeHeadReq} ChangeHeadReq instance
         */
        ChangeHeadReq.create = function create(properties) {
            return new ChangeHeadReq(properties);
        };

        /**
         * Encodes the specified ChangeHeadReq message. Does not implicitly {@link gamesvr.ChangeHeadReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {gamesvr.IChangeHeadReq} message ChangeHeadReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeHeadReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeadID != null && Object.hasOwnProperty.call(message, "HeadID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeadID);
            if (message.HeadFrameID != null && Object.hasOwnProperty.call(message, "HeadFrameID"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.HeadFrameID);
            return writer;
        };

        /**
         * Encodes the specified ChangeHeadReq message, length delimited. Does not implicitly {@link gamesvr.ChangeHeadReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {gamesvr.IChangeHeadReq} message ChangeHeadReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeHeadReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChangeHeadReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ChangeHeadReq} ChangeHeadReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeHeadReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ChangeHeadReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeadID = reader.int32();
                    break;
                case 2:
                    message.HeadFrameID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChangeHeadReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ChangeHeadReq} ChangeHeadReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeHeadReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChangeHeadReq message.
         * @function verify
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChangeHeadReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                if (!$util.isInteger(message.HeadID))
                    return "HeadID: integer expected";
            if (message.HeadFrameID != null && message.hasOwnProperty("HeadFrameID"))
                if (!$util.isInteger(message.HeadFrameID))
                    return "HeadFrameID: integer expected";
            return null;
        };

        /**
         * Creates a ChangeHeadReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ChangeHeadReq} ChangeHeadReq
         */
        ChangeHeadReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ChangeHeadReq)
                return object;
            var message = new $root.gamesvr.ChangeHeadReq();
            if (object.HeadID != null)
                message.HeadID = object.HeadID | 0;
            if (object.HeadFrameID != null)
                message.HeadFrameID = object.HeadFrameID | 0;
            return message;
        };

        /**
         * Creates a plain object from a ChangeHeadReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ChangeHeadReq
         * @static
         * @param {gamesvr.ChangeHeadReq} message ChangeHeadReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChangeHeadReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.HeadID = 0;
                object.HeadFrameID = 0;
            }
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                object.HeadID = message.HeadID;
            if (message.HeadFrameID != null && message.hasOwnProperty("HeadFrameID"))
                object.HeadFrameID = message.HeadFrameID;
            return object;
        };

        /**
         * Converts this ChangeHeadReq to JSON.
         * @function toJSON
         * @memberof gamesvr.ChangeHeadReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChangeHeadReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ChangeHeadReq;
    })();

    gamesvr.ChangeHeadRes = (function() {

        /**
         * Properties of a ChangeHeadRes.
         * @memberof gamesvr
         * @interface IChangeHeadRes
         * @property {number|null} [HeadID] ChangeHeadRes HeadID
         * @property {number|null} [HeadFrameID] ChangeHeadRes HeadFrameID
         */

        /**
         * Constructs a new ChangeHeadRes.
         * @memberof gamesvr
         * @classdesc Represents a ChangeHeadRes.
         * @implements IChangeHeadRes
         * @constructor
         * @param {gamesvr.IChangeHeadRes=} [properties] Properties to set
         */
        function ChangeHeadRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ChangeHeadRes HeadID.
         * @member {number} HeadID
         * @memberof gamesvr.ChangeHeadRes
         * @instance
         */
        ChangeHeadRes.prototype.HeadID = 0;

        /**
         * ChangeHeadRes HeadFrameID.
         * @member {number} HeadFrameID
         * @memberof gamesvr.ChangeHeadRes
         * @instance
         */
        ChangeHeadRes.prototype.HeadFrameID = 0;

        /**
         * Creates a new ChangeHeadRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {gamesvr.IChangeHeadRes=} [properties] Properties to set
         * @returns {gamesvr.ChangeHeadRes} ChangeHeadRes instance
         */
        ChangeHeadRes.create = function create(properties) {
            return new ChangeHeadRes(properties);
        };

        /**
         * Encodes the specified ChangeHeadRes message. Does not implicitly {@link gamesvr.ChangeHeadRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {gamesvr.IChangeHeadRes} message ChangeHeadRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeHeadRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeadID != null && Object.hasOwnProperty.call(message, "HeadID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeadID);
            if (message.HeadFrameID != null && Object.hasOwnProperty.call(message, "HeadFrameID"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.HeadFrameID);
            return writer;
        };

        /**
         * Encodes the specified ChangeHeadRes message, length delimited. Does not implicitly {@link gamesvr.ChangeHeadRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {gamesvr.IChangeHeadRes} message ChangeHeadRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ChangeHeadRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ChangeHeadRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ChangeHeadRes} ChangeHeadRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeHeadRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ChangeHeadRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeadID = reader.int32();
                    break;
                case 2:
                    message.HeadFrameID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ChangeHeadRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ChangeHeadRes} ChangeHeadRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ChangeHeadRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ChangeHeadRes message.
         * @function verify
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ChangeHeadRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                if (!$util.isInteger(message.HeadID))
                    return "HeadID: integer expected";
            if (message.HeadFrameID != null && message.hasOwnProperty("HeadFrameID"))
                if (!$util.isInteger(message.HeadFrameID))
                    return "HeadFrameID: integer expected";
            return null;
        };

        /**
         * Creates a ChangeHeadRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ChangeHeadRes} ChangeHeadRes
         */
        ChangeHeadRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ChangeHeadRes)
                return object;
            var message = new $root.gamesvr.ChangeHeadRes();
            if (object.HeadID != null)
                message.HeadID = object.HeadID | 0;
            if (object.HeadFrameID != null)
                message.HeadFrameID = object.HeadFrameID | 0;
            return message;
        };

        /**
         * Creates a plain object from a ChangeHeadRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ChangeHeadRes
         * @static
         * @param {gamesvr.ChangeHeadRes} message ChangeHeadRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ChangeHeadRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.HeadID = 0;
                object.HeadFrameID = 0;
            }
            if (message.HeadID != null && message.hasOwnProperty("HeadID"))
                object.HeadID = message.HeadID;
            if (message.HeadFrameID != null && message.hasOwnProperty("HeadFrameID"))
                object.HeadFrameID = message.HeadFrameID;
            return object;
        };

        /**
         * Converts this ChangeHeadRes to JSON.
         * @function toJSON
         * @memberof gamesvr.ChangeHeadRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ChangeHeadRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ChangeHeadRes;
    })();

    gamesvr.RandomNameReq = (function() {

        /**
         * Properties of a RandomNameReq.
         * @memberof gamesvr
         * @interface IRandomNameReq
         */

        /**
         * Constructs a new RandomNameReq.
         * @memberof gamesvr
         * @classdesc Represents a RandomNameReq.
         * @implements IRandomNameReq
         * @constructor
         * @param {gamesvr.IRandomNameReq=} [properties] Properties to set
         */
        function RandomNameReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new RandomNameReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {gamesvr.IRandomNameReq=} [properties] Properties to set
         * @returns {gamesvr.RandomNameReq} RandomNameReq instance
         */
        RandomNameReq.create = function create(properties) {
            return new RandomNameReq(properties);
        };

        /**
         * Encodes the specified RandomNameReq message. Does not implicitly {@link gamesvr.RandomNameReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {gamesvr.IRandomNameReq} message RandomNameReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RandomNameReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified RandomNameReq message, length delimited. Does not implicitly {@link gamesvr.RandomNameReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {gamesvr.IRandomNameReq} message RandomNameReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RandomNameReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RandomNameReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.RandomNameReq} RandomNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RandomNameReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.RandomNameReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RandomNameReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.RandomNameReq} RandomNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RandomNameReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RandomNameReq message.
         * @function verify
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RandomNameReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a RandomNameReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.RandomNameReq} RandomNameReq
         */
        RandomNameReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.RandomNameReq)
                return object;
            return new $root.gamesvr.RandomNameReq();
        };

        /**
         * Creates a plain object from a RandomNameReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.RandomNameReq
         * @static
         * @param {gamesvr.RandomNameReq} message RandomNameReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RandomNameReq.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this RandomNameReq to JSON.
         * @function toJSON
         * @memberof gamesvr.RandomNameReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RandomNameReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RandomNameReq;
    })();

    gamesvr.RandomNameRes = (function() {

        /**
         * Properties of a RandomNameRes.
         * @memberof gamesvr
         * @interface IRandomNameRes
         * @property {string|null} [Name] RandomNameRes Name
         */

        /**
         * Constructs a new RandomNameRes.
         * @memberof gamesvr
         * @classdesc Represents a RandomNameRes.
         * @implements IRandomNameRes
         * @constructor
         * @param {gamesvr.IRandomNameRes=} [properties] Properties to set
         */
        function RandomNameRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RandomNameRes Name.
         * @member {string} Name
         * @memberof gamesvr.RandomNameRes
         * @instance
         */
        RandomNameRes.prototype.Name = "";

        /**
         * Creates a new RandomNameRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {gamesvr.IRandomNameRes=} [properties] Properties to set
         * @returns {gamesvr.RandomNameRes} RandomNameRes instance
         */
        RandomNameRes.create = function create(properties) {
            return new RandomNameRes(properties);
        };

        /**
         * Encodes the specified RandomNameRes message. Does not implicitly {@link gamesvr.RandomNameRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {gamesvr.IRandomNameRes} message RandomNameRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RandomNameRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Name != null && Object.hasOwnProperty.call(message, "Name"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.Name);
            return writer;
        };

        /**
         * Encodes the specified RandomNameRes message, length delimited. Does not implicitly {@link gamesvr.RandomNameRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {gamesvr.IRandomNameRes} message RandomNameRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RandomNameRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RandomNameRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.RandomNameRes} RandomNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RandomNameRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.RandomNameRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.Name = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RandomNameRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.RandomNameRes} RandomNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RandomNameRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RandomNameRes message.
         * @function verify
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RandomNameRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Name != null && message.hasOwnProperty("Name"))
                if (!$util.isString(message.Name))
                    return "Name: string expected";
            return null;
        };

        /**
         * Creates a RandomNameRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.RandomNameRes} RandomNameRes
         */
        RandomNameRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.RandomNameRes)
                return object;
            var message = new $root.gamesvr.RandomNameRes();
            if (object.Name != null)
                message.Name = String(object.Name);
            return message;
        };

        /**
         * Creates a plain object from a RandomNameRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.RandomNameRes
         * @static
         * @param {gamesvr.RandomNameRes} message RandomNameRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RandomNameRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.Name = "";
            if (message.Name != null && message.hasOwnProperty("Name"))
                object.Name = message.Name;
            return object;
        };

        /**
         * Converts this RandomNameRes to JSON.
         * @function toJSON
         * @memberof gamesvr.RandomNameRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RandomNameRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RandomNameRes;
    })();

    gamesvr.DiffLoginNotify = (function() {

        /**
         * Properties of a DiffLoginNotify.
         * @memberof gamesvr
         * @interface IDiffLoginNotify
         */

        /**
         * Constructs a new DiffLoginNotify.
         * @memberof gamesvr
         * @classdesc Represents a DiffLoginNotify.
         * @implements IDiffLoginNotify
         * @constructor
         * @param {gamesvr.IDiffLoginNotify=} [properties] Properties to set
         */
        function DiffLoginNotify(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new DiffLoginNotify instance using the specified properties.
         * @function create
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {gamesvr.IDiffLoginNotify=} [properties] Properties to set
         * @returns {gamesvr.DiffLoginNotify} DiffLoginNotify instance
         */
        DiffLoginNotify.create = function create(properties) {
            return new DiffLoginNotify(properties);
        };

        /**
         * Encodes the specified DiffLoginNotify message. Does not implicitly {@link gamesvr.DiffLoginNotify.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {gamesvr.IDiffLoginNotify} message DiffLoginNotify message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DiffLoginNotify.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified DiffLoginNotify message, length delimited. Does not implicitly {@link gamesvr.DiffLoginNotify.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {gamesvr.IDiffLoginNotify} message DiffLoginNotify message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DiffLoginNotify.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a DiffLoginNotify message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.DiffLoginNotify} DiffLoginNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DiffLoginNotify.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.DiffLoginNotify();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a DiffLoginNotify message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.DiffLoginNotify} DiffLoginNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DiffLoginNotify.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DiffLoginNotify message.
         * @function verify
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DiffLoginNotify.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a DiffLoginNotify message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.DiffLoginNotify} DiffLoginNotify
         */
        DiffLoginNotify.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.DiffLoginNotify)
                return object;
            return new $root.gamesvr.DiffLoginNotify();
        };

        /**
         * Creates a plain object from a DiffLoginNotify message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.DiffLoginNotify
         * @static
         * @param {gamesvr.DiffLoginNotify} message DiffLoginNotify
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DiffLoginNotify.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this DiffLoginNotify to JSON.
         * @function toJSON
         * @memberof gamesvr.DiffLoginNotify
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DiffLoginNotify.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return DiffLoginNotify;
    })();

    gamesvr.PveReport = (function() {

        /**
         * Properties of a PveReport.
         * @memberof gamesvr
         * @interface IPveReport
         * @property {Array.<number>|null} [Heroes] PveReport Heroes
         * @property {number|null} [GainGold] PveReport GainGold
         */

        /**
         * Constructs a new PveReport.
         * @memberof gamesvr
         * @classdesc Represents a PveReport.
         * @implements IPveReport
         * @constructor
         * @param {gamesvr.IPveReport=} [properties] Properties to set
         */
        function PveReport(properties) {
            this.Heroes = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PveReport Heroes.
         * @member {Array.<number>} Heroes
         * @memberof gamesvr.PveReport
         * @instance
         */
        PveReport.prototype.Heroes = $util.emptyArray;

        /**
         * PveReport GainGold.
         * @member {number} GainGold
         * @memberof gamesvr.PveReport
         * @instance
         */
        PveReport.prototype.GainGold = 0;

        /**
         * Creates a new PveReport instance using the specified properties.
         * @function create
         * @memberof gamesvr.PveReport
         * @static
         * @param {gamesvr.IPveReport=} [properties] Properties to set
         * @returns {gamesvr.PveReport} PveReport instance
         */
        PveReport.create = function create(properties) {
            return new PveReport(properties);
        };

        /**
         * Encodes the specified PveReport message. Does not implicitly {@link gamesvr.PveReport.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.PveReport
         * @static
         * @param {gamesvr.IPveReport} message PveReport message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PveReport.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.Heroes != null && message.Heroes.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (var i = 0; i < message.Heroes.length; ++i)
                    writer.int32(message.Heroes[i]);
                writer.ldelim();
            }
            if (message.GainGold != null && Object.hasOwnProperty.call(message, "GainGold"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.GainGold);
            return writer;
        };

        /**
         * Encodes the specified PveReport message, length delimited. Does not implicitly {@link gamesvr.PveReport.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.PveReport
         * @static
         * @param {gamesvr.IPveReport} message PveReport message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PveReport.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PveReport message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.PveReport
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.PveReport} PveReport
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PveReport.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.PveReport();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.Heroes && message.Heroes.length))
                        message.Heroes = [];
                    if ((tag & 7) === 2) {
                        var end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.Heroes.push(reader.int32());
                    } else
                        message.Heroes.push(reader.int32());
                    break;
                case 2:
                    message.GainGold = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PveReport message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.PveReport
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.PveReport} PveReport
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PveReport.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PveReport message.
         * @function verify
         * @memberof gamesvr.PveReport
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PveReport.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.Heroes != null && message.hasOwnProperty("Heroes")) {
                if (!Array.isArray(message.Heroes))
                    return "Heroes: array expected";
                for (var i = 0; i < message.Heroes.length; ++i)
                    if (!$util.isInteger(message.Heroes[i]))
                        return "Heroes: integer[] expected";
            }
            if (message.GainGold != null && message.hasOwnProperty("GainGold"))
                if (!$util.isInteger(message.GainGold))
                    return "GainGold: integer expected";
            return null;
        };

        /**
         * Creates a PveReport message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.PveReport
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.PveReport} PveReport
         */
        PveReport.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.PveReport)
                return object;
            var message = new $root.gamesvr.PveReport();
            if (object.Heroes) {
                if (!Array.isArray(object.Heroes))
                    throw TypeError(".gamesvr.PveReport.Heroes: array expected");
                message.Heroes = [];
                for (var i = 0; i < object.Heroes.length; ++i)
                    message.Heroes[i] = object.Heroes[i] | 0;
            }
            if (object.GainGold != null)
                message.GainGold = object.GainGold | 0;
            return message;
        };

        /**
         * Creates a plain object from a PveReport message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.PveReport
         * @static
         * @param {gamesvr.PveReport} message PveReport
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PveReport.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Heroes = [];
            if (options.defaults)
                object.GainGold = 0;
            if (message.Heroes && message.Heroes.length) {
                object.Heroes = [];
                for (var j = 0; j < message.Heroes.length; ++j)
                    object.Heroes[j] = message.Heroes[j];
            }
            if (message.GainGold != null && message.hasOwnProperty("GainGold"))
                object.GainGold = message.GainGold;
            return object;
        };

        /**
         * Converts this PveReport to JSON.
         * @function toJSON
         * @memberof gamesvr.PveReport
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PveReport.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PveReport;
    })();

    gamesvr.EnterPveReq = (function() {

        /**
         * Properties of an EnterPveReq.
         * @memberof gamesvr
         * @interface IEnterPveReq
         * @property {number|null} [LessonID] EnterPveReq LessonID
         */

        /**
         * Constructs a new EnterPveReq.
         * @memberof gamesvr
         * @classdesc Represents an EnterPveReq.
         * @implements IEnterPveReq
         * @constructor
         * @param {gamesvr.IEnterPveReq=} [properties] Properties to set
         */
        function EnterPveReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EnterPveReq LessonID.
         * @member {number} LessonID
         * @memberof gamesvr.EnterPveReq
         * @instance
         */
        EnterPveReq.prototype.LessonID = 0;

        /**
         * Creates a new EnterPveReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {gamesvr.IEnterPveReq=} [properties] Properties to set
         * @returns {gamesvr.EnterPveReq} EnterPveReq instance
         */
        EnterPveReq.create = function create(properties) {
            return new EnterPveReq(properties);
        };

        /**
         * Encodes the specified EnterPveReq message. Does not implicitly {@link gamesvr.EnterPveReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {gamesvr.IEnterPveReq} message EnterPveReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnterPveReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.LessonID != null && Object.hasOwnProperty.call(message, "LessonID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.LessonID);
            return writer;
        };

        /**
         * Encodes the specified EnterPveReq message, length delimited. Does not implicitly {@link gamesvr.EnterPveReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {gamesvr.IEnterPveReq} message EnterPveReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnterPveReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EnterPveReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.EnterPveReq} EnterPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnterPveReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.EnterPveReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.LessonID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EnterPveReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.EnterPveReq} EnterPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnterPveReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EnterPveReq message.
         * @function verify
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EnterPveReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                if (!$util.isInteger(message.LessonID))
                    return "LessonID: integer expected";
            return null;
        };

        /**
         * Creates an EnterPveReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.EnterPveReq} EnterPveReq
         */
        EnterPveReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.EnterPveReq)
                return object;
            var message = new $root.gamesvr.EnterPveReq();
            if (object.LessonID != null)
                message.LessonID = object.LessonID | 0;
            return message;
        };

        /**
         * Creates a plain object from an EnterPveReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.EnterPveReq
         * @static
         * @param {gamesvr.EnterPveReq} message EnterPveReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EnterPveReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.LessonID = 0;
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                object.LessonID = message.LessonID;
            return object;
        };

        /**
         * Converts this EnterPveReq to JSON.
         * @function toJSON
         * @memberof gamesvr.EnterPveReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EnterPveReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return EnterPveReq;
    })();

    gamesvr.EnterPveRes = (function() {

        /**
         * Properties of an EnterPveRes.
         * @memberof gamesvr
         * @interface IEnterPveRes
         * @property {number|null} [LessonID] EnterPveRes LessonID
         */

        /**
         * Constructs a new EnterPveRes.
         * @memberof gamesvr
         * @classdesc Represents an EnterPveRes.
         * @implements IEnterPveRes
         * @constructor
         * @param {gamesvr.IEnterPveRes=} [properties] Properties to set
         */
        function EnterPveRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EnterPveRes LessonID.
         * @member {number} LessonID
         * @memberof gamesvr.EnterPveRes
         * @instance
         */
        EnterPveRes.prototype.LessonID = 0;

        /**
         * Creates a new EnterPveRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {gamesvr.IEnterPveRes=} [properties] Properties to set
         * @returns {gamesvr.EnterPveRes} EnterPveRes instance
         */
        EnterPveRes.create = function create(properties) {
            return new EnterPveRes(properties);
        };

        /**
         * Encodes the specified EnterPveRes message. Does not implicitly {@link gamesvr.EnterPveRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {gamesvr.IEnterPveRes} message EnterPveRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnterPveRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.LessonID != null && Object.hasOwnProperty.call(message, "LessonID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.LessonID);
            return writer;
        };

        /**
         * Encodes the specified EnterPveRes message, length delimited. Does not implicitly {@link gamesvr.EnterPveRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {gamesvr.IEnterPveRes} message EnterPveRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EnterPveRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an EnterPveRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.EnterPveRes} EnterPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnterPveRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.EnterPveRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.LessonID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an EnterPveRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.EnterPveRes} EnterPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EnterPveRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EnterPveRes message.
         * @function verify
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EnterPveRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                if (!$util.isInteger(message.LessonID))
                    return "LessonID: integer expected";
            return null;
        };

        /**
         * Creates an EnterPveRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.EnterPveRes} EnterPveRes
         */
        EnterPveRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.EnterPveRes)
                return object;
            var message = new $root.gamesvr.EnterPveRes();
            if (object.LessonID != null)
                message.LessonID = object.LessonID | 0;
            return message;
        };

        /**
         * Creates a plain object from an EnterPveRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.EnterPveRes
         * @static
         * @param {gamesvr.EnterPveRes} message EnterPveRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EnterPveRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.LessonID = 0;
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                object.LessonID = message.LessonID;
            return object;
        };

        /**
         * Converts this EnterPveRes to JSON.
         * @function toJSON
         * @memberof gamesvr.EnterPveRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EnterPveRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return EnterPveRes;
    })();

    gamesvr.FinishPveReq = (function() {

        /**
         * Properties of a FinishPveReq.
         * @memberof gamesvr
         * @interface IFinishPveReq
         * @property {number|null} [LessonID] FinishPveReq LessonID
         * @property {boolean|null} [Past] FinishPveReq Past
         * @property {gamesvr.IPveReport|null} [PveReport] FinishPveReq PveReport
         */

        /**
         * Constructs a new FinishPveReq.
         * @memberof gamesvr
         * @classdesc Represents a FinishPveReq.
         * @implements IFinishPveReq
         * @constructor
         * @param {gamesvr.IFinishPveReq=} [properties] Properties to set
         */
        function FinishPveReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * FinishPveReq LessonID.
         * @member {number} LessonID
         * @memberof gamesvr.FinishPveReq
         * @instance
         */
        FinishPveReq.prototype.LessonID = 0;

        /**
         * FinishPveReq Past.
         * @member {boolean} Past
         * @memberof gamesvr.FinishPveReq
         * @instance
         */
        FinishPveReq.prototype.Past = false;

        /**
         * FinishPveReq PveReport.
         * @member {gamesvr.IPveReport|null|undefined} PveReport
         * @memberof gamesvr.FinishPveReq
         * @instance
         */
        FinishPveReq.prototype.PveReport = null;

        /**
         * Creates a new FinishPveReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {gamesvr.IFinishPveReq=} [properties] Properties to set
         * @returns {gamesvr.FinishPveReq} FinishPveReq instance
         */
        FinishPveReq.create = function create(properties) {
            return new FinishPveReq(properties);
        };

        /**
         * Encodes the specified FinishPveReq message. Does not implicitly {@link gamesvr.FinishPveReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {gamesvr.IFinishPveReq} message FinishPveReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FinishPveReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.LessonID != null && Object.hasOwnProperty.call(message, "LessonID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.LessonID);
            if (message.Past != null && Object.hasOwnProperty.call(message, "Past"))
                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.Past);
            if (message.PveReport != null && Object.hasOwnProperty.call(message, "PveReport"))
                $root.gamesvr.PveReport.encode(message.PveReport, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified FinishPveReq message, length delimited. Does not implicitly {@link gamesvr.FinishPveReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {gamesvr.IFinishPveReq} message FinishPveReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FinishPveReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FinishPveReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.FinishPveReq} FinishPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FinishPveReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.FinishPveReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.LessonID = reader.int32();
                    break;
                case 2:
                    message.Past = reader.bool();
                    break;
                case 10:
                    message.PveReport = $root.gamesvr.PveReport.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FinishPveReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.FinishPveReq} FinishPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FinishPveReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FinishPveReq message.
         * @function verify
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FinishPveReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                if (!$util.isInteger(message.LessonID))
                    return "LessonID: integer expected";
            if (message.Past != null && message.hasOwnProperty("Past"))
                if (typeof message.Past !== "boolean")
                    return "Past: boolean expected";
            if (message.PveReport != null && message.hasOwnProperty("PveReport")) {
                var error = $root.gamesvr.PveReport.verify(message.PveReport);
                if (error)
                    return "PveReport." + error;
            }
            return null;
        };

        /**
         * Creates a FinishPveReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.FinishPveReq} FinishPveReq
         */
        FinishPveReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.FinishPveReq)
                return object;
            var message = new $root.gamesvr.FinishPveReq();
            if (object.LessonID != null)
                message.LessonID = object.LessonID | 0;
            if (object.Past != null)
                message.Past = Boolean(object.Past);
            if (object.PveReport != null) {
                if (typeof object.PveReport !== "object")
                    throw TypeError(".gamesvr.FinishPveReq.PveReport: object expected");
                message.PveReport = $root.gamesvr.PveReport.fromObject(object.PveReport);
            }
            return message;
        };

        /**
         * Creates a plain object from a FinishPveReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.FinishPveReq
         * @static
         * @param {gamesvr.FinishPveReq} message FinishPveReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FinishPveReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.LessonID = 0;
                object.Past = false;
                object.PveReport = null;
            }
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                object.LessonID = message.LessonID;
            if (message.Past != null && message.hasOwnProperty("Past"))
                object.Past = message.Past;
            if (message.PveReport != null && message.hasOwnProperty("PveReport"))
                object.PveReport = $root.gamesvr.PveReport.toObject(message.PveReport, options);
            return object;
        };

        /**
         * Converts this FinishPveReq to JSON.
         * @function toJSON
         * @memberof gamesvr.FinishPveReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FinishPveReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return FinishPveReq;
    })();

    gamesvr.FinishPveRes = (function() {

        /**
         * Properties of a FinishPveRes.
         * @memberof gamesvr
         * @interface IFinishPveRes
         * @property {number|null} [LessonID] FinishPveRes LessonID
         * @property {boolean|null} [Past] FinishPveRes Past
         * @property {number|null} [Exp] FinishPveRes Exp
         * @property {number|null} [TotalExp] FinishPveRes TotalExp
         * @property {data.ILessonRecord|null} [Record] FinishPveRes Record
         * @property {Array.<data.IPrize>|null} [Prizes] FinishPveRes Prizes
         */

        /**
         * Constructs a new FinishPveRes.
         * @memberof gamesvr
         * @classdesc Represents a FinishPveRes.
         * @implements IFinishPveRes
         * @constructor
         * @param {gamesvr.IFinishPveRes=} [properties] Properties to set
         */
        function FinishPveRes(properties) {
            this.Prizes = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * FinishPveRes LessonID.
         * @member {number} LessonID
         * @memberof gamesvr.FinishPveRes
         * @instance
         */
        FinishPveRes.prototype.LessonID = 0;

        /**
         * FinishPveRes Past.
         * @member {boolean} Past
         * @memberof gamesvr.FinishPveRes
         * @instance
         */
        FinishPveRes.prototype.Past = false;

        /**
         * FinishPveRes Exp.
         * @member {number} Exp
         * @memberof gamesvr.FinishPveRes
         * @instance
         */
        FinishPveRes.prototype.Exp = 0;

        /**
         * FinishPveRes TotalExp.
         * @member {number} TotalExp
         * @memberof gamesvr.FinishPveRes
         * @instance
         */
        FinishPveRes.prototype.TotalExp = 0;

        /**
         * FinishPveRes Record.
         * @member {data.ILessonRecord|null|undefined} Record
         * @memberof gamesvr.FinishPveRes
         * @instance
         */
        FinishPveRes.prototype.Record = null;

        /**
         * FinishPveRes Prizes.
         * @member {Array.<data.IPrize>} Prizes
         * @memberof gamesvr.FinishPveRes
         * @instance
         */
        FinishPveRes.prototype.Prizes = $util.emptyArray;

        /**
         * Creates a new FinishPveRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {gamesvr.IFinishPveRes=} [properties] Properties to set
         * @returns {gamesvr.FinishPveRes} FinishPveRes instance
         */
        FinishPveRes.create = function create(properties) {
            return new FinishPveRes(properties);
        };

        /**
         * Encodes the specified FinishPveRes message. Does not implicitly {@link gamesvr.FinishPveRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {gamesvr.IFinishPveRes} message FinishPveRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FinishPveRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.LessonID != null && Object.hasOwnProperty.call(message, "LessonID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.LessonID);
            if (message.Past != null && Object.hasOwnProperty.call(message, "Past"))
                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.Past);
            if (message.Exp != null && Object.hasOwnProperty.call(message, "Exp"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.Exp);
            if (message.TotalExp != null && Object.hasOwnProperty.call(message, "TotalExp"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.TotalExp);
            if (message.Record != null && Object.hasOwnProperty.call(message, "Record"))
                $root.data.LessonRecord.encode(message.Record, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
            if (message.Prizes != null && message.Prizes.length)
                for (var i = 0; i < message.Prizes.length; ++i)
                    $root.data.Prize.encode(message.Prizes[i], writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified FinishPveRes message, length delimited. Does not implicitly {@link gamesvr.FinishPveRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {gamesvr.IFinishPveRes} message FinishPveRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FinishPveRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a FinishPveRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.FinishPveRes} FinishPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FinishPveRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.FinishPveRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.LessonID = reader.int32();
                    break;
                case 2:
                    message.Past = reader.bool();
                    break;
                case 3:
                    message.Exp = reader.int32();
                    break;
                case 4:
                    message.TotalExp = reader.int32();
                    break;
                case 10:
                    message.Record = $root.data.LessonRecord.decode(reader, reader.uint32());
                    break;
                case 11:
                    if (!(message.Prizes && message.Prizes.length))
                        message.Prizes = [];
                    message.Prizes.push($root.data.Prize.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a FinishPveRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.FinishPveRes} FinishPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FinishPveRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FinishPveRes message.
         * @function verify
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FinishPveRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                if (!$util.isInteger(message.LessonID))
                    return "LessonID: integer expected";
            if (message.Past != null && message.hasOwnProperty("Past"))
                if (typeof message.Past !== "boolean")
                    return "Past: boolean expected";
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                if (!$util.isInteger(message.Exp))
                    return "Exp: integer expected";
            if (message.TotalExp != null && message.hasOwnProperty("TotalExp"))
                if (!$util.isInteger(message.TotalExp))
                    return "TotalExp: integer expected";
            if (message.Record != null && message.hasOwnProperty("Record")) {
                var error = $root.data.LessonRecord.verify(message.Record);
                if (error)
                    return "Record." + error;
            }
            if (message.Prizes != null && message.hasOwnProperty("Prizes")) {
                if (!Array.isArray(message.Prizes))
                    return "Prizes: array expected";
                for (var i = 0; i < message.Prizes.length; ++i) {
                    var error = $root.data.Prize.verify(message.Prizes[i]);
                    if (error)
                        return "Prizes." + error;
                }
            }
            return null;
        };

        /**
         * Creates a FinishPveRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.FinishPveRes} FinishPveRes
         */
        FinishPveRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.FinishPveRes)
                return object;
            var message = new $root.gamesvr.FinishPveRes();
            if (object.LessonID != null)
                message.LessonID = object.LessonID | 0;
            if (object.Past != null)
                message.Past = Boolean(object.Past);
            if (object.Exp != null)
                message.Exp = object.Exp | 0;
            if (object.TotalExp != null)
                message.TotalExp = object.TotalExp | 0;
            if (object.Record != null) {
                if (typeof object.Record !== "object")
                    throw TypeError(".gamesvr.FinishPveRes.Record: object expected");
                message.Record = $root.data.LessonRecord.fromObject(object.Record);
            }
            if (object.Prizes) {
                if (!Array.isArray(object.Prizes))
                    throw TypeError(".gamesvr.FinishPveRes.Prizes: array expected");
                message.Prizes = [];
                for (var i = 0; i < object.Prizes.length; ++i) {
                    if (typeof object.Prizes[i] !== "object")
                        throw TypeError(".gamesvr.FinishPveRes.Prizes: object expected");
                    message.Prizes[i] = $root.data.Prize.fromObject(object.Prizes[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a FinishPveRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.FinishPveRes
         * @static
         * @param {gamesvr.FinishPveRes} message FinishPveRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FinishPveRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.Prizes = [];
            if (options.defaults) {
                object.LessonID = 0;
                object.Past = false;
                object.Exp = 0;
                object.TotalExp = 0;
                object.Record = null;
            }
            if (message.LessonID != null && message.hasOwnProperty("LessonID"))
                object.LessonID = message.LessonID;
            if (message.Past != null && message.hasOwnProperty("Past"))
                object.Past = message.Past;
            if (message.Exp != null && message.hasOwnProperty("Exp"))
                object.Exp = message.Exp;
            if (message.TotalExp != null && message.hasOwnProperty("TotalExp"))
                object.TotalExp = message.TotalExp;
            if (message.Record != null && message.hasOwnProperty("Record"))
                object.Record = $root.data.LessonRecord.toObject(message.Record, options);
            if (message.Prizes && message.Prizes.length) {
                object.Prizes = [];
                for (var j = 0; j < message.Prizes.length; ++j)
                    object.Prizes[j] = $root.data.Prize.toObject(message.Prizes[j], options);
            }
            return object;
        };

        /**
         * Converts this FinishPveRes to JSON.
         * @function toJSON
         * @memberof gamesvr.FinishPveRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FinishPveRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return FinishPveRes;
    })();

    gamesvr.ComposeHeroReq = (function() {

        /**
         * Properties of a ComposeHeroReq.
         * @memberof gamesvr
         * @interface IComposeHeroReq
         * @property {number|null} [HeroID] ComposeHeroReq HeroID
         */

        /**
         * Constructs a new ComposeHeroReq.
         * @memberof gamesvr
         * @classdesc Represents a ComposeHeroReq.
         * @implements IComposeHeroReq
         * @constructor
         * @param {gamesvr.IComposeHeroReq=} [properties] Properties to set
         */
        function ComposeHeroReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ComposeHeroReq HeroID.
         * @member {number} HeroID
         * @memberof gamesvr.ComposeHeroReq
         * @instance
         */
        ComposeHeroReq.prototype.HeroID = 0;

        /**
         * Creates a new ComposeHeroReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {gamesvr.IComposeHeroReq=} [properties] Properties to set
         * @returns {gamesvr.ComposeHeroReq} ComposeHeroReq instance
         */
        ComposeHeroReq.create = function create(properties) {
            return new ComposeHeroReq(properties);
        };

        /**
         * Encodes the specified ComposeHeroReq message. Does not implicitly {@link gamesvr.ComposeHeroReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {gamesvr.IComposeHeroReq} message ComposeHeroReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ComposeHeroReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeroID);
            return writer;
        };

        /**
         * Encodes the specified ComposeHeroReq message, length delimited. Does not implicitly {@link gamesvr.ComposeHeroReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {gamesvr.IComposeHeroReq} message ComposeHeroReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ComposeHeroReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ComposeHeroReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ComposeHeroReq} ComposeHeroReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ComposeHeroReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ComposeHeroReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeroID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ComposeHeroReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ComposeHeroReq} ComposeHeroReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ComposeHeroReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ComposeHeroReq message.
         * @function verify
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ComposeHeroReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            return null;
        };

        /**
         * Creates a ComposeHeroReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ComposeHeroReq} ComposeHeroReq
         */
        ComposeHeroReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ComposeHeroReq)
                return object;
            var message = new $root.gamesvr.ComposeHeroReq();
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            return message;
        };

        /**
         * Creates a plain object from a ComposeHeroReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ComposeHeroReq
         * @static
         * @param {gamesvr.ComposeHeroReq} message ComposeHeroReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ComposeHeroReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.HeroID = 0;
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            return object;
        };

        /**
         * Converts this ComposeHeroReq to JSON.
         * @function toJSON
         * @memberof gamesvr.ComposeHeroReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ComposeHeroReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ComposeHeroReq;
    })();

    gamesvr.ComposeHeroRes = (function() {

        /**
         * Properties of a ComposeHeroRes.
         * @memberof gamesvr
         * @interface IComposeHeroRes
         * @property {number|null} [HeroID] ComposeHeroRes HeroID
         */

        /**
         * Constructs a new ComposeHeroRes.
         * @memberof gamesvr
         * @classdesc Represents a ComposeHeroRes.
         * @implements IComposeHeroRes
         * @constructor
         * @param {gamesvr.IComposeHeroRes=} [properties] Properties to set
         */
        function ComposeHeroRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ComposeHeroRes HeroID.
         * @member {number} HeroID
         * @memberof gamesvr.ComposeHeroRes
         * @instance
         */
        ComposeHeroRes.prototype.HeroID = 0;

        /**
         * Creates a new ComposeHeroRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {gamesvr.IComposeHeroRes=} [properties] Properties to set
         * @returns {gamesvr.ComposeHeroRes} ComposeHeroRes instance
         */
        ComposeHeroRes.create = function create(properties) {
            return new ComposeHeroRes(properties);
        };

        /**
         * Encodes the specified ComposeHeroRes message. Does not implicitly {@link gamesvr.ComposeHeroRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {gamesvr.IComposeHeroRes} message ComposeHeroRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ComposeHeroRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeroID);
            return writer;
        };

        /**
         * Encodes the specified ComposeHeroRes message, length delimited. Does not implicitly {@link gamesvr.ComposeHeroRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {gamesvr.IComposeHeroRes} message ComposeHeroRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ComposeHeroRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ComposeHeroRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.ComposeHeroRes} ComposeHeroRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ComposeHeroRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.ComposeHeroRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeroID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ComposeHeroRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.ComposeHeroRes} ComposeHeroRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ComposeHeroRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ComposeHeroRes message.
         * @function verify
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ComposeHeroRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            return null;
        };

        /**
         * Creates a ComposeHeroRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.ComposeHeroRes} ComposeHeroRes
         */
        ComposeHeroRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.ComposeHeroRes)
                return object;
            var message = new $root.gamesvr.ComposeHeroRes();
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            return message;
        };

        /**
         * Creates a plain object from a ComposeHeroRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.ComposeHeroRes
         * @static
         * @param {gamesvr.ComposeHeroRes} message ComposeHeroRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ComposeHeroRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.HeroID = 0;
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            return object;
        };

        /**
         * Converts this ComposeHeroRes to JSON.
         * @function toJSON
         * @memberof gamesvr.ComposeHeroRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ComposeHeroRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ComposeHeroRes;
    })();

    gamesvr.AddHeroStarReq = (function() {

        /**
         * Properties of an AddHeroStarReq.
         * @memberof gamesvr
         * @interface IAddHeroStarReq
         * @property {number|null} [HeroID] AddHeroStarReq HeroID
         */

        /**
         * Constructs a new AddHeroStarReq.
         * @memberof gamesvr
         * @classdesc Represents an AddHeroStarReq.
         * @implements IAddHeroStarReq
         * @constructor
         * @param {gamesvr.IAddHeroStarReq=} [properties] Properties to set
         */
        function AddHeroStarReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AddHeroStarReq HeroID.
         * @member {number} HeroID
         * @memberof gamesvr.AddHeroStarReq
         * @instance
         */
        AddHeroStarReq.prototype.HeroID = 0;

        /**
         * Creates a new AddHeroStarReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {gamesvr.IAddHeroStarReq=} [properties] Properties to set
         * @returns {gamesvr.AddHeroStarReq} AddHeroStarReq instance
         */
        AddHeroStarReq.create = function create(properties) {
            return new AddHeroStarReq(properties);
        };

        /**
         * Encodes the specified AddHeroStarReq message. Does not implicitly {@link gamesvr.AddHeroStarReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {gamesvr.IAddHeroStarReq} message AddHeroStarReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AddHeroStarReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeroID);
            return writer;
        };

        /**
         * Encodes the specified AddHeroStarReq message, length delimited. Does not implicitly {@link gamesvr.AddHeroStarReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {gamesvr.IAddHeroStarReq} message AddHeroStarReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AddHeroStarReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AddHeroStarReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.AddHeroStarReq} AddHeroStarReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AddHeroStarReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.AddHeroStarReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeroID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AddHeroStarReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.AddHeroStarReq} AddHeroStarReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AddHeroStarReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AddHeroStarReq message.
         * @function verify
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AddHeroStarReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            return null;
        };

        /**
         * Creates an AddHeroStarReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.AddHeroStarReq} AddHeroStarReq
         */
        AddHeroStarReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.AddHeroStarReq)
                return object;
            var message = new $root.gamesvr.AddHeroStarReq();
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            return message;
        };

        /**
         * Creates a plain object from an AddHeroStarReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.AddHeroStarReq
         * @static
         * @param {gamesvr.AddHeroStarReq} message AddHeroStarReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AddHeroStarReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.HeroID = 0;
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            return object;
        };

        /**
         * Converts this AddHeroStarReq to JSON.
         * @function toJSON
         * @memberof gamesvr.AddHeroStarReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AddHeroStarReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AddHeroStarReq;
    })();

    gamesvr.AddHeroStarRes = (function() {

        /**
         * Properties of an AddHeroStarRes.
         * @memberof gamesvr
         * @interface IAddHeroStarRes
         * @property {number|null} [HeroID] AddHeroStarRes HeroID
         * @property {number|null} [Star] AddHeroStarRes Star
         */

        /**
         * Constructs a new AddHeroStarRes.
         * @memberof gamesvr
         * @classdesc Represents an AddHeroStarRes.
         * @implements IAddHeroStarRes
         * @constructor
         * @param {gamesvr.IAddHeroStarRes=} [properties] Properties to set
         */
        function AddHeroStarRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * AddHeroStarRes HeroID.
         * @member {number} HeroID
         * @memberof gamesvr.AddHeroStarRes
         * @instance
         */
        AddHeroStarRes.prototype.HeroID = 0;

        /**
         * AddHeroStarRes Star.
         * @member {number} Star
         * @memberof gamesvr.AddHeroStarRes
         * @instance
         */
        AddHeroStarRes.prototype.Star = 0;

        /**
         * Creates a new AddHeroStarRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {gamesvr.IAddHeroStarRes=} [properties] Properties to set
         * @returns {gamesvr.AddHeroStarRes} AddHeroStarRes instance
         */
        AddHeroStarRes.create = function create(properties) {
            return new AddHeroStarRes(properties);
        };

        /**
         * Encodes the specified AddHeroStarRes message. Does not implicitly {@link gamesvr.AddHeroStarRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {gamesvr.IAddHeroStarRes} message AddHeroStarRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AddHeroStarRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeroID);
            if (message.Star != null && Object.hasOwnProperty.call(message, "Star"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Star);
            return writer;
        };

        /**
         * Encodes the specified AddHeroStarRes message, length delimited. Does not implicitly {@link gamesvr.AddHeroStarRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {gamesvr.IAddHeroStarRes} message AddHeroStarRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AddHeroStarRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an AddHeroStarRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.AddHeroStarRes} AddHeroStarRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AddHeroStarRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.AddHeroStarRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeroID = reader.int32();
                    break;
                case 2:
                    message.Star = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an AddHeroStarRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.AddHeroStarRes} AddHeroStarRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AddHeroStarRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AddHeroStarRes message.
         * @function verify
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AddHeroStarRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            if (message.Star != null && message.hasOwnProperty("Star"))
                if (!$util.isInteger(message.Star))
                    return "Star: integer expected";
            return null;
        };

        /**
         * Creates an AddHeroStarRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.AddHeroStarRes} AddHeroStarRes
         */
        AddHeroStarRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.AddHeroStarRes)
                return object;
            var message = new $root.gamesvr.AddHeroStarRes();
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            if (object.Star != null)
                message.Star = object.Star | 0;
            return message;
        };

        /**
         * Creates a plain object from an AddHeroStarRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.AddHeroStarRes
         * @static
         * @param {gamesvr.AddHeroStarRes} message AddHeroStarRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AddHeroStarRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.HeroID = 0;
                object.Star = 0;
            }
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            if (message.Star != null && message.hasOwnProperty("Star"))
                object.Star = message.Star;
            return object;
        };

        /**
         * Converts this AddHeroStarRes to JSON.
         * @function toJSON
         * @memberof gamesvr.AddHeroStarRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AddHeroStarRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return AddHeroStarRes;
    })();

    gamesvr.HeroEquipReq = (function() {

        /**
         * Properties of a HeroEquipReq.
         * @memberof gamesvr
         * @interface IHeroEquipReq
         * @property {number|null} [HeroID] HeroEquipReq HeroID
         * @property {number|null} [Positon] HeroEquipReq Positon
         * @property {number|null} [EquipSeq] HeroEquipReq EquipSeq
         * @property {number|null} [EquipID] HeroEquipReq EquipID
         */

        /**
         * Constructs a new HeroEquipReq.
         * @memberof gamesvr
         * @classdesc Represents a HeroEquipReq.
         * @implements IHeroEquipReq
         * @constructor
         * @param {gamesvr.IHeroEquipReq=} [properties] Properties to set
         */
        function HeroEquipReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HeroEquipReq HeroID.
         * @member {number} HeroID
         * @memberof gamesvr.HeroEquipReq
         * @instance
         */
        HeroEquipReq.prototype.HeroID = 0;

        /**
         * HeroEquipReq Positon.
         * @member {number} Positon
         * @memberof gamesvr.HeroEquipReq
         * @instance
         */
        HeroEquipReq.prototype.Positon = 0;

        /**
         * HeroEquipReq EquipSeq.
         * @member {number} EquipSeq
         * @memberof gamesvr.HeroEquipReq
         * @instance
         */
        HeroEquipReq.prototype.EquipSeq = 0;

        /**
         * HeroEquipReq EquipID.
         * @member {number} EquipID
         * @memberof gamesvr.HeroEquipReq
         * @instance
         */
        HeroEquipReq.prototype.EquipID = 0;

        /**
         * Creates a new HeroEquipReq instance using the specified properties.
         * @function create
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {gamesvr.IHeroEquipReq=} [properties] Properties to set
         * @returns {gamesvr.HeroEquipReq} HeroEquipReq instance
         */
        HeroEquipReq.create = function create(properties) {
            return new HeroEquipReq(properties);
        };

        /**
         * Encodes the specified HeroEquipReq message. Does not implicitly {@link gamesvr.HeroEquipReq.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {gamesvr.IHeroEquipReq} message HeroEquipReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeroEquipReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeroID);
            if (message.Positon != null && Object.hasOwnProperty.call(message, "Positon"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Positon);
            if (message.EquipSeq != null && Object.hasOwnProperty.call(message, "EquipSeq"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.EquipSeq);
            if (message.EquipID != null && Object.hasOwnProperty.call(message, "EquipID"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.EquipID);
            return writer;
        };

        /**
         * Encodes the specified HeroEquipReq message, length delimited. Does not implicitly {@link gamesvr.HeroEquipReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {gamesvr.IHeroEquipReq} message HeroEquipReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeroEquipReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HeroEquipReq message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.HeroEquipReq} HeroEquipReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeroEquipReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.HeroEquipReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeroID = reader.int32();
                    break;
                case 2:
                    message.Positon = reader.int32();
                    break;
                case 3:
                    message.EquipSeq = reader.int32();
                    break;
                case 4:
                    message.EquipID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HeroEquipReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.HeroEquipReq} HeroEquipReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeroEquipReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HeroEquipReq message.
         * @function verify
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeroEquipReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            if (message.Positon != null && message.hasOwnProperty("Positon"))
                if (!$util.isInteger(message.Positon))
                    return "Positon: integer expected";
            if (message.EquipSeq != null && message.hasOwnProperty("EquipSeq"))
                if (!$util.isInteger(message.EquipSeq))
                    return "EquipSeq: integer expected";
            if (message.EquipID != null && message.hasOwnProperty("EquipID"))
                if (!$util.isInteger(message.EquipID))
                    return "EquipID: integer expected";
            return null;
        };

        /**
         * Creates a HeroEquipReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.HeroEquipReq} HeroEquipReq
         */
        HeroEquipReq.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.HeroEquipReq)
                return object;
            var message = new $root.gamesvr.HeroEquipReq();
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            if (object.Positon != null)
                message.Positon = object.Positon | 0;
            if (object.EquipSeq != null)
                message.EquipSeq = object.EquipSeq | 0;
            if (object.EquipID != null)
                message.EquipID = object.EquipID | 0;
            return message;
        };

        /**
         * Creates a plain object from a HeroEquipReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.HeroEquipReq
         * @static
         * @param {gamesvr.HeroEquipReq} message HeroEquipReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeroEquipReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.HeroID = 0;
                object.Positon = 0;
                object.EquipSeq = 0;
                object.EquipID = 0;
            }
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            if (message.Positon != null && message.hasOwnProperty("Positon"))
                object.Positon = message.Positon;
            if (message.EquipSeq != null && message.hasOwnProperty("EquipSeq"))
                object.EquipSeq = message.EquipSeq;
            if (message.EquipID != null && message.hasOwnProperty("EquipID"))
                object.EquipID = message.EquipID;
            return object;
        };

        /**
         * Converts this HeroEquipReq to JSON.
         * @function toJSON
         * @memberof gamesvr.HeroEquipReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeroEquipReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HeroEquipReq;
    })();

    gamesvr.HeroEquipRes = (function() {

        /**
         * Properties of a HeroEquipRes.
         * @memberof gamesvr
         * @interface IHeroEquipRes
         * @property {number|null} [HeroID] HeroEquipRes HeroID
         * @property {number|null} [Positon] HeroEquipRes Positon
         * @property {number|null} [EquipSeq] HeroEquipRes EquipSeq
         * @property {number|null} [EquipID] HeroEquipRes EquipID
         */

        /**
         * Constructs a new HeroEquipRes.
         * @memberof gamesvr
         * @classdesc Represents a HeroEquipRes.
         * @implements IHeroEquipRes
         * @constructor
         * @param {gamesvr.IHeroEquipRes=} [properties] Properties to set
         */
        function HeroEquipRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HeroEquipRes HeroID.
         * @member {number} HeroID
         * @memberof gamesvr.HeroEquipRes
         * @instance
         */
        HeroEquipRes.prototype.HeroID = 0;

        /**
         * HeroEquipRes Positon.
         * @member {number} Positon
         * @memberof gamesvr.HeroEquipRes
         * @instance
         */
        HeroEquipRes.prototype.Positon = 0;

        /**
         * HeroEquipRes EquipSeq.
         * @member {number} EquipSeq
         * @memberof gamesvr.HeroEquipRes
         * @instance
         */
        HeroEquipRes.prototype.EquipSeq = 0;

        /**
         * HeroEquipRes EquipID.
         * @member {number} EquipID
         * @memberof gamesvr.HeroEquipRes
         * @instance
         */
        HeroEquipRes.prototype.EquipID = 0;

        /**
         * Creates a new HeroEquipRes instance using the specified properties.
         * @function create
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {gamesvr.IHeroEquipRes=} [properties] Properties to set
         * @returns {gamesvr.HeroEquipRes} HeroEquipRes instance
         */
        HeroEquipRes.create = function create(properties) {
            return new HeroEquipRes(properties);
        };

        /**
         * Encodes the specified HeroEquipRes message. Does not implicitly {@link gamesvr.HeroEquipRes.verify|verify} messages.
         * @function encode
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {gamesvr.IHeroEquipRes} message HeroEquipRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeroEquipRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.HeroID != null && Object.hasOwnProperty.call(message, "HeroID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.HeroID);
            if (message.Positon != null && Object.hasOwnProperty.call(message, "Positon"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.Positon);
            if (message.EquipSeq != null && Object.hasOwnProperty.call(message, "EquipSeq"))
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.EquipSeq);
            if (message.EquipID != null && Object.hasOwnProperty.call(message, "EquipID"))
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.EquipID);
            return writer;
        };

        /**
         * Encodes the specified HeroEquipRes message, length delimited. Does not implicitly {@link gamesvr.HeroEquipRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {gamesvr.IHeroEquipRes} message HeroEquipRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HeroEquipRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HeroEquipRes message from the specified reader or buffer.
         * @function decode
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {gamesvr.HeroEquipRes} HeroEquipRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeroEquipRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.gamesvr.HeroEquipRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.HeroID = reader.int32();
                    break;
                case 2:
                    message.Positon = reader.int32();
                    break;
                case 3:
                    message.EquipSeq = reader.int32();
                    break;
                case 4:
                    message.EquipID = reader.int32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HeroEquipRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {gamesvr.HeroEquipRes} HeroEquipRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HeroEquipRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HeroEquipRes message.
         * @function verify
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HeroEquipRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                if (!$util.isInteger(message.HeroID))
                    return "HeroID: integer expected";
            if (message.Positon != null && message.hasOwnProperty("Positon"))
                if (!$util.isInteger(message.Positon))
                    return "Positon: integer expected";
            if (message.EquipSeq != null && message.hasOwnProperty("EquipSeq"))
                if (!$util.isInteger(message.EquipSeq))
                    return "EquipSeq: integer expected";
            if (message.EquipID != null && message.hasOwnProperty("EquipID"))
                if (!$util.isInteger(message.EquipID))
                    return "EquipID: integer expected";
            return null;
        };

        /**
         * Creates a HeroEquipRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {gamesvr.HeroEquipRes} HeroEquipRes
         */
        HeroEquipRes.fromObject = function fromObject(object) {
            if (object instanceof $root.gamesvr.HeroEquipRes)
                return object;
            var message = new $root.gamesvr.HeroEquipRes();
            if (object.HeroID != null)
                message.HeroID = object.HeroID | 0;
            if (object.Positon != null)
                message.Positon = object.Positon | 0;
            if (object.EquipSeq != null)
                message.EquipSeq = object.EquipSeq | 0;
            if (object.EquipID != null)
                message.EquipID = object.EquipID | 0;
            return message;
        };

        /**
         * Creates a plain object from a HeroEquipRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof gamesvr.HeroEquipRes
         * @static
         * @param {gamesvr.HeroEquipRes} message HeroEquipRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HeroEquipRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.HeroID = 0;
                object.Positon = 0;
                object.EquipSeq = 0;
                object.EquipID = 0;
            }
            if (message.HeroID != null && message.hasOwnProperty("HeroID"))
                object.HeroID = message.HeroID;
            if (message.Positon != null && message.hasOwnProperty("Positon"))
                object.Positon = message.Positon;
            if (message.EquipSeq != null && message.hasOwnProperty("EquipSeq"))
                object.EquipSeq = message.EquipSeq;
            if (message.EquipID != null && message.hasOwnProperty("EquipID"))
                object.EquipID = message.EquipID;
            return object;
        };

        /**
         * Converts this HeroEquipRes to JSON.
         * @function toJSON
         * @memberof gamesvr.HeroEquipRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HeroEquipRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HeroEquipRes;
    })();

    /**
     * CMD enum.
     * @name gamesvr.CMD
     * @enum {number}
     * @property {number} INVALID=0 INVALID value
     * @property {number} LOGIN_REQ=101 LOGIN_REQ value
     * @property {number} LOGIN_RES=102 LOGIN_RES value
     * @property {number} HEART_BEAT_REQ=103 HEART_BEAT_REQ value
     * @property {number} HEART_BEAT_RES=104 HEART_BEAT_RES value
     * @property {number} CHANGE_NAME_REQ=105 CHANGE_NAME_REQ value
     * @property {number} CHANGE_NAME_RES=106 CHANGE_NAME_RES value
     * @property {number} CHANGE_HEAD_REQ=107 CHANGE_HEAD_REQ value
     * @property {number} CHANGE_HEAD_RES=108 CHANGE_HEAD_RES value
     * @property {number} RANDOM_NAME_REQ=109 RANDOM_NAME_REQ value
     * @property {number} RANDOM_NAME_RES=110 RANDOM_NAME_RES value
     * @property {number} DIFF_LOGIN_NOTIFY=112 DIFF_LOGIN_NOTIFY value
     * @property {number} GET_ITEM_REQ=201 GET_ITEM_REQ value
     * @property {number} GET_ITEM_RES=202 GET_ITEM_RES value
     * @property {number} ITEM_CHANGE_NOTIFY=204 ITEM_CHANGE_NOTIFY value
     * @property {number} COMPOSE_HERO_REQ=301 COMPOSE_HERO_REQ value
     * @property {number} COMPOSE_HERO_RES=302 COMPOSE_HERO_RES value
     * @property {number} ADD_HERO_STAR_REQ=303 ADD_HERO_STAR_REQ value
     * @property {number} ADD_HERO_STAR_RES=304 ADD_HERO_STAR_RES value
     * @property {number} HERO_EQUIP_REQ=305 HERO_EQUIP_REQ value
     * @property {number} HERO_EQUIP_RES=306 HERO_EQUIP_RES value
     * @property {number} ENTER_PVE_REQ=401 ENTER_PVE_REQ value
     * @property {number} ENTER_PVE_RES=402 ENTER_PVE_RES value
     * @property {number} FINISH_PVE_REQ=403 FINISH_PVE_REQ value
     * @property {number} FINISH_PVE_RES=404 FINISH_PVE_RES value
     */
    gamesvr.CMD = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "INVALID"] = 0;
        values[valuesById[101] = "LOGIN_REQ"] = 101;
        values[valuesById[102] = "LOGIN_RES"] = 102;
        values[valuesById[103] = "HEART_BEAT_REQ"] = 103;
        values[valuesById[104] = "HEART_BEAT_RES"] = 104;
        values[valuesById[105] = "CHANGE_NAME_REQ"] = 105;
        values[valuesById[106] = "CHANGE_NAME_RES"] = 106;
        values[valuesById[107] = "CHANGE_HEAD_REQ"] = 107;
        values[valuesById[108] = "CHANGE_HEAD_RES"] = 108;
        values[valuesById[109] = "RANDOM_NAME_REQ"] = 109;
        values[valuesById[110] = "RANDOM_NAME_RES"] = 110;
        values[valuesById[112] = "DIFF_LOGIN_NOTIFY"] = 112;
        values[valuesById[201] = "GET_ITEM_REQ"] = 201;
        values[valuesById[202] = "GET_ITEM_RES"] = 202;
        values[valuesById[204] = "ITEM_CHANGE_NOTIFY"] = 204;
        values[valuesById[301] = "COMPOSE_HERO_REQ"] = 301;
        values[valuesById[302] = "COMPOSE_HERO_RES"] = 302;
        values[valuesById[303] = "ADD_HERO_STAR_REQ"] = 303;
        values[valuesById[304] = "ADD_HERO_STAR_RES"] = 304;
        values[valuesById[305] = "HERO_EQUIP_REQ"] = 305;
        values[valuesById[306] = "HERO_EQUIP_RES"] = 306;
        values[valuesById[401] = "ENTER_PVE_REQ"] = 401;
        values[valuesById[402] = "ENTER_PVE_RES"] = 402;
        values[valuesById[403] = "FINISH_PVE_REQ"] = 403;
        values[valuesById[404] = "FINISH_PVE_RES"] = 404;
        return values;
    })();

    return gamesvr;
})();

$root.onlinesvr = (function() {

    /**
     * Namespace onlinesvr.
     * @exports onlinesvr
     * @namespace
     */
    var onlinesvr = {};

    /**
     * CMD enum.
     * @name onlinesvr.CMD
     * @enum {number}
     * @property {number} INVALID=0 INVALID value
     * @property {number} HELLO_REQ=1 HELLO_REQ value
     * @property {number} HELLO_RES=2 HELLO_RES value
     * @property {number} JOIN_REQ=3 JOIN_REQ value
     * @property {number} JOIN_RES=4 JOIN_RES value
     * @property {number} BREAK_REQ=5 BREAK_REQ value
     * @property {number} BREAK_RES=6 BREAK_RES value
     * @property {number} REJOIN_REQ=7 REJOIN_REQ value
     * @property {number} REJOIN_RES=8 REJOIN_RES value
     * @property {number} RECOVERY_NOTIFY=10 RECOVERY_NOTIFY value
     * @property {number} LOCK_USER_REQ=11 LOCK_USER_REQ value
     * @property {number} LOCK_USER_RES=12 LOCK_USER_RES value
     * @property {number} UNLOCK_USER_REQ=13 UNLOCK_USER_REQ value
     * @property {number} UNLOCK_USER_RES=14 UNLOCK_USER_RES value
     * @property {number} REPORT_USERS_REQ=15 REPORT_USERS_REQ value
     * @property {number} REPORT_USERS_RES=16 REPORT_USERS_RES value
     * @property {number} QUERY_GAMESVRS_REQ=17 QUERY_GAMESVRS_REQ value
     * @property {number} QUERY_GAMESVRS_RES=18 QUERY_GAMESVRS_RES value
     */
    onlinesvr.CMD = (function() {
        var valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "INVALID"] = 0;
        values[valuesById[1] = "HELLO_REQ"] = 1;
        values[valuesById[2] = "HELLO_RES"] = 2;
        values[valuesById[3] = "JOIN_REQ"] = 3;
        values[valuesById[4] = "JOIN_RES"] = 4;
        values[valuesById[5] = "BREAK_REQ"] = 5;
        values[valuesById[6] = "BREAK_RES"] = 6;
        values[valuesById[7] = "REJOIN_REQ"] = 7;
        values[valuesById[8] = "REJOIN_RES"] = 8;
        values[valuesById[10] = "RECOVERY_NOTIFY"] = 10;
        values[valuesById[11] = "LOCK_USER_REQ"] = 11;
        values[valuesById[12] = "LOCK_USER_RES"] = 12;
        values[valuesById[13] = "UNLOCK_USER_REQ"] = 13;
        values[valuesById[14] = "UNLOCK_USER_RES"] = 14;
        values[valuesById[15] = "REPORT_USERS_REQ"] = 15;
        values[valuesById[16] = "REPORT_USERS_RES"] = 16;
        values[valuesById[17] = "QUERY_GAMESVRS_REQ"] = 17;
        values[valuesById[18] = "QUERY_GAMESVRS_RES"] = 18;
        return values;
    })();

    onlinesvr.HelloReq = (function() {

        /**
         * Properties of a HelloReq.
         * @memberof onlinesvr
         * @interface IHelloReq
         * @property {number|null} [GamesvrID] HelloReq GamesvrID
         * @property {string|null} [URL] HelloReq URL
         */

        /**
         * Constructs a new HelloReq.
         * @memberof onlinesvr
         * @classdesc Represents a HelloReq.
         * @implements IHelloReq
         * @constructor
         * @param {onlinesvr.IHelloReq=} [properties] Properties to set
         */
        function HelloReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * HelloReq GamesvrID.
         * @member {number} GamesvrID
         * @memberof onlinesvr.HelloReq
         * @instance
         */
        HelloReq.prototype.GamesvrID = 0;

        /**
         * HelloReq URL.
         * @member {string} URL
         * @memberof onlinesvr.HelloReq
         * @instance
         */
        HelloReq.prototype.URL = "";

        /**
         * Creates a new HelloReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {onlinesvr.IHelloReq=} [properties] Properties to set
         * @returns {onlinesvr.HelloReq} HelloReq instance
         */
        HelloReq.create = function create(properties) {
            return new HelloReq(properties);
        };

        /**
         * Encodes the specified HelloReq message. Does not implicitly {@link onlinesvr.HelloReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {onlinesvr.IHelloReq} message HelloReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HelloReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.GamesvrID != null && Object.hasOwnProperty.call(message, "GamesvrID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.GamesvrID);
            if (message.URL != null && Object.hasOwnProperty.call(message, "URL"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.URL);
            return writer;
        };

        /**
         * Encodes the specified HelloReq message, length delimited. Does not implicitly {@link onlinesvr.HelloReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {onlinesvr.IHelloReq} message HelloReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HelloReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HelloReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.HelloReq} HelloReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HelloReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.HelloReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.GamesvrID = reader.int32();
                    break;
                case 2:
                    message.URL = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HelloReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.HelloReq} HelloReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HelloReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HelloReq message.
         * @function verify
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HelloReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.GamesvrID != null && message.hasOwnProperty("GamesvrID"))
                if (!$util.isInteger(message.GamesvrID))
                    return "GamesvrID: integer expected";
            if (message.URL != null && message.hasOwnProperty("URL"))
                if (!$util.isString(message.URL))
                    return "URL: string expected";
            return null;
        };

        /**
         * Creates a HelloReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.HelloReq} HelloReq
         */
        HelloReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.HelloReq)
                return object;
            var message = new $root.onlinesvr.HelloReq();
            if (object.GamesvrID != null)
                message.GamesvrID = object.GamesvrID | 0;
            if (object.URL != null)
                message.URL = String(object.URL);
            return message;
        };

        /**
         * Creates a plain object from a HelloReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.HelloReq
         * @static
         * @param {onlinesvr.HelloReq} message HelloReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HelloReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.GamesvrID = 0;
                object.URL = "";
            }
            if (message.GamesvrID != null && message.hasOwnProperty("GamesvrID"))
                object.GamesvrID = message.GamesvrID;
            if (message.URL != null && message.hasOwnProperty("URL"))
                object.URL = message.URL;
            return object;
        };

        /**
         * Converts this HelloReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.HelloReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HelloReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HelloReq;
    })();

    onlinesvr.HelloRes = (function() {

        /**
         * Properties of a HelloRes.
         * @memberof onlinesvr
         * @interface IHelloRes
         */

        /**
         * Constructs a new HelloRes.
         * @memberof onlinesvr
         * @classdesc Represents a HelloRes.
         * @implements IHelloRes
         * @constructor
         * @param {onlinesvr.IHelloRes=} [properties] Properties to set
         */
        function HelloRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new HelloRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {onlinesvr.IHelloRes=} [properties] Properties to set
         * @returns {onlinesvr.HelloRes} HelloRes instance
         */
        HelloRes.create = function create(properties) {
            return new HelloRes(properties);
        };

        /**
         * Encodes the specified HelloRes message. Does not implicitly {@link onlinesvr.HelloRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {onlinesvr.IHelloRes} message HelloRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HelloRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified HelloRes message, length delimited. Does not implicitly {@link onlinesvr.HelloRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {onlinesvr.IHelloRes} message HelloRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        HelloRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a HelloRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.HelloRes} HelloRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HelloRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.HelloRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a HelloRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.HelloRes} HelloRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        HelloRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a HelloRes message.
         * @function verify
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        HelloRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a HelloRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.HelloRes} HelloRes
         */
        HelloRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.HelloRes)
                return object;
            return new $root.onlinesvr.HelloRes();
        };

        /**
         * Creates a plain object from a HelloRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.HelloRes
         * @static
         * @param {onlinesvr.HelloRes} message HelloRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        HelloRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this HelloRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.HelloRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        HelloRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return HelloRes;
    })();

    onlinesvr.JoinReq = (function() {

        /**
         * Properties of a JoinReq.
         * @memberof onlinesvr
         * @interface IJoinReq
         */

        /**
         * Constructs a new JoinReq.
         * @memberof onlinesvr
         * @classdesc Represents a JoinReq.
         * @implements IJoinReq
         * @constructor
         * @param {onlinesvr.IJoinReq=} [properties] Properties to set
         */
        function JoinReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new JoinReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {onlinesvr.IJoinReq=} [properties] Properties to set
         * @returns {onlinesvr.JoinReq} JoinReq instance
         */
        JoinReq.create = function create(properties) {
            return new JoinReq(properties);
        };

        /**
         * Encodes the specified JoinReq message. Does not implicitly {@link onlinesvr.JoinReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {onlinesvr.IJoinReq} message JoinReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified JoinReq message, length delimited. Does not implicitly {@link onlinesvr.JoinReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {onlinesvr.IJoinReq} message JoinReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a JoinReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.JoinReq} JoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.JoinReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a JoinReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.JoinReq} JoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a JoinReq message.
         * @function verify
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        JoinReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a JoinReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.JoinReq} JoinReq
         */
        JoinReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.JoinReq)
                return object;
            return new $root.onlinesvr.JoinReq();
        };

        /**
         * Creates a plain object from a JoinReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.JoinReq
         * @static
         * @param {onlinesvr.JoinReq} message JoinReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        JoinReq.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this JoinReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.JoinReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        JoinReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return JoinReq;
    })();

    onlinesvr.JoinRes = (function() {

        /**
         * Properties of a JoinRes.
         * @memberof onlinesvr
         * @interface IJoinRes
         */

        /**
         * Constructs a new JoinRes.
         * @memberof onlinesvr
         * @classdesc Represents a JoinRes.
         * @implements IJoinRes
         * @constructor
         * @param {onlinesvr.IJoinRes=} [properties] Properties to set
         */
        function JoinRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new JoinRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {onlinesvr.IJoinRes=} [properties] Properties to set
         * @returns {onlinesvr.JoinRes} JoinRes instance
         */
        JoinRes.create = function create(properties) {
            return new JoinRes(properties);
        };

        /**
         * Encodes the specified JoinRes message. Does not implicitly {@link onlinesvr.JoinRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {onlinesvr.IJoinRes} message JoinRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified JoinRes message, length delimited. Does not implicitly {@link onlinesvr.JoinRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {onlinesvr.IJoinRes} message JoinRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        JoinRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a JoinRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.JoinRes} JoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.JoinRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a JoinRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.JoinRes} JoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        JoinRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a JoinRes message.
         * @function verify
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        JoinRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a JoinRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.JoinRes} JoinRes
         */
        JoinRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.JoinRes)
                return object;
            return new $root.onlinesvr.JoinRes();
        };

        /**
         * Creates a plain object from a JoinRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.JoinRes
         * @static
         * @param {onlinesvr.JoinRes} message JoinRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        JoinRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this JoinRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.JoinRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        JoinRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return JoinRes;
    })();

    onlinesvr.BreakReq = (function() {

        /**
         * Properties of a BreakReq.
         * @memberof onlinesvr
         * @interface IBreakReq
         */

        /**
         * Constructs a new BreakReq.
         * @memberof onlinesvr
         * @classdesc Represents a BreakReq.
         * @implements IBreakReq
         * @constructor
         * @param {onlinesvr.IBreakReq=} [properties] Properties to set
         */
        function BreakReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new BreakReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {onlinesvr.IBreakReq=} [properties] Properties to set
         * @returns {onlinesvr.BreakReq} BreakReq instance
         */
        BreakReq.create = function create(properties) {
            return new BreakReq(properties);
        };

        /**
         * Encodes the specified BreakReq message. Does not implicitly {@link onlinesvr.BreakReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {onlinesvr.IBreakReq} message BreakReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BreakReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified BreakReq message, length delimited. Does not implicitly {@link onlinesvr.BreakReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {onlinesvr.IBreakReq} message BreakReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BreakReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BreakReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.BreakReq} BreakReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BreakReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.BreakReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BreakReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.BreakReq} BreakReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BreakReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BreakReq message.
         * @function verify
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BreakReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a BreakReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.BreakReq} BreakReq
         */
        BreakReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.BreakReq)
                return object;
            return new $root.onlinesvr.BreakReq();
        };

        /**
         * Creates a plain object from a BreakReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.BreakReq
         * @static
         * @param {onlinesvr.BreakReq} message BreakReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BreakReq.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this BreakReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.BreakReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BreakReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BreakReq;
    })();

    onlinesvr.BreakRes = (function() {

        /**
         * Properties of a BreakRes.
         * @memberof onlinesvr
         * @interface IBreakRes
         */

        /**
         * Constructs a new BreakRes.
         * @memberof onlinesvr
         * @classdesc Represents a BreakRes.
         * @implements IBreakRes
         * @constructor
         * @param {onlinesvr.IBreakRes=} [properties] Properties to set
         */
        function BreakRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new BreakRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {onlinesvr.IBreakRes=} [properties] Properties to set
         * @returns {onlinesvr.BreakRes} BreakRes instance
         */
        BreakRes.create = function create(properties) {
            return new BreakRes(properties);
        };

        /**
         * Encodes the specified BreakRes message. Does not implicitly {@link onlinesvr.BreakRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {onlinesvr.IBreakRes} message BreakRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BreakRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified BreakRes message, length delimited. Does not implicitly {@link onlinesvr.BreakRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {onlinesvr.IBreakRes} message BreakRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BreakRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a BreakRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.BreakRes} BreakRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BreakRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.BreakRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a BreakRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.BreakRes} BreakRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BreakRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BreakRes message.
         * @function verify
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BreakRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a BreakRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.BreakRes} BreakRes
         */
        BreakRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.BreakRes)
                return object;
            return new $root.onlinesvr.BreakRes();
        };

        /**
         * Creates a plain object from a BreakRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.BreakRes
         * @static
         * @param {onlinesvr.BreakRes} message BreakRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BreakRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this BreakRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.BreakRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BreakRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return BreakRes;
    })();

    onlinesvr.RejoinReq = (function() {

        /**
         * Properties of a RejoinReq.
         * @memberof onlinesvr
         * @interface IRejoinReq
         * @property {Array.<string>|null} [UserIDs] RejoinReq UserIDs
         */

        /**
         * Constructs a new RejoinReq.
         * @memberof onlinesvr
         * @classdesc Represents a RejoinReq.
         * @implements IRejoinReq
         * @constructor
         * @param {onlinesvr.IRejoinReq=} [properties] Properties to set
         */
        function RejoinReq(properties) {
            this.UserIDs = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * RejoinReq UserIDs.
         * @member {Array.<string>} UserIDs
         * @memberof onlinesvr.RejoinReq
         * @instance
         */
        RejoinReq.prototype.UserIDs = $util.emptyArray;

        /**
         * Creates a new RejoinReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {onlinesvr.IRejoinReq=} [properties] Properties to set
         * @returns {onlinesvr.RejoinReq} RejoinReq instance
         */
        RejoinReq.create = function create(properties) {
            return new RejoinReq(properties);
        };

        /**
         * Encodes the specified RejoinReq message. Does not implicitly {@link onlinesvr.RejoinReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {onlinesvr.IRejoinReq} message RejoinReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RejoinReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserIDs != null && message.UserIDs.length)
                for (var i = 0; i < message.UserIDs.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserIDs[i]);
            return writer;
        };

        /**
         * Encodes the specified RejoinReq message, length delimited. Does not implicitly {@link onlinesvr.RejoinReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {onlinesvr.IRejoinReq} message RejoinReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RejoinReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RejoinReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.RejoinReq} RejoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RejoinReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.RejoinReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.UserIDs && message.UserIDs.length))
                        message.UserIDs = [];
                    message.UserIDs.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RejoinReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.RejoinReq} RejoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RejoinReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RejoinReq message.
         * @function verify
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RejoinReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserIDs != null && message.hasOwnProperty("UserIDs")) {
                if (!Array.isArray(message.UserIDs))
                    return "UserIDs: array expected";
                for (var i = 0; i < message.UserIDs.length; ++i)
                    if (!$util.isString(message.UserIDs[i]))
                        return "UserIDs: string[] expected";
            }
            return null;
        };

        /**
         * Creates a RejoinReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.RejoinReq} RejoinReq
         */
        RejoinReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.RejoinReq)
                return object;
            var message = new $root.onlinesvr.RejoinReq();
            if (object.UserIDs) {
                if (!Array.isArray(object.UserIDs))
                    throw TypeError(".onlinesvr.RejoinReq.UserIDs: array expected");
                message.UserIDs = [];
                for (var i = 0; i < object.UserIDs.length; ++i)
                    message.UserIDs[i] = String(object.UserIDs[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a RejoinReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.RejoinReq
         * @static
         * @param {onlinesvr.RejoinReq} message RejoinReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RejoinReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.UserIDs = [];
            if (message.UserIDs && message.UserIDs.length) {
                object.UserIDs = [];
                for (var j = 0; j < message.UserIDs.length; ++j)
                    object.UserIDs[j] = message.UserIDs[j];
            }
            return object;
        };

        /**
         * Converts this RejoinReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.RejoinReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RejoinReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RejoinReq;
    })();

    onlinesvr.RejoinRes = (function() {

        /**
         * Properties of a RejoinRes.
         * @memberof onlinesvr
         * @interface IRejoinRes
         */

        /**
         * Constructs a new RejoinRes.
         * @memberof onlinesvr
         * @classdesc Represents a RejoinRes.
         * @implements IRejoinRes
         * @constructor
         * @param {onlinesvr.IRejoinRes=} [properties] Properties to set
         */
        function RejoinRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new RejoinRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {onlinesvr.IRejoinRes=} [properties] Properties to set
         * @returns {onlinesvr.RejoinRes} RejoinRes instance
         */
        RejoinRes.create = function create(properties) {
            return new RejoinRes(properties);
        };

        /**
         * Encodes the specified RejoinRes message. Does not implicitly {@link onlinesvr.RejoinRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {onlinesvr.IRejoinRes} message RejoinRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RejoinRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified RejoinRes message, length delimited. Does not implicitly {@link onlinesvr.RejoinRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {onlinesvr.IRejoinRes} message RejoinRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RejoinRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RejoinRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.RejoinRes} RejoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RejoinRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.RejoinRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RejoinRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.RejoinRes} RejoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RejoinRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RejoinRes message.
         * @function verify
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RejoinRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a RejoinRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.RejoinRes} RejoinRes
         */
        RejoinRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.RejoinRes)
                return object;
            return new $root.onlinesvr.RejoinRes();
        };

        /**
         * Creates a plain object from a RejoinRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.RejoinRes
         * @static
         * @param {onlinesvr.RejoinRes} message RejoinRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RejoinRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this RejoinRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.RejoinRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RejoinRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RejoinRes;
    })();

    onlinesvr.RecoveryNotify = (function() {

        /**
         * Properties of a RecoveryNotify.
         * @memberof onlinesvr
         * @interface IRecoveryNotify
         */

        /**
         * Constructs a new RecoveryNotify.
         * @memberof onlinesvr
         * @classdesc Represents a RecoveryNotify.
         * @implements IRecoveryNotify
         * @constructor
         * @param {onlinesvr.IRecoveryNotify=} [properties] Properties to set
         */
        function RecoveryNotify(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new RecoveryNotify instance using the specified properties.
         * @function create
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {onlinesvr.IRecoveryNotify=} [properties] Properties to set
         * @returns {onlinesvr.RecoveryNotify} RecoveryNotify instance
         */
        RecoveryNotify.create = function create(properties) {
            return new RecoveryNotify(properties);
        };

        /**
         * Encodes the specified RecoveryNotify message. Does not implicitly {@link onlinesvr.RecoveryNotify.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {onlinesvr.IRecoveryNotify} message RecoveryNotify message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecoveryNotify.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified RecoveryNotify message, length delimited. Does not implicitly {@link onlinesvr.RecoveryNotify.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {onlinesvr.IRecoveryNotify} message RecoveryNotify message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecoveryNotify.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a RecoveryNotify message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.RecoveryNotify} RecoveryNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecoveryNotify.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.RecoveryNotify();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a RecoveryNotify message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.RecoveryNotify} RecoveryNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecoveryNotify.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RecoveryNotify message.
         * @function verify
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RecoveryNotify.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a RecoveryNotify message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.RecoveryNotify} RecoveryNotify
         */
        RecoveryNotify.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.RecoveryNotify)
                return object;
            return new $root.onlinesvr.RecoveryNotify();
        };

        /**
         * Creates a plain object from a RecoveryNotify message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.RecoveryNotify
         * @static
         * @param {onlinesvr.RecoveryNotify} message RecoveryNotify
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RecoveryNotify.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this RecoveryNotify to JSON.
         * @function toJSON
         * @memberof onlinesvr.RecoveryNotify
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RecoveryNotify.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return RecoveryNotify;
    })();

    onlinesvr.LockUserReq = (function() {

        /**
         * Properties of a LockUserReq.
         * @memberof onlinesvr
         * @interface ILockUserReq
         * @property {string|null} [UserID] LockUserReq UserID
         */

        /**
         * Constructs a new LockUserReq.
         * @memberof onlinesvr
         * @classdesc Represents a LockUserReq.
         * @implements ILockUserReq
         * @constructor
         * @param {onlinesvr.ILockUserReq=} [properties] Properties to set
         */
        function LockUserReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LockUserReq UserID.
         * @member {string} UserID
         * @memberof onlinesvr.LockUserReq
         * @instance
         */
        LockUserReq.prototype.UserID = "";

        /**
         * Creates a new LockUserReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {onlinesvr.ILockUserReq=} [properties] Properties to set
         * @returns {onlinesvr.LockUserReq} LockUserReq instance
         */
        LockUserReq.create = function create(properties) {
            return new LockUserReq(properties);
        };

        /**
         * Encodes the specified LockUserReq message. Does not implicitly {@link onlinesvr.LockUserReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {onlinesvr.ILockUserReq} message LockUserReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LockUserReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserID != null && Object.hasOwnProperty.call(message, "UserID"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserID);
            return writer;
        };

        /**
         * Encodes the specified LockUserReq message, length delimited. Does not implicitly {@link onlinesvr.LockUserReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {onlinesvr.ILockUserReq} message LockUserReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LockUserReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LockUserReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.LockUserReq} LockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LockUserReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.LockUserReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserID = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LockUserReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.LockUserReq} LockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LockUserReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LockUserReq message.
         * @function verify
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LockUserReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                if (!$util.isString(message.UserID))
                    return "UserID: string expected";
            return null;
        };

        /**
         * Creates a LockUserReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.LockUserReq} LockUserReq
         */
        LockUserReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.LockUserReq)
                return object;
            var message = new $root.onlinesvr.LockUserReq();
            if (object.UserID != null)
                message.UserID = String(object.UserID);
            return message;
        };

        /**
         * Creates a plain object from a LockUserReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.LockUserReq
         * @static
         * @param {onlinesvr.LockUserReq} message LockUserReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LockUserReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.UserID = "";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                object.UserID = message.UserID;
            return object;
        };

        /**
         * Converts this LockUserReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.LockUserReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LockUserReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LockUserReq;
    })();

    onlinesvr.LockUserRes = (function() {

        /**
         * Properties of a LockUserRes.
         * @memberof onlinesvr
         * @interface ILockUserRes
         */

        /**
         * Constructs a new LockUserRes.
         * @memberof onlinesvr
         * @classdesc Represents a LockUserRes.
         * @implements ILockUserRes
         * @constructor
         * @param {onlinesvr.ILockUserRes=} [properties] Properties to set
         */
        function LockUserRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new LockUserRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {onlinesvr.ILockUserRes=} [properties] Properties to set
         * @returns {onlinesvr.LockUserRes} LockUserRes instance
         */
        LockUserRes.create = function create(properties) {
            return new LockUserRes(properties);
        };

        /**
         * Encodes the specified LockUserRes message. Does not implicitly {@link onlinesvr.LockUserRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {onlinesvr.ILockUserRes} message LockUserRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LockUserRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified LockUserRes message, length delimited. Does not implicitly {@link onlinesvr.LockUserRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {onlinesvr.ILockUserRes} message LockUserRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LockUserRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a LockUserRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.LockUserRes} LockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LockUserRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.LockUserRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a LockUserRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.LockUserRes} LockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LockUserRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LockUserRes message.
         * @function verify
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LockUserRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a LockUserRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.LockUserRes} LockUserRes
         */
        LockUserRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.LockUserRes)
                return object;
            return new $root.onlinesvr.LockUserRes();
        };

        /**
         * Creates a plain object from a LockUserRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.LockUserRes
         * @static
         * @param {onlinesvr.LockUserRes} message LockUserRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LockUserRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this LockUserRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.LockUserRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LockUserRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return LockUserRes;
    })();

    onlinesvr.UnlockUserReq = (function() {

        /**
         * Properties of an UnlockUserReq.
         * @memberof onlinesvr
         * @interface IUnlockUserReq
         * @property {string|null} [UserID] UnlockUserReq UserID
         */

        /**
         * Constructs a new UnlockUserReq.
         * @memberof onlinesvr
         * @classdesc Represents an UnlockUserReq.
         * @implements IUnlockUserReq
         * @constructor
         * @param {onlinesvr.IUnlockUserReq=} [properties] Properties to set
         */
        function UnlockUserReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * UnlockUserReq UserID.
         * @member {string} UserID
         * @memberof onlinesvr.UnlockUserReq
         * @instance
         */
        UnlockUserReq.prototype.UserID = "";

        /**
         * Creates a new UnlockUserReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {onlinesvr.IUnlockUserReq=} [properties] Properties to set
         * @returns {onlinesvr.UnlockUserReq} UnlockUserReq instance
         */
        UnlockUserReq.create = function create(properties) {
            return new UnlockUserReq(properties);
        };

        /**
         * Encodes the specified UnlockUserReq message. Does not implicitly {@link onlinesvr.UnlockUserReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {onlinesvr.IUnlockUserReq} message UnlockUserReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UnlockUserReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserID != null && Object.hasOwnProperty.call(message, "UserID"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserID);
            return writer;
        };

        /**
         * Encodes the specified UnlockUserReq message, length delimited. Does not implicitly {@link onlinesvr.UnlockUserReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {onlinesvr.IUnlockUserReq} message UnlockUserReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UnlockUserReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an UnlockUserReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.UnlockUserReq} UnlockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UnlockUserReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.UnlockUserReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.UserID = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an UnlockUserReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.UnlockUserReq} UnlockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UnlockUserReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an UnlockUserReq message.
         * @function verify
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        UnlockUserReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                if (!$util.isString(message.UserID))
                    return "UserID: string expected";
            return null;
        };

        /**
         * Creates an UnlockUserReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.UnlockUserReq} UnlockUserReq
         */
        UnlockUserReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.UnlockUserReq)
                return object;
            var message = new $root.onlinesvr.UnlockUserReq();
            if (object.UserID != null)
                message.UserID = String(object.UserID);
            return message;
        };

        /**
         * Creates a plain object from an UnlockUserReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.UnlockUserReq
         * @static
         * @param {onlinesvr.UnlockUserReq} message UnlockUserReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        UnlockUserReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.UserID = "";
            if (message.UserID != null && message.hasOwnProperty("UserID"))
                object.UserID = message.UserID;
            return object;
        };

        /**
         * Converts this UnlockUserReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.UnlockUserReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        UnlockUserReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return UnlockUserReq;
    })();

    onlinesvr.UnlockUserRes = (function() {

        /**
         * Properties of an UnlockUserRes.
         * @memberof onlinesvr
         * @interface IUnlockUserRes
         */

        /**
         * Constructs a new UnlockUserRes.
         * @memberof onlinesvr
         * @classdesc Represents an UnlockUserRes.
         * @implements IUnlockUserRes
         * @constructor
         * @param {onlinesvr.IUnlockUserRes=} [properties] Properties to set
         */
        function UnlockUserRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new UnlockUserRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {onlinesvr.IUnlockUserRes=} [properties] Properties to set
         * @returns {onlinesvr.UnlockUserRes} UnlockUserRes instance
         */
        UnlockUserRes.create = function create(properties) {
            return new UnlockUserRes(properties);
        };

        /**
         * Encodes the specified UnlockUserRes message. Does not implicitly {@link onlinesvr.UnlockUserRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {onlinesvr.IUnlockUserRes} message UnlockUserRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UnlockUserRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified UnlockUserRes message, length delimited. Does not implicitly {@link onlinesvr.UnlockUserRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {onlinesvr.IUnlockUserRes} message UnlockUserRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        UnlockUserRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes an UnlockUserRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.UnlockUserRes} UnlockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UnlockUserRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.UnlockUserRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an UnlockUserRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.UnlockUserRes} UnlockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        UnlockUserRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an UnlockUserRes message.
         * @function verify
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        UnlockUserRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates an UnlockUserRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.UnlockUserRes} UnlockUserRes
         */
        UnlockUserRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.UnlockUserRes)
                return object;
            return new $root.onlinesvr.UnlockUserRes();
        };

        /**
         * Creates a plain object from an UnlockUserRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.UnlockUserRes
         * @static
         * @param {onlinesvr.UnlockUserRes} message UnlockUserRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        UnlockUserRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this UnlockUserRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.UnlockUserRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        UnlockUserRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return UnlockUserRes;
    })();

    onlinesvr.QueryGamesvrsReq = (function() {

        /**
         * Properties of a QueryGamesvrsReq.
         * @memberof onlinesvr
         * @interface IQueryGamesvrsReq
         */

        /**
         * Constructs a new QueryGamesvrsReq.
         * @memberof onlinesvr
         * @classdesc Represents a QueryGamesvrsReq.
         * @implements IQueryGamesvrsReq
         * @constructor
         * @param {onlinesvr.IQueryGamesvrsReq=} [properties] Properties to set
         */
        function QueryGamesvrsReq(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new QueryGamesvrsReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {onlinesvr.IQueryGamesvrsReq=} [properties] Properties to set
         * @returns {onlinesvr.QueryGamesvrsReq} QueryGamesvrsReq instance
         */
        QueryGamesvrsReq.create = function create(properties) {
            return new QueryGamesvrsReq(properties);
        };

        /**
         * Encodes the specified QueryGamesvrsReq message. Does not implicitly {@link onlinesvr.QueryGamesvrsReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {onlinesvr.IQueryGamesvrsReq} message QueryGamesvrsReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        QueryGamesvrsReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified QueryGamesvrsReq message, length delimited. Does not implicitly {@link onlinesvr.QueryGamesvrsReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {onlinesvr.IQueryGamesvrsReq} message QueryGamesvrsReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        QueryGamesvrsReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a QueryGamesvrsReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.QueryGamesvrsReq} QueryGamesvrsReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        QueryGamesvrsReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.QueryGamesvrsReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a QueryGamesvrsReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.QueryGamesvrsReq} QueryGamesvrsReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        QueryGamesvrsReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a QueryGamesvrsReq message.
         * @function verify
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        QueryGamesvrsReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a QueryGamesvrsReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.QueryGamesvrsReq} QueryGamesvrsReq
         */
        QueryGamesvrsReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.QueryGamesvrsReq)
                return object;
            return new $root.onlinesvr.QueryGamesvrsReq();
        };

        /**
         * Creates a plain object from a QueryGamesvrsReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.QueryGamesvrsReq
         * @static
         * @param {onlinesvr.QueryGamesvrsReq} message QueryGamesvrsReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        QueryGamesvrsReq.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this QueryGamesvrsReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.QueryGamesvrsReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        QueryGamesvrsReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return QueryGamesvrsReq;
    })();

    onlinesvr.GamesvrInfo = (function() {

        /**
         * Properties of a GamesvrInfo.
         * @memberof onlinesvr
         * @interface IGamesvrInfo
         * @property {number|null} [GamesvrID] GamesvrInfo GamesvrID
         * @property {string|null} [URL] GamesvrInfo URL
         */

        /**
         * Constructs a new GamesvrInfo.
         * @memberof onlinesvr
         * @classdesc Represents a GamesvrInfo.
         * @implements IGamesvrInfo
         * @constructor
         * @param {onlinesvr.IGamesvrInfo=} [properties] Properties to set
         */
        function GamesvrInfo(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GamesvrInfo GamesvrID.
         * @member {number} GamesvrID
         * @memberof onlinesvr.GamesvrInfo
         * @instance
         */
        GamesvrInfo.prototype.GamesvrID = 0;

        /**
         * GamesvrInfo URL.
         * @member {string} URL
         * @memberof onlinesvr.GamesvrInfo
         * @instance
         */
        GamesvrInfo.prototype.URL = "";

        /**
         * Creates a new GamesvrInfo instance using the specified properties.
         * @function create
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {onlinesvr.IGamesvrInfo=} [properties] Properties to set
         * @returns {onlinesvr.GamesvrInfo} GamesvrInfo instance
         */
        GamesvrInfo.create = function create(properties) {
            return new GamesvrInfo(properties);
        };

        /**
         * Encodes the specified GamesvrInfo message. Does not implicitly {@link onlinesvr.GamesvrInfo.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {onlinesvr.IGamesvrInfo} message GamesvrInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GamesvrInfo.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.GamesvrID != null && Object.hasOwnProperty.call(message, "GamesvrID"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.GamesvrID);
            if (message.URL != null && Object.hasOwnProperty.call(message, "URL"))
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.URL);
            return writer;
        };

        /**
         * Encodes the specified GamesvrInfo message, length delimited. Does not implicitly {@link onlinesvr.GamesvrInfo.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {onlinesvr.IGamesvrInfo} message GamesvrInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GamesvrInfo.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a GamesvrInfo message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.GamesvrInfo} GamesvrInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GamesvrInfo.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.GamesvrInfo();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.GamesvrID = reader.int32();
                    break;
                case 2:
                    message.URL = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GamesvrInfo message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.GamesvrInfo} GamesvrInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GamesvrInfo.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GamesvrInfo message.
         * @function verify
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GamesvrInfo.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.GamesvrID != null && message.hasOwnProperty("GamesvrID"))
                if (!$util.isInteger(message.GamesvrID))
                    return "GamesvrID: integer expected";
            if (message.URL != null && message.hasOwnProperty("URL"))
                if (!$util.isString(message.URL))
                    return "URL: string expected";
            return null;
        };

        /**
         * Creates a GamesvrInfo message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.GamesvrInfo} GamesvrInfo
         */
        GamesvrInfo.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.GamesvrInfo)
                return object;
            var message = new $root.onlinesvr.GamesvrInfo();
            if (object.GamesvrID != null)
                message.GamesvrID = object.GamesvrID | 0;
            if (object.URL != null)
                message.URL = String(object.URL);
            return message;
        };

        /**
         * Creates a plain object from a GamesvrInfo message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.GamesvrInfo
         * @static
         * @param {onlinesvr.GamesvrInfo} message GamesvrInfo
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GamesvrInfo.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.GamesvrID = 0;
                object.URL = "";
            }
            if (message.GamesvrID != null && message.hasOwnProperty("GamesvrID"))
                object.GamesvrID = message.GamesvrID;
            if (message.URL != null && message.hasOwnProperty("URL"))
                object.URL = message.URL;
            return object;
        };

        /**
         * Converts this GamesvrInfo to JSON.
         * @function toJSON
         * @memberof onlinesvr.GamesvrInfo
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GamesvrInfo.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return GamesvrInfo;
    })();

    onlinesvr.QueryGamesvrsRes = (function() {

        /**
         * Properties of a QueryGamesvrsRes.
         * @memberof onlinesvr
         * @interface IQueryGamesvrsRes
         * @property {Array.<onlinesvr.IGamesvrInfo>|null} [GamesvrInfos] QueryGamesvrsRes GamesvrInfos
         */

        /**
         * Constructs a new QueryGamesvrsRes.
         * @memberof onlinesvr
         * @classdesc Represents a QueryGamesvrsRes.
         * @implements IQueryGamesvrsRes
         * @constructor
         * @param {onlinesvr.IQueryGamesvrsRes=} [properties] Properties to set
         */
        function QueryGamesvrsRes(properties) {
            this.GamesvrInfos = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * QueryGamesvrsRes GamesvrInfos.
         * @member {Array.<onlinesvr.IGamesvrInfo>} GamesvrInfos
         * @memberof onlinesvr.QueryGamesvrsRes
         * @instance
         */
        QueryGamesvrsRes.prototype.GamesvrInfos = $util.emptyArray;

        /**
         * Creates a new QueryGamesvrsRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {onlinesvr.IQueryGamesvrsRes=} [properties] Properties to set
         * @returns {onlinesvr.QueryGamesvrsRes} QueryGamesvrsRes instance
         */
        QueryGamesvrsRes.create = function create(properties) {
            return new QueryGamesvrsRes(properties);
        };

        /**
         * Encodes the specified QueryGamesvrsRes message. Does not implicitly {@link onlinesvr.QueryGamesvrsRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {onlinesvr.IQueryGamesvrsRes} message QueryGamesvrsRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        QueryGamesvrsRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.GamesvrInfos != null && message.GamesvrInfos.length)
                for (var i = 0; i < message.GamesvrInfos.length; ++i)
                    $root.onlinesvr.GamesvrInfo.encode(message.GamesvrInfos[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified QueryGamesvrsRes message, length delimited. Does not implicitly {@link onlinesvr.QueryGamesvrsRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {onlinesvr.IQueryGamesvrsRes} message QueryGamesvrsRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        QueryGamesvrsRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a QueryGamesvrsRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.QueryGamesvrsRes} QueryGamesvrsRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        QueryGamesvrsRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.QueryGamesvrsRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.GamesvrInfos && message.GamesvrInfos.length))
                        message.GamesvrInfos = [];
                    message.GamesvrInfos.push($root.onlinesvr.GamesvrInfo.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a QueryGamesvrsRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.QueryGamesvrsRes} QueryGamesvrsRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        QueryGamesvrsRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a QueryGamesvrsRes message.
         * @function verify
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        QueryGamesvrsRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.GamesvrInfos != null && message.hasOwnProperty("GamesvrInfos")) {
                if (!Array.isArray(message.GamesvrInfos))
                    return "GamesvrInfos: array expected";
                for (var i = 0; i < message.GamesvrInfos.length; ++i) {
                    var error = $root.onlinesvr.GamesvrInfo.verify(message.GamesvrInfos[i]);
                    if (error)
                        return "GamesvrInfos." + error;
                }
            }
            return null;
        };

        /**
         * Creates a QueryGamesvrsRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.QueryGamesvrsRes} QueryGamesvrsRes
         */
        QueryGamesvrsRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.QueryGamesvrsRes)
                return object;
            var message = new $root.onlinesvr.QueryGamesvrsRes();
            if (object.GamesvrInfos) {
                if (!Array.isArray(object.GamesvrInfos))
                    throw TypeError(".onlinesvr.QueryGamesvrsRes.GamesvrInfos: array expected");
                message.GamesvrInfos = [];
                for (var i = 0; i < object.GamesvrInfos.length; ++i) {
                    if (typeof object.GamesvrInfos[i] !== "object")
                        throw TypeError(".onlinesvr.QueryGamesvrsRes.GamesvrInfos: object expected");
                    message.GamesvrInfos[i] = $root.onlinesvr.GamesvrInfo.fromObject(object.GamesvrInfos[i]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a QueryGamesvrsRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.QueryGamesvrsRes
         * @static
         * @param {onlinesvr.QueryGamesvrsRes} message QueryGamesvrsRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        QueryGamesvrsRes.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.GamesvrInfos = [];
            if (message.GamesvrInfos && message.GamesvrInfos.length) {
                object.GamesvrInfos = [];
                for (var j = 0; j < message.GamesvrInfos.length; ++j)
                    object.GamesvrInfos[j] = $root.onlinesvr.GamesvrInfo.toObject(message.GamesvrInfos[j], options);
            }
            return object;
        };

        /**
         * Converts this QueryGamesvrsRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.QueryGamesvrsRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        QueryGamesvrsRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return QueryGamesvrsRes;
    })();

    onlinesvr.ReportUsersReq = (function() {

        /**
         * Properties of a ReportUsersReq.
         * @memberof onlinesvr
         * @interface IReportUsersReq
         * @property {Array.<string>|null} [UserIDs] ReportUsersReq UserIDs
         */

        /**
         * Constructs a new ReportUsersReq.
         * @memberof onlinesvr
         * @classdesc Represents a ReportUsersReq.
         * @implements IReportUsersReq
         * @constructor
         * @param {onlinesvr.IReportUsersReq=} [properties] Properties to set
         */
        function ReportUsersReq(properties) {
            this.UserIDs = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReportUsersReq UserIDs.
         * @member {Array.<string>} UserIDs
         * @memberof onlinesvr.ReportUsersReq
         * @instance
         */
        ReportUsersReq.prototype.UserIDs = $util.emptyArray;

        /**
         * Creates a new ReportUsersReq instance using the specified properties.
         * @function create
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {onlinesvr.IReportUsersReq=} [properties] Properties to set
         * @returns {onlinesvr.ReportUsersReq} ReportUsersReq instance
         */
        ReportUsersReq.create = function create(properties) {
            return new ReportUsersReq(properties);
        };

        /**
         * Encodes the specified ReportUsersReq message. Does not implicitly {@link onlinesvr.ReportUsersReq.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {onlinesvr.IReportUsersReq} message ReportUsersReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReportUsersReq.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            if (message.UserIDs != null && message.UserIDs.length)
                for (var i = 0; i < message.UserIDs.length; ++i)
                    writer.uint32(/* id 1, wireType 2 =*/10).string(message.UserIDs[i]);
            return writer;
        };

        /**
         * Encodes the specified ReportUsersReq message, length delimited. Does not implicitly {@link onlinesvr.ReportUsersReq.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {onlinesvr.IReportUsersReq} message ReportUsersReq message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReportUsersReq.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ReportUsersReq message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.ReportUsersReq} ReportUsersReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReportUsersReq.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.ReportUsersReq();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    if (!(message.UserIDs && message.UserIDs.length))
                        message.UserIDs = [];
                    message.UserIDs.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ReportUsersReq message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.ReportUsersReq} ReportUsersReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReportUsersReq.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReportUsersReq message.
         * @function verify
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReportUsersReq.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (message.UserIDs != null && message.hasOwnProperty("UserIDs")) {
                if (!Array.isArray(message.UserIDs))
                    return "UserIDs: array expected";
                for (var i = 0; i < message.UserIDs.length; ++i)
                    if (!$util.isString(message.UserIDs[i]))
                        return "UserIDs: string[] expected";
            }
            return null;
        };

        /**
         * Creates a ReportUsersReq message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.ReportUsersReq} ReportUsersReq
         */
        ReportUsersReq.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.ReportUsersReq)
                return object;
            var message = new $root.onlinesvr.ReportUsersReq();
            if (object.UserIDs) {
                if (!Array.isArray(object.UserIDs))
                    throw TypeError(".onlinesvr.ReportUsersReq.UserIDs: array expected");
                message.UserIDs = [];
                for (var i = 0; i < object.UserIDs.length; ++i)
                    message.UserIDs[i] = String(object.UserIDs[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a ReportUsersReq message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.ReportUsersReq
         * @static
         * @param {onlinesvr.ReportUsersReq} message ReportUsersReq
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReportUsersReq.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.UserIDs = [];
            if (message.UserIDs && message.UserIDs.length) {
                object.UserIDs = [];
                for (var j = 0; j < message.UserIDs.length; ++j)
                    object.UserIDs[j] = message.UserIDs[j];
            }
            return object;
        };

        /**
         * Converts this ReportUsersReq to JSON.
         * @function toJSON
         * @memberof onlinesvr.ReportUsersReq
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReportUsersReq.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ReportUsersReq;
    })();

    onlinesvr.ReportUsersRes = (function() {

        /**
         * Properties of a ReportUsersRes.
         * @memberof onlinesvr
         * @interface IReportUsersRes
         */

        /**
         * Constructs a new ReportUsersRes.
         * @memberof onlinesvr
         * @classdesc Represents a ReportUsersRes.
         * @implements IReportUsersRes
         * @constructor
         * @param {onlinesvr.IReportUsersRes=} [properties] Properties to set
         */
        function ReportUsersRes(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new ReportUsersRes instance using the specified properties.
         * @function create
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {onlinesvr.IReportUsersRes=} [properties] Properties to set
         * @returns {onlinesvr.ReportUsersRes} ReportUsersRes instance
         */
        ReportUsersRes.create = function create(properties) {
            return new ReportUsersRes(properties);
        };

        /**
         * Encodes the specified ReportUsersRes message. Does not implicitly {@link onlinesvr.ReportUsersRes.verify|verify} messages.
         * @function encode
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {onlinesvr.IReportUsersRes} message ReportUsersRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReportUsersRes.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            return writer;
        };

        /**
         * Encodes the specified ReportUsersRes message, length delimited. Does not implicitly {@link onlinesvr.ReportUsersRes.verify|verify} messages.
         * @function encodeDelimited
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {onlinesvr.IReportUsersRes} message ReportUsersRes message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReportUsersRes.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a ReportUsersRes message from the specified reader or buffer.
         * @function decode
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {onlinesvr.ReportUsersRes} ReportUsersRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReportUsersRes.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.onlinesvr.ReportUsersRes();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a ReportUsersRes message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {onlinesvr.ReportUsersRes} ReportUsersRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReportUsersRes.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReportUsersRes message.
         * @function verify
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReportUsersRes.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            return null;
        };

        /**
         * Creates a ReportUsersRes message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {onlinesvr.ReportUsersRes} ReportUsersRes
         */
        ReportUsersRes.fromObject = function fromObject(object) {
            if (object instanceof $root.onlinesvr.ReportUsersRes)
                return object;
            return new $root.onlinesvr.ReportUsersRes();
        };

        /**
         * Creates a plain object from a ReportUsersRes message. Also converts values to other types if specified.
         * @function toObject
         * @memberof onlinesvr.ReportUsersRes
         * @static
         * @param {onlinesvr.ReportUsersRes} message ReportUsersRes
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReportUsersRes.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this ReportUsersRes to JSON.
         * @function toJSON
         * @memberof onlinesvr.ReportUsersRes
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReportUsersRes.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return ReportUsersRes;
    })();

    return onlinesvr;
})();

module.exports = $root;
