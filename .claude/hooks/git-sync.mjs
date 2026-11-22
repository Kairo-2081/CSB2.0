#!/usr/bin/env node
// Keeps several agents working in this repo in step with GitHub.
//   node git-sync.mjs pull  -> rebase the current branch onto its remote copy
//   node git-sync.mjs push  -> commit changed files, rebase, then push
// A lock in .git serialises runs so two agents never touch the index at once.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const mode = process.argv[2] === "push" ? "push" : "pull";
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PROTECTED = new Set(["main", "master"]);
// Never committed automatically: local data, secrets, personal settings
const EXCLUDE = [":(exclude)*.db", ":(exclude).env*", ":(exclude).claude/settings.local.json"];

const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const tryGit = (...args) => { try { return git(...args); } catch { return null; } };
const notes = [];
const say = (message) => notes.push(message);
process.on("exit", () => { if (notes.length) process.stdout.write(JSON.stringify({ systemMessage: `git sync: ${notes.join("; ")}` })); });

const gitDir = tryGit("rev-parse", "--absolute-git-dir");
if (!gitDir) process.exit(0);

// ---- lock (mkdir is atomic); stale after 2 minutes
const lock = path.join(gitDir, "claude-sync.lock");
const deadline = Date.now() + 45_000;
for (;;) {
  try { fs.mkdirSync(lock); break; } catch {
    try { if (Date.now() - fs.statSync(lock).mtimeMs > 120_000) { fs.rmSync(lock, { recursive: true, force: true }); continue; } } catch {}
    if (Date.now() > deadline) { say("another agent is still syncing, skipped this time"); process.exit(0); }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
  }
}
const release = () => fs.rmSync(lock, { recursive: true, force: true });
process.on("exit", release);

const busy = ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD"].some((f) => fs.existsSync(path.join(gitDir, f)));
if (busy) { say("a rebase or merge is in progress, skipped"); process.exit(0); }

const branch = tryGit("symbolic-ref", "--short", "HEAD");
if (!branch) process.exit(0); // detached HEAD

const hasRemoteBranch = () => tryGit("ls-remote", "--exit-code", "--heads", "origin", branch) !== null;

function rebaseOntoRemote() {
  if (!hasRemoteBranch()) return true;
  if (tryGit("fetch", "--quiet", "origin", branch) === null) { say("could not reach origin, working offline"); return false; }
  const behind = Number(tryGit("rev-list", "--count", `HEAD..origin/${branch}`) || 0);
  if (!behind) return true;
  if (tryGit("rebase", "--autostash", `origin/${branch}`) === null) {
    tryGit("rebase", "--abort");
    say(`conflict while rebasing ${branch} onto origin, left it for you to resolve`);
    return false;
  }
  say(`pulled ${behind} new commit${behind === 1 ? "" : "s"} into ${branch}`);
  return true;
}

if (mode === "pull") { rebaseOntoRemote(); process.exit(0); }

// ---- push mode
if (PROTECTED.has(branch)) {
  const dirty = tryGit("status", "--porcelain", "--", ".", ...EXCLUDE);
  if (dirty) say(`on ${branch}, so changes were left uncommitted; switch to a feature branch`);
  process.exit(0);
}

tryGit("add", "-A", "--", ".", ...EXCLUDE);
const staged = (tryGit("diff", "--cached", "--name-only") || "").split("\n").filter(Boolean);
if (staged.length) {
  const names = staged.slice(0, 3).map((f) => path.basename(f)).join(", ");
  const more = staged.length > 3 ? ` and ${staged.length - 3} more` : "";
  const body = staged.map((f) => `- ${f}`).join("\n");
  if (tryGit("commit", "--quiet", "-m", `Sync ${names}${more}`, "-m", body) === null) {
    say("commit failed, changes left staged");
    process.exit(0);
  }
}

// Another agent may push between our rebase and our push, so retry a few times
for (let attempt = 1; ; attempt++) {
  if (!rebaseOntoRemote()) process.exit(0);
  const ahead = hasRemoteBranch() ? Number(tryGit("rev-list", "--count", `origin/${branch}..HEAD`) || 0) : 1;
  if (!ahead) process.exit(0);
  if (tryGit("push", "--quiet", "-u", "origin", branch) !== null) break;
  if (attempt === 3) { say(`push of ${branch} was rejected 3 times, try again later`); process.exit(0); }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000 * attempt);
}
say(`${staged.length ? `committed ${staged.length} file${staged.length === 1 ? "" : "s"} and ` : ""}pushed ${branch}`);
