You are performing the final merge of 4 feature branches into `feat/zephlo-chat-inline-element` in the FlunkieAI platform monorepo.

You are currently in the main worktree at /Users/innocentkithinji/research/website_agent on branch feat/zephlo-chat-inline-element. Branches todo/03-resend-invites and todo/04-forgot-password are ALREADY merged — do not merge them again.

Remaining branches (merge in this exact order, which minimizes conflicts):

  1. todo/06-admin-limits     (hooks into invite/usage paths from 03)
  2. todo/02-docs             (text-only)
  3. todo/01-landing          (landing rewrite)
  4. todo/05-examples-page    (extends landing from 01)

Each todo/* branch was worked on in isolation in /Users/innocentkithinji/research/website_agent/.claude-worktrees/<name>/ by a parallel agent. Each one created its own TODO.md (the base branch had it untracked). Each may have added alembic migrations; 03 added `api/alembic/versions/025_invite_resend_and_audit_log.py`.

=== GROUND RULES ===

- Work ONLY in /Users/innocentkithinji/research/website_agent (the main worktree). Do NOT cd into .claude-worktrees/*.
- Do NOT push. Do NOT deploy. Do NOT run destructive commands like `git reset --hard` on the branch unless absolutely necessary to recover from a bad merge, and explain why first in your output.
- Commit each merge with `--no-ff` and a clear message (e.g. "merge todo/06-admin-limits into feat/zephlo-chat-inline-element"). When you resolve conflicts, the merge commit message should briefly describe the conflict resolution (e.g. "merge: resolved alembic migration collision by renumbering 025 → 026").
- After resolving conflicts, always run `git diff --cached` BEFORE `git commit` to sanity-check what you're about to record.
- Use f-strings in any Python you touch. Refer to Agents by UUID, never numeric id. "Agent" not "chatbot".
- Juniors will maintain this — keep resolutions simple and explicit. No clever one-liners; prefer readable code.

=== PER-BRANCH MERGE PROCEDURE ===

For each branch in order:

Step 1. Inspect what's coming in:
    git log --oneline feat/zephlo-chat-inline-element..<branch>
    git diff --stat feat/zephlo-chat-inline-element..<branch>

Step 2. Start the merge:
    git merge --no-ff <branch> -m "merge <branch> into feat/zephlo-chat-inline-element"

Step 3. If conflict: DO NOT PANIC. Run `git status` and classify every conflict file. For each conflict, pick the right resolution strategy below:

   (a) TODO.md — expected on every merge. Resolve as a UNION of all checked boxes. Take the full file from whichever side is more complete and make sure every section that was ticked off in EITHER side is ticked off in the merged file. Keep only one copy of each section.

   (b) Alembic migrations (api/alembic/versions/NNN_*.py):
       - If two branches created the same NNN, rename the incoming branch's file to the next available number. Edit `down_revision` inside the renamed file to point to the tip migration on feat/zephlo-chat-inline-element. Run `grep -r down_revision api/alembic/versions/` to see the current chain and pick the head.
       - Verify the chain is still linear: `cd api && alembic history` should list every revision cleanly.
       - DO NOT run `alembic upgrade head` against a prod DB. Test it against a scratch container only if docker is available — otherwise skip and leave a note.

   (c) api/app/routers/*.py, api/app/services/*.py, api/app/models/*.py, api/app/schemas/*.py:
       - Read BOTH sides carefully. The conflict is usually additive — both sides added routes/methods to the same file. Keep both additions unless they duplicate functionality, in which case prefer the more recent / more complete version and note which was dropped.
       - If both sides edited the SAME function, read both and merge the logic. Do not just pick one side blindly.

   (d) api/app/config.py, .env.example, docker-compose.yml:
       - Usually additive (new env vars). Keep all added settings from both sides. Sort alphabetically if the file was already sorted.

   (e) api/pyproject.toml, api/requirements.txt, api/requirements-dev.txt:
       - Merge dependency lists — keep all added packages from both sides. Deduplicate. If versions disagree, prefer the stricter (newer minimum) constraint.

   (f) frontend/src/... (TSX, TS):
       - Conflicts are usually in routing tables, nav menus, hook exports, or shared type definitions. Keep both additions. If a component was rewritten on both sides, read both and merge; prefer the more feature-complete version.
       - For import-sort conflicts, just keep all imports and sort them.

   (g) frontend/package.json:
       - Merge `dependencies` and `devDependencies` — union of both sides. If versions disagree, prefer the newer.

   (h) landing/...:
       - 01 rewrote the landing site. 05 builds on top of 01 to add an examples page. When merging 05, most conflicts should be additive (new files/routes). If 05 references components that 01 introduced, keep 01's version.

   (i) docs/...:
       - Only 02 touches this materially. Should be conflict-free unless 01/05 touched it for links.

Step 4. After resolving each conflict file, add it and diff to verify:
    git add <file>
    git diff --cached -- <file>

Step 5. When all conflicts resolved:
    git status   # expect no unmerged paths
    git commit   # use a merge commit message summarizing the resolution

Step 6. Verify the build for the touched areas after each merge:
    - If api/ changed: `cd api && python -c "from app.main import app; print('api imports ok')"` (skip if a venv isn't available — just log that you skipped).
    - If frontend/ changed: `cd frontend && npm run build 2>&1 | tail -30` (skip if npm isn't available).
    - If landing/ changed: `cd landing && npm run build 2>&1 | tail -30` (skip if npm isn't available).
    - If docs/ has a build: run it. Otherwise spot-check that key markdown files still exist.
    - If migrations changed: `cd api && alembic history 2>&1 | tail -20` if alembic is available.

  Treat verification failures as real. If a build breaks, investigate and fix before moving to the next merge. If the failure is clearly pre-existing (not caused by your merge), note it and continue.

Step 7. Move to the next branch.

=== AT THE END ===

After all 4 merges succeed:

  a. Show the final log:  git log --oneline -15
  b. Show all merged branches:  git branch --merged feat/zephlo-chat-inline-element | grep todo/
  c. Show final TODO.md — confirm all 6 sections are fully checked off.
  d. Run one last end-to-end verification:
       - `cd api && alembic history | tail -30` (if alembic available)
       - `cd frontend && npm run build 2>&1 | tail -20` (if npm available)
       - `cd landing && npm run build 2>&1 | tail -20` (if npm available)
  e. Print a merge summary: per branch, how many conflicts, which files, one-line description of each resolution.
  f. Do NOT push. Do NOT delete the todo/* branches. Do NOT remove the worktrees. That's the user's call.

If at any point you get truly stuck on a conflict — e.g., the two sides fundamentally contradict and you genuinely can't pick a sensible merge — STOP that merge with `git merge --abort`, clearly log what failed and why, and move on to the next branch. Report the skipped branch at the end so the user can resolve it manually.

Start now. Be meticulous. Read each conflict in full before deciding. Keep the merged `feat/zephlo-chat-inline-element` in a working state at every step.
