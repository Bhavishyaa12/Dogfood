const Event = require("../models/event.model");
const { shortId } = require("../utils/id");

const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      starts_at,
      submissions_close,
      judging_close,
      tracks = [],
      prizes = [],
      rubric = [],
    } = req.body;
    if (!name || !starts_at || !submissions_close || !judging_close) {
      return res.status(400).json({
        success: false,
        message: "name, dates and deadline are required",
      });
    }
    if (!Array.isArray(rubric) || rubric.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one rubric criterion is required",
      });
    }
    const weight = rubric.reduce((n, c) => n + Number(c.weight || 0), 0);
    if (Math.abs(weight - 100) > 0.001) {
      return res
        .status(400)
        .json({ success: false, message: "Rubric weights must total 100" });
    }
    const event = await Event.create({
      id: shortId("evt"),
      name,
      description,
      starts_at,
      submissions_close,
      judging_close,
      tracks,
      prizes,
      rubric,
      created_by: req.user.userId,
      status: "open",
    });
    res.status(201).json({ success: true, event });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, events });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to list events" });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ id: req.params.id }).lean();
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to get event" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const allowed = [
      "name",
      "description",
      "starts_at",
      "submissions_close",
      "judging_close",
      "tracks",
      "prizes",
      "rubric",
      "status",
    ];
    const updates = {};
    for (const k of allowed)
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    if (updates.rubric) {
      const total = updates.rubric.reduce(
        (n, c) => n + Number(c.weight || 0),
        0,
      );
      if (Math.abs(total - 100) > 0.001)
        return res
          .status(400)
          .json({ success: false, message: "Rubric weights must total 100" });
    }
    const event = await Event.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to update event" });
  }
};

module.exports = { createEvent, listEvents, getEvent, updateEvent };
