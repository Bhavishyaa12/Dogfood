# Data Model

## Overview

The application stores data in MongoDB using Mongoose ODM. The schema separates fixture data (string IDs from the official DOGFOOD fixture file) from internal references (MongoDB ObjectIds), allowing seamless import/export while maintaining relational integrity.

## Collections

### User or Role

Represents a person in the system: organizer, judge, participant, or admin.

```
{
  _id: ObjectId                    // MongoDB internal ID
  name: string                     // Display name
  email: string                    // Unique email, used for login
  password: string                 // Bcrypt-hashed password
  role: enum                       // "organizer" | "judge" | "participant" | "admin"
  createdAt: date                  // ISO timestamp
  updatedAt: date                  // ISO timestamp
}
```

### Session

Stores JWT refresh tokens and session metadata for logout/revocation.

```
{
  _id: ObjectId
  user: ObjectId ref User          // User who owns this session
  refreshTokenHash: string         // Bcrypt hash of refresh token (never store raw)
  isValid: boolean                 // false if user logged out
  createdAt: date
  expiresAt: date                  // Refresh token expiry
}
```

### Event

A hackathon event with tracks prizes and judging rubric.

```
{
  _id: ObjectId
  id: string                       // Fixture ID from official fixtures.json
  name: string                     // Event name (ex. "DOGFOOD 2026")
  starts_at: date                  // Event start
  submissions_close: date          // Deadline for project submissions
  judging_close: date              // Deadline for judging
  tracks: [{                       // Tracks for projects
    id: string,
    name: string
  }]
  prizes: [{                       // Prize structure (optional)
    place: string,                 // "1st", "2nd", etc.
    amount: number
  }]
  rubric: [{                       // Scoring criteria
    key: string,                   // "functionality", "quality", etc.
    name: string,
    description: string,
    weight: number                 // 0–100, total must equal 100
  }]
  status: enum                     // "open" | "closed" | "judging" | "published"
  created_by: ObjectId ref User
  createdAt: date
  updatedAt: date
}
```

### Team

A group of participants working on a project together

```
{
  _id: ObjectId
  id: string                       // Fixture ID
  event: ObjectId ref Event
  name: string                     // Team name
  owner: ObjectId ref User         // Team lead
  members: [ObjectId ref User]     // All team members
  inviteToken: string              // UUID for invite link
  createdAt: date		   // ISO Timestamp
  updatedAt: date	           // ISO Timestamp
}
```

### Project

A submission to the hackathon

```
{
  _id: ObjectId
  id: string                       // Fixture ID
  event: ObjectId ref Event
  team: string                     // Fixture team ID (string, not ObjectId)
  teamRef: ObjectId ref Team       // Internal reference to team (if known)
  track: string                    // Fixture track ID
  title: string                    // Project title
  summary: string                  // One-line description
  repo_url: string                 // Repository URL
  submitted_at: date               // When submitted
  status: enum                     // "draft" | "submitted"
  created_by: ObjectId ref User    // Submitting user
  createdAt: date
  updatedAt: date
}
```

### JudgeAssignment

Explicit assignment of a judge to evaluate a specific project

```
{
  _id: ObjectId
  event: ObjectId ref Event
  judge: ObjectId ref User
  project: ObjectId ref Project
  status: enum                     // "assigned" | "invited" | "completed"
  invited_by: ObjectId ref User    // Who assigned this judge
  createdAt: date
  updatedAt: date
  
  // Compound unique index: (event, judge, project)
  // Prevents duplicate assignments
}
```

### JudgeInvitation

A time-limited invitation for a user to act as a judge for an event

```
{
  _id: ObjectId
  event: ObjectId ref Event
  judge: ObjectId ref User         // User invited as judge
  status: enum                     // "pending" | "accepted" | "declined"
  inviteToken: string              // UUID, used in invitation link
  expiresAt: date                  // When invite expires
  invited_by: ObjectId ref User    // Who sent the invitation
  createdAt: date
  updatedAt: date
}
```

### Score

A judge's rating of a project using the event's rubric

```
{
  _id: ObjectId
  event: ObjectId ref Event
  judge: ObjectId ref User         // Which judge submitted this
  project: ObjectId ref Project
  criteria: {                      // Scores for each rubric criterion
    functionality: number (0–5),
    quality: number (0–5),
    innovation: number (0–5),
    ...
  }
  raw_total: number                // Weighted average: Σ(score × weight / 100)
  normalized_total: number         // Z-score normalized to 0–5 scale
  comment: string                  // Judge's feedback (optional)
  createdAt: date
  updatedAt: date
  
  // Compound unique index: (event, judge, project)
  // One score per judge per project
}
```

---

## Import Path: Fixture Loading

The seed script (`seed.js`) loads the official DOGFOOD `fixtures.json` at application startup:

1. **Read** `fixtures.json` from `backend/fixtures.json`
2. **Parse** the fixture structure (event, tracks, judges, teams, projects, scores)
3. **Upsert** each record:
   - Use fixture `id` (string) to find existing records
   - If exists, update it; if not, create it
   - This makes seeding idempotent (safe to re-run)
