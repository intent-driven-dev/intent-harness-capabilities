# ADR skill eval

## Run

Requires Node.js 22+, npm, and an installed, authenticated Codex CLI. No `npm install` is needed.

Open a terminal in the repository root and run:

```sh
npm run eval:adrs
```

The eval uses your configured Codex model.

## Understand the result

- **PASS:** all criteria passed.
- **FAIL:** the answer missed a required behavior.
- **ERROR:** execution or grading failed; no valid skill verdict.

Exit codes: `0` all pass, `1` behavioral failure, `2` execution/grading error.

Answers and grading evidence are saved under `evals/adrs/results/<timestamp>/`.
