const crypto = require("crypto");
const {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  S3Client,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const ddb = new DynamoDBClient({});
const s3 = new S3Client({});

const WEIGHT_TABLE = process.env.WEIGHT_LOGS_TABLE;
const MEASUREMENTS_TABLE = process.env.MEASUREMENT_LOGS_TABLE;
const PHOTOS_TABLE = process.env.PHOTOS_TABLE;
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET;
const AWS_REGION_NAME = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const SIGNED_URL_EXPIRES_SECONDS = Number(process.env.SIGNED_URL_EXPIRES_SECONDS || 900);

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

function getUserId(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims || {};
  return claims.sub || claims.username || claims.email;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
}

function safeExtension(contentType) {
  const normalized = String(contentType || "").toLowerCase();

  if (normalized.includes("png")) return "png";
  if (normalized.includes("webp")) return "webp";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";

  return "jpg";
}

function assertImageContentType(contentType) {
  const normalized = String(contentType || "").toLowerCase();
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(normalized);
}

function toAttr(value) {
  if (value === null || value === undefined) return { NULL: true };
  if (typeof value === "number" && Number.isFinite(value)) return { N: String(value) };
  if (typeof value === "boolean") return { BOOL: value };
  return { S: String(value) };
}

function fromAttr(attr) {
  if (!attr) return undefined;
  if ("S" in attr) return attr.S;
  if ("N" in attr) return Number(attr.N);
  if ("BOOL" in attr) return attr.BOOL;
  if ("NULL" in attr) return null;
  return undefined;
}

function itemToObject(item) {
  const obj = {};
  for (const [key, value] of Object.entries(item || {})) {
    obj[key] = fromAttr(value);
  }
  if (obj.date && !obj.id) obj.id = obj.date;
  if (obj.photoId && !obj.id) obj.id = obj.photoId;
  return obj;
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

async function queryByUser(tableName, userId) {
  const result = await ddb.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
    },
    ScanIndexForward: false,
    Limit: 100,
  }));

  return (result.Items || []).map(itemToObject);
}

async function putItem(tableName, item) {
  const dynamoItem = {};

  for (const [key, value] of Object.entries(item)) {
    if (value !== undefined) {
      dynamoItem[key] = toAttr(value);
    }
  }

  await ddb.send(new PutItemCommand({
    TableName: tableName,
    Item: dynamoItem,
  }));

  return itemToObject(dynamoItem);
}

async function deleteDateItem(tableName, userId, date) {
  await ddb.send(new DeleteItemCommand({
    TableName: tableName,
    Key: {
      userId: { S: userId },
      date: { S: date },
    },
  }));

  return { deleted: true, id: date, date };
}

