const Project = require("../models/project.model");
const Team = require("../models/team.model");
const Event = require("../models/event.model");
const { shortId } = require("../utils/id");

const getOpenEvent = async (id) =>
  Event.findOne(id ? { id } : { status: { $in: ["open", "judging"] } }).sort({
    createdAt: -1,
  });

const createProject = async (req, res) => {
  try {
    const {
      event_id,
      team_id,
      track,
      title = "",
      summary = "",
      repo_url = "",
    } = req.body;
    const event = await getOpenEvent(event_id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    if (new Date() > event.submissions_close)
      return res
        .status(400)
        .json({ success: false, message: "Submissions are closed" });
    const team = await Team.findOne({
      id: team_id,
      event: event._id,
      members: req.user.userId,
    });
    if (!team)
      return res
        .status(403)
        .json({ success: false, message: "You are not a member of this team" });
    if (!event.tracks.some((t) => t.id === track))
      return res.status(400).json({ success: false, message: "Invalid track" });
    const project = await Project.create({
      id: shortId("prj"),
      event: event._id,
      team: team.name,
      teamRef: team._id,
      track,
      title,
      summary,
      repo_url,
      created_by: req.user.userId,
      status: "draft",
    });
    res.status(201).json({ success: true, project });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create project" });
  }
};

const getMine = async (req, res) => {
  const project = await Project.findOne({
    id: req.params.id,
    created_by: req.user.userId,
  }).lean();
  if (!project)
    return res
      .status(404)
      .json({ success: false, message: "Project not found" });
  res.json({ success: true, project });
};

const listMine = async (req, res) => {
  const projects = await Project.find({ created_by: req.user.userId })
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ success: true, projects });
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      id: req.params.id,
      created_by: req.user.userId,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    const event = await Event.findById(project.event);
    if (!event || new Date() > event.submissions_close)
      return res
        .status(400)
        .json({ success: false, message: "Project can no longer be edited" });
    if (project.status === "submitted" && req.body.submit !== false)
      return res
        .status(400)
        .json({ success: false, message: "Submitted project is locked" });
    for (const k of ["title", "summary", "repo_url", "track"])
      if (req.body[k] !== undefined) project[k] = req.body[k];
    await project.save();
    res.json({ success: true, project });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update project" });
  }
};

const submitProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      id: req.params.id,
      created_by: req.user.userId,
    });
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    const event = await Event.findById(project.event);
    if (!event || new Date() > event.submissions_close)
      return res
        .status(400)
        .json({ success: false, message: "Submissions are closed" });
    if (!project.title || !project.summary || !project.repo_url)
      return res.status(400).json({
        success: false,
        message: "Title, summary and repository are required",
      });
    project.status = "submitted";
    project.submitted_at = new Date();
    await project.save();
    res.json({ success: true, message: "Project submitted", project });
  } catch (e) {
    console.error("Submit score error:", e);

    // Distinguish error types
    if (e.code === 11000) {
      return res
        .status(409)
        .json({
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

module.exports = {
  createProject,
  getMine,
  listMine,
  updateProject,
  submitProject,
};
