const {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");

const ddb = new DynamoDBClient({});

const WEIGHT_TABLE = process.env.WEIGHT_LOGS_TABLE;
const MEASUREMENTS_TABLE = process.env.MEASUREMENT_LOGS_TABLE;

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

async function deleteItem(tableName, userId, date) {
  await ddb.send(new DeleteItemCommand({
    TableName: tableName,
    Key: {
      userId: { S: userId },
      date: { S: date },
    },
  }));

  return { deleted: true, id: date, date };
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

      const item = {
        userId,
        date,
        id: date,
        weightKg,
        createdAt: new Date().toISOString(),
      };

      return json(200, await putItem(WEIGHT_TABLE, item));
    }

    if (routeKey === "DELETE /weight/{date}") {
      const date = event.pathParameters?.date;

      if (!date) {
        return json(400, { message: "date path parameter is required" });
      }

      return json(200, await deleteItem(WEIGHT_TABLE, userId, date));
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

      return json(200, await deleteItem(MEASUREMENTS_TABLE, userId, date));
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
