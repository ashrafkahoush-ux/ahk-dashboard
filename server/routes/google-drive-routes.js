// server/routes/google-drive-routes.js
import express from "express";
import { drive, testDriveAccess } from "../google-drive-oauth.js";

const router = express.Router();

// Simple test route to check auth and connectivity
router.get("/status", async (req, res) => {
  try {
    const result = await testDriveAccess();
    if (result.success) {
      res.json({ 
        ok: true, 
        message: "Google Drive Connected",
        user: result.user.emailAddress,
        displayName: result.user.displayName
      });
    } else {
      res.status(500).json({ ok: false, error: result.error });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Trigger sync - support both GET and POST
router.get("/sync", async (req, res) => {
  try {
    // basic test for now until full sync logic is ready
    const files = await drive.files.list({ pageSize: 10 });
    res.json({ ok: true, success: true, files: files.data.files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/sync", async (req, res) => {
  try {
    // basic test for now until full sync logic is ready
    const files = await drive.files.list({ pageSize: 10 });
    res.json({ ok: true, success: true, files: files.data.files });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
