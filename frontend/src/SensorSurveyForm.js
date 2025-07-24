import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function SensorSurveyForm() {
  const [sensorData, setSensorData] = useState([]);
  const [area, setArea] = useState("");
  const [line, setLine] = useState("");
  const [sensorType, setSensorType] = useState("");
  const [sensorTypeDetail, setSensorTypeDetail] = useState("");
  const [sensorCode, setSensorCode] = useState("");
  const [gDAS, setGDAS] = useState("");
  const [channel, setChannel] = useState("");
  const [coilNumber, setCoilNumber] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [installTime, setInstallTime] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [comments, setComments] = useState("");
  const [duration, setDuration] = useState("");
  const [durationFlag, setDurationFlag] = useState(false);
  const [savedLogs, setSavedLogs] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const filteredLines = area ? [...new Set(sensorData.filter(s => s.area === area).map(s => s.line))] : [];
  const filteredTypes = line ? [...new Set(sensorData.filter(s => s.area === area && s.line === line).map(s => s.sensorType))] : [];
  const filteredTypeDetails = sensorType ? [...new Set(sensorData.filter(s => s.area === area && s.line === line && s.sensorType === sensorType).map(s => s.sensorTypeDetail))] : [];
  const filteredSensorCodes = sensorTypeDetail ? sensorData.filter(s => s.area === area && s.line === line && s.sensorType === sensorType && s.sensorTypeDetail === sensorTypeDetail).map(s => s.sensorCode) : [];

  const formatDate = (dateStr) => {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${dd}/${mm}/${yyyy}`;
  };

  const isFormValid = () => {
    return (
      area && line && sensorType && sensorTypeDetail && sensorCode &&
      gDAS && channel && installDate && installTime &&
      (!["Hx", "Hy", "Hz"].includes(sensorType) || coilNumber)
    );
  };

  const syncLogs = async () => {
    if (!navigator.onLine) {
      alert("⚠️ You're currently offline. Logs will sync when you're back online.");
      return;
    }

    const logs = JSON.parse(localStorage.getItem("sensorLogs")) || [];
    const unsyncedLogs = logs.filter(log => !log.synced);
    if (unsyncedLogs.length === 0) {
      console.log("All logs already synced!");
      return;
    }

    for (let log of unsyncedLogs) {
      const formattedFrom = `${formatDate(log.installDate)} ${log.installTime}`;
      const formattedTo = log.pickupDate && log.pickupTime
        ? `${formatDate(log.pickupDate)} ${log.pickupTime}`
        : "";

      const payload = {
        sensorCode: log.sensorCode,
        gDAS: log.gDAS,
        channel: log.channel,
        from: formattedFrom,
        to: formattedTo,
        duration: log.duration,
        coilNumber: log.coilNumber || "",
        comments: log.comments
      };

      try {
        const response = await fetch("https://gdas-logging-app-proxy.onrender.com/proxy", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });

        const result = await response.text();
        console.log("Uploaded log:", result);
        log.synced = true;
      } catch (error) {
        console.error("Upload failed:", error);
        break; // stop trying if network fails midway
      }
    }

    localStorage.setItem("sensorLogs", JSON.stringify(logs));
    setSavedLogs(logs);
    console.log("Sync complete!");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const logs = [...savedLogs];
    const today = new Date();
    const formattedInstallDate = formatDate(installDate); // "DD/MM/YYYY"
    const from = `${formattedInstallDate} ${installTime}`;

    const duplicateIndex = logs.findIndex(log =>
      log.sensorCode === sensorCode &&
      `${formatDate(log.installDate)} ${log.installTime}` === from
    );

    const log = {
      area, line, sensorType, sensorTypeDetail, sensorCode,
      gDAS, channel, coilNumber,
      installDate, installTime, pickupDate, pickupTime, comments,
      duration,
      timestamp: today.toISOString(),
      synced: false,
      originalSensorCode: editingIndex !== null ? savedLogs[editingIndex].sensorCode : sensorCode,
      originalFrom: editingIndex !== null
        ? `${formatDate(savedLogs[editingIndex].installDate)} ${savedLogs[editingIndex].installTime}`
        : from
    };

    if (editingIndex !== null) {
      logs[editingIndex] = log;
      setEditingIndex(null);
    } else if (duplicateIndex !== -1) {
      const overwrite = window.confirm("⚠️ This sensorCode + time is already logged. Overwrite?");
      if (overwrite) {
        logs[duplicateIndex] = log;
      } else {
        logs.push(log);
      }
    } else {
      logs.push(log);
    }

    localStorage.setItem("sensorLogs", JSON.stringify(logs));
    setSavedLogs(logs);
    alert("Log saved!");

    // Clear form
    setSensorCode(""); setGDAS(""); setChannel(""); setCoilNumber("");
    setPickupDate(""); setPickupTime(""); setComments("");
    const now = new Date();
    setInstallDate(now.toISOString().split("T")[0]);
    setInstallTime(now.toTimeString().slice(0, 5));
  };


  const handleLoadLog = (index) => {
    const log = savedLogs[index];
    setArea(log.area);
    setLine(log.line);
    setSensorType(log.sensorType);
    setSensorTypeDetail(log.sensorTypeDetail);
    setSensorCode(log.sensorCode);
    setGDAS(log.gDAS);
    setChannel(log.channel);
    setCoilNumber(log.coilNumber || "");
    setInstallDate(log.installDate);
    setInstallTime(log.installTime);
    setPickupDate(log.pickupDate || "");
    setPickupTime(log.pickupTime || "");
    setComments(log.comments || "");
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteLog = (index) => {
    const updatedLogs = savedLogs.filter((_, i) => i !== index);
    setSavedLogs(updatedLogs);
    localStorage.setItem("sensorLogs", JSON.stringify(updatedLogs));
    if (index === editingIndex) setEditingIndex(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setSensorData(jsonData);
      localStorage.setItem("sensorData", JSON.stringify(jsonData));
      alert("Sensor data imported!");
    };
    reader.readAsBinaryString(file);
  };

useEffect(() => {
  const saved = localStorage.getItem("prefillSensor");
  if (saved) {
    try {
      const sensor = JSON.parse(saved);
      setArea(sensor.area || "");
      setLine(sensor.line || "");
      setSensorType(sensor.sensorType || "");
      setSensorTypeDetail(sensor.sensorTypeDetail || "");
      setSensorCode(sensor.sensorCode || "");
      localStorage.removeItem("prefillSensor");
    } catch (e) {
      console.error("Failed to parse prefillSensor");
    }
  }
}, []);
useEffect(() => {
    if (installDate && installTime && pickupDate && pickupTime) {
      const installDT = new Date(`${installDate}T${installTime}`);
      const pickupDT = new Date(`${pickupDate}T${pickupTime}`);
      const diffMs = pickupDT - installDT;
      const diffHours = diffMs / (1000 * 60 * 60);
      setDuration(diffHours.toFixed(2));
      setDurationFlag(diffHours < 0);
    } else {
      setDuration("");
      setDurationFlag(false);
    }
  }, [installDate, installTime, pickupDate, pickupTime]);

  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem("sensorLogs")) || [];
    setSavedLogs(logs);

    const savedSensorData = JSON.parse(localStorage.getItem("sensorData")) || [];
    if (savedSensorData.length > 0) setSensorData(savedSensorData);

    const lastSelections = JSON.parse(localStorage.getItem("lastSelections"));
    if (lastSelections) {
      setArea(lastSelections.area);
      setLine(lastSelections.line);
      setSensorType(lastSelections.sensorType);
      setSensorTypeDetail(lastSelections.sensorTypeDetail);
    }

    const today = new Date();
    setInstallDate(today.toISOString().split("T")[0]);
    setInstallTime(today.toTimeString().slice(0, 5));

    const handleOnline = () => {
      console.log("Back online! Starting sync...");
      syncLogs();
    };
    window.addEventListener("online", handleOnline);

    const intervalId = setInterval(() => {
      const unsyncedLogs = JSON.parse(localStorage.getItem("sensorLogs") || "[]").filter(log => !log.synced);
      if (navigator.onLine && unsyncedLogs.length > 0) {
        console.log("Auto-syncing logs...");
        syncLogs();
      }
    }, 30 * 60 * 1000); // every 30 minutes

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(intervalId);
    };
  }, []);

  const cellStyle = {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "center",
    fontSize: "0.85rem",
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-section"><h2>Import Sensor Data</h2><input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} /></div>

      <div className="form-section"><h2>Sensor Selection</h2>
        <div className="form-grid">
          <div><label>Area:</label>
            <select value={area} onChange={e => setArea(e.target.value)}><option value="">Select Area</option>{[...new Set(sensorData.map(s => s.area))].map(a => <option key={a} value={a}>{a}</option>)}</select>
          </div>
          <div><label>Line:</label>
            <select value={line} onChange={e => setLine(e.target.value)}><option value="">Select Line</option>{filteredLines.map(l => <option key={l} value={l}>{l}</option>)}</select>
          </div>
          <div><label>Sensor Type:</label>
            <select value={sensorType} onChange={e => setSensorType(e.target.value)}><option value="">Select Type</option>{filteredTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div><label>Sensor Type Detail:</label>
            <select value={sensorTypeDetail} onChange={e => setSensorTypeDetail(e.target.value)}><option value="">Select Detail</option>{filteredTypeDetails.map(d => <option key={d} value={d}>{d}</option>)}</select>
          </div>
          <div className="full-span"><label>Sensor Code:</label>
            <select value={sensorCode} onChange={e => setSensorCode(e.target.value)}><option value="">Select Code</option>{filteredSensorCodes.map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          {(sensorType === "Hx" || sensorType === "Hy" || sensorType === "Hz") && (
            <div className="full-span"><label>Coil s/n:</label><input type="text" value={coilNumber} onChange={e => setCoilNumber(e.target.value)} placeholder="Enter Coil s/n" /></div>
          )}
        </div>
      </div>

      <div className="form-section"><h2>Timing</h2>
        <div className="form-grid">
          <div><label>Installation Date:</label><input type="date" value={installDate} onChange={e => setInstallDate(e.target.value)} /></div>
          <div><label>Installation Time:</label><input type="time" value={installTime} onChange={e => setInstallTime(e.target.value)} /></div>
          <div><label>Pickup Date:</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} /></div>
          <div><label>Pickup Time:</label><input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} /></div>
          <div className="full-span"><label>Duration:</label><input type="text" readOnly value={duration} className={durationFlag ? "error-duration" : ""} /></div>
        </div>
      </div>

      <div className="form-section"><h2>Other Info</h2>
        <div className="form-grid">
          <div><label>gDAS s/n:</label><input type="number" value={gDAS} onChange={e => setGDAS(e.target.value)} /></div>
          <div><label>Channel:</label>
            <select value={channel} onChange={e => setChannel(e.target.value)}>
              <option value="">Select Channel</option><option value="1">1</option><option value="2">2</option>
            </select>
          </div>
          <div className="full-span"><label>Comments:</label><textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} /></div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid()}
        className="form-submit"
        style={{
          backgroundColor: isFormValid() ? "#007bff" : "#ccc",
          color: isFormValid() ? "white" : "#666",
          cursor: isFormValid() ? "pointer" : "not-allowed",
          padding: "10px",
          border: "none",
          borderRadius: "4px",
          marginTop: "10px"
        }}
      >
        {editingIndex !== null ? "Update Log" : "Submit Log"}
      </button>

      {editingIndex !== null && (
        <button type="button" onClick={() => {
          setEditingIndex(null);
          setSensorCode(""); setGDAS(""); setChannel(""); setCoilNumber(""); setPickupDate(""); setPickupTime(""); setComments("");
          const today = new Date(); setInstallDate(today.toISOString().split("T")[0]); setInstallTime(today.toTimeString().slice(0, 5));
        }} className="form-cancel">Cancel / New Sensor</button>
      )}

      <button type="button" onClick={syncLogs} style={{ marginTop: "10px", padding: "10px", background: "#28a745", color: "white", border: "none", borderRadius: "4px" }}>🔄 Sync Now</button>

      <h2>Saved Logs</h2>
      {savedLogs.length === 0 ? (
        <p>No logs saved yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              {["Area","Line","Type","Detail","Code","gDAS","Channel","Install Date","Install Time","Pickup Date","Pickup Time","Duration (h)","Comments","Status","Delete"].map((h, i) => <th key={i} style={cellStyle}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {savedLogs.map((log, index) => (
              <tr key={index} onClick={() => handleLoadLog(index)} style={{ cursor: "pointer", background: index === editingIndex ? "#d1e7dd" : "white" }}>
                <td style={cellStyle}>{log.area}</td><td style={cellStyle}>{log.line}</td><td style={cellStyle}>{log.sensorType}</td><td style={cellStyle}>{log.sensorTypeDetail}</td><td style={cellStyle}>{log.sensorCode}</td><td style={cellStyle}>{log.gDAS}</td><td style={cellStyle}>{log.channel}</td><td style={cellStyle}>{log.installDate}</td><td style={cellStyle}>{log.installTime}</td><td style={cellStyle}>{log.pickupDate}</td><td style={cellStyle}>{log.pickupTime}</td><td style={cellStyle}>{log.duration}</td><td style={cellStyle}>{log.comments}</td><td style={cellStyle}>{log.synced ? "✅ Synced" : "❌ Not Synced"}</td>
                <td style={cellStyle}><button onClick={(e) => { e.stopPropagation(); handleDeleteLog(index); }} style={{ background: "red", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", padding: "4px 8px" }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}

