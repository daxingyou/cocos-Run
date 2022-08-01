import * as $protobuf from "protobufjs";
/** Namespace comm. */
export namespace comm {

    /** Properties of a Request. */
    interface IRequest {

        /** Request Seq */
        Seq?: (number|Long|null);

        /** Request CMD */
        CMD?: (number|null);

        /** Request Msg */
        Msg?: (Uint8Array|null);
    }

    /** Represents a Request. */
    class Request implements IRequest {

        /**
         * Constructs a new Request.
         * @param [properties] Properties to set
         */
        constructor(properties?: comm.IRequest);

        /** Request Seq. */
        public Seq: (number|Long);

        /** Request CMD. */
        public CMD: number;

        /** Request Msg. */
        public Msg: Uint8Array;

        /**
         * Creates a new Request instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Request instance
         */
        public static create(properties?: comm.IRequest): comm.Request;

        /**
         * Encodes the specified Request message. Does not implicitly {@link comm.Request.verify|verify} messages.
         * @param message Request message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: comm.IRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Request message, length delimited. Does not implicitly {@link comm.Request.verify|verify} messages.
         * @param message Request message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: comm.IRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Request message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Request
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): comm.Request;

        /**
         * Decodes a Request message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Request
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): comm.Request;

        /**
         * Verifies a Request message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Request message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Request
         */
        public static fromObject(object: { [k: string]: any }): comm.Request;

        /**
         * Creates a plain object from a Request message. Also converts values to other types if specified.
         * @param message Request
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: comm.Request, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Request to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Response. */
    interface IResponse {

        /** Response Seq */
        Seq?: (number|Long|null);

        /** Response CMD */
        CMD?: (number|null);

        /** Response Msg */
        Msg?: (Uint8Array|null);

        /** Response Errcode */
        Errcode?: (number|null);

        /** Response Desc */
        Desc?: (string|null);

        /** Response Compressed */
        Compressed?: (boolean|null);
    }

    /** Represents a Response. */
    class Response implements IResponse {

        /**
         * Constructs a new Response.
         * @param [properties] Properties to set
         */
        constructor(properties?: comm.IResponse);

        /** Response Seq. */
        public Seq: (number|Long);

        /** Response CMD. */
        public CMD: number;

        /** Response Msg. */
        public Msg: Uint8Array;

        /** Response Errcode. */
        public Errcode: number;

        /** Response Desc. */
        public Desc: string;

        /** Response Compressed. */
        public Compressed: boolean;

        /**
         * Creates a new Response instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Response instance
         */
        public static create(properties?: comm.IResponse): comm.Response;

        /**
         * Encodes the specified Response message. Does not implicitly {@link comm.Response.verify|verify} messages.
         * @param message Response message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: comm.IResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Response message, length delimited. Does not implicitly {@link comm.Response.verify|verify} messages.
         * @param message Response message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: comm.IResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Response message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): comm.Response;

        /**
         * Decodes a Response message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Response
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): comm.Response;

        /**
         * Verifies a Response message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Response message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Response
         */
        public static fromObject(object: { [k: string]: any }): comm.Response;

        /**
         * Creates a plain object from a Response message. Also converts values to other types if specified.
         * @param message Response
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: comm.Response, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Response to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

/** Namespace data. */
export namespace data {

    /** Properties of an AccountData. */
    interface IAccountData {

        /** AccountData UserID */
        UserID?: (string|null);

        /** AccountData RegisterTime */
        RegisterTime?: (number|Long|null);

        /** AccountData LastLoginTime */
        LastLoginTime?: (number|Long|null);

        /** AccountData Name */
        Name?: (string|null);

        /** AccountData HeadID */
        HeadID?: (number|null);

        /** AccountData HeadFrameID */
        HeadFrameID?: (number|null);

        /** AccountData ChangeNameCounter */
        ChangeNameCounter?: (number|null);

        /** AccountData Exp */
        Exp?: (number|null);

        /** AccountData RealNameStatus */
        RealNameStatus?: (number|null);

        /** AccountData IsTeenager */
        IsTeenager?: (boolean|null);
    }

    /** Represents an AccountData. */
    class AccountData implements IAccountData {

        /**
         * Constructs a new AccountData.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IAccountData);

        /** AccountData UserID. */
        public UserID: string;

        /** AccountData RegisterTime. */
        public RegisterTime: (number|Long);

        /** AccountData LastLoginTime. */
        public LastLoginTime: (number|Long);

        /** AccountData Name. */
        public Name: string;

        /** AccountData HeadID. */
        public HeadID: number;

        /** AccountData HeadFrameID. */
        public HeadFrameID: number;

        /** AccountData ChangeNameCounter. */
        public ChangeNameCounter: number;

        /** AccountData Exp. */
        public Exp: number;

        /** AccountData RealNameStatus. */
        public RealNameStatus: number;

        /** AccountData IsTeenager. */
        public IsTeenager: boolean;

        /**
         * Creates a new AccountData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AccountData instance
         */
        public static create(properties?: data.IAccountData): data.AccountData;

        /**
         * Encodes the specified AccountData message. Does not implicitly {@link data.AccountData.verify|verify} messages.
         * @param message AccountData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IAccountData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AccountData message, length delimited. Does not implicitly {@link data.AccountData.verify|verify} messages.
         * @param message AccountData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IAccountData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AccountData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AccountData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.AccountData;

        /**
         * Decodes an AccountData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AccountData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.AccountData;

        /**
         * Verifies an AccountData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AccountData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AccountData
         */
        public static fromObject(object: { [k: string]: any }): data.AccountData;

        /**
         * Creates a plain object from an AccountData message. Also converts values to other types if specified.
         * @param message AccountData
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.AccountData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AccountData to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a Prize. */
    interface IPrize {

        /** Prize ID */
        ID?: (number|null);

        /** Prize Count */
        Count?: (number|Long|null);
    }

    /** Represents a Prize. */
    class Prize implements IPrize {

        /**
         * Constructs a new Prize.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IPrize);

        /** Prize ID. */
        public ID: number;

        /** Prize Count. */
        public Count: (number|Long);

        /**
         * Creates a new Prize instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Prize instance
         */
        public static create(properties?: data.IPrize): data.Prize;

        /**
         * Encodes the specified Prize message. Does not implicitly {@link data.Prize.verify|verify} messages.
         * @param message Prize message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IPrize, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Prize message, length delimited. Does not implicitly {@link data.Prize.verify|verify} messages.
         * @param message Prize message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IPrize, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Prize message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns Prize
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.Prize;

        /**
         * Decodes a Prize message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns Prize
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.Prize;

        /**
         * Verifies a Prize message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Prize message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Prize
         */
        public static fromObject(object: { [k: string]: any }): data.Prize;

        /**
         * Creates a plain object from a Prize message. Also converts values to other types if specified.
         * @param message Prize
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.Prize, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Prize to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HeroUnit. */
    interface IHeroUnit {

        /** HeroUnit Exp */
        Exp?: (number|null);

        /** HeroUnit Star */
        Star?: (number|null);

        /** HeroUnit Equips */
        Equips?: ({ [k: string]: data.IBagUnit }|null);
    }

    /** Represents a HeroUnit. */
    class HeroUnit implements IHeroUnit {

        /**
         * Constructs a new HeroUnit.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IHeroUnit);

        /** HeroUnit Exp. */
        public Exp: number;

        /** HeroUnit Star. */
        public Star: number;

        /** HeroUnit Equips. */
        public Equips: { [k: string]: data.IBagUnit };

        /**
         * Creates a new HeroUnit instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeroUnit instance
         */
        public static create(properties?: data.IHeroUnit): data.HeroUnit;

        /**
         * Encodes the specified HeroUnit message. Does not implicitly {@link data.HeroUnit.verify|verify} messages.
         * @param message HeroUnit message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IHeroUnit, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HeroUnit message, length delimited. Does not implicitly {@link data.HeroUnit.verify|verify} messages.
         * @param message HeroUnit message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IHeroUnit, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HeroUnit message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HeroUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.HeroUnit;

        /**
         * Decodes a HeroUnit message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HeroUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.HeroUnit;

        /**
         * Verifies a HeroUnit message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeroUnit message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeroUnit
         */
        public static fromObject(object: { [k: string]: any }): data.HeroUnit;

        /**
         * Creates a plain object from a HeroUnit message. Also converts values to other types if specified.
         * @param message HeroUnit
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.HeroUnit, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeroUnit to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an EquipUnit. */
    interface IEquipUnit {

        /** EquipUnit Exp */
        Exp?: (number|null);

        /** EquipUnit Star */
        Star?: (number|null);
    }

    /** Represents an EquipUnit. */
    class EquipUnit implements IEquipUnit {

        /**
         * Constructs a new EquipUnit.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IEquipUnit);

        /** EquipUnit Exp. */
        public Exp: number;

        /** EquipUnit Star. */
        public Star: number;

        /**
         * Creates a new EquipUnit instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EquipUnit instance
         */
        public static create(properties?: data.IEquipUnit): data.EquipUnit;

        /**
         * Encodes the specified EquipUnit message. Does not implicitly {@link data.EquipUnit.verify|verify} messages.
         * @param message EquipUnit message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IEquipUnit, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EquipUnit message, length delimited. Does not implicitly {@link data.EquipUnit.verify|verify} messages.
         * @param message EquipUnit message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IEquipUnit, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EquipUnit message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EquipUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.EquipUnit;

        /**
         * Decodes an EquipUnit message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EquipUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.EquipUnit;

        /**
         * Verifies an EquipUnit message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EquipUnit message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EquipUnit
         */
        public static fromObject(object: { [k: string]: any }): data.EquipUnit;

        /**
         * Creates a plain object from an EquipUnit message. Also converts values to other types if specified.
         * @param message EquipUnit
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.EquipUnit, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EquipUnit to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BagUnit. */
    interface IBagUnit {

        /** BagUnit Seq */
        Seq?: (number|Long|null);

        /** BagUnit ID */
        ID?: (number|null);

        /** BagUnit Count */
        Count?: (number|Long|null);

        /** BagUnit UpdateTime */
        UpdateTime?: (number|Long|null);

        /** BagUnit Combinable */
        Combinable?: (boolean|null);

        /** BagUnit HeroUnit */
        HeroUnit?: (data.IHeroUnit|null);

        /** BagUnit EquipUnit */
        EquipUnit?: (data.IEquipUnit|null);
    }

    /** Represents a BagUnit. */
    class BagUnit implements IBagUnit {

        /**
         * Constructs a new BagUnit.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IBagUnit);

        /** BagUnit Seq. */
        public Seq: (number|Long);

        /** BagUnit ID. */
        public ID: number;

        /** BagUnit Count. */
        public Count: (number|Long);

        /** BagUnit UpdateTime. */
        public UpdateTime: (number|Long);

        /** BagUnit Combinable. */
        public Combinable: boolean;

        /** BagUnit HeroUnit. */
        public HeroUnit?: (data.IHeroUnit|null);

        /** BagUnit EquipUnit. */
        public EquipUnit?: (data.IEquipUnit|null);

        /**
         * Creates a new BagUnit instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BagUnit instance
         */
        public static create(properties?: data.IBagUnit): data.BagUnit;

