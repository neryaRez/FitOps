const crypto = require("crypto");
const {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
} = require("@aws-sdk/client-dynamodb");

const {
  BedrockRuntimeClient,
  ConverseCommand,
} = require("@aws-sdk/client-bedrock-runtime");

const ddb = new DynamoDBClient({});
const bedrock = new BedrockRuntimeClient({});

const PROFILES_TABLE = process.env.PROFILES_TABLE;
const WEIGHT_LOGS_TABLE = process.env.WEIGHT_LOGS_TABLE;
const MEASUREMENT_LOGS_TABLE = process.env.MEASUREMENT_LOGS_TABLE;
const AI_RECOMMENDATIONS_TABLE = process.env.AI_RECOMMENDATIONS_TABLE;
const AI_CHAT_CONVERSATIONS_TABLE = process.env.AI_CHAT_CONVERSATIONS_TABLE;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

function getUserId(event) {
  const claims = event?.requestContext?.authorizer?.jwt?.claims || {};
  return claims.sub || claims.username || claims.email;
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function randomId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
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

  if (obj.messagesJson) {
    try {
      obj.messages = JSON.parse(obj.messagesJson);
    } catch {
      obj.messages = [];
    }
    delete obj.messagesJson;
  }

  if (obj.conversationId && !obj.id) obj.id = obj.conversationId;
  return obj;
}

function toAttr(value) {
  if (value === null || value === undefined) return { NULL: true };
  if (typeof value === "number" && Number.isFinite(value)) return { N: String(value) };
  if (typeof value === "boolean") return { BOOL: value };
  return { S: String(value) };
}

async function getByUserId(tableName, userId) {
  const result = await ddb.send(new GetItemCommand({
    TableName: tableName,
    Key: { userId: { S: userId } },
  }));

  return result.Item ? itemToObject(result.Item) : null;
}

async function queryByUser(tableName, userId, limit = 25) {
  const result = await ddb.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": { S: userId },
    },
    ScanIndexForward: false,
    Limit: limit,
  }));

  return (result.Items || []).map(itemToObject);
}

async function getConversation(userId, conversationId) {
  const result = await ddb.send(new GetItemCommand({
    TableName: AI_CHAT_CONVERSATIONS_TABLE,
    Key: {
      userId: { S: userId },
      conversationId: { S: conversationId },
    },
  }));

  return result.Item ? itemToObject(result.Item) : null;
}

async function saveConversation(conversation) {
  const item = {
    userId: toAttr(conversation.userId),
    conversationId: toAttr(conversation.conversationId),
    id: toAttr(conversation.conversationId),
    title: toAttr(conversation.title || "Coach Session"),
    created_date: toAttr(conversation.created_date || nowIso()),
    updated_date: toAttr(conversation.updated_date || nowIso()),
    messagesJson: toAttr(JSON.stringify(conversation.messages || [])),
  };

  await ddb.send(new PutItemCommand({
    TableName: AI_CHAT_CONVERSATIONS_TABLE,
    Item: item,
  }));

  return itemToObject(item);
}

async function saveRecommendation(payload) {
  const item = {};
  for (const [key, value] of Object.entries(payload)) {
    item[key] = toAttr(value);
  }

  await ddb.send(new PutItemCommand({
    TableName: AI_RECOMMENDATIONS_TABLE,
    Item: item,
  }));

  return payload;
}

function normalizeHeightCm(rawHeight) {
  const n = Number(rawHeight);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 0 && n < 3) return n * 100;
  if (n >= 3 && n < 30) return n * 10;
  return n;
}

function calculateBMI(profile, weightLogs) {
  const latestWeight =
    Array.isArray(weightLogs) && weightLogs.length > 0
      ? Number(weightLogs[0].weightKg)
      : Number(profile?.startingWeightKg);

  const heightCm = normalizeHeightCm(profile?.heightCm);
  const heightM = heightCm ? heightCm / 100 : null;

  if (!Number.isFinite(latestWeight) || !heightM || heightM <= 0) {
    return { bmi: null, category: "Unknown", weightKg: latestWeight || null, heightCm };
  }

  const bmi = latestWeight / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;

  let category = "Normal weight";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi >= 25 && bmi < 30) category = "Overweight";
  else if (bmi >= 30) category = "Obese";

  return { bmi: bmiRounded, category, weightKg: latestWeight, heightCm };
}

