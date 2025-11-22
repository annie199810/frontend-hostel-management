require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");


const Room = require("./models/Room");
const Resident = require("./models/Resident");
const Maintenance = require("./models/Maintenance");
const Billing = require("./models/Billing");
const User = require("./models/User");

const app = express();


const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://hostelmanagementann.netlify.app",
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));




app.get("/api/users", async (req, res) => {
  try {
    const data = await User.find().sort({ createdAt: -1 });
    res.json({ ok: true, users: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load users" });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const body = req.body;
    if (!body.name || !body.email || !body.password) {
      return res.status(400).json({ ok: false, error: "All fields required" });
    }

    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || "Staff",
      status: body.status || "Active",
    });

    res.status(201).json({ ok: true, user });
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ ok: false, error: "Email already exists" });

    res.status(500).json({ ok: false, error: "Failed to create user" });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) return res.status(404).json({ ok: false, error: "User not found" });

    res.json({ ok: true, user: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ ok: false, error: "User not found" });

    res.json({ ok: true, deletedId: req.params.id });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to delete user" });
  }
});



app.get("/api/billing", async (req, res) => {
  try {
    const data = await Billing.find().sort({ createdAt: -1 });
    res.json({ ok: true, payments: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load billing" });
  }
});

app.post("/api/billing", async (req, res) => {
  try {
    const body = req.body;

    if (!body.residentName || !body.roomNumber || !body.amount || !body.month) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const doc = await Billing.create({
      residentName: body.residentName,
      roomNumber: body.roomNumber,
      amount: body.amount,
      month: body.month,
      status: body.status || "Paid",
      method: body.method || "Cash",
      dueDate: body.dueDate || "",
      paidOn: body.paidOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, payment: doc });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to create billing" });
  }
});




app.get("/api/maintenance", async (req, res) => {
  try {
    const data = await Maintenance.find().sort({ createdAt: -1 });
    res.json({ ok: true, requests: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load maintenance" });
  }
});

app.post("/api/maintenance", async (req, res) => {
  try {
    const body = req.body;

    if (!body.roomNumber || !body.issue) {
      return res.status(400).json({ ok: false, error: "Room & Issue required" });
    }

    const doc = await Maintenance.create({
      roomNumber: body.roomNumber,
      issue: body.issue,
      type: body.type || "Others",
      priority: body.priority || "Medium",
      status: body.status || "Open",
      reportedBy: body.reportedBy || "",
      reportedOn: body.reportedOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, request: doc });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to create request" });
  }
});




app.get("/api/residents", async (req, res) => {
  try {
    const data = await Resident.find().sort({ createdAt: -1 });
    res.json({ ok: true, residents: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load residents" });
  }
});

app.post("/api/residents", async (req, res) => {
  try {
    const body = req.body;

    if (!body.name)
      return res.status(400).json({ ok: false, error: "Name required" });

    const newRes = await Resident.create({
      name: body.name,
      roomNumber: body.roomNumber,
      phone: body.phone,
      status: body.status || "Active",
      checkIn: body.checkIn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, resident: newRes });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to create resident" });
  }
});

app.put("/api/residents/:id", async (req, res) => {
  try {
    const updated = await Resident.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ ok: false, error: "Resident not found" });

    res.json({ ok: true, resident: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to update resident" });
  }
});

app.delete("/api/residents/:id", async (req, res) => {
  try {
    const removed = await Resident.findByIdAndDelete(req.params.id);

    if (!removed)
      return res.status(404).json({ ok: false, error: "Resident not found" });

    res.json({ ok: true, message: "Resident deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to delete resident" });
  }
});




app.get("/api/rooms", async (req, res) => {
  try {
    const data = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});

app.post("/api/rooms", async (req, res) => {
  try {
    const body = req.body;

    if (!body.number || !body.pricePerMonth)
      return res.status(400).json({ ok: false, error: "Missing fields" });

    const room = await Room.create({
      number: body.number,
      type: body.type || "single",
      status: body.status || "available",
      pricePerMonth: body.pricePerMonth,
      occupants: [],
    });

    res.status(201).json({ ok: true, room });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to create room" });
  }
});

app.post("/api/rooms/:id/assign", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    const resident = await Resident.findById(req.body.residentId);

    if (!room) return res.status(404).json({ ok: false, error: "Room not found" });
    if (!resident) return res.status(404).json({ ok: false, error: "Resident not found" });

    room.occupants.push({
      residentId: resident._id,
      name: resident.name,
      checkIn: req.body.checkInDate || new Date().toISOString(),
    });

    room.status = "occupied";
    await room.save();

    res.json({ ok: true, room });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to assign room" });
  }
});

app.post("/api/rooms/:id/checkout", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ ok: false, error: "Room not found" });

    room.occupants = [];
    room.status = "available";
    await room.save();

    res.json({ ok: true, room });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to checkout" });
  }
});



app.get("/", (req, res) => {
  res.send("Hostel Management API with MongoDB is running");
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
