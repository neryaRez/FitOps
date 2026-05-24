# FitOps AI Modules

Future AI infrastructure modules for the FitOps AI layer.

Modules:

- agent
  - The main AI agent configuration.

- tools
  - Actions/tools the agent can call.
  - Example: get user profile, get progress logs, save recommendation.

- knowledge
  - Knowledge base / RAG layer.
  - Used for private documents, fitness rules, nutrition guidance, and app-specific knowledge.

- safety
  - AI safety boundaries.
  - Used to prevent unsafe, private, medical, or out-of-scope responses.

- workflow
  - AI orchestration flow.
  - Coordinates steps such as loading user data, calling the AI model/agent, validating output, and saving results.

Security rules:
- No AI keys in the frontend.
- AI calls go through the backend only.
- Secrets stay in Secrets Manager or SSM SecureString.
- Sensitive values are encrypted with KMS.
- Agent tools use least-privilege IAM.
- User data access must be scoped to the authenticated user.
