# TODO - GitHub skill graph (auto sync after login)

- [x] Update `server/src/controllers/auth.controller.ts` to persist GitHub `accessToken` into Prisma `User.accessToken` during OAuth callback upsert.


- [x] Extend `server/src/services/github.service.ts`:
  - [x] Add `getRepoLanguages(owner, repo, token)`


  - [x] Add aggregator to compute language bytes totals across repos
  - [x] Convert bytes totals into skill scores (percentages)
- [ ] Add skill sync + read endpoints:
  - [ ] Create `server/src/controllers/skills.controller.ts` with:
    - [ ] POST `/api/users/sync-skills`
    - [ ] GET `/api/users/skills`
  - [ ] Create `server/src/routes/users.routes.ts`
  - [ ] Register routes in `server/src/app.ts`
- [x] Auto-sync skills immediately after successful GitHub login:
  - [x] Call skill generation/sync from `githubCallback` after upsert.


- [ ] Frontend dashboard:
  - [ ] Install `recharts` in `client`
  - [ ] Update `client/src/App.tsx` to fetch `GET /api/users/skills` and render a bar chart.
- [x] Run migrations + verify end-to-end flow.

