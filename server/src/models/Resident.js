app.post("/api/residents", async function (req, res) {
  try {
    var body = req.body || {};
    var name = body.name;
    var roomNumber = body.roomNumber;
    var phone = body.phone;

    var statusRaw = body.status || "active";
    var status = String(statusRaw).toLowerCase();
    if (status !== "active" && status !== "checked-out") {
      status = "active";
    }

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
