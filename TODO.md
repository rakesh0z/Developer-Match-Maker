# TODO

## Done
- (none)

## To do
- [x] Fix `/api/issues` 500 by hardening Prisma query in `server/src/controllers/issues.controller.ts` (handle UNKNOWN difficulty, robust language filtering, add try/catch with error details).

- [ ] Restart server and verify `GET /api/issues` and `GET /api/issues?difficulty=UNKNOWN` no longer returns 500.

