import React, { useState } from "react";
import SensorSurveyForm from "./SensorSurveyForm";
import SensorMap from "./SensorMap";
import InstallPromptButton from "./components/InstallPromptButton"; // ✅ Make sure this path is correct

const sensorData = [
  { Area: "North", Line: "LineA", sensorType: "Temperature", sensorTypeDetail: "Thermistor", sensorCode: "T001", UTMx: 123456, UTMy: 654321 },
  { Area: "North", Line: "LineA", sensorType: "Temperature", sensorTypeDetail: "RTD", sensorCode: "T002", UTMx: 123457, UTMy: 654322 },
  { Area: "North", Line: "LineB", sensorType: "Pressure", sensorTypeDetail: "Piezo", sensorCode: "P001", UTMx: 123458, UTMy: 654323 },
  { Area: "South", Line: "LineC", sensorType: "Humidity", sensorTypeDetail: "Capacitive", sensorCode: "H001", UTMx: 123459, UTMy: 654324 },
];

function App() {
  const [view, setView] = useState("form"); // 'form' or 'map'

  return (
    <div>
      <div style={{ padding: "10px", background: "#eee", display: "flex", justifyContent: "space-between" }}>
        <h2>Sensor Survey App</h2>
        <div>
          <button onClick={() => setView("form")} disabled={view === "form"}>Form</button>
          <button onClick={() => setView("map")} disabled={view === "map"} style={{ marginLeft: "10px" }}>Map</button>
        </div>
      </div>

      {view === "form" ? (
        <SensorSurveyForm sensorData={sensorData} />
      ) : (
        <SensorMap />
      )}

      <InstallPromptButton /> {/* ✅ Floating install button rendered here */}
    </div>
  );
}

export default App;