        /**
         * Encodes the specified BagUnit message. Does not implicitly {@link data.BagUnit.verify|verify} messages.
         * @param message BagUnit message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IBagUnit, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BagUnit message, length delimited. Does not implicitly {@link data.BagUnit.verify|verify} messages.
         * @param message BagUnit message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IBagUnit, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BagUnit message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BagUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.BagUnit;

        /**
         * Decodes a BagUnit message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BagUnit
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.BagUnit;

        /**
         * Verifies a BagUnit message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BagUnit message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BagUnit
         */
        public static fromObject(object: { [k: string]: any }): data.BagUnit;

        /**
         * Creates a plain object from a BagUnit message. Also converts values to other types if specified.
         * @param message BagUnit
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.BagUnit, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BagUnit to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BagItem. */
    interface IBagItem {

        /** BagItem Array */
        Array?: (data.IBagUnit[]|null);
    }

    /** Represents a BagItem. */
    class BagItem implements IBagItem {

        /**
         * Constructs a new BagItem.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IBagItem);

        /** BagItem Array. */
        public Array: data.IBagUnit[];

        /**
         * Creates a new BagItem instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BagItem instance
         */
        public static create(properties?: data.IBagItem): data.BagItem;

        /**
         * Encodes the specified BagItem message. Does not implicitly {@link data.BagItem.verify|verify} messages.
         * @param message BagItem message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IBagItem, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BagItem message, length delimited. Does not implicitly {@link data.BagItem.verify|verify} messages.
         * @param message BagItem message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IBagItem, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BagItem message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BagItem
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.BagItem;

        /**
         * Decodes a BagItem message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BagItem
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.BagItem;

        /**
         * Verifies a BagItem message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BagItem message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BagItem
         */
        public static fromObject(object: { [k: string]: any }): data.BagItem;

        /**
         * Creates a plain object from a BagItem message. Also converts values to other types if specified.
         * @param message BagItem
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.BagItem, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BagItem to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BagData. */
    interface IBagData {

        /** BagData Items */
        Items?: ({ [k: string]: data.IBagItem }|null);

        /** BagData SeqCounter */
        SeqCounter?: (number|Long|null);
    }

    /** Represents a BagData. */
    class BagData implements IBagData {

        /**
         * Constructs a new BagData.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IBagData);

        /** BagData Items. */
        public Items: { [k: string]: data.IBagItem };

        /** BagData SeqCounter. */
        public SeqCounter: (number|Long);

        /**
         * Creates a new BagData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BagData instance
         */
        public static create(properties?: data.IBagData): data.BagData;

        /**
         * Encodes the specified BagData message. Does not implicitly {@link data.BagData.verify|verify} messages.
         * @param message BagData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IBagData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BagData message, length delimited. Does not implicitly {@link data.BagData.verify|verify} messages.
         * @param message BagData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IBagData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BagData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BagData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.BagData;

        /**
         * Decodes a BagData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BagData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.BagData;

        /**
         * Verifies a BagData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BagData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BagData
         */
        public static fromObject(object: { [k: string]: any }): data.BagData;

        /**
         * Creates a plain object from a BagData message. Also converts values to other types if specified.
         * @param message BagData
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.BagData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BagData to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a LessonRecord. */
    interface ILessonRecord {

        /** LessonRecord Past */
        Past?: (boolean|null);

        /** LessonRecord Heroes */
        Heroes?: (number[]|null);
    }

    /** Represents a LessonRecord. */
    class LessonRecord implements ILessonRecord {

        /**
         * Constructs a new LessonRecord.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.ILessonRecord);

        /** LessonRecord Past. */
        public Past: boolean;

        /** LessonRecord Heroes. */
        public Heroes: number[];

        /**
         * Creates a new LessonRecord instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LessonRecord instance
         */
        public static create(properties?: data.ILessonRecord): data.LessonRecord;

        /**
         * Encodes the specified LessonRecord message. Does not implicitly {@link data.LessonRecord.verify|verify} messages.
         * @param message LessonRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.ILessonRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LessonRecord message, length delimited. Does not implicitly {@link data.LessonRecord.verify|verify} messages.
         * @param message LessonRecord message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.ILessonRecord, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LessonRecord message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LessonRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.LessonRecord;

        /**
         * Decodes a LessonRecord message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LessonRecord
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.LessonRecord;

        /**
         * Verifies a LessonRecord message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LessonRecord message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LessonRecord
         */
        public static fromObject(object: { [k: string]: any }): data.LessonRecord;

        /**
         * Creates a plain object from a LessonRecord message. Also converts values to other types if specified.
         * @param message LessonRecord
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.LessonRecord, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LessonRecord to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PVEData. */
    interface IPVEData {

        /** PVEData LessonRecords */
        LessonRecords?: ({ [k: string]: data.ILessonRecord }|null);
    }

    /** Represents a PVEData. */
    class PVEData implements IPVEData {

        /**
         * Constructs a new PVEData.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IPVEData);

        /** PVEData LessonRecords. */
        public LessonRecords: { [k: string]: data.ILessonRecord };

        /**
         * Creates a new PVEData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PVEData instance
         */
        public static create(properties?: data.IPVEData): data.PVEData;

        /**
         * Encodes the specified PVEData message. Does not implicitly {@link data.PVEData.verify|verify} messages.
         * @param message PVEData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IPVEData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PVEData message, length delimited. Does not implicitly {@link data.PVEData.verify|verify} messages.
         * @param message PVEData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IPVEData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PVEData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PVEData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.PVEData;

        /**
         * Decodes a PVEData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PVEData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.PVEData;

        /**
         * Verifies a PVEData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PVEData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PVEData
         */
        public static fromObject(object: { [k: string]: any }): data.PVEData;

        /**
         * Creates a plain object from a PVEData message. Also converts values to other types if specified.
         * @param message PVEData
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.PVEData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PVEData to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RankUser. */
    interface IRankUser {

        /** RankUser UserID */
        UserID?: (string|null);

        /** RankUser Name */
        Name?: (string|null);

        /** RankUser HeadID */
        HeadID?: (number|null);
    }

    /** Represents a RankUser. */
    class RankUser implements IRankUser {

        /**
         * Constructs a new RankUser.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IRankUser);

        /** RankUser UserID. */
        public UserID: string;

        /** RankUser Name. */
        public Name: string;

        /** RankUser HeadID. */
        public HeadID: number;

        /**
         * Creates a new RankUser instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RankUser instance
         */
        public static create(properties?: data.IRankUser): data.RankUser;

        /**
         * Encodes the specified RankUser message. Does not implicitly {@link data.RankUser.verify|verify} messages.
         * @param message RankUser message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IRankUser, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RankUser message, length delimited. Does not implicitly {@link data.RankUser.verify|verify} messages.
         * @param message RankUser message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IRankUser, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RankUser message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RankUser
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.RankUser;

        /**
         * Decodes a RankUser message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RankUser
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.RankUser;

        /**
         * Verifies a RankUser message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RankUser message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RankUser
         */
        public static fromObject(object: { [k: string]: any }): data.RankUser;

        /**
         * Creates a plain object from a RankUser message. Also converts values to other types if specified.
         * @param message RankUser
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.RankUser, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RankUser to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a StageRank. */
    interface IStageRank {

        /** StageRank User */
        User?: (data.IRankUser|null);

        /** StageRank Score */
        Score?: (number|null);

        /** StageRank StageID */
        StageID?: (number|null);

        /** StageRank Level */
        Level?: (number|null);

        /** StageRank HeroID */
        HeroID?: (number|null);
    }

    /** Represents a StageRank. */
    class StageRank implements IStageRank {

        /**
         * Constructs a new StageRank.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IStageRank);

        /** StageRank User. */
        public User?: (data.IRankUser|null);

        /** StageRank Score. */
        public Score: number;

        /** StageRank StageID. */
        public StageID: number;

        /** StageRank Level. */
        public Level: number;

        /** StageRank HeroID. */
        public HeroID: number;

        /**
         * Creates a new StageRank instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StageRank instance
         */
        public static create(properties?: data.IStageRank): data.StageRank;

        /**
         * Encodes the specified StageRank message. Does not implicitly {@link data.StageRank.verify|verify} messages.
         * @param message StageRank message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IStageRank, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StageRank message, length delimited. Does not implicitly {@link data.StageRank.verify|verify} messages.
         * @param message StageRank message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IStageRank, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StageRank message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StageRank
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.StageRank;

        /**
         * Decodes a StageRank message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StageRank
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.StageRank;

        /**
         * Verifies a StageRank message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StageRank message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StageRank
         */
        public static fromObject(object: { [k: string]: any }): data.StageRank;

        /**
         * Creates a plain object from a StageRank message. Also converts values to other types if specified.
         * @param message StageRank
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.StageRank, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StageRank to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a StageRankList. */
    interface IStageRankList {

        /** StageRankList Entries */
        Entries?: (data.IStageRank[]|null);
    }

    /** Represents a StageRankList. */
    class StageRankList implements IStageRankList {

        /**
         * Constructs a new StageRankList.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IStageRankList);

        /** StageRankList Entries. */
        public Entries: data.IStageRank[];

        /**
         * Creates a new StageRankList instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StageRankList instance
         */
        public static create(properties?: data.IStageRankList): data.StageRankList;

        /**
         * Encodes the specified StageRankList message. Does not implicitly {@link data.StageRankList.verify|verify} messages.
         * @param message StageRankList message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IStageRankList, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StageRankList message, length delimited. Does not implicitly {@link data.StageRankList.verify|verify} messages.
         * @param message StageRankList message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IStageRankList, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StageRankList message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StageRankList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.StageRankList;

        /**
         * Decodes a StageRankList message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StageRankList
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.StageRankList;

        /**
         * Verifies a StageRankList message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StageRankList message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StageRankList
         */
        public static fromObject(object: { [k: string]: any }): data.StageRankList;

        /**
         * Creates a plain object from a StageRankList message. Also converts values to other types if specified.
         * @param message StageRankList
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.StageRankList, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StageRankList to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RankData. */
    interface IRankData {

        /** RankData RankLists */
        RankLists?: ({ [k: string]: data.IStageRankList }|null);
    }

    /** Represents a RankData. */
    class RankData implements IRankData {

        /**
         * Constructs a new RankData.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IRankData);

        /** RankData RankLists. */
        public RankLists: { [k: string]: data.IStageRankList };

        /**
         * Creates a new RankData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RankData instance
         */
        public static create(properties?: data.IRankData): data.RankData;

        /**
         * Encodes the specified RankData message. Does not implicitly {@link data.RankData.verify|verify} messages.
         * @param message RankData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IRankData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RankData message, length delimited. Does not implicitly {@link data.RankData.verify|verify} messages.
         * @param message RankData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IRankData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RankData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RankData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.RankData;

        /**
         * Decodes a RankData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RankData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.RankData;

        /**
         * Verifies a RankData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RankData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RankData
         */
        public static fromObject(object: { [k: string]: any }): data.RankData;

        /**
         * Creates a plain object from a RankData message. Also converts values to other types if specified.
         * @param message RankData
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.RankData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RankData to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a UserData. */
    interface IUserData {

        /** UserData Version */
        Version?: (number|null);

        /** UserData FromDBTime */
        FromDBTime?: (number|Long|null);

        /** UserData AccountData */
        AccountData?: (data.IAccountData|null);

        /** UserData BagData */
        BagData?: (data.IBagData|null);

        /** UserData PVEData */
        PVEData?: (data.IPVEData|null);
    }

