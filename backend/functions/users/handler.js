/* eslint-disable no-undef */
/**
 * backend/functions/users/handler.js
 *
 * AWS Lambda handler for User Profile operations.
 *
 * Target routes:
 *   GET /profile
 *   PUT /profile
 *
 * Auth:
 *   API Gateway JWT Authorizer with Cognito.
 *   userId is taken from JWT claims, NOT from the URL.
 *
 * DynamoDB:
 *   Table name comes from env var: PROFILES_TABLE
 *   Partition key: userId (String)
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.PROFILES_TABLE;

exports.handler = async (event) => {
  try {
    if (!TABLE) {
      return respond(500, {
        message: "Server configuration error: PROFILES_TABLE is missing",
      });
    }

    const routeKey = event.routeKey;
    const method = event.requestContext?.http?.method;

    if (method === "OPTIONS") {
      return respond(204, {});
    }

    switch (routeKey) {
      case "GET /profile":
        return getProfile(event);

      case "PUT /profile":
        return upsertProfile(event);

      /**
       * Backward compatibility.
       * Keep temporarily only if old frontend/serverless code still calls these.
       * Prefer /profile going forward.
       */
      case "GET /users/{userId}/profile":
        return getProfile(event);

      case "PUT /users/{userId}/profile":
        return upsertProfile(event);

      default:
        return respond(404, {
          message: "Route not found",
          routeKey,
        });
    }
  } catch (error) {
    console.error("users handler error:", {
      name: error?.name,
      message: error?.message,
    });

    return respond(500, {
      message: "Internal server error",
    });
  }
};

async function getProfile(event) {
  const user = getAuthenticatedUser(event);

  if (!user.userId) {
    return respond(401, {
      message: "Unauthorized",
    });
  }

  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        userId: user.userId,
      },
    })
  );

  if (!result.Item) {
    return respond(404, {
      message: "Profile not found",
      userId: user.userId,
    });
  }

  return respond(200, result.Item);
}

async function upsertProfile(event) {
  const user = getAuthenticatedUser(event);

  if (!user.userId) {
    return respond(401, {
      message: "Unauthorized",
    });
  }

  const body = parseJsonBody(event.body);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return respond(400, {
      message: "Request body must be a valid JSON object",
    });
  }

  /**
   * Never trust identity fields from the frontend.
   * The real identity comes from Cognito JWT claims.
   */
  const now = new Date().toISOString();

  const item = {
    ...body,

    userId: user.userId,
    email: user.email,
    name: body.name ?? user.name ?? null,

    updatedAt: now,
    createdAt: body.createdAt ?? now,
  };

  delete item.sub;
  delete item.username;

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: item,
    })
  );

  return respond(200, item);
}

function getAuthenticatedUser(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};

  return {
    userId: claims.sub,
    email: claims.email || null,
    name: claims.name || claims["cognito:username"] || null,
    claims,
  };
}

function parseJsonBody(body) {
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    },
    body: statusCode === 204 ? "" : JSON.stringify(body),
  };
}