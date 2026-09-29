const crypto = require("crypto");
const Event = require("../models/event.model");
const User = require("../models/user.model");
const Project = require("../models/project.model");
const JudgeAssignment = require("../models/judge-assignment.model");
const JudgeInvitation = require("../models/judge-invitation.model");
const Score = require("../models/score.model");

const inviteJudge = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.body.event_id });
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    const email = req.body.email?.trim().toLowerCase();
    if (!email || !email.includes("@") || email.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Valid email address required",
      });
    }
    const existing = await User.findOne({ email });
    const invitation = await JudgeInvitation.create({
      event: event._id,
      email,
      judge: existing?._id || null,
      token: crypto.randomBytes(24).toString("hex"),
    });
    res.status(201).json({
      success: true,
      invitation,
      inviteUrl: `/judge/invite/${invitation.token}`,
    });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ success: false, message: "Judge invitation already exists" });
    res.status(500).json({ success: false, message: "Failed to invite judge" });
  }
};

const acceptJudge = async (req, res) => {
  const invitation = await JudgeInvitation.findOne({
    token: req.params.token,
    status: "pending",
  });
  if (!invitation)
    return res
      .status(404)
      .json({ success: false, message: "Invitation not found" });
  invitation.judge = req.user.userId;
  invitation.status = "accepted";
  await invitation.save();
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { role: "judge" },
    { returnDocument: "after" },
  ).select("-password");
  res.json({ success: true, message: "Judge invitation accepted", user });
};

const assignJudge = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.body.event_id });
    const judge = await User.findOne({ _id: req.body.judge_id, role: "judge" });
    const project = await Project.findOne({
      id: req.body.project_id,
      event: event?._id,
      status: "submitted",
    });
    if (!event || !judge || !project)
      return res.status(404).json({
        success: false,
        message: "Event, judge or submitted project not found",
      });
    const a = await JudgeAssignment.create({
      event: event._id,
      judge: judge._id,
      project: project._id,
      invited_by: req.user.userId,
    });
    res.status(201).json({ success: true, assignment: a });
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({
        success: false,
        message: "Judge is already assigned to this project",
      });
    res.status(500).json({ success: false, message: "Failed to assign judge" });
  }
};

const myAssignments = async (req, res) => {
  try {
    const assignments = await JudgeAssignment.find({ judge: req.user.userId })
      .populate("project", "id title summary repo_url team track submitted_at")
      .populate("event", "id name rubric")
      .lean();

    const valid = assignments.filter((a) => a.project && a.event);

    res.json({ success: true, count: valid.length, assignments: valid });
  } catch (e) {
    console.error("Get assignments error:", e);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch assignments" });
  }
};
const getScores = async (req, res) => {
  try {
    if (req.query.judge) {
      return res.status(403).json({
        success: false,
        message: "Judges cannot request another judge's scores",
      });
    }
    const filter = { judge: req.user.userId };
    if (req.query.event) {
      const event = await Event.findOne({ id: req.query.event });
      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Event not found" });
      }
      filter.event = event._id;
    }
    const scores = await Score.find(filter)
      .populate("project", "id title team track")
      .lean();
    res.json({ success: true, scores });
  } catch (e) {
    console.error("Get scores error:", e);
    res.status(500).json({ success: false, message: "Failed to fetch scores" });
  }
};