    /** Represents a UserData. */
    class UserData implements IUserData {

        /**
         * Constructs a new UserData.
         * @param [properties] Properties to set
         */
        constructor(properties?: data.IUserData);

        /** UserData Version. */
        public Version: number;

        /** UserData FromDBTime. */
        public FromDBTime: (number|Long);

        /** UserData AccountData. */
        public AccountData?: (data.IAccountData|null);

        /** UserData BagData. */
        public BagData?: (data.IBagData|null);

        /** UserData PVEData. */
        public PVEData?: (data.IPVEData|null);

        /**
         * Creates a new UserData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UserData instance
         */
        public static create(properties?: data.IUserData): data.UserData;

        /**
         * Encodes the specified UserData message. Does not implicitly {@link data.UserData.verify|verify} messages.
         * @param message UserData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: data.IUserData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UserData message, length delimited. Does not implicitly {@link data.UserData.verify|verify} messages.
         * @param message UserData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: data.IUserData, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a UserData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UserData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): data.UserData;

        /**
         * Decodes a UserData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UserData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): data.UserData;

        /**
         * Verifies a UserData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a UserData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UserData
         */
        public static fromObject(object: { [k: string]: any }): data.UserData;

        /**
         * Creates a plain object from a UserData message. Also converts values to other types if specified.
         * @param message UserData
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: data.UserData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UserData to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

/** Namespace evidencesvr. */
export namespace evidencesvr {

    /** CMD enum. */
    enum CMD {
        INVALID = 0,
        CHECK_ACCOUNT_REQ = 1,
        CHECK_ACCOUNT_RES = 2
    }

    /** AccountType enum. */
    enum AccountType {
        AT_SELF = 0
    }

    /** Properties of a CheckAccountReq. */
    interface ICheckAccountReq {

        /** CheckAccountReq AccountType */
        AccountType?: (evidencesvr.AccountType|null);

        /** CheckAccountReq Account */
        Account?: (string|null);

        /** CheckAccountReq Password */
        Password?: (string|null);
    }

    /** Represents a CheckAccountReq. */
    class CheckAccountReq implements ICheckAccountReq {

        /**
         * Constructs a new CheckAccountReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: evidencesvr.ICheckAccountReq);

        /** CheckAccountReq AccountType. */
        public AccountType: evidencesvr.AccountType;

        /** CheckAccountReq Account. */
        public Account: string;

        /** CheckAccountReq Password. */
        public Password: string;

        /**
         * Creates a new CheckAccountReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CheckAccountReq instance
         */
        public static create(properties?: evidencesvr.ICheckAccountReq): evidencesvr.CheckAccountReq;

        /**
         * Encodes the specified CheckAccountReq message. Does not implicitly {@link evidencesvr.CheckAccountReq.verify|verify} messages.
         * @param message CheckAccountReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: evidencesvr.ICheckAccountReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CheckAccountReq message, length delimited. Does not implicitly {@link evidencesvr.CheckAccountReq.verify|verify} messages.
         * @param message CheckAccountReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: evidencesvr.ICheckAccountReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CheckAccountReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CheckAccountReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): evidencesvr.CheckAccountReq;

        /**
         * Decodes a CheckAccountReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CheckAccountReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): evidencesvr.CheckAccountReq;

        /**
         * Verifies a CheckAccountReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CheckAccountReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CheckAccountReq
         */
        public static fromObject(object: { [k: string]: any }): evidencesvr.CheckAccountReq;

        /**
         * Creates a plain object from a CheckAccountReq message. Also converts values to other types if specified.
         * @param message CheckAccountReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: evidencesvr.CheckAccountReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CheckAccountReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a CheckAccountRes. */
    interface ICheckAccountRes {

        /** CheckAccountRes UserID */
        UserID?: (string|null);

        /** CheckAccountRes TokenTime */
        TokenTime?: (number|Long|null);

        /** CheckAccountRes TokenRandom */
        TokenRandom?: (number|null);

        /** CheckAccountRes Token */
        Token?: (string|null);
    }

    /** Represents a CheckAccountRes. */
    class CheckAccountRes implements ICheckAccountRes {

        /**
         * Constructs a new CheckAccountRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: evidencesvr.ICheckAccountRes);

        /** CheckAccountRes UserID. */
        public UserID: string;

        /** CheckAccountRes TokenTime. */
        public TokenTime: (number|Long);

        /** CheckAccountRes TokenRandom. */
        public TokenRandom: number;

        /** CheckAccountRes Token. */
        public Token: string;

        /**
         * Creates a new CheckAccountRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CheckAccountRes instance
         */
        public static create(properties?: evidencesvr.ICheckAccountRes): evidencesvr.CheckAccountRes;

        /**
         * Encodes the specified CheckAccountRes message. Does not implicitly {@link evidencesvr.CheckAccountRes.verify|verify} messages.
         * @param message CheckAccountRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: evidencesvr.ICheckAccountRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CheckAccountRes message, length delimited. Does not implicitly {@link evidencesvr.CheckAccountRes.verify|verify} messages.
         * @param message CheckAccountRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: evidencesvr.ICheckAccountRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CheckAccountRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns CheckAccountRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): evidencesvr.CheckAccountRes;

        /**
         * Decodes a CheckAccountRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns CheckAccountRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): evidencesvr.CheckAccountRes;

        /**
         * Verifies a CheckAccountRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CheckAccountRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CheckAccountRes
         */
        public static fromObject(object: { [k: string]: any }): evidencesvr.CheckAccountRes;

        /**
         * Creates a plain object from a CheckAccountRes message. Also converts values to other types if specified.
         * @param message CheckAccountRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: evidencesvr.CheckAccountRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CheckAccountRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}

/** Namespace gamesvr. */
export namespace gamesvr {

    /** Properties of a GetItemReq. */
    interface IGetItemReq {

        /** GetItemReq ID */
        ID?: (number|null);

        /** GetItemReq Count */
        Count?: (number|Long|null);
    }

    /** Represents a GetItemReq. */
    class GetItemReq implements IGetItemReq {

        /**
         * Constructs a new GetItemReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IGetItemReq);

        /** GetItemReq ID. */
        public ID: number;

        /** GetItemReq Count. */
        public Count: (number|Long);

        /**
         * Creates a new GetItemReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetItemReq instance
         */
        public static create(properties?: gamesvr.IGetItemReq): gamesvr.GetItemReq;

        /**
         * Encodes the specified GetItemReq message. Does not implicitly {@link gamesvr.GetItemReq.verify|verify} messages.
         * @param message GetItemReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IGetItemReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetItemReq message, length delimited. Does not implicitly {@link gamesvr.GetItemReq.verify|verify} messages.
         * @param message GetItemReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IGetItemReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetItemReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetItemReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.GetItemReq;

        /**
         * Decodes a GetItemReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetItemReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.GetItemReq;

        /**
         * Verifies a GetItemReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetItemReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetItemReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.GetItemReq;

        /**
         * Creates a plain object from a GetItemReq message. Also converts values to other types if specified.
         * @param message GetItemReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.GetItemReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetItemReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GetItemRes. */
    interface IGetItemRes {
    }

    /** Represents a GetItemRes. */
    class GetItemRes implements IGetItemRes {

        /**
         * Constructs a new GetItemRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IGetItemRes);

        /**
         * Creates a new GetItemRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetItemRes instance
         */
        public static create(properties?: gamesvr.IGetItemRes): gamesvr.GetItemRes;

        /**
         * Encodes the specified GetItemRes message. Does not implicitly {@link gamesvr.GetItemRes.verify|verify} messages.
         * @param message GetItemRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IGetItemRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetItemRes message, length delimited. Does not implicitly {@link gamesvr.GetItemRes.verify|verify} messages.
         * @param message GetItemRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IGetItemRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetItemRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetItemRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.GetItemRes;

        /**
         * Decodes a GetItemRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetItemRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.GetItemRes;

        /**
         * Verifies a GetItemRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetItemRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetItemRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.GetItemRes;

        /**
         * Creates a plain object from a GetItemRes message. Also converts values to other types if specified.
         * @param message GetItemRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.GetItemRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetItemRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an ItemChangeNotify. */
    interface IItemChangeNotify {

        /** ItemChangeNotify Units */
        Units?: (data.IBagUnit[]|null);
    }

    /** Represents an ItemChangeNotify. */
    class ItemChangeNotify implements IItemChangeNotify {

        /**
         * Constructs a new ItemChangeNotify.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IItemChangeNotify);

        /** ItemChangeNotify Units. */
        public Units: data.IBagUnit[];

        /**
         * Creates a new ItemChangeNotify instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ItemChangeNotify instance
         */
        public static create(properties?: gamesvr.IItemChangeNotify): gamesvr.ItemChangeNotify;

        /**
         * Encodes the specified ItemChangeNotify message. Does not implicitly {@link gamesvr.ItemChangeNotify.verify|verify} messages.
         * @param message ItemChangeNotify message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IItemChangeNotify, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ItemChangeNotify message, length delimited. Does not implicitly {@link gamesvr.ItemChangeNotify.verify|verify} messages.
         * @param message ItemChangeNotify message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IItemChangeNotify, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ItemChangeNotify message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ItemChangeNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ItemChangeNotify;

        /**
         * Decodes an ItemChangeNotify message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ItemChangeNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ItemChangeNotify;

        /**
         * Verifies an ItemChangeNotify message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ItemChangeNotify message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ItemChangeNotify
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ItemChangeNotify;

        /**
         * Creates a plain object from an ItemChangeNotify message. Also converts values to other types if specified.
         * @param message ItemChangeNotify
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ItemChangeNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ItemChangeNotify to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a LoginReq. */
    interface ILoginReq {

        /** LoginReq UserID */
        UserID?: (string|null);

        /** LoginReq Channel */
        Channel?: (number|null);

        /** LoginReq TokenTime */
        TokenTime?: (number|Long|null);

        /** LoginReq TokenRandom */
        TokenRandom?: (number|null);

        /** LoginReq Token */
        Token?: (string|null);
    }

    /** Represents a LoginReq. */
    class LoginReq implements ILoginReq {

        /**
         * Constructs a new LoginReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.ILoginReq);

        /** LoginReq UserID. */
        public UserID: string;

        /** LoginReq Channel. */
        public Channel: number;

        /** LoginReq TokenTime. */
        public TokenTime: (number|Long);

        /** LoginReq TokenRandom. */
        public TokenRandom: number;

        /** LoginReq Token. */
        public Token: string;

        /**
         * Creates a new LoginReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LoginReq instance
         */
        public static create(properties?: gamesvr.ILoginReq): gamesvr.LoginReq;

        /**
         * Encodes the specified LoginReq message. Does not implicitly {@link gamesvr.LoginReq.verify|verify} messages.
         * @param message LoginReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.ILoginReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LoginReq message, length delimited. Does not implicitly {@link gamesvr.LoginReq.verify|verify} messages.
         * @param message LoginReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.ILoginReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LoginReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LoginReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.LoginReq;

        /**
         * Decodes a LoginReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LoginReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.LoginReq;

        /**
         * Verifies a LoginReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LoginReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LoginReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.LoginReq;

        /**
         * Creates a plain object from a LoginReq message. Also converts values to other types if specified.
         * @param message LoginReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.LoginReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LoginReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a LoginRes. */
    interface ILoginRes {

