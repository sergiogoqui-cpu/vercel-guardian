import { readFileSync } from "node:fs";
import vm from "node:vm";

// Normalize line endings first: a CRLF checkout (common on Windows, e.g.
// git's core.autocrlf) would otherwise break the literal "\n\n" blank-line
// match below, since \r sits between the two \n characters.
const source = readFileSync(new URL("./vercel-guardian.mjs", import.meta.url), "utf8").replace(
  /\r\n/g,
  "\n",
);
const match = source.match(
  /function redactUrlSecrets\(url\) \{[\s\S]*?\n\}\n\nfunction redactWebhook/u,
);

if (!match) {
  throw new Error("redactUrlSecrets function not found");
}

const functionSource = match[0].replace(/\n\nfunction redactWebhook$/u, "\n");
const sandbox = { URL };
vm.runInNewContext(
  `${functionSource}\nglobalThis.__redactUrlSecrets = redactUrlSecrets;`,
  sandbox,
  { filename: "redactUrlSecrets.extract.js" },
);

const redactUrlSecrets = sandbox.__redactUrlSecrets;
const cases = [
  ["query token", "https://example.test/a?token=dummy&ok=1", /token=\[redacted\]/],
  ["query secret", "https://example.test/a?secret=dummy", /secret=\[redacted\]/],
  ["query key", "https://example.test/a?key=dummy", /key=\[redacted\]/],
  ["query api-key", "https://example.test/a?api-key=dummy", /api-key=\[redacted\]/],
  ["query dd-api-key", "https://example.test/a?dd-api-key=dummy", /dd-api-key=\[redacted\]/],
  ["query x-api-key", "https://example.test/a?x-api-key=dummy", /x-api-key=\[redacted\]/],
  ["query access_token", "https://example.test/a?access_token=dummy", /access_token=\[redacted\]/],
  ["query authorization", "https://example.test/a?authorization=dummy", /authorization=\[redacted\]/],
  ["query auth", "https://example.test/a?auth=dummy", /auth=\[redacted\]/],
  ["query password", "https://example.test/a?password=dummy", /password=\[redacted\]/],
  ["query sig", "https://example.test/a?sig=dummy", /sig=\[redacted\]/],
  ["query signature", "https://example.test/a?signature=dummy", /signature=\[redacted\]/],
  ["query credential", "https://example.test/a?credential=dummy", /credential=\[redacted\]/],
  [
    "userinfo",
    "https://user:pass@example.test/path",
    /^https:\/\/redacted:redacted@example\.test\/path$/,
  ],
  [
    "slack services path",
    "https://hooks.slack.com/services/T01/B02/dummysecret",
    /\/services\/T01\/B02\/\[redacted\]$/,
  ],
  [
    "hooks path",
    "https://example.test/hooks/provider/project/dummysecret",
    /\/hooks\/provider\/project\/\[redacted\]$/,
  ],
  [
    "partial malformed",
    "not a url ?token=dummy /hooks/a/b/dummysecret",
    /token=\[redacted\].*\/hooks\/a\/b\/\[redacted\]/,
  ],
];

const failures = [];
for (const [name, input, expected] of cases) {
  const output = redactUrlSecrets(input);
  if (!expected.test(output)) {
    failures.push({ name, output });
  }
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`redactUrlSecrets isolated tests passed: ${cases.length}/${cases.length}`);
}
