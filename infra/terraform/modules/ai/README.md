# FitOps AI Modules

This directory contains AI-related infrastructure modules.

Current module:

- insights
  - Generates personalized fitness/progress insights through the backend.
  - The frontend never calls the AI provider directly.
  - The backend loads user data, calls the AI model, validates the response, and stores the result.

Future possible modules:

- agent
- tools
- knowledge
- guardrails

These will be added only if the project needs a more advanced AI agent workflow.
