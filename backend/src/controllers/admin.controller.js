const userModel = require("../models/user.model");

const getUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

const patchUsers = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedUpdates = ["name", "email", "role"];

    const updates = {};

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    const user = await userModel
      .findByIdAndUpdate(
        id,
        { $set: updates },
        {
          returnDocument: "after",
          runValidators: true,
        },
      )
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Patch user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

const deleteUsers = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  patchUsers,
  deleteUsers,
};