4. **Map** fixture strings to MongoDB ObjectIds:
   - `teams.members` (email strings) → User lookups + team member arrays
   - `judges` (fixture judge objects) → User creation + judge assignments
   - `projects.team` (fixture team ID) → Project.teamRef lookup
5. **Compute** derived fields:
   - `scores.raw_total` = weighted sum of criteria
   - Fixture does not include `raw_total` or `normalized_total`; both are computed on import

### Fixture Structure (Input)

```json
{
  "event": {
    "id": "evt_01",
    "name": "Sample Hack 2026",
    "submissions_close": "2026-03-01T18:00:00Z"
  },
  "tracks": [
    { "id": "trk_01", "name": "Developer tools" }
  ],
  "judges": [
    { "id": "jdg_01", "name": "Ada Okonkwo", "email": "ada@example.org", "tracks": ["trk_01"] }
  ],
  "teams": [
    { "id": "tm_01", "name": "Nightshift", "members": ["ada@example.org"] }
  ],
  "projects": [
    {
      "id": "prj_01",
      "team": "tm_01",
      "track": "trk_01",
      "title": "Quiet Hours",
      "summary": "One line.",
      "repo_url": "https://example.org/repo",
      "submitted_at": "2026-02-28T22:14:00Z"
    }
  ],
  "scores": [
    {
      "judge": "jdg_01",
      "project": "prj_01",
      "criteria": { "functionality": 4, "quality": 3 },
      "comment": "Text, sometimes empty."
    }
  ]
}
```

---

## Export Path: CSV Generation

Organizers and admins can download judge scores as CSV via `GET /api/export.csv`

### CSV Structure 

```
project_id,project_title,team_id,track_id,judge_id,judge_name,raw_score,normalized_score,comment
prj_01,Quiet Hours,tm_01,trk_01,jdg_01,Ada Okonkwo,3.8,2.9,Excellent work
prj_01,Quiet Hours,tm_01,trk_01,jdg_02,Grace Smith,4.2,3.1,Missing documentation
...
```

**Columns:**
- `project_id`: Fixture project ID (string)
- `project_title`: Display title
- `team_id`: Fixture team ID
- `track_id`: Fixture track ID
- `judge_id`: Fixture judge ID (or MongoDB ObjectId.toString() if not in fixture)
- `judge_name`: Judge's name
- `raw_score`: Judge's weighted score (0–5)
- `normalized_score`: Z-score normalized score (0–5)
- `comment`: Judge's optional feedback

**Filtering:**
- Export includes all projects and scores for the event being viewed
- Organizer dashboard pre-filters by event
- Includes only completed (non-draft) projects
- One row per (project, judge) pair

---

## Key Design Decisions

### String IDs + ObjectIds

**Why:** The fixture file uses string IDs (e.g., `prj_01`, `jdg_02`). MongoDB wants ObjectIds for referential integrity. We dual-store:

- **Fixture data** stored as-is (string `id` field)
- **Internal refs** use ObjectId (e.g., `Project.teamRef`, `Score.judge`)

**Benefit:** Fixture import/export stays clean. Judges and organizers see readable fixture IDs in CSV/UI. Internal queries use fast ObjectId indices.

### Raw + Normalized Scores

**Why:** Audit trail. Judges' actual scores remain unchanged (raw_total). Normalized values are derived and re-computed on-demand. If normalization method changes, raw scores are still available.

**Process:**
1. Judge submits score → stored as `raw_total`
2. Organizer requests dashboard → `normalized_total` computed on-read
3. CSV export includes both columns

### Fixture ID + User Email → Judge Identity

**Why:** The fixture lists judges by email, not MongoDB ObjectId. On import:
1. Lookup or create User by email
2. Create JudgeAssignment linking User → Project
3. When a judge authenticates, their token is looked up by User._id
4. Score query uses authenticated User._id (not email, not fixture ID)

---

## Indices

```javascript
// Compound unique: prevents duplicate assignments
db.judgeassignments.createIndex({ event: 1, judge: 1, project: 1 }, { unique: true })

// Lookup scores by event + judge (for dashboard)
db.scores.createIndex({ event: 1, judge: 1 })

// Lookup projects by event + team (for submissions)
db.projects.createIndex({ event: 1, teamRef: 1 })

// Email lookup for login
db.users.createIndex({ email: 1 }, { unique: true })

// Session lookup by user
db.sessions.createIndex({ user: 1 })
```

---

## Migration & Backup

### Backup
```bash
docker compose exec mongo mongodump --archive=/data/db/backup.archive --gzip
docker cp dogfood-mongo:/data/db/backup.archive ./backup.archive
```

### Restore
```bash
docker cp backup.archive dogfood-mongo:/data/db/
docker compose exec mongo mongorestore --archive=/data/db/backup.archive --gzip
```

### Reset (Clear All Data)
```bash
docker compose down -v                 # Delete volume
docker compose up                      # Re-seed from scratch
```
