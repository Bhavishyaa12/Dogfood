const Team = require("../models/team.model");
const Event = require("../models/event.model");
const { shortId, token } = require("../utils/id");

const createTeam = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.body.event_id });
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    if (new Date() > event.submissions_close)
      return res
        .status(400)
        .json({ success: false, message: "Team formation is closed" });
    const team = await Team.create({
      id: shortId("tm"),
      event: event._id,
      name: req.body.name,
      owner: req.user.userId,
      members: [req.user.userId],
      inviteToken: token(),
    });
    res.status(201).json({
      success: true,
      team,
      inviteUrl: `/team/invite/${team.inviteToken}`,
    });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ success: false, message: "Team id collision, retry" });
    res.status(500).json({ success: false, message: "Failed to create team" });
  }
};

const inviteInfo = async (req, res) => {
  const team = await Team.findOne({ inviteToken: req.params.token })
    .select("+inviteToken")
    .populate("event", "id name submissions_close")
    .lean();
  if (!team)
    return res
      .status(404)
      .json({ success: false, message: "Invite not found" });
  res.json({
    success: true,
    team: { id: team.id, name: team.name, event: team.event },
  });
};

const joinTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ inviteToken: req.params.token }).select(
      "+inviteToken",
    );
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Invite not found" });
    const event = await Event.findById(team.event);
    if (!event || new Date() > event.submissions_close)
      return res
        .status(400)
        .json({ success: false, message: "Team invite is closed" });
    if (!team.members.some((m) => m.toString() === req.user.userId))
      team.members.push(req.user.userId);
    await team.save();
    res.json({ success: true, message: "Joined team", team });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to join team" });
  }
};

const myTeams = async (req, res) => {
  const teams = await Team.find({ members: req.user.userId })
    .populate("event", "id name submissions_close")
    .lean();
  res.json({ success: true, teams });
};

module.exports = { createTeam, inviteInfo, joinTeam, myTeams };
