# AI — Engineering Decisions

> **Placeholder — no AI/LLM code exists in the repo yet.**

There is currently **no** LLM integration (no Gemini/OpenAI/Anthropic client, no structured-output
parsing, no prompt code, no retry/cost handling). The only "AI"-named code is a **marketing mockup** on
the landing page:

- [`features/landing/components/ai-prescription/`](../../../frontend/src/features/landing/components/ai-prescription/)
  — `AiPrescription`, `AiInfoPanel`, `AiSmartMock`, `AiVoiceMock`. These are static/animated UI
  illustrations of a future feature, not a working model integration.

The Prisma scaffold hints at an intended AI surface (`RecipeSource.AI`, a `Recipe` with `Json` fields for
model output) but that belongs to the leftover **PantryChef** scaffold, not MediNex+ (see
[database.md](database.md)).

**When real AI code lands**, log entries here for the genuinely non-obvious decisions, e.g.:
- structured / schema-constrained output vs free-text parsing
- retry & timeout strategy on model calls
- token/cost controls and truncation
- prompt/version management and caching
- streaming vs batch responses

Follow the 5-part Learn template in [README.md](README.md). Until then, this file is intentionally empty
of entries. `(no lesson — status note)`
