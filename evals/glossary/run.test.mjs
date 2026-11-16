import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkResponse, main } from './run.mjs';

const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
const proposal = 'Allow users to create shortened URLs pointing to a **destination**. Each generated URL must qualify as an **active short link** before being offered for use. Apply these requirements during creation and redirection so users can reliably share links and recipients can consistently reach the intended resource through the shortening service.';

test('checks exact word count and every glossary occurrence', () => {
  assert.ok(Object.values(checkResponse(proposal)).every(item => item.pass));
  assert.equal(checkResponse(proposal + ' Extra.').word_count.pass, false);
  assert.equal(checkResponse(proposal.replace('**destination**', 'destination')).bold_terms.pass, false);
  assert.equal(checkResponse(proposal + ' destination').bold_terms.pass, false);
  assert.equal(checkResponse(proposal.replace('**destination**', 'target')).bold_terms.pass, false);
  assert.equal(checkResponse('').word_count.pass, false);
});

for (const mode of ['pass', 'semantic-fail', 'format-fail', 'error', 'execution-error']) {
  test(`isolates cases, persists evidence, and cleans up: ${mode}`, () => {
    const temp = mkdtempSync(join(tmpdir(), 'glossary-test-'));
    const output = join(temp, 'results');
    const workspaces = [];
    let candidates = 0;
    let judges = 0;
    try {
      const status = main(['--output-dir', output], {
        log: () => {},
        runProcess: () => ({ status: 0, stdout: 'test-version' }),
        invokeCall: (workspace, prompt, destination, model, timeout, schema) => {
          workspaces.push(workspace);
          mkdirSync(destination, { recursive: true });
          if (!schema) {
            const scenario = cases[candidates++];
            for (const file of scenario.files) assert.ok(existsSync(join(workspace, file)));
            assert.deepEqual(readdirSync(join(workspace, 'docs/glossary')), ['domain.md']);
            assert.ok(existsSync(join(workspace, '.agents/skills/glossary/SKILL.md')));
            if (mode === 'execution-error') throw new Error('CLI unavailable');
            return mode === 'format-fail' ? proposal + ' Extra.' : proposal;
          }
          const scenario = cases[judges++];
          assert.deepEqual(readdirSync(workspace), []);
          const payload = JSON.parse(prompt.slice(prompt.indexOf('{')));
          assert.deepEqual(Object.keys(payload.files), scenario.files);
          if (mode === 'error') return '{}';
          return JSON.stringify(Object.fromEntries(schema.required.map(key =>
            [key, { pass: mode !== 'semantic-fail', evidence: 'Test evidence' }])));
        },
      });
      const expected = mode === 'pass' ? 0 : mode.endsWith('error') ? 2 : 1;
      assert.equal(status, expected);
      const summary = JSON.parse(readFileSync(join(output, 'summary.json'), 'utf8'));
      assert.deepEqual(summary.map(item => item.status), cases.map(() => ['pass', 'fail', 'error'][expected]));
      assert.ok(workspaces.every(workspace => !existsSync(workspace)));
      assert.ok(existsSync(join(output, 'skill-snapshot/SKILL.md')));
      if (expected !== 2) {
        const verdict = JSON.parse(readFileSync(join(output, cases[0].id, 'verdict.json'), 'utf8'));
        assert.equal(verdict.word_count.pass, mode !== 'format-fail');
      }
    } finally { rmSync(temp, { recursive: true, force: true }); }
  });
}
