# Interview skill smoke eval

Requires Node.js 22+, npm, and an installed, authenticated Codex CLI. No `npm install` is needed.

```sh
npm run eval:interview
npm run eval:interview -- --help
```

The eval uses the configured Codex model for both candidate and judge. Override with `--model MODEL` and `--judge-model MODEL` if needed. Each call defaults to a 300-second timeout (`--timeout SECONDS`). Results default to `evals/interview/results/<timestamp>/`, independent of the working directory. Use `--output-dir PATH` to override this location; passing a path under `/tmp` saves results there instead.

Two small cases check a supplied questionnaire with a URL spec and a stop request with two previously recorded answers. The readback case supplies no spec; its recorded 30-day answer belongs to that independent conversation. These are single-response smoke checks, not a full conversation test. They do not prove topic independence, multi-turn ordering, complete file-option coverage, or all completion behavior.

The runner checks that the skill body is one line and at most 50 words, excluding metadata. It reuses the ADR eval's CLI invocation, grading schema, and verdict validation helpers. Each candidate gets a temporary workspace with the skill and only that case's files; the judge gets an independent workspace and the case evidence.

- **PASS:** every criterion passed.
- **FAIL:** a required behavior was missed.
- **ERROR:** execution or grading failed; no valid skill verdict.

Exit codes: `0` all pass, `1` behavioral failure, `2` execution/grading error.

Evidence is saved under `evals/interview/results/<timestamp>/`: skill snapshot, cases, fixture contents, CLI version and model settings, candidate/judge prompts, commands, event logs, stderr, responses, verdicts, and summary. Results are gitignored. Workspaces are removed after each invocation.

Run `npm test` for local harness checks covering the word limit, case-specific files, grading statuses, saved summaries, and workspace cleanup. These mocked checks do not call Codex.

## Skill invocations

Invoke the skill in chat with any of these forms (paths are examples relative to the current project):

```text
Use the interview skill. Interview me about the URL shortening service we just discussed.
Use the interview skill with spec=spec.md.
Use the interview skill with questions=questions.md.
Use the interview skill with spec=spec.md and questions=questions.md.
```

Without files it uses conversation context. With both files it uses them together, asks supplied questions in order, and then clarifies gaps. It asks one multiple-choice question at a time and waits for each answer. On completion or a stop request, it reads back every asked question and recorded answer in chat for the user to store; it does not write a file.