function compactLogs(logs, fields) {
  return (logs || []).slice(0, 10).map((log) => {
    const out = {};
    for (const field of fields) {
      if (log[field] !== undefined) out[field] = log[field];
    }
    return out;
  });
}

function buildRecommendationPrompt({ profile, weightLogs, measurementLogs }) {
  const bmi = calculateBMI(profile, weightLogs);

  const safeProfile = {
    name: profile?.name || "User",
    age: profile?.age,
    heightCm: bmi.heightCm,
    startingWeightKg: profile?.startingWeightKg,
    currentWeightKg: bmi.weightKg,
    goalWeightKg: profile?.goalWeightKg,
    activityLevel: profile?.activityLevel,
    primaryGoal: profile?.primaryGoal,
    dietaryPreference: profile?.dietaryPreference,
    workoutPreference: profile?.workoutPreference,
    bmi: bmi.bmi,
    bmiCategory: bmi.category,
  };

  return [
    "You are FitOps AI, a careful fitness and nutrition assistant.",
    "Generate concise, motivating, practical fitness insights.",
    "Do not diagnose medical conditions. Do not promise medical outcomes. Do not recommend extreme diets.",
    "Return ONLY valid JSON. No markdown.",
    "",
    "Required JSON shape:",
    "{",
    "  \"bmiAnalysis\": \"string\",",
    "  \"fitnessPath\": \"string\",",
    "  \"mealGuidance\": \"string\",",
    "  \"workoutPlan\": \"string\",",
    "  \"progressInsights\": \"string\"",
    "}",
    "",
    "User profile:",
    JSON.stringify(safeProfile, null, 2),
    "",
    "Recent weight logs:",
    JSON.stringify(compactLogs(weightLogs, ["date", "weightKg"]), null, 2),
    "",
    "Recent measurement logs:",
    JSON.stringify(compactLogs(measurementLogs, ["date", "waist", "neck", "chest", "hips", "leftArm", "rightArm", "leftThigh", "rightThigh"]), null, 2),
  ].join("\n");
}

function extractTextFromConverse(response) {
  const content = response?.output?.message?.content || [];
  return content.map((part) => part.text || "").join("\n").trim();
}

function parseModelJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Bedrock response was not valid JSON");
  }
}

function normalizeRecommendation(raw) {
  return {
    bmiAnalysis: String(raw?.bmiAnalysis || "No BMI analysis was generated."),
    fitnessPath: String(raw?.fitnessPath || "No fitness path was generated."),
    mealGuidance: String(raw?.mealGuidance || "No meal guidance was generated."),
    workoutPlan: String(raw?.workoutPlan || "No workout plan was generated."),
    progressInsights: String(raw?.progressInsights || "No progress insights were generated."),
  };
}

async function generateRecommendationWithBedrock(prompt) {
  const response = await bedrock.send(new ConverseCommand({
    modelId: BEDROCK_MODEL_ID,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 900, temperature: 0.4 },
  }));

  return normalizeRecommendation(parseModelJson(extractTextFromConverse(response)));
}

