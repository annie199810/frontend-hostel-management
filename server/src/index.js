// server/src/index.js

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

/* ---------------------------------------------
   Global middlewares
--------------------------------------------- */

// 🔍 Debug logger – this will show which origin is calling which API
app.use(function (req, res, next) {
  console.log(
    "[REQ]",
    req.method,
    req.url,
    "| Origin:",
    req.headers.origin || "(no origin header)"
  );
  next();
});

// 🌐 CORS – allow all origins (Netlify, localhost, etc.)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

/* ---------------------------------------------
   MongoDB connection
--------------------------------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(function () {
    console.log("MongoDB Connected");
  })
  .catch(function (err) {
    console.error("MongoDB Error:", err);
  });

/* ---------------------------------------------
   User routes
--------------------------------------------- */

app.get("/api/users", async function (req, res) {
  try {
    var data = await User.find().sort({ createdAt: -1 });
    res.json({ ok: true, users: data });
  } catch (err) {
    console.error("Error loading users:", err);
    res.status(500).json({ ok: false, error: "Failed to load users" });
  }
});

app.post("/api/users", async function (req, res) {
  try {
    var body = req.body || {};
    var name = body.name;
    var email = body.email;
    var password = body.password;
    var role = body.role || "Staff";
    var status = body.status || "Active";

    if (!name || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Name, email and password are required",
      });
    }

    var user = await User.create({
      name: name,
      email: email,
      password: password,
      role: role,
      status: status,
    });

    res.status(201).json({ ok: true, user: user });
  } catch (err) {
    console.error("Error creating user:", err);

    if (err && err.code === 11000) {
      return res
        .status(409)
        .json({ ok: false, error: "Email already exists" });
    }

    res.status(500).json({ ok: false, error: "Failed to create user" });
  }
});

app.put("/api/users/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var body = req.body || {};
    var updates = {};

    if (body.name != null) updates.name = body.name;
    if (body.email != null) updates.email = body.email;
    if (body.role != null) updates.role = body.role;
    if (body.status != null) updates.status = body.status;
    if (body.password) updates.password = body.password;

    var user = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, user: user });
  } catch (err) {
    console.error("Error updating user:", err);

    if (err && err.code === 11000) {
      return res
        .status(409)
        .json({ ok: false, error: "Email already exists" });
    }

    res.status(500).json({ ok: false, error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ ok: false, error: "Failed to delete user" });
  }
});

/* ---------------------------------------------
   Billing routes
--------------------------------------------- */

app.get("/api/billing", async function (req, res) {
  try {
    var data = await Billing.find().sort({ createdAt: -1 });
    res.json({ ok: true, payments: data });
  } catch (err) {
    console.error("Error fetching billing records", err);
    res
      .status(500)
      .json({ ok: false, error: "Failed to load billing records" });
  }
});

app.post("/api/billing", async function (req, res) {
  try {
    var body = req.body || {};
    var residentName = body.residentName;
    var roomNumber = body.roomNumber;
    var amount = body.amount;
    var month = body.month;

    if (!residentName || !roomNumber || amount == null || !month) {
      return res.status(400).json({
        ok: false,
        error: "Resident name, room, amount and month are required",
      });
    }

    var doc = await Billing.create({
      residentName: residentName,
      roomNumber: roomNumber,
      amount: amount,
      month: month,
      status: body.status || "Paid",
      method: body.method || "Cash",
      dueDate: body.dueDate || "",
      paidOn: body.paidOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, payment: doc });
  } catch (err) {
    console.error("Error creating billing record", err);
    res
      .status(500)
      .json({ ok: false, error: "Failed to create billing record" });
  }
});

/* ---------------------------------------------
   Maintenance routes
--------------------------------------------- */

app.get("/api/maintenance", async function (req, res) {
  try {
    var data = await Maintenance.find().sort({ createdAt: -1 });
    res.json({ ok: true, requests: data });
  } catch (err) {
    console.error("Error fetching maintenance requests", err);
    res
      .status(500)
      .json({ ok: false, error: "Failed to load maintenance requests" });
  }
});

app.post("/api/maintenance", async function (req, res) {
  try {
    var body = req.body || {};
    var roomNumber = body.roomNumber;
    var issue = body.issue;

    if (!roomNumber || !issue) {
      return res.status(400).json({
        ok: false,
        error: "Room number and issue are required",
      });
    }

    var doc = await Maintenance.create({
      roomNumber: roomNumber,
      issue: issue,
      type: body.type || "Others",
      priority: body.priority || "Medium",
      status: body.status || "Open",
      reportedBy: body.reportedBy || "",
      reportedOn: body.reportedOn || new Date().toISOString().slice(0, 10),
    });

    res.status(201).json({ ok: true, request: doc });
  } catch (err) {
    console.error("Error creating maintenance request", err);
    res
      .status(500)
      .json({ ok: false, error: "Failed to create maintenance request" });
  }
});

