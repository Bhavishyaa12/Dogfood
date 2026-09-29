# Judging model

## Weighted rubric

Organizers configure criteria whose weights must total exactly 100%. Judges enter a 0–5 score for every configured criterion.

For a judge, the raw project score is:

`raw = Σ(score_i × weight_i / 100)`

This produces a 0–5 weighted average.

## Backend isolation

`GET /api/judge/scores` never accepts a judge identity from the client. The backend takes the authenticated judge identity from the access token and queries only that judge's scores. A request made by Judge B to `?judge=judge_a` therefore gives an error of authorization

The same rule applies to score submission: a judge can only submit for a project for which a `JudgeAssignment` exists for that authenticated judge.

## Cross-judge normalization

The organizer dashboard computes normalization per judge.

For each judge with at least one completed score:

1. Calculate that judge's mean raw score.
2. Calculate the population standard deviation of that judge's raw scores.
3. Convert each score to a z-score.
4. Map it to a 0–5 scale using `2.5 + 0.75*z`.
5. Clamp the result to `[0, 5]`.

The center is therefore 2.5 and a judge's one-standard-deviation-above project maps to 3.25. A judge with zero variance receives 2.5 for all their normalized scores because there is no meaningful relative spread to normalize.

The implementation currently calculates normalized values for organizer progress and CSV export. It does not overwrite the original raw score, so the audit trail retains the judge's actual submitted score.

## Assignment

Organizers create judge invitations and explicitly assign judges to submitted projects. The database has a unique `(event, judge, project)` constraint, preventing duplicate assignments

## Export

Organizer/admin access to `/api/export.csv` returns project, judge, raw score, normalized score and comment data. Judge and participant roles are rejected by backend middleware
