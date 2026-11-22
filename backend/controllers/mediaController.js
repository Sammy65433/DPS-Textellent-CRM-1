import mongoose from "mongoose";
import Media from "../models/Media.js";

const DPS_SCOPE = "user123";

export async function uploadMedia(req, res) {
  const { filename, mimeType, data } = req.body ?? {};
  if (!filename || !mimeType || !data) {
    return res.status(400).json({ error: "filename, mimeType, and data (base64) are required." });
  }
  try {
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: "File too large (max 5MB)." });
    }
    const media = await Media.create({
      userId: DPS_SCOPE,
      filename: String(filename).trim().slice(0, 200),
      mimeType: String(mimeType).trim(),
      size: buffer.length,
      data: buffer,
    });
    return res.status(201).json({
      _id: media._id,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      createdAt: media.createdAt,
    });
  } catch (error) {
    console.error("Upload media error:", error);
    return res.status(500).json({ error: "Failed to upload media." });
  }
}

export async function getMedia(_req, res) {
  try {
    const items = await Media.find({ userId: DPS_SCOPE })
      .select("-data")
      .sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    console.error("Get media error:", error);
    return res.status(500).json({ error: "Failed to fetch media." });
  }
}

export async function getMediaFile(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid media ID." });
  }
  try {
    const media = await Media.findOne({ _id: req.params.id });
    if (!media) return res.status(404).json({ error: "Media not found." });
    res.set("Content-Type", media.mimeType);
    res.set("Content-Length", media.size);
    return res.send(media.data);
  } catch (error) {
    console.error("Get media file error:", error);
    return res.status(500).json({ error: "Failed to fetch media file." });
  }
}

export async function deleteMedia(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Invalid media ID." });
  }
  try {
    const deleted = await Media.findOneAndDelete({ _id: req.params.id, userId: DPS_SCOPE });
    if (!deleted) return res.status(404).json({ error: "Media not found." });
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete media error:", error);
    return res.status(500).json({ error: "Failed to delete media." });
  }
}
