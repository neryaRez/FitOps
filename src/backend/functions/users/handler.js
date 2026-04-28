/* eslint-disable no-undef */
/**
 * backend/functions/users/handler.js
 * AWS Lambda handlers for User Profile operations.
 * Phase 2: wire these to API Gateway routes in serverless.yml
 *
 * DynamoDB Table: fitops-user-profiles
 * Partition key: userId (String)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.PROFILES_TABLE || 'fitops-user-profiles';

// GET /users/{userId}/profile
module.exports.getProfile = async (event) => {
  const { userId } = event.pathParameters;
  const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
  if (!result.Item) return respond(404, { message: 'Profile not found' });
  return respond(200, result.Item);
};

// PUT /users/{userId}/profile  (upsert)
module.exports.upsertProfile = async (event) => {
  const { userId } = event.pathParameters;
  const body = JSON.parse(event.body);
  const item = { ...body, userId, updatedAt: new Date().toISOString() };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return respond(200, item);
};

// ── helpers ──────────────────────────────────────────────────────────────────
function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}