async function generateChatReply(messages, userContext = {}) {
  const safeHistory = (messages || [])
    .slice(-12)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [{ text: String(m.content || "").slice(0, 3000) }],
    }));

  const contextText = [
    "Known user data from the FitOps platform:",
    JSON.stringify(userContext, null, 2),
  ].join("\n");

  const systemText = [
    "You are FitOps AI Coach.",
    "You are running inside the FitOps platform.",
    "Use the provided platform data when answering questions about the user's profile, weight, measurements, BMI, progress, and goals.",
    "If the user asks whether you know their measurements, use the provided context.",
    "Do not say you have no access to platform data when context is provided.",
    "Be practical, concise, encouraging, and fitness-oriented.",
    "Do not diagnose medical conditions.",
    "Do not claim to be a doctor.",
    "Do not recommend extreme diets.",
    "",
    contextText,
  ].join("\n");

  const response = await bedrock.send(new ConverseCommand({
    modelId: BEDROCK_MODEL_ID,
    system: [{ text: systemText }],
    messages: safeHistory,
    inferenceConfig: { maxTokens: 900, temperature: 0.5 },
  }));

  return extractTextFromConverse(response) || "I could not generate a response right now.";
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);
    if (!userId) return json(401, { message: "Unauthorized" });

    const routeKey = event.routeKey;
    const body = parseBody(event);
    if (body === null) return json(400, { message: "Invalid JSON body" });

    if (routeKey === "GET /ai/recommendation") {
      const existing = await getByUserId(AI_RECOMMENDATIONS_TABLE, userId);
      return json(200, existing);
    }

    if (routeKey === "POST /ai/recommendation/generate") {
      const [storedProfile, weightLogs, measurementLogs] = await Promise.all([
        getByUserId(PROFILES_TABLE, userId),
        queryByUser(WEIGHT_LOGS_TABLE, userId, 25),
        queryByUser(MEASUREMENT_LOGS_TABLE, userId, 25),
      ]);

      const profile = storedProfile || body.profile;
      if (!profile) {
        return json(400, { message: "Profile is required before generating AI insights." });
      }

      const recommendation = await generateRecommendationWithBedrock(
        buildRecommendationPrompt({
          profile,
          weightLogs: weightLogs.length ? weightLogs : (body.weightLogs || []),
          measurementLogs: measurementLogs.length ? measurementLogs : (body.measurementLogs || []),
        })
      );

      return json(200, await saveRecommendation({
        userId,
        id: userId,
        generatedAt: nowIso(),
        status: "ready",
        modelId: BEDROCK_MODEL_ID,
        ...recommendation,
      }));
    }

    if (routeKey === "GET /ai/chat/conversations") {
      const conversations = await queryByUser(AI_CHAT_CONVERSATIONS_TABLE, userId, 50);
      return json(200, conversations.map((c) => ({
        id: c.conversationId,
        conversationId: c.conversationId,
        title: c.title,
        created_date: c.created_date,
        updated_date: c.updated_date,
        metadata: { userId },
      })));
    }

    if (routeKey === "POST /ai/chat/conversations") {
      const conversationId = randomId();
      const title = body.title || body?.metadata?.title || "Coach Session";

      const saved = await saveConversation({
        userId,
        conversationId,
        title,
        created_date: nowIso(),
        updated_date: nowIso(),
        messages: [],
      });

      return json(200, {
        ...saved,
        id: saved.conversationId,
        metadata: { userId },
      });
    }

    if (routeKey === "GET /ai/chat/conversations/{conversationId}") {
      const conversationId = event.pathParameters?.conversationId;
      const conversation = await getConversation(userId, conversationId);

      if (!conversation) return json(404, { message: "Conversation not found" });

      return json(200, {
        ...conversation,
        id: conversation.conversationId,
        metadata: { userId },
      });
    }

    if (routeKey === "POST /ai/chat/conversations/{conversationId}/messages") {
      const conversationId = event.pathParameters?.conversationId;
      const content = String(body.content || "").trim();

      if (!content) return json(400, { message: "Message content is required" });

      const existing = await getConversation(userId, conversationId);
      if (!existing) return json(404, { message: "Conversation not found" });

      const userMessage = {
        id: randomId(),
        role: "user",
        content,
        created_date: nowIso(),
      };

      const [profile, weightLogs, measurementLogs] = await Promise.all([
        getByUserId(PROFILES_TABLE, userId),
        queryByUser(WEIGHT_LOGS_TABLE, userId, 10),
        queryByUser(MEASUREMENT_LOGS_TABLE, userId, 10),
      ]);

      const bmi = calculateBMI(profile || {}, weightLogs);

      const userContext = {
        profile,
        bmi,
        recentWeightLogs: compactLogs(weightLogs, ["date", "weightKg"]),
        recentMeasurementLogs: compactLogs(measurementLogs, [
          "date",
          "waist",
          "neck",
          "chest",
          "hips",
          "leftArm",
          "rightArm",
          "leftThigh",
          "rightThigh",
        ]),
      };

      const messagesBeforeReply = [...(existing.messages || []), userMessage];
      const assistantText = await generateChatReply(messagesBeforeReply, userContext);

      const assistantMessage = {
        id: randomId(),
        role: "assistant",
        content: assistantText,
        created_date: nowIso(),
      };

      const updated = await saveConversation({
        ...existing,
        messages: [...messagesBeforeReply, assistantMessage],
        updated_date: nowIso(),
      });

      return json(200, {
        ...updated,
        id: updated.conversationId,
        metadata: { userId },
      });
    }

    return json(404, { message: "Route not found", routeKey });
  } catch (err) {
    console.error("AI handler error:", err);
    return json(500, {
      message: "Internal server error",
      error: err?.message || String(err),
    });
  }
};