/* ---------------------------------------------
   Residents routes
--------------------------------------------- */

app.get("/api/residents", async function (req, res) {
  try {
    var data = await Resident.find().sort({ createdAt: -1 });
    res.json({ ok: true, residents: data });
  } catch (err) {
    console.error("Error loading residents:", err);
    res.status(500).json({ ok: false, error: "Failed to load residents" });
  }
});

app.post("/api/residents", async function (req, res) {
  try {
    var body = req.body || {};
    var name = body.name;
    var roomNumber = body.roomNumber;
    var phone = body.phone;
    var status = body.status || "active";
    var checkIn = body.checkIn || new Date().toISOString().slice(0, 10);

    if (!name) {
      return res.status(400).json({ ok: false, error: "Name is required" });
    }

    var newRes = await Resident.create({
      name: name,
      roomNumber: roomNumber,
      phone: phone,
      status: status,
      checkIn: checkIn,
    });

    res.status(201).json({ ok: true, resident: newRes });
  } catch (err) {
    console.error("Error creating resident:", err);
    res.status(500).json({ ok: false, error: "Failed to create resident" });
  }
});

app.put("/api/residents/:id", async function (req, res) {
  try {
    var id = req.params.id;
    var body = req.body || {};

    var updated = await Resident.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    res.json({ ok: true, resident: updated });
  } catch (err) {
    console.error("Error updating resident:", err);
    res.status(500).json({ ok: false, error: "Failed to update resident" });
  }
});

app.delete("/api/residents/:id", async function (req, res) {
  try {
    var id = req.params.id;

    var removed = await Resident.findByIdAndDelete(id);

    if (!removed) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    res.json({ ok: true, message: "Resident deleted" });
  } catch (err) {
    console.error("Error deleting resident:", err);
    res.status(500).json({ ok: false, error: "Failed to delete resident" });
  }
});

/* ---------------------------------------------
   Rooms routes
--------------------------------------------- */

app.get("/api/rooms", async function (req, res) {
  try {
    var data = await Room.find().sort({ number: 1 });
    res.json({ ok: true, rooms: data });
  } catch (err) {
    console.error("Error fetching rooms", err);
    res.status(500).json({ ok: false, error: "Failed to load rooms" });
  }
});

app.post("/api/rooms", async function (req, res) {
  try {
    var number = req.body.number;
    var type = req.body.type || "single";
    var status = req.body.status || "available";
    var pricePerMonth = req.body.pricePerMonth;

    if (!number || pricePerMonth == null) {
      return res.status(400).json({
        ok: false,
        error: "Room number and price required",
      });
    }

    var room = await Room.create({
      number: number,
      type: type,
      status: status,
      pricePerMonth: pricePerMonth,
      occupants: [],
    });

    res.status(201).json({ ok: true, room: room });
  } catch (err) {
    console.error("Error creating room", err);
    res.status(500).json({ ok: false, error: "Failed to create room" });
  }
});

app.post("/api/rooms/:id/assign", async function (req, res) {
  try {
    var id = req.params.id;
    var residentId = req.body.residentId;
    var checkInDate = req.body.checkInDate;

    var room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    var resident = await Resident.findById(residentId);
    if (!resident) {
      return res.status(404).json({ ok: false, error: "Resident not found" });
    }

    var occupant = {
      residentId: residentId,
      name: resident.name,
      checkIn: checkInDate || new Date().toISOString(),
    };

    room.occupants.push(occupant);
    room.status = "occupied";

    await room.save();

    res.json({ ok: true, room: room });
  } catch (err) {
    console.error("Error assigning room", err);
    res.status(500).json({ ok: false, error: "Failed to assign room" });
  }
});

app.post("/api/rooms/:id/checkout", async function (req, res) {
  try {
    var id = req.params.id;

    var room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ ok: false, error: "Room not found" });
    }

    room.occupants = [];
    room.status = "available";

    await room.save();

    res.json({ ok: true, room: room });
  } catch (err) {
    console.error("Error checking out room", err);
    res.status(500).json({ ok: false, error: "Failed to checkout room" });
  }
});

/* ---------------------------------------------
   Root route
--------------------------------------------- */

app.get("/", function (req, res) {
  res.send("Hostel Management API with MongoDB is running");
});

/* ---------------------------------------------
   Start server
--------------------------------------------- */

var PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
  console.log("Server running on port", PORT);
});