const submitScore = async (req, res) => {
  try {
    const project = await Project.findOne({ id: req.body.project_id });
    const assignment = project
      ? await JudgeAssignment.findOne({
          judge: req.user.userId,
          project: project._id,
        }).populate("event")
      : null;
    if (!project || !assignment)
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this project",
      });
    const event = assignment.event;
    if (new Date() > event.judging_close)
      return res
        .status(400)
        .json({ success: false, message: "Judging is closed" });
    const criteria = event.rubric;
    const input = req.body.criteria || {};

    const missingCriteria = criteria.filter((c) => !(c.key in input));
    if (missingCriteria.length) {
      return res.status(400).json({
        success: false,
        message: `Missing scores for: ${missingCriteria.map((c) => c.key).join(", ")}`,
      });
    }
    if (req.body.comment && req.body.comment.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 2000 characters",
      });
    }

    for (const c of criteria) {
      const value = Number(input[c.key]);
      if (!Number.isFinite(value) || value < 0 || value > 5)
        return res.status(400).json({
          success: false,
          message: `${c.key} must be between 0 and 5`,
        });
    }
    const raw_total = criteria.reduce(
      (sum, c) => sum + (Number(input[c.key]) * Number(c.weight)) / 100,
      0,
    );
    const score = await Score.findOneAndUpdate(
      { event: event._id, judge: req.user.userId, project: project._id },
      {
        $set: {
          criteria: input,
          raw_total,
          comment: req.body.comment || "",
          submitted_at: new Date(),
        },
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
    );
    await JudgeAssignment.updateOne(
      { event: event._id, judge: req.user.userId, project: project._id },
      { $set: { status: "completed" } },
    );
    res.status(201).json({ success: true, score });
  } catch (e) {
    console.error("Submit score error:", e);

    // Distinguish error types
    if (e.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Score already submitted for this project",
      });
    }
    if (e.message?.includes("Cast to ObjectId failed")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project or event ID" });
    }

    return res
      .status(500)
      .json({ success: false, message: "Failed to save score" });
  }
};

function normalizedRows(scores) {
  const byJudge = new Map();
  for (const s of scores) {
    if (!byJudge.has(String(s.judge))) byJudge.set(String(s.judge), []);
    byJudge.get(String(s.judge)).push(s);
  }
  for (const rows of byJudge.values()) {
    const vals = rows.map((x) => x.raw_total);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance =
      vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const sd = Math.sqrt(variance);
    for (const s of rows) {
      s.normalized_total =
        sd === 0
          ? 2.5
          : Math.max(0, Math.min(5, 2.5 + 0.75 * ((s.raw_total - mean) / sd)));
    }
  }
  return scores;
}

const organizerDashboard = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.params.eventId });
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const [assignments, scores, projects] = await Promise.all([
      JudgeAssignment.find({ event: event._id }).lean(),
      Score.find({ event: event._id }).lean(),
      Project.find({ event: event._id, status: "submitted" })
        .select("id title team track")
        .lean(),
    ]);

    const normalized = normalizedRows(scores);
    const byProject = {};
    for (const s of normalized) {
      const p = String(s.project);
      if (!byProject[p]) byProject[p] = [];
      byProject[p].push(s.normalized_total);
    }

    const progress = projects.map((p) => ({
      ...p,
      completed: byProject[String(p._id)]?.length || 0,
      assigned: assignments.filter((a) => String(a.project) === String(p._id))
        .length,
      average: byProject[String(p._id)]
        ? byProject[String(p._id)].reduce((a, b) => a + b, 0) /
          byProject[String(p._id)].length
        : null,
    }));

    res.json({
      success: true,
      event: { id: event.id, name: event.name },
      summary: {
        assignments: assignments.length,
        scores: scores.length,
        projects: projects.length,
        completionRate: assignments.length
          ? Math.round((scores.length / assignments.length) * 100)
          : 0,
      },
      projects: progress,
    });
  } catch (e) {
    console.error("Organizer dashboard error:", e);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard" });
  }
};
const exportCsv = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.params.eventId }).lean();
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    const [projects, scores] = await Promise.all([
      Project.find({ event: event._id, status: "submitted" }).lean(),
      Score.find({ event: event._id }).lean(),
    ]);

    const normalized = normalizedRows(scores);
    const lines = [
      [
        "project_id",
        "title",
        "team",
        "judge_id",
        "raw_score",
        "normalized_score",
        "comment",
      ]
        .map(csv)
        .join(","),
    ];

    for (const s of normalized) {
      const p = projects.find((x) => String(x._id) === String(s.project));
      lines.push(
        [
          p?.id,
          p?.title,
          p?.team,
          s.judge,
          s.raw_total,
          s.normalized_total ?? "",
          s.comment,
        ]
          .map(csv)
          .join(","),
      );
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="dogfood-results.csv"',
    );
    res.status(200).send(lines.join("\n"));
  } catch (e) {
    console.error("CSV export error:", e);
    res.status(500).json({ success: false, message: "Failed to export CSV" });
  }
};
const csv = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;

module.exports = {
  inviteJudge,
  acceptJudge,
  assignJudge,
  myAssignments,
  getScores,
  submitScore,
  organizerDashboard,
  exportCsv,
};