        /** LoginRes UserData */
        UserData?: (data.IUserData|null);

        /** LoginRes ServerTime */
        ServerTime?: (number|Long|null);
    }

    /** Represents a LoginRes. */
    class LoginRes implements ILoginRes {

        /**
         * Constructs a new LoginRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.ILoginRes);

        /** LoginRes UserData. */
        public UserData?: (data.IUserData|null);

        /** LoginRes ServerTime. */
        public ServerTime: (number|Long);

        /**
         * Creates a new LoginRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LoginRes instance
         */
        public static create(properties?: gamesvr.ILoginRes): gamesvr.LoginRes;

        /**
         * Encodes the specified LoginRes message. Does not implicitly {@link gamesvr.LoginRes.verify|verify} messages.
         * @param message LoginRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.ILoginRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LoginRes message, length delimited. Does not implicitly {@link gamesvr.LoginRes.verify|verify} messages.
         * @param message LoginRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.ILoginRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LoginRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LoginRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.LoginRes;

        /**
         * Decodes a LoginRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LoginRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.LoginRes;

        /**
         * Verifies a LoginRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LoginRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LoginRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.LoginRes;

        /**
         * Creates a plain object from a LoginRes message. Also converts values to other types if specified.
         * @param message LoginRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.LoginRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LoginRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HeartBeatReq. */
    interface IHeartBeatReq {
    }

    /** Represents a HeartBeatReq. */
    class HeartBeatReq implements IHeartBeatReq {

        /**
         * Constructs a new HeartBeatReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IHeartBeatReq);

        /**
         * Creates a new HeartBeatReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeartBeatReq instance
         */
        public static create(properties?: gamesvr.IHeartBeatReq): gamesvr.HeartBeatReq;

        /**
         * Encodes the specified HeartBeatReq message. Does not implicitly {@link gamesvr.HeartBeatReq.verify|verify} messages.
         * @param message HeartBeatReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IHeartBeatReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HeartBeatReq message, length delimited. Does not implicitly {@link gamesvr.HeartBeatReq.verify|verify} messages.
         * @param message HeartBeatReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IHeartBeatReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HeartBeatReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HeartBeatReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.HeartBeatReq;

        /**
         * Decodes a HeartBeatReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HeartBeatReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.HeartBeatReq;

        /**
         * Verifies a HeartBeatReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeartBeatReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeartBeatReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.HeartBeatReq;

        /**
         * Creates a plain object from a HeartBeatReq message. Also converts values to other types if specified.
         * @param message HeartBeatReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.HeartBeatReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeartBeatReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HeartBeatRes. */
    interface IHeartBeatRes {

        /** HeartBeatRes ServerTime */
        ServerTime?: (number|Long|null);
    }

    /** Represents a HeartBeatRes. */
    class HeartBeatRes implements IHeartBeatRes {

        /**
         * Constructs a new HeartBeatRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IHeartBeatRes);

        /** HeartBeatRes ServerTime. */
        public ServerTime: (number|Long);

        /**
         * Creates a new HeartBeatRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeartBeatRes instance
         */
        public static create(properties?: gamesvr.IHeartBeatRes): gamesvr.HeartBeatRes;

        /**
         * Encodes the specified HeartBeatRes message. Does not implicitly {@link gamesvr.HeartBeatRes.verify|verify} messages.
         * @param message HeartBeatRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IHeartBeatRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HeartBeatRes message, length delimited. Does not implicitly {@link gamesvr.HeartBeatRes.verify|verify} messages.
         * @param message HeartBeatRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IHeartBeatRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HeartBeatRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HeartBeatRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.HeartBeatRes;

        /**
         * Decodes a HeartBeatRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HeartBeatRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.HeartBeatRes;

        /**
         * Verifies a HeartBeatRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeartBeatRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeartBeatRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.HeartBeatRes;

        /**
         * Creates a plain object from a HeartBeatRes message. Also converts values to other types if specified.
         * @param message HeartBeatRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.HeartBeatRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeartBeatRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChangeNameReq. */
    interface IChangeNameReq {

        /** ChangeNameReq Name */
        Name?: (string|null);
    }

    /** Represents a ChangeNameReq. */
    class ChangeNameReq implements IChangeNameReq {

        /**
         * Constructs a new ChangeNameReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IChangeNameReq);

        /** ChangeNameReq Name. */
        public Name: string;

        /**
         * Creates a new ChangeNameReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChangeNameReq instance
         */
        public static create(properties?: gamesvr.IChangeNameReq): gamesvr.ChangeNameReq;

        /**
         * Encodes the specified ChangeNameReq message. Does not implicitly {@link gamesvr.ChangeNameReq.verify|verify} messages.
         * @param message ChangeNameReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IChangeNameReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChangeNameReq message, length delimited. Does not implicitly {@link gamesvr.ChangeNameReq.verify|verify} messages.
         * @param message ChangeNameReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IChangeNameReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChangeNameReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChangeNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ChangeNameReq;

        /**
         * Decodes a ChangeNameReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChangeNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ChangeNameReq;

        /**
         * Verifies a ChangeNameReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChangeNameReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChangeNameReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ChangeNameReq;

        /**
         * Creates a plain object from a ChangeNameReq message. Also converts values to other types if specified.
         * @param message ChangeNameReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ChangeNameReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChangeNameReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChangeNameRes. */
    interface IChangeNameRes {

        /** ChangeNameRes Name */
        Name?: (string|null);
    }

    /** Represents a ChangeNameRes. */
    class ChangeNameRes implements IChangeNameRes {

        /**
         * Constructs a new ChangeNameRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IChangeNameRes);

        /** ChangeNameRes Name. */
        public Name: string;

        /**
         * Creates a new ChangeNameRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChangeNameRes instance
         */
        public static create(properties?: gamesvr.IChangeNameRes): gamesvr.ChangeNameRes;

        /**
         * Encodes the specified ChangeNameRes message. Does not implicitly {@link gamesvr.ChangeNameRes.verify|verify} messages.
         * @param message ChangeNameRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IChangeNameRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChangeNameRes message, length delimited. Does not implicitly {@link gamesvr.ChangeNameRes.verify|verify} messages.
         * @param message ChangeNameRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IChangeNameRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChangeNameRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChangeNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ChangeNameRes;

        /**
         * Decodes a ChangeNameRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChangeNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ChangeNameRes;

        /**
         * Verifies a ChangeNameRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChangeNameRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChangeNameRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ChangeNameRes;

        /**
         * Creates a plain object from a ChangeNameRes message. Also converts values to other types if specified.
         * @param message ChangeNameRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ChangeNameRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChangeNameRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChangeHeadReq. */
    interface IChangeHeadReq {

        /** ChangeHeadReq HeadID */
        HeadID?: (number|null);

        /** ChangeHeadReq HeadFrameID */
        HeadFrameID?: (number|null);
    }

    /** Represents a ChangeHeadReq. */
    class ChangeHeadReq implements IChangeHeadReq {

        /**
         * Constructs a new ChangeHeadReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IChangeHeadReq);

        /** ChangeHeadReq HeadID. */
        public HeadID: number;

        /** ChangeHeadReq HeadFrameID. */
        public HeadFrameID: number;

        /**
         * Creates a new ChangeHeadReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChangeHeadReq instance
         */
        public static create(properties?: gamesvr.IChangeHeadReq): gamesvr.ChangeHeadReq;

        /**
         * Encodes the specified ChangeHeadReq message. Does not implicitly {@link gamesvr.ChangeHeadReq.verify|verify} messages.
         * @param message ChangeHeadReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IChangeHeadReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChangeHeadReq message, length delimited. Does not implicitly {@link gamesvr.ChangeHeadReq.verify|verify} messages.
         * @param message ChangeHeadReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IChangeHeadReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChangeHeadReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChangeHeadReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ChangeHeadReq;

        /**
         * Decodes a ChangeHeadReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChangeHeadReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ChangeHeadReq;

        /**
         * Verifies a ChangeHeadReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChangeHeadReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChangeHeadReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ChangeHeadReq;

        /**
         * Creates a plain object from a ChangeHeadReq message. Also converts values to other types if specified.
         * @param message ChangeHeadReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ChangeHeadReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChangeHeadReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ChangeHeadRes. */
    interface IChangeHeadRes {

        /** ChangeHeadRes HeadID */
        HeadID?: (number|null);

        /** ChangeHeadRes HeadFrameID */
        HeadFrameID?: (number|null);
    }

    /** Represents a ChangeHeadRes. */
    class ChangeHeadRes implements IChangeHeadRes {

        /**
         * Constructs a new ChangeHeadRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IChangeHeadRes);

        /** ChangeHeadRes HeadID. */
        public HeadID: number;

        /** ChangeHeadRes HeadFrameID. */
        public HeadFrameID: number;

        /**
         * Creates a new ChangeHeadRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ChangeHeadRes instance
         */
        public static create(properties?: gamesvr.IChangeHeadRes): gamesvr.ChangeHeadRes;

        /**
         * Encodes the specified ChangeHeadRes message. Does not implicitly {@link gamesvr.ChangeHeadRes.verify|verify} messages.
         * @param message ChangeHeadRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IChangeHeadRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ChangeHeadRes message, length delimited. Does not implicitly {@link gamesvr.ChangeHeadRes.verify|verify} messages.
         * @param message ChangeHeadRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IChangeHeadRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ChangeHeadRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ChangeHeadRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ChangeHeadRes;

        /**
         * Decodes a ChangeHeadRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ChangeHeadRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ChangeHeadRes;

        /**
         * Verifies a ChangeHeadRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ChangeHeadRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ChangeHeadRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ChangeHeadRes;

        /**
         * Creates a plain object from a ChangeHeadRes message. Also converts values to other types if specified.
         * @param message ChangeHeadRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ChangeHeadRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ChangeHeadRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RandomNameReq. */
    interface IRandomNameReq {
    }

    /** Represents a RandomNameReq. */
    class RandomNameReq implements IRandomNameReq {

        /**
         * Constructs a new RandomNameReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IRandomNameReq);

        /**
         * Creates a new RandomNameReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RandomNameReq instance
         */
        public static create(properties?: gamesvr.IRandomNameReq): gamesvr.RandomNameReq;

        /**
         * Encodes the specified RandomNameReq message. Does not implicitly {@link gamesvr.RandomNameReq.verify|verify} messages.
         * @param message RandomNameReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IRandomNameReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RandomNameReq message, length delimited. Does not implicitly {@link gamesvr.RandomNameReq.verify|verify} messages.
         * @param message RandomNameReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IRandomNameReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RandomNameReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RandomNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.RandomNameReq;

        /**
         * Decodes a RandomNameReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RandomNameReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.RandomNameReq;

        /**
         * Verifies a RandomNameReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RandomNameReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RandomNameReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.RandomNameReq;

        /**
         * Creates a plain object from a RandomNameReq message. Also converts values to other types if specified.
         * @param message RandomNameReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.RandomNameReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RandomNameReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RandomNameRes. */
    interface IRandomNameRes {

        /** RandomNameRes Name */
        Name?: (string|null);
    }

