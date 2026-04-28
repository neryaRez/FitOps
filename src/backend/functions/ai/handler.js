/* eslint-disable no-undef */
/**
 * backend/functions/ai/handler.js
 * AWS Lambda handler for AI Recommendations.
 * Phase 2: replace stub logic with calls to AWS Bedrock / OpenAI via Step Functions.
 *
 * DynamoDB Table: fitops-ai-recommendations
 * Partition key: userId (String)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.AI_TABLE || 'fitops-ai-recommendations';

// GET /users/{userId}/insights
module.exports.getRecommendation = async (event) => {
  const { userId } = event.pathParameters;
  const result = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }));
  if (!result.Item) return respond(404, { message: 'No insights yet' });
  return respond(200, result.Item);
};

// POST /users/{userId}/insights/generate
module.exports.requestAnalysis = async (event) => {
  const { userId } = event.pathParameters;
  const { profile, weightLogs = [], measurementLogs = [] } = JSON.parse(event.body);

  // ── Phase 1: stub logic (mirrors frontend aiService.js) ──────────────────
  const heightM = profile.heightCm / 100;
  const bmi = Math.round((profile.startingWeightKg / (heightM * heightM)) * 10) / 10;
  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obese';

  const logsCount = weightLogs.length + measurementLogs.length;

  const item = {
    userId,
    generatedAt: new Date().toISOString(),
    status: 'stub',
    bmiAnalysis: `Your BMI is ${bmi} (${bmiCategory}). [Phase 2: Bedrock AI analysis here]`,
    fitnessPath: `Structured plan for goal: ${profile.primaryGoal?.replace('_', ' ')}. [Phase 2: personalized path here]`,
    mealGuidance: `Calorie target based on profile & activity. [Phase 2: personalized meal plan here]`,
    workoutPlan: `${profile.activityLevel} activity → 3–5 sessions/week recommended. [Phase 2: personalized plan here]`,
    progressInsights: `${logsCount} total entries logged. [Phase 2: trend analysis here]`,
  };

  // ── Phase 2: replace above block with ──────────────────────────────────────
  // const sfn = new SFNClient({});
  // await sfn.send(new StartExecutionCommand({ stateMachineArn: process.env.AI_STATE_MACHINE_ARN, input: JSON.stringify({ userId, profile }) }));
  // return respond(202, { message: 'Analysis started' });
  // ─────────────────────────────────────────────────────────────────────────

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return respond(200, item);
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}