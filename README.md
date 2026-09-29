# DOGFOOD 2026 Portal

A self-hostable hackathon submission and judging platform implementing **T1 and T2** of the DOGFOOD 2026 specification.

Built with the **MERN stack** (MongoDB, Express, React, Node.js).

## Run

```bash
docker compose up --build
```

That's it

The Docker Compose stack starts a local MongoDB database, seeds the database with demo/fixture data, starts the backend API and serves the React frontend.

The frontend is available at:

```text
http://localhost:8080
```

The stack is designed to run locally without hosted APIs, hosted databases, OAuth providers, or other external runtime services.

### Re-seeding

Seeding is handled by a dedicated one-shot Docker Compose service

To re-seed the database:

```bash
docker compose run --rm seed
```

Then restart the backend if necessary:

```bash
docker compose restart backend
```

Note - The seed process uses fixed IDs and upserts, so running it again does not intentionally create duplicate fixture records

## T1 — Core Platform

* Authentication and sessions
* Participant, judge, organizer, and admin roles
* Event creation with configurable dates, tracks, and prizes
* Team creation and invite links
* Draft project creation and editing
* Deadline-enforced project submission
* Public searchable/filterable project gallery

## T2 — Judging

* Judge invitations
* Explicit judge/project assignments
* Weighted scoring rubric configuration
* Backend-enforced judge score isolation
* Organizer judging progress dashboard
* Cross-judge score normalization
* Organizer CSV export

Judge isolation is enforced by the backend/API rather than only by the frontend. A judge attempting to access another judge's scores is rejected with an authorization error

## Acceptance

The repository includes `.dogfood.toml` containing the portal URL, claimed tiers, authentication headers, and acceptance-test routes.

Run the official acceptance checker:

```bash
python3 run.py .dogfood.toml > acceptance-report.txt
```

The seeded portal provides deterministic acceptance credentials/session headers for:

* Organizer
* Judge A
* Judge B
* Participant

The acceptance tests verify the public gallery, submission deadline enforcement, judge score access, backend judge isolation, participant role isolation, and organizer CSV export.

The seed process loads the fixture data into the application's schema, including:

* Event
* Tracks
* Judges
* Teams
* Projects
* Scores

If the official fixture file is not present, the seed process creates a small deterministic offline demo dataset so that the application can still start and be demonstrated locally.

## Offline Operation

The application is designed to operate entirely on a local machine.

Runtime dependencies are limited to the local:

* MongoDB container
* Node/Express backend container
* React/Nginx frontend container

There are no hosted APIs, hosted databases, OAuth providers, or external runtime services.

Note - For a completely disconnected machine, the required Docker base images and npm dependencies must already be available locally.

## License

This project is open source under the **MIT License**.

See [`LICENSE`](LICENSE) for the full license text.

