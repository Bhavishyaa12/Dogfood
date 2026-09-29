const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./src/config/db");
const config = require("./src/config/config");
const User = require("./src/models/user.model");
const Session = require("./src/models/session.model");
const Event = require("./src/models/event.model");
const Team = require("./src/models/team.model");
const Project = require("./src/models/project.model");
const Score = require("./src/models/score.model");
const { shortId, token } = require("./src/utils/id");

const fixturePath = path.join(__dirname, "fixtures.json");
const fixture = fs.existsSync(fixturePath)
  ? JSON.parse(fs.readFileSync(fixturePath, "utf8"))
  : null;

const accounts = [
  {
    _id: "000000000000000000000001",
    name: "DOGFOOD Organizer",
    email: "organizer@dogfood.local",
    password: "DogfoodOrg123!",
    role: "organizer",
  },
  {
    _id: "000000000000000000000002",
    name: "DOGFOOD Admin",
    email: "admin@dogfood.local",
    password: "DogfoodAdmin123!",
    role: "admin",
  },
  {
    _id: "000000000000000000000003",
    name: "DOGFOOD Participant",
    email: "participant@dogfood.local",
    password: "DogfoodPart123!",
    role: "participant",
  },
  {
    _id: "000000000000000000000004",
    name: "Ada Judge",
    email: "ada@example.org",
    password: "DogfoodJudge123!",
    role: "judge",
  },
  {
    _id: "000000000000000000000005",
    name: "Grace Judge",
    email: "grace@example.org",
    password: "DogfoodJudge123!",
    role: "judge",
  },
];