    /** Represents a RandomNameRes. */
    class RandomNameRes implements IRandomNameRes {

        /**
         * Constructs a new RandomNameRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IRandomNameRes);

        /** RandomNameRes Name. */
        public Name: string;

        /**
         * Creates a new RandomNameRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RandomNameRes instance
         */
        public static create(properties?: gamesvr.IRandomNameRes): gamesvr.RandomNameRes;

        /**
         * Encodes the specified RandomNameRes message. Does not implicitly {@link gamesvr.RandomNameRes.verify|verify} messages.
         * @param message RandomNameRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IRandomNameRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RandomNameRes message, length delimited. Does not implicitly {@link gamesvr.RandomNameRes.verify|verify} messages.
         * @param message RandomNameRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IRandomNameRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RandomNameRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RandomNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.RandomNameRes;

        /**
         * Decodes a RandomNameRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RandomNameRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.RandomNameRes;

        /**
         * Verifies a RandomNameRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RandomNameRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RandomNameRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.RandomNameRes;

        /**
         * Creates a plain object from a RandomNameRes message. Also converts values to other types if specified.
         * @param message RandomNameRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.RandomNameRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RandomNameRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a DiffLoginNotify. */
    interface IDiffLoginNotify {
    }

    /** Represents a DiffLoginNotify. */
    class DiffLoginNotify implements IDiffLoginNotify {

        /**
         * Constructs a new DiffLoginNotify.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IDiffLoginNotify);

        /**
         * Creates a new DiffLoginNotify instance using the specified properties.
         * @param [properties] Properties to set
         * @returns DiffLoginNotify instance
         */
        public static create(properties?: gamesvr.IDiffLoginNotify): gamesvr.DiffLoginNotify;

        /**
         * Encodes the specified DiffLoginNotify message. Does not implicitly {@link gamesvr.DiffLoginNotify.verify|verify} messages.
         * @param message DiffLoginNotify message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IDiffLoginNotify, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified DiffLoginNotify message, length delimited. Does not implicitly {@link gamesvr.DiffLoginNotify.verify|verify} messages.
         * @param message DiffLoginNotify message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IDiffLoginNotify, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a DiffLoginNotify message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns DiffLoginNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.DiffLoginNotify;

        /**
         * Decodes a DiffLoginNotify message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns DiffLoginNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.DiffLoginNotify;

        /**
         * Verifies a DiffLoginNotify message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a DiffLoginNotify message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns DiffLoginNotify
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.DiffLoginNotify;

        /**
         * Creates a plain object from a DiffLoginNotify message. Also converts values to other types if specified.
         * @param message DiffLoginNotify
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.DiffLoginNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this DiffLoginNotify to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a PveReport. */
    interface IPveReport {

        /** PveReport Heroes */
        Heroes?: (number[]|null);

        /** PveReport GainGold */
        GainGold?: (number|null);
    }

    /** Represents a PveReport. */
    class PveReport implements IPveReport {

        /**
         * Constructs a new PveReport.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IPveReport);

        /** PveReport Heroes. */
        public Heroes: number[];

        /** PveReport GainGold. */
        public GainGold: number;

        /**
         * Creates a new PveReport instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PveReport instance
         */
        public static create(properties?: gamesvr.IPveReport): gamesvr.PveReport;

        /**
         * Encodes the specified PveReport message. Does not implicitly {@link gamesvr.PveReport.verify|verify} messages.
         * @param message PveReport message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IPveReport, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PveReport message, length delimited. Does not implicitly {@link gamesvr.PveReport.verify|verify} messages.
         * @param message PveReport message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IPveReport, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PveReport message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PveReport
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.PveReport;

        /**
         * Decodes a PveReport message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PveReport
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.PveReport;

        /**
         * Verifies a PveReport message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PveReport message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PveReport
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.PveReport;

        /**
         * Creates a plain object from a PveReport message. Also converts values to other types if specified.
         * @param message PveReport
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.PveReport, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PveReport to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an EnterPveReq. */
    interface IEnterPveReq {

        /** EnterPveReq LessonID */
        LessonID?: (number|null);
    }

    /** Represents an EnterPveReq. */
    class EnterPveReq implements IEnterPveReq {

        /**
         * Constructs a new EnterPveReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IEnterPveReq);

        /** EnterPveReq LessonID. */
        public LessonID: number;

        /**
         * Creates a new EnterPveReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnterPveReq instance
         */
        public static create(properties?: gamesvr.IEnterPveReq): gamesvr.EnterPveReq;

        /**
         * Encodes the specified EnterPveReq message. Does not implicitly {@link gamesvr.EnterPveReq.verify|verify} messages.
         * @param message EnterPveReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IEnterPveReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnterPveReq message, length delimited. Does not implicitly {@link gamesvr.EnterPveReq.verify|verify} messages.
         * @param message EnterPveReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IEnterPveReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnterPveReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnterPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.EnterPveReq;

        /**
         * Decodes an EnterPveReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnterPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.EnterPveReq;

        /**
         * Verifies an EnterPveReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnterPveReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnterPveReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.EnterPveReq;

        /**
         * Creates a plain object from an EnterPveReq message. Also converts values to other types if specified.
         * @param message EnterPveReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.EnterPveReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnterPveReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an EnterPveRes. */
    interface IEnterPveRes {

        /** EnterPveRes LessonID */
        LessonID?: (number|null);
    }

    /** Represents an EnterPveRes. */
    class EnterPveRes implements IEnterPveRes {

        /**
         * Constructs a new EnterPveRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IEnterPveRes);

        /** EnterPveRes LessonID. */
        public LessonID: number;

        /**
         * Creates a new EnterPveRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EnterPveRes instance
         */
        public static create(properties?: gamesvr.IEnterPveRes): gamesvr.EnterPveRes;

        /**
         * Encodes the specified EnterPveRes message. Does not implicitly {@link gamesvr.EnterPveRes.verify|verify} messages.
         * @param message EnterPveRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IEnterPveRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EnterPveRes message, length delimited. Does not implicitly {@link gamesvr.EnterPveRes.verify|verify} messages.
         * @param message EnterPveRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IEnterPveRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EnterPveRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EnterPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.EnterPveRes;

        /**
         * Decodes an EnterPveRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EnterPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.EnterPveRes;

        /**
         * Verifies an EnterPveRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EnterPveRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EnterPveRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.EnterPveRes;

        /**
         * Creates a plain object from an EnterPveRes message. Also converts values to other types if specified.
         * @param message EnterPveRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.EnterPveRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EnterPveRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a FinishPveReq. */
    interface IFinishPveReq {

        /** FinishPveReq LessonID */
        LessonID?: (number|null);

        /** FinishPveReq Past */
        Past?: (boolean|null);

        /** FinishPveReq PveReport */
        PveReport?: (gamesvr.IPveReport|null);
    }

    /** Represents a FinishPveReq. */
    class FinishPveReq implements IFinishPveReq {

        /**
         * Constructs a new FinishPveReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IFinishPveReq);

        /** FinishPveReq LessonID. */
        public LessonID: number;

        /** FinishPveReq Past. */
        public Past: boolean;

        /** FinishPveReq PveReport. */
        public PveReport?: (gamesvr.IPveReport|null);

        /**
         * Creates a new FinishPveReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FinishPveReq instance
         */
        public static create(properties?: gamesvr.IFinishPveReq): gamesvr.FinishPveReq;

        /**
         * Encodes the specified FinishPveReq message. Does not implicitly {@link gamesvr.FinishPveReq.verify|verify} messages.
         * @param message FinishPveReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IFinishPveReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FinishPveReq message, length delimited. Does not implicitly {@link gamesvr.FinishPveReq.verify|verify} messages.
         * @param message FinishPveReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IFinishPveReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FinishPveReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FinishPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.FinishPveReq;

        /**
         * Decodes a FinishPveReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FinishPveReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.FinishPveReq;

        /**
         * Verifies a FinishPveReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FinishPveReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FinishPveReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.FinishPveReq;

        /**
         * Creates a plain object from a FinishPveReq message. Also converts values to other types if specified.
         * @param message FinishPveReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.FinishPveReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FinishPveReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a FinishPveRes. */
    interface IFinishPveRes {

        /** FinishPveRes LessonID */
        LessonID?: (number|null);

        /** FinishPveRes Past */
        Past?: (boolean|null);

        /** FinishPveRes Exp */
        Exp?: (number|null);

        /** FinishPveRes TotalExp */
        TotalExp?: (number|null);

        /** FinishPveRes Record */
        Record?: (data.ILessonRecord|null);

        /** FinishPveRes Prizes */
        Prizes?: (data.IPrize[]|null);
    }

    /** Represents a FinishPveRes. */
    class FinishPveRes implements IFinishPveRes {

        /**
         * Constructs a new FinishPveRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IFinishPveRes);

        /** FinishPveRes LessonID. */
        public LessonID: number;

        /** FinishPveRes Past. */
        public Past: boolean;

        /** FinishPveRes Exp. */
        public Exp: number;

        /** FinishPveRes TotalExp. */
        public TotalExp: number;

        /** FinishPveRes Record. */
        public Record?: (data.ILessonRecord|null);

        /** FinishPveRes Prizes. */
        public Prizes: data.IPrize[];

        /**
         * Creates a new FinishPveRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FinishPveRes instance
         */
        public static create(properties?: gamesvr.IFinishPveRes): gamesvr.FinishPveRes;

        /**
         * Encodes the specified FinishPveRes message. Does not implicitly {@link gamesvr.FinishPveRes.verify|verify} messages.
         * @param message FinishPveRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IFinishPveRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FinishPveRes message, length delimited. Does not implicitly {@link gamesvr.FinishPveRes.verify|verify} messages.
         * @param message FinishPveRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IFinishPveRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FinishPveRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns FinishPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.FinishPveRes;

        /**
         * Decodes a FinishPveRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns FinishPveRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.FinishPveRes;

        /**
         * Verifies a FinishPveRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FinishPveRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FinishPveRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.FinishPveRes;

        /**
         * Creates a plain object from a FinishPveRes message. Also converts values to other types if specified.
         * @param message FinishPveRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.FinishPveRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FinishPveRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ComposeHeroReq. */
    interface IComposeHeroReq {

        /** ComposeHeroReq HeroID */
        HeroID?: (number|null);
    }

    /** Represents a ComposeHeroReq. */
    class ComposeHeroReq implements IComposeHeroReq {

        /**
         * Constructs a new ComposeHeroReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IComposeHeroReq);

        /** ComposeHeroReq HeroID. */
        public HeroID: number;

        /**
         * Creates a new ComposeHeroReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ComposeHeroReq instance
         */
        public static create(properties?: gamesvr.IComposeHeroReq): gamesvr.ComposeHeroReq;

        /**
         * Encodes the specified ComposeHeroReq message. Does not implicitly {@link gamesvr.ComposeHeroReq.verify|verify} messages.
         * @param message ComposeHeroReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IComposeHeroReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ComposeHeroReq message, length delimited. Does not implicitly {@link gamesvr.ComposeHeroReq.verify|verify} messages.
         * @param message ComposeHeroReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IComposeHeroReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ComposeHeroReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ComposeHeroReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ComposeHeroReq;

        /**
         * Decodes a ComposeHeroReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ComposeHeroReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ComposeHeroReq;

        /**
         * Verifies a ComposeHeroReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ComposeHeroReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ComposeHeroReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ComposeHeroReq;

        /**
         * Creates a plain object from a ComposeHeroReq message. Also converts values to other types if specified.
         * @param message ComposeHeroReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ComposeHeroReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ComposeHeroReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ComposeHeroRes. */
    interface IComposeHeroRes {

