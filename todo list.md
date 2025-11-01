# RentMate Sprint 1 TODO

## Critical
- Lock down registration so roles are server-assigned (remove `role` from `RegisterDto`, add admin-only elevation workflow, migrate existing users if needed).
- Replace the placeholder Gemini chat with the planned AHP/TOPSIS + clustering recommender exposed via `/api/ai/recommend`, including validation + fallback flows.
- Rotate and remove the committed `GEMINI_API_KEY`; load secrets from environment variables that are never stored in Git.

## Major
- Model and persist `UserPreference` data (budget, location, amenities) aligned with Database-Design v1.0 and connect it to the AI scoring pipeline.
- Add automated tests (Jest/e2e) covering AuthService, PropertiesService, and the new AI ranking helpers; integrate them into CI.
- Standardize API response envelopes `{ success, data, error }` across auth, properties, messages, and AI endpoints, updating the Axios client accordingly.
- Design and implement an owner/manager inbox so “Chat với Chủ nhà” mode delivers messages to a human recipient (notifications + reply flow).

## Minor / Cleanup
- Normalize property DTO validation (length limits for description/address, min/max price/area) to prevent inconsistent records.
- Document role assignment rules, AI recommendation usage, and secret management steps in the README/setup guide.
