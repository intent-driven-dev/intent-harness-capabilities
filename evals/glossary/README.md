# Glossary skill smoke eval

Requires Node.js 22+ and an authenticated Codex CLI. No npm install is needed.

```sh
npm run eval:glossary
npm run eval:glossary -- --help
npm test
```

The single case asks for a 50-word URL-shortener change proposal using the default glossary at `docs/glossary/domain.md`, containing only `active short link` and `destination`. Fixtures belong to the eval, rather than the repository's own documentation.

Word count (whitespace-separated after removing bold markers) and bold formatting for every occurrence of both terms are checked deterministically. An independent Codex judge checks meaningful use of the definitions, preservation of the requested requirements, and compression rather than restating definitions. This is a single-response smoke check; it does not prove custom-location handling, all file layouts, missing-source behavior, or formatting in edited documents.

The runner reuses the ADR CLI and judge schema helpers. Candidate and judge workspaces are isolated and removed after use. Results include the skill snapshot, fixtures, cases, CLI metadata, prompts, commands, logs, responses, verdicts, and summary. Results default to gitignored `evals/glossary/results/<timestamp>/`.

Options: `--model MODEL`, `--judge-model MODEL`, `--timeout SECONDS` (default 300 per call), and `--output-dir PATH` (must not exist). Exit codes: 0 all pass, 1 behavioral failure, 2 execution or grading error. Mocked harness tests cover failures, fixture placement, evidence, and cleanup without calling Codex.

Example invocations:

```text
Use the glossary skill to draft a change proposal for the URL shortener.
Use the glossary skill with glossary_location=docs/glossary/domain.md.
```
