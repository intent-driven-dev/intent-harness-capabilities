import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main, validateSkill } from './run.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const cases = readJSON(join(HERE, 'cases.json'));

test('default results persist in the repository while temporary workspaces are removed', () => {
  let output;
  const workspaces = [];
  try {
    const status = main([], {
      log: line => {
        if (line.startsWith('Saving results to: ')) output = line.slice('Saving results to: '.length);
      },
      runProcess: () => ({ status: 0, stdout: 'codex test-version\n' }),
      invokeCall: (workspace, prompt, destination, model, timeout, schema) => {
        workspaces.push(workspace);
        assert.equal(dirname(dirname(destination)), output);
        mkdirSync(destination, { recursive: true });
        return schema ? JSON.stringify(Object.fromEntries(schema.required
          .map(key => [key, { pass: true, evidence: 'Observed test evidence' }]))) : 'candidate evidence';
      },
    });
    assert.equal(status, 0);
    assert.equal(dirname(output), join(HERE, 'results'));
    assert.deepEqual(readJSON(join(output, 'summary.json')).map(entry => entry.status), Array(cases.length).fill('pass'));
    assert.ok(workspaces.every(workspace => !existsSync(workspace)));
  } finally {
    if (output) rmSync(output, { recursive: true, force: true });
  }
});

test('actual skill has a single 49-word instruction; invalid bodies are rejected', () => {
  assert.equal(validateSkill(readFileSync(join(HERE, '../../.agents/skills/interview/SKILL.md'), 'utf8')), 49);
  for (const source of ['No metadata', '---\nname: interview\n---\n',
    '---\nname: interview\n---\nTwo\nlines',
    '---\nname: interview\n---\n' + 'word '.repeat(51)]) {
    assert.throws(() => validateSkill(source));
  }
});

for (const mode of ['pass', 'fail', 'error']) {
  test(`runner isolates fixtures, saves evidence, and reports ${mode.toUpperCase()}`, () => {
    const temp = mkdtempSync(join(tmpdir(), 'interview-run-test-'));
    const output = join(temp, 'results');
    const workspaces = [];
    const logs = [];
    let candidates = 0;
    let judges = 0;
    try {
      const status = main(['--output-dir', output, '--model', 'candidate-model',
        '--judge-model', 'judge-model', '--timeout', '12'], {
        log: line => logs.push(line),
        runProcess: () => ({ status: 0, stdout: 'codex test-version\n' }),
        invokeCall: (workspace, prompt, destination, model, timeout, schema) => {
          workspaces.push(workspace);
          mkdirSync(destination, { recursive: true });
          assert.equal(timeout, 12);
          if (!schema) {
            const scenario = cases[candidates++];
            assert.equal(prompt, scenario.prompt);
            assert.equal(model, 'candidate-model');
            assert.deepEqual(readdirSync(workspace).filter(name => name !== '.agents').sort(), [...scenario.files].sort());
            assert.ok(existsSync(join(workspace, '.agents/skills/interview/SKILL.md')));
            return 'candidate evidence';
          }
          const scenario = cases[judges++];
          assert.equal(model, 'judge-model');
          assert.deepEqual(readdirSync(workspace), []);
          const payload = JSON.parse(prompt.slice(prompt.indexOf('{')));
          assert.equal(payload.candidate_response, 'candidate evidence');
          assert.deepEqual(Object.keys(payload.files).sort(), [...scenario.files].sort());
          assert.deepEqual(schema.required, Object.keys(scenario.criteria));
          if (mode === 'error') return '{}'; // Valid JSON, invalid grading schema.
          return JSON.stringify(Object.fromEntries(Object.keys(scenario.criteria)
            .map(key => [key, { pass: mode === 'pass', evidence: 'Observed test evidence' }])));
        },
      });
      assert.equal(status, { pass: 0, fail: 1, error: 2 }[mode]);
      assert.equal(candidates, cases.length);
      assert.equal(judges, cases.length);
      assert.deepEqual(readJSON(join(output, 'summary.json')).map(entry => entry.status), Array(cases.length).fill(mode));
      assert.equal(readJSON(join(output, 'metadata.json')).skill_instruction_words, 49);
      assert.ok(existsSync(join(output, 'skill-snapshot/SKILL.md')));
      assert.deepEqual(readJSON(join(output, 'cases.json')), cases);
      for (const scenario of cases) {
        assert.ok(logs.some(line => line.startsWith(`${mode.toUpperCase()}: ${scenario.id}`)));
        assert.equal(existsSync(join(output, scenario.id, 'verdict.json')), mode !== 'error');
      }
      assert.ok(workspaces.every(workspace => !existsSync(workspace)));
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
}