        /** ComposeHeroRes HeroID */
        HeroID?: (number|null);
    }

    /** Represents a ComposeHeroRes. */
    class ComposeHeroRes implements IComposeHeroRes {

        /**
         * Constructs a new ComposeHeroRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IComposeHeroRes);

        /** ComposeHeroRes HeroID. */
        public HeroID: number;

        /**
         * Creates a new ComposeHeroRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ComposeHeroRes instance
         */
        public static create(properties?: gamesvr.IComposeHeroRes): gamesvr.ComposeHeroRes;

        /**
         * Encodes the specified ComposeHeroRes message. Does not implicitly {@link gamesvr.ComposeHeroRes.verify|verify} messages.
         * @param message ComposeHeroRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IComposeHeroRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ComposeHeroRes message, length delimited. Does not implicitly {@link gamesvr.ComposeHeroRes.verify|verify} messages.
         * @param message ComposeHeroRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IComposeHeroRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ComposeHeroRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ComposeHeroRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.ComposeHeroRes;

        /**
         * Decodes a ComposeHeroRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ComposeHeroRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.ComposeHeroRes;

        /**
         * Verifies a ComposeHeroRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ComposeHeroRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ComposeHeroRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.ComposeHeroRes;

        /**
         * Creates a plain object from a ComposeHeroRes message. Also converts values to other types if specified.
         * @param message ComposeHeroRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.ComposeHeroRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ComposeHeroRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AddHeroStarReq. */
    interface IAddHeroStarReq {

        /** AddHeroStarReq HeroID */
        HeroID?: (number|null);
    }

    /** Represents an AddHeroStarReq. */
    class AddHeroStarReq implements IAddHeroStarReq {

        /**
         * Constructs a new AddHeroStarReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IAddHeroStarReq);

        /** AddHeroStarReq HeroID. */
        public HeroID: number;

        /**
         * Creates a new AddHeroStarReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AddHeroStarReq instance
         */
        public static create(properties?: gamesvr.IAddHeroStarReq): gamesvr.AddHeroStarReq;

        /**
         * Encodes the specified AddHeroStarReq message. Does not implicitly {@link gamesvr.AddHeroStarReq.verify|verify} messages.
         * @param message AddHeroStarReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IAddHeroStarReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AddHeroStarReq message, length delimited. Does not implicitly {@link gamesvr.AddHeroStarReq.verify|verify} messages.
         * @param message AddHeroStarReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IAddHeroStarReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AddHeroStarReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AddHeroStarReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.AddHeroStarReq;

        /**
         * Decodes an AddHeroStarReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AddHeroStarReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.AddHeroStarReq;

        /**
         * Verifies an AddHeroStarReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AddHeroStarReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AddHeroStarReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.AddHeroStarReq;

        /**
         * Creates a plain object from an AddHeroStarReq message. Also converts values to other types if specified.
         * @param message AddHeroStarReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.AddHeroStarReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AddHeroStarReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an AddHeroStarRes. */
    interface IAddHeroStarRes {

        /** AddHeroStarRes HeroID */
        HeroID?: (number|null);

        /** AddHeroStarRes Star */
        Star?: (number|null);
    }

    /** Represents an AddHeroStarRes. */
    class AddHeroStarRes implements IAddHeroStarRes {

        /**
         * Constructs a new AddHeroStarRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IAddHeroStarRes);

        /** AddHeroStarRes HeroID. */
        public HeroID: number;

        /** AddHeroStarRes Star. */
        public Star: number;

        /**
         * Creates a new AddHeroStarRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns AddHeroStarRes instance
         */
        public static create(properties?: gamesvr.IAddHeroStarRes): gamesvr.AddHeroStarRes;

        /**
         * Encodes the specified AddHeroStarRes message. Does not implicitly {@link gamesvr.AddHeroStarRes.verify|verify} messages.
         * @param message AddHeroStarRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IAddHeroStarRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified AddHeroStarRes message, length delimited. Does not implicitly {@link gamesvr.AddHeroStarRes.verify|verify} messages.
         * @param message AddHeroStarRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IAddHeroStarRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an AddHeroStarRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns AddHeroStarRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.AddHeroStarRes;

        /**
         * Decodes an AddHeroStarRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns AddHeroStarRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.AddHeroStarRes;

        /**
         * Verifies an AddHeroStarRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an AddHeroStarRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns AddHeroStarRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.AddHeroStarRes;

        /**
         * Creates a plain object from an AddHeroStarRes message. Also converts values to other types if specified.
         * @param message AddHeroStarRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.AddHeroStarRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this AddHeroStarRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HeroEquipReq. */
    interface IHeroEquipReq {

        /** HeroEquipReq HeroID */
        HeroID?: (number|null);

        /** HeroEquipReq Positon */
        Positon?: (number|null);

        /** HeroEquipReq EquipSeq */
        EquipSeq?: (number|null);

        /** HeroEquipReq EquipID */
        EquipID?: (number|null);
    }

    /** Represents a HeroEquipReq. */
    class HeroEquipReq implements IHeroEquipReq {

        /**
         * Constructs a new HeroEquipReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IHeroEquipReq);

        /** HeroEquipReq HeroID. */
        public HeroID: number;

        /** HeroEquipReq Positon. */
        public Positon: number;

        /** HeroEquipReq EquipSeq. */
        public EquipSeq: number;

        /** HeroEquipReq EquipID. */
        public EquipID: number;

        /**
         * Creates a new HeroEquipReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeroEquipReq instance
         */
        public static create(properties?: gamesvr.IHeroEquipReq): gamesvr.HeroEquipReq;

        /**
         * Encodes the specified HeroEquipReq message. Does not implicitly {@link gamesvr.HeroEquipReq.verify|verify} messages.
         * @param message HeroEquipReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IHeroEquipReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HeroEquipReq message, length delimited. Does not implicitly {@link gamesvr.HeroEquipReq.verify|verify} messages.
         * @param message HeroEquipReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IHeroEquipReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HeroEquipReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HeroEquipReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.HeroEquipReq;

        /**
         * Decodes a HeroEquipReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HeroEquipReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.HeroEquipReq;

        /**
         * Verifies a HeroEquipReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeroEquipReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeroEquipReq
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.HeroEquipReq;

        /**
         * Creates a plain object from a HeroEquipReq message. Also converts values to other types if specified.
         * @param message HeroEquipReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.HeroEquipReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeroEquipReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HeroEquipRes. */
    interface IHeroEquipRes {

        /** HeroEquipRes HeroID */
        HeroID?: (number|null);

        /** HeroEquipRes Positon */
        Positon?: (number|null);

        /** HeroEquipRes EquipSeq */
        EquipSeq?: (number|null);

        /** HeroEquipRes EquipID */
        EquipID?: (number|null);
    }

    /** Represents a HeroEquipRes. */
    class HeroEquipRes implements IHeroEquipRes {

        /**
         * Constructs a new HeroEquipRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: gamesvr.IHeroEquipRes);

        /** HeroEquipRes HeroID. */
        public HeroID: number;

        /** HeroEquipRes Positon. */
        public Positon: number;

        /** HeroEquipRes EquipSeq. */
        public EquipSeq: number;

        /** HeroEquipRes EquipID. */
        public EquipID: number;

        /**
         * Creates a new HeroEquipRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HeroEquipRes instance
         */
        public static create(properties?: gamesvr.IHeroEquipRes): gamesvr.HeroEquipRes;

        /**
         * Encodes the specified HeroEquipRes message. Does not implicitly {@link gamesvr.HeroEquipRes.verify|verify} messages.
         * @param message HeroEquipRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: gamesvr.IHeroEquipRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HeroEquipRes message, length delimited. Does not implicitly {@link gamesvr.HeroEquipRes.verify|verify} messages.
         * @param message HeroEquipRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: gamesvr.IHeroEquipRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HeroEquipRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HeroEquipRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): gamesvr.HeroEquipRes;

        /**
         * Decodes a HeroEquipRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HeroEquipRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): gamesvr.HeroEquipRes;

        /**
         * Verifies a HeroEquipRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HeroEquipRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HeroEquipRes
         */
        public static fromObject(object: { [k: string]: any }): gamesvr.HeroEquipRes;

        /**
         * Creates a plain object from a HeroEquipRes message. Also converts values to other types if specified.
         * @param message HeroEquipRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: gamesvr.HeroEquipRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HeroEquipRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** CMD enum. */
    enum CMD {
        INVALID = 0,
        LOGIN_REQ = 101,
        LOGIN_RES = 102,
        HEART_BEAT_REQ = 103,
        HEART_BEAT_RES = 104,
        CHANGE_NAME_REQ = 105,
        CHANGE_NAME_RES = 106,
        CHANGE_HEAD_REQ = 107,
        CHANGE_HEAD_RES = 108,
        RANDOM_NAME_REQ = 109,
        RANDOM_NAME_RES = 110,
        DIFF_LOGIN_NOTIFY = 112,
        GET_ITEM_REQ = 201,
        GET_ITEM_RES = 202,
        ITEM_CHANGE_NOTIFY = 204,
        COMPOSE_HERO_REQ = 301,
        COMPOSE_HERO_RES = 302,
        ADD_HERO_STAR_REQ = 303,
        ADD_HERO_STAR_RES = 304,
        HERO_EQUIP_REQ = 305,
        HERO_EQUIP_RES = 306,
        ENTER_PVE_REQ = 401,
        ENTER_PVE_RES = 402,
        FINISH_PVE_REQ = 403,
        FINISH_PVE_RES = 404
    }
}

/** Namespace onlinesvr. */
export namespace onlinesvr {

    /** CMD enum. */
    enum CMD {
        INVALID = 0,
        HELLO_REQ = 1,
        HELLO_RES = 2,
        JOIN_REQ = 3,
        JOIN_RES = 4,
        BREAK_REQ = 5,
        BREAK_RES = 6,
        REJOIN_REQ = 7,
        REJOIN_RES = 8,
        RECOVERY_NOTIFY = 10,
        LOCK_USER_REQ = 11,
        LOCK_USER_RES = 12,
        UNLOCK_USER_REQ = 13,
        UNLOCK_USER_RES = 14,
        REPORT_USERS_REQ = 15,
        REPORT_USERS_RES = 16,
        QUERY_GAMESVRS_REQ = 17,
        QUERY_GAMESVRS_RES = 18
    }

    /** Properties of a HelloReq. */
    interface IHelloReq {

        /** HelloReq GamesvrID */
        GamesvrID?: (number|null);

        /** HelloReq URL */
        URL?: (string|null);
    }

    /** Represents a HelloReq. */
    class HelloReq implements IHelloReq {

        /**
         * Constructs a new HelloReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IHelloReq);

        /** HelloReq GamesvrID. */
        public GamesvrID: number;

        /** HelloReq URL. */
        public URL: string;