async function upsertUser(a) {
  const password = await bcrypt.hash(a.password, 12);
  const filter = a._id
    ? { _id: new mongoose.Types.ObjectId(a._id) }
    : { email: a.email };
  return User.findOneAndUpdate(
    filter,
    { $set: { name: a.name, email: a.email, password, role: a.role } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}
async function seed() {
  await connectDB();
  const users = {};
  for (const a of accounts) users[a.email] = await upsertUser(a);
  const fixtureJudgeUsers = {};
  for (const j of fixture?.judges || []) {
    const email = (j.email || `${j.id}@dogfood.local`).toLowerCase();
    fixtureJudgeUsers[j.id] = await upsertUser({
      name: j.name || j.id,
      email,
      password: "DogfoodJudge123!",
      role: "judge",
    });
  }

  let event;
  if (fixture?.event) {
    event = await Event.findOneAndUpdate(
      { id: fixture.event.id },
      {
        $set: {
          id: fixture.event.id,
          name: fixture.event.name,
          starts_at: fixture.event.starts_at || new Date(),
          submissions_close: fixture.event.submissions_close,
          judging_close:
            fixture.event.judging_close || fixture.event.submissions_close,
          tracks: fixture.tracks || [],
          prizes: fixture.prizes || [],
          rubric: fixture.rubric || [
            {
              key: "functionality",
              name: "Functionality",
              description: "How completely the project works as submitted",
              weight: 40,
            },
            {
              key: "quality",
              name: "Quality",
              description: "Engineering quality, clarity and maintainability",
              weight: 35,
            },
            {
              key: "innovation",
              name: "Innovation",
              description: "Originality and quality of the approach",
              weight: 25,
            },
          ],
          created_by: users["organizer@dogfood.local"]._id,
          status:
            new Date(fixture.event.submissions_close) < new Date()
              ? "closed"
              : "open",
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  } else {
    event = await Event.findOneAndUpdate(
      { id: "evt_demo" },
      {
        $set: {
          id: "evt_demo",
          name: "DOGFOOD 2026 Demo Event",
          starts_at: new Date(Date.now() - 86400000),
          submissions_close: new Date(Date.now() + 7 * 86400000),
          judging_close: new Date(Date.now() + 14 * 86400000),
          tracks: [
            { id: "trk_01", name: "Developer tools" },
            { id: "trk_02", name: "Open source" },
          ],
          prizes: [
            { place: "1st", amount: 800 },
            { place: "2nd", amount: 500 },
          ],
          rubric: [
            {
              key: "functionality",
              name: "Functionality",
              description: "Works as submitted",
              weight: 40,
            },
            {
              key: "quality",
              name: "Code quality",
              description: "Maintainability and engineering quality",
              weight: 25,
            },
            {
              key: "impact",
              name: "Impact",
              description: "Usefulness and user value",
              weight: 20,
            },
            {
              key: "innovation",
              name: "Innovation",
              description: "Originality and design choices",
              weight: 15,
            },
          ],
          created_by: users["organizer@dogfood.local"]._id,
          status: "open",
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  if (fixture?.teams?.length) {
    for (const t of fixture.teams) {
      const memberIds = [];
      for (const emailRaw of t.members || []) {
        const email = String(emailRaw).toLowerCase();
        let member = await User.findOne({ email });
        if (!member) {
          const display =
            String(email.split("@")[0])
              .replace(/[._-]+/g, " ")
              .replace(/\b\w/g, (m) => m.toUpperCase())
              .slice(0, 15) || "Participant";
          member = await upsertUser({
            name: display,
            email,
            password: "DogfoodPart123!",
            role: "participant",
          });
        }
        memberIds.push(member._id);
      }
      const owner = memberIds[0] || users["participant@dogfood.local"]._id;
      await Team.findOneAndUpdate(
        { id: t.id },
        {
          $set: {
            id: t.id,
            event: event._id,
            name: t.name,
            owner,
            members: memberIds.length ? memberIds : [owner],
            inviteToken: token(),
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  }
  if (fixture?.projects?.length) {
    for (const p of fixture.projects) {
      const team = await Team.findOne({ id: p.team, event: event._id });
      await Project.findOneAndUpdate(
        { id: p.id },
        {
          $set: {
            id: p.id,
            event: event._id,
            team: p.team,
            teamRef: team?._id || null,
            track: p.track,
            title: p.title,
            summary: p.summary || "",
            repo_url: p.repo_url || "",
            submitted_at: p.submitted_at,
            status: "submitted",
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  } else {
    const team = await Team.findOneAndUpdate(
      { id: "tm_demo" },
      {
        $set: {
          id: "tm_demo",
          event: event._id,
          name: "Offline Builders",
          owner: users["participant@dogfood.local"]._id,
          members: [users["participant@dogfood.local"]._id],
          inviteToken: token(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    await Project.findOneAndUpdate(
      { id: "prj_demo" },
      {
        $set: {
          id: "prj_demo",
          event: event._id,
          team: team.name,
          teamRef: team._id,
          track: "trk_01",
          title: "Offline Judging Portal",
          summary: "A self-hostable hackathon submission and judging platform.",
          repo_url: "https://example.org/repo",
          submitted_at: new Date(),
          status: "submitted",
          created_by: users["participant@dogfood.local"]._id,
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  // Fixture scores are loaded when possible; demo scores make the organizer dashboard visible.
  const projects = await Project.find({
    event: event._id,
    status: "submitted",
  });
  const judges = Object.values(users).filter((u) => u.role === "judge");
  if (fixture?.scores?.length) {
    for (const fs of fixture.scores) {
      const judge = fixtureJudgeUsers[fs.judge];
      const project = await Project.findOne({
        id: fs.project,
        event: event._id,
      });
      if (!judge || !project) continue;
      const criteria = fs.criteria || {};
      const raw = event.rubric.reduce(
        (sum, c) =>
          sum + (Number(criteria[c.key] || 0) * Number(c.weight)) / 100,
        0,
      );
      await Score.findOneAndUpdate(
        { event: event._id, judge: judge._id, project: project._id },
        {
          $set: {
            event: event._id,
            judge: judge._id,
            project: project._id,
            criteria,
            raw_total: raw,
            comment: fs.comment || "",
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  } else if (projects.length && judges.length) {
    for (let i = 0; i < Math.min(projects.length, 2); i++) {
      const j = judges[i % judges.length],
        p = projects[i];
      const criteria = {};
      for (const c of event.rubric) criteria[c.key] = 4 - (i % 2);
      const raw = event.rubric.reduce(
        (s, c) => s + (criteria[c.key] * c.weight) / 100,
        0,
      );
      await Score.findOneAndUpdate(
        { event: event._id, judge: j._id, project: p._id },
        {
          $set: {
            event: event._id,
            judge: j._id,
            project: p._id,
            criteria,
            raw_total: raw,
            comment: "Seeded demo score",
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  }

  const JudgeAssignment = require("./src/models/judge-assignment.model");
  if (fixture?.scores?.length) {
    for (const fs of fixture.scores) {
      const judge = fixtureJudgeUsers[fs.judge];
      const project = await Project.findOne({
        id: fs.project,
        event: event._id,
      });
      if (!judge || !project) continue;
      await JudgeAssignment.findOneAndUpdate(
        { event: event._id, judge: judge._id, project: project._id },
        {
          $set: {
            event: event._id,
            judge: judge._id,
            project: project._id,
            invited_by: users["organizer@dogfood.local"]._id,
            status: "completed",
          },
        },
        { upsert: true, returnDocument: "after" },
      );
    }
  }

  // Give the acceptance judges a real assignment so their score endpoint is useful.
  const ada = users["ada@example.org"];
  const grace = users["grace@example.org"];
  if (projects.length) {
    if (ada)
      await JudgeAssignment.findOneAndUpdate(
        { event: event._id, judge: ada._id, project: projects[0]._id },
        {
          $set: {
            event: event._id,
            judge: ada._id,
            project: projects[0]._id,
            invited_by: users["organizer@dogfood.local"]._id,
            status: "completed",
          },
        },
        { upsert: true },
      );
    if (grace)
      await JudgeAssignment.findOneAndUpdate(
        {
          event: event._id,
          judge: grace._id,
          project: projects[Math.min(1, projects.length - 1)]._id,
        },
        {
          $set: {
            event: event._id,
            judge: grace._id,
            project: projects[Math.min(1, projects.length - 1)]._id,
            invited_by: users["organizer@dogfood.local"]._id,
            status: "completed",
          },
        },
        { upsert: true },
      );
  }

  // Keep repeated container starts deterministic.
  await Session.deleteMany({
    user: { $in: Object.values(users).map((u) => u._id) },
  });

  // Generate short-lived acceptance credentials as access-token cookies.
  const credentials = {};
  const credentialOrder = [
    ["organizer@dogfood.local", "org_000000000000000000000001"],
    ["ada@example.org", "jdg_a_000000000000000000000004"],
    ["grace@example.org", "jdg_b_000000000000000000000005"],
    ["participant@dogfood.local", "prt_000000000000000000000003"],
  ];
  for (const [key, sessionLabel] of credentialOrder) {
    const u = users[key];
    const access = jwt.sign(
      { userId: u._id.toString(), sessionId: sessionLabel, role: u.role },
      config.JWT_ACCESS_SECRET,
      { expiresIn: "30d" },
    );
    credentials[key] = access;
  }
  console.log("\nDOGFOOD seeded.");
  console.log("Organizer:", credentials["organizer@dogfood.local"]);
  console.log("Judge A:", credentials["ada@example.org"]);
  console.log("Judge B:", credentials["grace@example.org"]);
  console.log("Participant:", credentials["participant@dogfood.local"]);
  const tomlPath = path.join(__dirname, "..", ".dogfood.toml");
  if (fs.existsSync(tomlPath)) {
    let toml = fs.readFileSync(tomlPath, "utf8");
    toml = toml.replace(
      /organizer\s*=.*$/m,
      `organizer   = "Cookie: session=${credentials["organizer@dogfood.local"]}"`,
    );
    toml = toml.replace(
      /judge_a\s*=.*$/m,
      `judge_a     = "Cookie: session=${credentials["ada@example.org"]}"`,
    );
    toml = toml.replace(
      /judge_b\s*=.*$/m,
      `judge_b     = "Cookie: session=${credentials["grace@example.org"]}"`,
    );
    toml = toml.replace(
      /participant\s*=.*$/m,
      `participant = "Cookie: session=${credentials["participant@dogfood.local"]}"`,
    );
    fs.writeFileSync(tomlPath, toml);
  }
  await require("mongoose").disconnect();
}
seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
