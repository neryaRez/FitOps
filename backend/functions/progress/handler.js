/* eslint-disable no-undef */
/**
 * backend/functions/progress/handler.js
 * AWS Lambda handlers for Weight Logs, Measurements, and Progress Photos.
 * Phase 2: wire these to API Gateway routes in serverless.yml
 *
 * DynamoDB Tables:
 *   fitops-weight-logs       PK: userId  SK: date
 *   fitops-measurement-logs  PK: userId  SK: date
 *   fitops-progress-photos   PK: userId  SK: date#angle
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({});

const WEIGHT_TABLE  = process.env.WEIGHT_TABLE  || 'fitops-weight-logs';
const MEASURE_TABLE = process.env.MEASURE_TABLE  || 'fitops-measurement-logs';
const PHOTOS_TABLE  = process.env.PHOTOS_TABLE   || 'fitops-progress-photos';
const PHOTOS_BUCKET = process.env.PHOTOS_BUCKET  || 'fitops-progress-photos';

// ── Weight Logs ───────────────────────────────────────────────────────────────

// GET /users/{userId}/weight
module.exports.getWeightLogs = async (event) => {
  const { userId } = event.pathParameters;
  const result = await ddb.send(new QueryCommand({
    TableName: WEIGHT_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
    Limit: 100,
  }));
  return respond(200, result.Items);
};

// POST /users/{userId}/weight
module.exports.addWeightLog = async (event) => {
  const { userId } = event.pathParameters;
  const { date, weightKg } = JSON.parse(event.body);
  const item = { userId, date, weightKg, id: uuidv4(), createdAt: new Date().toISOString() };
  await ddb.send(new PutCommand({ TableName: WEIGHT_TABLE, Item: item }));
  return respond(201, item);
};

// DELETE /users/{userId}/weight/{logId}
module.exports.deleteWeightLog = async (event) => {
  const { userId, logId } = event.pathParameters;
  await ddb.send(new DeleteCommand({ TableName: WEIGHT_TABLE, Key: { userId, id: logId } }));
  return respond(204, {});
};

// ── Measurement Logs ──────────────────────────────────────────────────────────

// GET /users/{userId}/measurements
module.exports.getMeasurementLogs = async (event) => {
  const { userId } = event.pathParameters;
  const result = await ddb.send(new QueryCommand({
    TableName: MEASURE_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
    Limit: 100,
  }));
  return respond(200, result.Items);
};

// POST /users/{userId}/measurements
module.exports.addMeasurementLog = async (event) => {
  const { userId } = event.pathParameters;
  const body = JSON.parse(event.body);
  const item = { userId, ...body, id: uuidv4(), createdAt: new Date().toISOString() };
  await ddb.send(new PutCommand({ TableName: MEASURE_TABLE, Item: item }));
  return respond(201, item);
};

// DELETE /users/{userId}/measurements/{logId}
module.exports.deleteMeasurementLog = async (event) => {
  const { userId, logId } = event.pathParameters;
  await ddb.send(new DeleteCommand({ TableName: MEASURE_TABLE, Key: { userId, id: logId } }));
  return respond(204, {});
};

// ── Progress Photos ───────────────────────────────────────────────────────────

// GET /users/{userId}/photos
module.exports.getProgressPhotos = async (event) => {
  const { userId } = event.pathParameters;
  const result = await ddb.send(new QueryCommand({
    TableName: PHOTOS_TABLE,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
    Limit: 100,
  }));
  return respond(200, result.Items);
};

// POST /users/{userId}/photos  (expects multipart OR base64 body)
module.exports.uploadProgressPhoto = async (event) => {
  const { userId } = event.pathParameters;
  const { date, angle, fileBase64, mimeType } = JSON.parse(event.body);
  const key = `photos/${userId}/${date}/${angle}-${uuidv4()}`;
  await s3.send(new PutObjectCommand({
    Bucket: PHOTOS_BUCKET,
    Key: key,
    Body: Buffer.from(fileBase64, 'base64'),
    ContentType: mimeType || 'image/jpeg',
  }));
  const photoUrl = `https://${PHOTOS_BUCKET}.s3.amazonaws.com/${key}`;
  const item = { userId, date, angle, photoUrl, id: uuidv4(), createdAt: new Date().toISOString() };
  await ddb.send(new PutCommand({ TableName: PHOTOS_TABLE, Item: item }));
  return respond(201, item);
};

// DELETE /users/{userId}/photos/{photoId}
module.exports.deleteProgressPhoto = async (event) => {
  const { userId, photoId } = event.pathParameters;
  await ddb.send(new DeleteCommand({ TableName: PHOTOS_TABLE, Key: { userId, id: photoId } }));
  return respond(204, {});
};

// ── helpers ───────────────────────────────────────────────────────────────────
function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}