        /**
         * Creates a new HelloReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HelloReq instance
         */
        public static create(properties?: onlinesvr.IHelloReq): onlinesvr.HelloReq;

        /**
         * Encodes the specified HelloReq message. Does not implicitly {@link onlinesvr.HelloReq.verify|verify} messages.
         * @param message HelloReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IHelloReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HelloReq message, length delimited. Does not implicitly {@link onlinesvr.HelloReq.verify|verify} messages.
         * @param message HelloReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IHelloReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HelloReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HelloReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.HelloReq;

        /**
         * Decodes a HelloReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HelloReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.HelloReq;

        /**
         * Verifies a HelloReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HelloReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HelloReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.HelloReq;

        /**
         * Creates a plain object from a HelloReq message. Also converts values to other types if specified.
         * @param message HelloReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.HelloReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HelloReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a HelloRes. */
    interface IHelloRes {
    }

    /** Represents a HelloRes. */
    class HelloRes implements IHelloRes {

        /**
         * Constructs a new HelloRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IHelloRes);

        /**
         * Creates a new HelloRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns HelloRes instance
         */
        public static create(properties?: onlinesvr.IHelloRes): onlinesvr.HelloRes;

        /**
         * Encodes the specified HelloRes message. Does not implicitly {@link onlinesvr.HelloRes.verify|verify} messages.
         * @param message HelloRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IHelloRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified HelloRes message, length delimited. Does not implicitly {@link onlinesvr.HelloRes.verify|verify} messages.
         * @param message HelloRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IHelloRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a HelloRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns HelloRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.HelloRes;

        /**
         * Decodes a HelloRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns HelloRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.HelloRes;

        /**
         * Verifies a HelloRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a HelloRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns HelloRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.HelloRes;

        /**
         * Creates a plain object from a HelloRes message. Also converts values to other types if specified.
         * @param message HelloRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.HelloRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this HelloRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a JoinReq. */
    interface IJoinReq {
    }

    /** Represents a JoinReq. */
    class JoinReq implements IJoinReq {

        /**
         * Constructs a new JoinReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IJoinReq);

        /**
         * Creates a new JoinReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns JoinReq instance
         */
        public static create(properties?: onlinesvr.IJoinReq): onlinesvr.JoinReq;

        /**
         * Encodes the specified JoinReq message. Does not implicitly {@link onlinesvr.JoinReq.verify|verify} messages.
         * @param message JoinReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IJoinReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified JoinReq message, length delimited. Does not implicitly {@link onlinesvr.JoinReq.verify|verify} messages.
         * @param message JoinReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IJoinReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a JoinReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns JoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.JoinReq;

        /**
         * Decodes a JoinReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns JoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.JoinReq;

        /**
         * Verifies a JoinReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a JoinReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns JoinReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.JoinReq;

        /**
         * Creates a plain object from a JoinReq message. Also converts values to other types if specified.
         * @param message JoinReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.JoinReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this JoinReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a JoinRes. */
    interface IJoinRes {
    }

    /** Represents a JoinRes. */
    class JoinRes implements IJoinRes {

        /**
         * Constructs a new JoinRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IJoinRes);

        /**
         * Creates a new JoinRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns JoinRes instance
         */
        public static create(properties?: onlinesvr.IJoinRes): onlinesvr.JoinRes;

        /**
         * Encodes the specified JoinRes message. Does not implicitly {@link onlinesvr.JoinRes.verify|verify} messages.
         * @param message JoinRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IJoinRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified JoinRes message, length delimited. Does not implicitly {@link onlinesvr.JoinRes.verify|verify} messages.
         * @param message JoinRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IJoinRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a JoinRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns JoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.JoinRes;

        /**
         * Decodes a JoinRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns JoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.JoinRes;

        /**
         * Verifies a JoinRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a JoinRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns JoinRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.JoinRes;

        /**
         * Creates a plain object from a JoinRes message. Also converts values to other types if specified.
         * @param message JoinRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.JoinRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this JoinRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BreakReq. */
    interface IBreakReq {
    }

    /** Represents a BreakReq. */
    class BreakReq implements IBreakReq {

        /**
         * Constructs a new BreakReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IBreakReq);

        /**
         * Creates a new BreakReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BreakReq instance
         */
        public static create(properties?: onlinesvr.IBreakReq): onlinesvr.BreakReq;

        /**
         * Encodes the specified BreakReq message. Does not implicitly {@link onlinesvr.BreakReq.verify|verify} messages.
         * @param message BreakReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IBreakReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BreakReq message, length delimited. Does not implicitly {@link onlinesvr.BreakReq.verify|verify} messages.
         * @param message BreakReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IBreakReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BreakReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BreakReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.BreakReq;

        /**
         * Decodes a BreakReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BreakReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.BreakReq;

        /**
         * Verifies a BreakReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BreakReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BreakReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.BreakReq;

        /**
         * Creates a plain object from a BreakReq message. Also converts values to other types if specified.
         * @param message BreakReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.BreakReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BreakReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a BreakRes. */
    interface IBreakRes {
    }

    /** Represents a BreakRes. */
    class BreakRes implements IBreakRes {

        /**
         * Constructs a new BreakRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IBreakRes);

        /**
         * Creates a new BreakRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns BreakRes instance
         */
        public static create(properties?: onlinesvr.IBreakRes): onlinesvr.BreakRes;

        /**
         * Encodes the specified BreakRes message. Does not implicitly {@link onlinesvr.BreakRes.verify|verify} messages.
         * @param message BreakRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IBreakRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified BreakRes message, length delimited. Does not implicitly {@link onlinesvr.BreakRes.verify|verify} messages.
         * @param message BreakRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IBreakRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a BreakRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns BreakRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.BreakRes;

        /**
         * Decodes a BreakRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns BreakRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.BreakRes;

        /**
         * Verifies a BreakRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a BreakRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns BreakRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.BreakRes;

        /**
         * Creates a plain object from a BreakRes message. Also converts values to other types if specified.
         * @param message BreakRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.BreakRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this BreakRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RejoinReq. */
    interface IRejoinReq {

        /** RejoinReq UserIDs */
        UserIDs?: (string[]|null);
    }

    /** Represents a RejoinReq. */
    class RejoinReq implements IRejoinReq {

        /**
         * Constructs a new RejoinReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IRejoinReq);

        /** RejoinReq UserIDs. */
        public UserIDs: string[];

        /**
         * Creates a new RejoinReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RejoinReq instance
         */
        public static create(properties?: onlinesvr.IRejoinReq): onlinesvr.RejoinReq;

        /**
         * Encodes the specified RejoinReq message. Does not implicitly {@link onlinesvr.RejoinReq.verify|verify} messages.
         * @param message RejoinReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IRejoinReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RejoinReq message, length delimited. Does not implicitly {@link onlinesvr.RejoinReq.verify|verify} messages.
         * @param message RejoinReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IRejoinReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RejoinReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RejoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.RejoinReq;

        /**
         * Decodes a RejoinReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RejoinReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.RejoinReq;

        /**
         * Verifies a RejoinReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RejoinReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RejoinReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.RejoinReq;

        /**
         * Creates a plain object from a RejoinReq message. Also converts values to other types if specified.
         * @param message RejoinReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.RejoinReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RejoinReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RejoinRes. */
    interface IRejoinRes {
    }

    /** Represents a RejoinRes. */
    class RejoinRes implements IRejoinRes {

        /**
         * Constructs a new RejoinRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IRejoinRes);

        /**
         * Creates a new RejoinRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RejoinRes instance
         */
        public static create(properties?: onlinesvr.IRejoinRes): onlinesvr.RejoinRes;

        /**
         * Encodes the specified RejoinRes message. Does not implicitly {@link onlinesvr.RejoinRes.verify|verify} messages.
         * @param message RejoinRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IRejoinRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RejoinRes message, length delimited. Does not implicitly {@link onlinesvr.RejoinRes.verify|verify} messages.
         * @param message RejoinRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IRejoinRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RejoinRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RejoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.RejoinRes;

        /**
         * Decodes a RejoinRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RejoinRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.RejoinRes;

        /**
         * Verifies a RejoinRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RejoinRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RejoinRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.RejoinRes;

        /**
         * Creates a plain object from a RejoinRes message. Also converts values to other types if specified.
         * @param message RejoinRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.RejoinRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RejoinRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RecoveryNotify. */
    interface IRecoveryNotify {
    }

    /** Represents a RecoveryNotify. */
    class RecoveryNotify implements IRecoveryNotify {

        /**
         * Constructs a new RecoveryNotify.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IRecoveryNotify);

        /**
         * Creates a new RecoveryNotify instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RecoveryNotify instance
         */
        public static create(properties?: onlinesvr.IRecoveryNotify): onlinesvr.RecoveryNotify;

        /**
         * Encodes the specified RecoveryNotify message. Does not implicitly {@link onlinesvr.RecoveryNotify.verify|verify} messages.
         * @param message RecoveryNotify message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IRecoveryNotify, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RecoveryNotify message, length delimited. Does not implicitly {@link onlinesvr.RecoveryNotify.verify|verify} messages.
         * @param message RecoveryNotify message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IRecoveryNotify, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RecoveryNotify message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RecoveryNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.RecoveryNotify;

        /**
         * Decodes a RecoveryNotify message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RecoveryNotify
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.RecoveryNotify;

        /**
         * Verifies a RecoveryNotify message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RecoveryNotify message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RecoveryNotify
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.RecoveryNotify;

        /**
         * Creates a plain object from a RecoveryNotify message. Also converts values to other types if specified.
         * @param message RecoveryNotify
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.RecoveryNotify, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RecoveryNotify to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a LockUserReq. */
    interface ILockUserReq {

        /** LockUserReq UserID */
        UserID?: (string|null);
    }

    /** Represents a LockUserReq. */
    class LockUserReq implements ILockUserReq {

        /**
         * Constructs a new LockUserReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.ILockUserReq);

        /** LockUserReq UserID. */
        public UserID: string;

        /**
         * Creates a new LockUserReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LockUserReq instance
         */
        public static create(properties?: onlinesvr.ILockUserReq): onlinesvr.LockUserReq;

        /**
         * Encodes the specified LockUserReq message. Does not implicitly {@link onlinesvr.LockUserReq.verify|verify} messages.
         * @param message LockUserReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.ILockUserReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LockUserReq message, length delimited. Does not implicitly {@link onlinesvr.LockUserReq.verify|verify} messages.
         * @param message LockUserReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.ILockUserReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LockUserReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.LockUserReq;

        /**
         * Decodes a LockUserReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.LockUserReq;

        /**
         * Verifies a LockUserReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LockUserReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LockUserReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.LockUserReq;

        /**
         * Creates a plain object from a LockUserReq message. Also converts values to other types if specified.
         * @param message LockUserReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.LockUserReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LockUserReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a LockUserRes. */
    interface ILockUserRes {
    }

    /** Represents a LockUserRes. */
    class LockUserRes implements ILockUserRes {

        /**
         * Constructs a new LockUserRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.ILockUserRes);

        /**
         * Creates a new LockUserRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LockUserRes instance
         */
        public static create(properties?: onlinesvr.ILockUserRes): onlinesvr.LockUserRes;