function rfc3986Encode(value) {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodeS3Key(key) {
  return String(key).split("/").map(rfc3986Encode).join("/");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}

function sha256(value, encoding = "hex") {
  return crypto.createHash("sha256").update(value, "utf8").digest(encoding);
}

function signingKey(secretAccessKey, dateStamp, region, service) {
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function presignS3Url({ method, bucket, key, expiresSeconds }) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (!accessKeyId || !secretAccessKey || !sessionToken) {
    throw new Error("Lambda AWS credentials are not available for signing.");
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "s3";
  const host = `${bucket}.s3.${AWS_REGION_NAME}.amazonaws.com`;
  const credentialScope = `${dateStamp}/${AWS_REGION_NAME}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;

  const queryParams = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-Security-Token": sessionToken,
    "X-Amz-SignedHeaders": "host",
  };

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((param) => `${rfc3986Encode(param)}=${rfc3986Encode(queryParams[param])}`)
    .join("&");

  const canonicalUri = `/${encodeS3Key(key)}`;
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const signature = hmac(
    signingKey(secretAccessKey, dateStamp, AWS_REGION_NAME, service),
    stringToSign,
    "hex"
  );

  return `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

function withPhotoUrl(photo) {
  if (!photo?.s3Key) return photo;

  return {
    ...photo,
    photoUrl: presignS3Url({
      method: "GET",
      bucket: PHOTOS_BUCKET,
      key: photo.s3Key,
      expiresSeconds: SIGNED_URL_EXPIRES_SECONDS,
    }),
  };
}

function assertUserPhotoKey(userId, photoId, s3Key) {
  const expectedPrefix = `users/${userId}/progress-photos/${photoId}.`;

  if (!s3Key || !s3Key.startsWith(expectedPrefix)) {
    return false;
  }

  return true;
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);

    if (!userId) {
      return json(401, { message: "Unauthorized" });
    }

    const routeKey = event.routeKey;
    const body = parseBody(event);

    if (body === null) {
      return json(400, { message: "Invalid JSON body" });
    }

    if (routeKey === "GET /weight") {
      return json(200, await queryByUser(WEIGHT_TABLE, userId));
    }

    if (routeKey === "POST /weight") {
      const date = body.date || todayIsoDate();
      const weightKg = Number(body.weightKg);

      if (!date || !Number.isFinite(weightKg) || weightKg <= 0) {
        return json(400, { message: "date and positive weightKg are required" });
      }

      return json(200, await putItem(WEIGHT_TABLE, {
        userId,
        date,
        id: date,
        weightKg,
        createdAt: new Date().toISOString(),
      }));
    }

    if (routeKey === "DELETE /weight/{date}") {
      const date = event.pathParameters?.date;

      if (!date) {
        return json(400, { message: "date path parameter is required" });
      }

      return json(200, await deleteDateItem(WEIGHT_TABLE, userId, date));
    }

    if (routeKey === "GET /measurements") {
      return json(200, await queryByUser(MEASUREMENTS_TABLE, userId));
    }

    if (routeKey === "POST /measurements") {
      const date = body.date || todayIsoDate();

      const item = {
        userId,
        date,
        id: date,
        createdAt: new Date().toISOString(),
      };

      for (const [key, value] of Object.entries(body)) {
        if (["userId", "id", "createdAt"].includes(key)) continue;

        if (key === "date") {
          item.date = String(value);
          item.id = String(value);
          continue;
        }

        const numeric = Number(value);
        item[key] = Number.isFinite(numeric) && value !== "" ? numeric : value;
      }

      return json(200, await putItem(MEASUREMENTS_TABLE, item));
    }

    if (routeKey === "DELETE /measurements/{date}") {
      const date = event.pathParameters?.date;

      if (!date) {
        return json(400, { message: "date path parameter is required" });
      }

      return json(200, await deleteDateItem(MEASUREMENTS_TABLE, userId, date));
    }

    if (routeKey === "GET /photos") {
      const photos = await queryByUser(PHOTOS_TABLE, userId);

      const signedPhotos = photos
        .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0))
        .map(withPhotoUrl);

      return json(200, signedPhotos);
    }

    if (routeKey === "POST /photos/upload-url") {
      const contentType = body.contentType || "image/jpeg";

      if (!assertImageContentType(contentType)) {
        return json(400, { message: "Only jpeg, png, and webp images are supported" });
      }

      const photoId = randomId();
      const extension = safeExtension(contentType);
      const s3Key = `users/${userId}/progress-photos/${photoId}.${extension}`;

      const uploadUrl = presignS3Url({
        method: "PUT",
        bucket: PHOTOS_BUCKET,
        key: s3Key,
        expiresSeconds: SIGNED_URL_EXPIRES_SECONDS,
      });

      return json(200, {
        photoId,
        s3Key,
        uploadUrl,
        expiresIn: SIGNED_URL_EXPIRES_SECONDS,
      });
    }

    if (routeKey === "POST /photos/complete") {
      const photoId = body.photoId;
      const s3Key = body.s3Key;
      const date = body.date || todayIsoDate();
      const angle = body.angle || "front";
      const contentType = body.contentType || "image/jpeg";

      if (!photoId || !assertUserPhotoKey(userId, photoId, s3Key)) {
        return json(400, { message: "Invalid photo metadata" });
      }

      const item = await putItem(PHOTOS_TABLE, {
        userId,
        photoId,
        id: photoId,
        date,
        angle,
        s3Key,
        contentType,
        createdAt: new Date().toISOString(),
      });

      return json(200, withPhotoUrl(item));
    }

    if (routeKey === "DELETE /photos/{photoId}") {
      const photoId = event.pathParameters?.photoId;

      if (!photoId) {
        return json(400, { message: "photoId path parameter is required" });
      }

      const result = await ddb.send(new DeleteItemCommand({
        TableName: PHOTOS_TABLE,
        Key: {
          userId: { S: userId },
          photoId: { S: photoId },
        },
        ReturnValues: "ALL_OLD",
      }));

      const deleted = itemToObject(result.Attributes || {});

      if (deleted?.s3Key) {
        await s3.send(new DeleteObjectCommand({
          Bucket: PHOTOS_BUCKET,
          Key: deleted.s3Key,
        }));
      }

      return json(200, { deleted: true, id: photoId, photoId });
    }

    return json(404, { message: "Route not found", routeKey });
  } catch (err) {
    console.error("Progress handler error:", err);
    return json(500, {
      message: "Internal server error",
      error: err?.message || String(err),
    });
  }
};
