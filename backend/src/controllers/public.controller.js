const Project = require("../models/project.model");
const Event = require("../models/event.model");

const publicGallery = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const track = (req.query.track || "").trim();
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = page * limit;

    const filter = { status: "submitted" };
    if (track) filter.track = track;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } },
        { team: { $regex: q, $options: "i" } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select("-_id -__v")
        .sort({ submitted_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    const tracks = await Project.distinct("track", { status: "submitted" });

    return res.status(200).json({
      success: true,
      count: projects.length,
      total,
      page,
      limit,
      hasMore: (page + 1) * limit < total,
      projects,
      tracks,
    });
  } catch (error) {
    console.error("Gallery error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch gallery" });
  }
};

module.exports = publicGallery;