        /**
         * Encodes the specified LockUserRes message. Does not implicitly {@link onlinesvr.LockUserRes.verify|verify} messages.
         * @param message LockUserRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.ILockUserRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LockUserRes message, length delimited. Does not implicitly {@link onlinesvr.LockUserRes.verify|verify} messages.
         * @param message LockUserRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.ILockUserRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LockUserRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.LockUserRes;

        /**
         * Decodes a LockUserRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.LockUserRes;

        /**
         * Verifies a LockUserRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LockUserRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LockUserRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.LockUserRes;

        /**
         * Creates a plain object from a LockUserRes message. Also converts values to other types if specified.
         * @param message LockUserRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.LockUserRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LockUserRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an UnlockUserReq. */
    interface IUnlockUserReq {

        /** UnlockUserReq UserID */
        UserID?: (string|null);
    }

    /** Represents an UnlockUserReq. */
    class UnlockUserReq implements IUnlockUserReq {

        /**
         * Constructs a new UnlockUserReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IUnlockUserReq);

        /** UnlockUserReq UserID. */
        public UserID: string;

        /**
         * Creates a new UnlockUserReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UnlockUserReq instance
         */
        public static create(properties?: onlinesvr.IUnlockUserReq): onlinesvr.UnlockUserReq;

        /**
         * Encodes the specified UnlockUserReq message. Does not implicitly {@link onlinesvr.UnlockUserReq.verify|verify} messages.
         * @param message UnlockUserReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IUnlockUserReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UnlockUserReq message, length delimited. Does not implicitly {@link onlinesvr.UnlockUserReq.verify|verify} messages.
         * @param message UnlockUserReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IUnlockUserReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UnlockUserReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UnlockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.UnlockUserReq;

        /**
         * Decodes an UnlockUserReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UnlockUserReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.UnlockUserReq;

        /**
         * Verifies an UnlockUserReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UnlockUserReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UnlockUserReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.UnlockUserReq;

        /**
         * Creates a plain object from an UnlockUserReq message. Also converts values to other types if specified.
         * @param message UnlockUserReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.UnlockUserReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UnlockUserReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of an UnlockUserRes. */
    interface IUnlockUserRes {
    }

    /** Represents an UnlockUserRes. */
    class UnlockUserRes implements IUnlockUserRes {

        /**
         * Constructs a new UnlockUserRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IUnlockUserRes);

        /**
         * Creates a new UnlockUserRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns UnlockUserRes instance
         */
        public static create(properties?: onlinesvr.IUnlockUserRes): onlinesvr.UnlockUserRes;

        /**
         * Encodes the specified UnlockUserRes message. Does not implicitly {@link onlinesvr.UnlockUserRes.verify|verify} messages.
         * @param message UnlockUserRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IUnlockUserRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified UnlockUserRes message, length delimited. Does not implicitly {@link onlinesvr.UnlockUserRes.verify|verify} messages.
         * @param message UnlockUserRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IUnlockUserRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an UnlockUserRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns UnlockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.UnlockUserRes;

        /**
         * Decodes an UnlockUserRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns UnlockUserRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.UnlockUserRes;

        /**
         * Verifies an UnlockUserRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an UnlockUserRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns UnlockUserRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.UnlockUserRes;

        /**
         * Creates a plain object from an UnlockUserRes message. Also converts values to other types if specified.
         * @param message UnlockUserRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.UnlockUserRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this UnlockUserRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a QueryGamesvrsReq. */
    interface IQueryGamesvrsReq {
    }

    /** Represents a QueryGamesvrsReq. */
    class QueryGamesvrsReq implements IQueryGamesvrsReq {

        /**
         * Constructs a new QueryGamesvrsReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IQueryGamesvrsReq);

        /**
         * Creates a new QueryGamesvrsReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns QueryGamesvrsReq instance
         */
        public static create(properties?: onlinesvr.IQueryGamesvrsReq): onlinesvr.QueryGamesvrsReq;

        /**
         * Encodes the specified QueryGamesvrsReq message. Does not implicitly {@link onlinesvr.QueryGamesvrsReq.verify|verify} messages.
         * @param message QueryGamesvrsReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IQueryGamesvrsReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified QueryGamesvrsReq message, length delimited. Does not implicitly {@link onlinesvr.QueryGamesvrsReq.verify|verify} messages.
         * @param message QueryGamesvrsReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IQueryGamesvrsReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a QueryGamesvrsReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns QueryGamesvrsReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.QueryGamesvrsReq;

        /**
         * Decodes a QueryGamesvrsReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns QueryGamesvrsReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.QueryGamesvrsReq;

        /**
         * Verifies a QueryGamesvrsReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a QueryGamesvrsReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns QueryGamesvrsReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.QueryGamesvrsReq;

        /**
         * Creates a plain object from a QueryGamesvrsReq message. Also converts values to other types if specified.
         * @param message QueryGamesvrsReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.QueryGamesvrsReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this QueryGamesvrsReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a GamesvrInfo. */
    interface IGamesvrInfo {

        /** GamesvrInfo GamesvrID */
        GamesvrID?: (number|null);

        /** GamesvrInfo URL */
        URL?: (string|null);
    }

    /** Represents a GamesvrInfo. */
    class GamesvrInfo implements IGamesvrInfo {

        /**
         * Constructs a new GamesvrInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IGamesvrInfo);

        /** GamesvrInfo GamesvrID. */
        public GamesvrID: number;

        /** GamesvrInfo URL. */
        public URL: string;

        /**
         * Creates a new GamesvrInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GamesvrInfo instance
         */
        public static create(properties?: onlinesvr.IGamesvrInfo): onlinesvr.GamesvrInfo;

        /**
         * Encodes the specified GamesvrInfo message. Does not implicitly {@link onlinesvr.GamesvrInfo.verify|verify} messages.
         * @param message GamesvrInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IGamesvrInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GamesvrInfo message, length delimited. Does not implicitly {@link onlinesvr.GamesvrInfo.verify|verify} messages.
         * @param message GamesvrInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IGamesvrInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GamesvrInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GamesvrInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.GamesvrInfo;

        /**
         * Decodes a GamesvrInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GamesvrInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.GamesvrInfo;

        /**
         * Verifies a GamesvrInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GamesvrInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GamesvrInfo
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.GamesvrInfo;

        /**
         * Creates a plain object from a GamesvrInfo message. Also converts values to other types if specified.
         * @param message GamesvrInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.GamesvrInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GamesvrInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a QueryGamesvrsRes. */
    interface IQueryGamesvrsRes {

        /** QueryGamesvrsRes GamesvrInfos */
        GamesvrInfos?: (onlinesvr.IGamesvrInfo[]|null);
    }

    /** Represents a QueryGamesvrsRes. */
    class QueryGamesvrsRes implements IQueryGamesvrsRes {

        /**
         * Constructs a new QueryGamesvrsRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IQueryGamesvrsRes);

        /** QueryGamesvrsRes GamesvrInfos. */
        public GamesvrInfos: onlinesvr.IGamesvrInfo[];

        /**
         * Creates a new QueryGamesvrsRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns QueryGamesvrsRes instance
         */
        public static create(properties?: onlinesvr.IQueryGamesvrsRes): onlinesvr.QueryGamesvrsRes;

        /**
         * Encodes the specified QueryGamesvrsRes message. Does not implicitly {@link onlinesvr.QueryGamesvrsRes.verify|verify} messages.
         * @param message QueryGamesvrsRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IQueryGamesvrsRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified QueryGamesvrsRes message, length delimited. Does not implicitly {@link onlinesvr.QueryGamesvrsRes.verify|verify} messages.
         * @param message QueryGamesvrsRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IQueryGamesvrsRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a QueryGamesvrsRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns QueryGamesvrsRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.QueryGamesvrsRes;

        /**
         * Decodes a QueryGamesvrsRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns QueryGamesvrsRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.QueryGamesvrsRes;

        /**
         * Verifies a QueryGamesvrsRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a QueryGamesvrsRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns QueryGamesvrsRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.QueryGamesvrsRes;

        /**
         * Creates a plain object from a QueryGamesvrsRes message. Also converts values to other types if specified.
         * @param message QueryGamesvrsRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.QueryGamesvrsRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this QueryGamesvrsRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ReportUsersReq. */
    interface IReportUsersReq {

        /** ReportUsersReq UserIDs */
        UserIDs?: (string[]|null);
    }

    /** Represents a ReportUsersReq. */
    class ReportUsersReq implements IReportUsersReq {

        /**
         * Constructs a new ReportUsersReq.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IReportUsersReq);

        /** ReportUsersReq UserIDs. */
        public UserIDs: string[];

        /**
         * Creates a new ReportUsersReq instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReportUsersReq instance
         */
        public static create(properties?: onlinesvr.IReportUsersReq): onlinesvr.ReportUsersReq;

        /**
         * Encodes the specified ReportUsersReq message. Does not implicitly {@link onlinesvr.ReportUsersReq.verify|verify} messages.
         * @param message ReportUsersReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IReportUsersReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReportUsersReq message, length delimited. Does not implicitly {@link onlinesvr.ReportUsersReq.verify|verify} messages.
         * @param message ReportUsersReq message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IReportUsersReq, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReportUsersReq message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReportUsersReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.ReportUsersReq;

        /**
         * Decodes a ReportUsersReq message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReportUsersReq
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.ReportUsersReq;

        /**
         * Verifies a ReportUsersReq message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReportUsersReq message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReportUsersReq
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.ReportUsersReq;

        /**
         * Creates a plain object from a ReportUsersReq message. Also converts values to other types if specified.
         * @param message ReportUsersReq
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.ReportUsersReq, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReportUsersReq to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a ReportUsersRes. */
    interface IReportUsersRes {
    }

    /** Represents a ReportUsersRes. */
    class ReportUsersRes implements IReportUsersRes {

        /**
         * Constructs a new ReportUsersRes.
         * @param [properties] Properties to set
         */
        constructor(properties?: onlinesvr.IReportUsersRes);

        /**
         * Creates a new ReportUsersRes instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReportUsersRes instance
         */
        public static create(properties?: onlinesvr.IReportUsersRes): onlinesvr.ReportUsersRes;

        /**
         * Encodes the specified ReportUsersRes message. Does not implicitly {@link onlinesvr.ReportUsersRes.verify|verify} messages.
         * @param message ReportUsersRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: onlinesvr.IReportUsersRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReportUsersRes message, length delimited. Does not implicitly {@link onlinesvr.ReportUsersRes.verify|verify} messages.
         * @param message ReportUsersRes message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: onlinesvr.IReportUsersRes, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReportUsersRes message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReportUsersRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): onlinesvr.ReportUsersRes;

        /**
         * Decodes a ReportUsersRes message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReportUsersRes
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): onlinesvr.ReportUsersRes;

        /**
         * Verifies a ReportUsersRes message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReportUsersRes message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReportUsersRes
         */
        public static fromObject(object: { [k: string]: any }): onlinesvr.ReportUsersRes;

        /**
         * Creates a plain object from a ReportUsersRes message. Also converts values to other types if specified.
         * @param message ReportUsersRes
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: onlinesvr.ReportUsersRes, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReportUsersRes to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
