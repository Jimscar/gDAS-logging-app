// SensorMap.js (Final Cleaned Version)
import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import proj4 from "proj4";
import L from "leaflet";

function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function SensorMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [utmZone, setUtmZone] = useState(localStorage.getItem("utmZone") || "");
  const [selectedDatum, setSelectedDatum] = useState(localStorage.getItem("selectedDatum") || "");
  const [sensorGroups, setSensorGroups] = useState([]);
  const [mapCenter, setMapCenter] = useState(() => {
    const saved = localStorage.getItem("mapCenter");
    return saved ? JSON.parse(saved) : [-33.86, 151.21];
  });
  const [zoom, setZoom] = useState(() => parseInt(localStorage.getItem("mapZoom")) || 12);
  const [showLabels, setShowLabels] = useState(true);
  const [lastPlottedDatumZone, setLastPlottedDatumZone] = useState({
    datum: localStorage.getItem("selectedDatum"),
    zone: localStorage.getItem("utmZone"),
  });

  const sensorData = JSON.parse(localStorage.getItem("sensorData")) || [];
  const logs = JSON.parse(localStorage.getItem("sensorLogs")) || [];
  const mapRef = useRef();

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => console.error("❌ GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (
      sensorData.length &&
      utmZone &&
      selectedDatum &&
      (lastPlottedDatumZone.datum !== selectedDatum || lastPlottedDatumZone.zone !== utmZone)
    ) {
      handlePlot();
    }
  }, []);

  const buildProjString = (zoneStr, datum) => {
    const zone = parseInt(zoneStr.match(/\d+/)[0]);
    const hemisphere = zoneStr.toUpperCase().includes("S") ? "+south" : "";
    return `+proj=utm +zone=${zone} ${hemisphere} +datum=${datum} +units=m +no_defs`;
  };

  const handlePlot = () => {
    if (!utmZone || !selectedDatum) return alert("Please select both UTM zone and datum");

    if (
      sensorGroups.length > 0 &&
      utmZone === lastPlottedDatumZone.zone &&
      selectedDatum === lastPlottedDatumZone.datum
    ) {
      return;
    }

    localStorage.setItem("utmZone", utmZone);
    localStorage.setItem("selectedDatum", selectedDatum);

    const projString = buildProjString(utmZone, selectedDatum);
    const grouped = {};

    for (const sensor of sensorData) {
      if (!sensor.UTMx || !sensor.UTMy) continue;
      const key = `${sensor.UTMx},${sensor.UTMy}`;
      const [lon, lat] = proj4(projString, "WGS84", [parseFloat(sensor.UTMx), parseFloat(sensor.UTMy)]);
      const hasLog = logs.some(log => log.sensorCode === sensor.sensorCode);
      if (!grouped[key]) grouped[key] = { lat, lon, sensors: [] };
      grouped[key].sensors.push({ ...sensor, hasLog });
    }

    const groupedArray = Object.values(grouped);
    setSensorGroups(groupedArray);
    setLastPlottedDatumZone({ datum: selectedDatum, zone: utmZone });

    if (groupedArray.length > 0) {
      const lats = groupedArray.map(g => g.lat);
      const lons = groupedArray.map(g => g.lon);
      const newCenter = [lats[Math.floor(lats.length / 2)], lons[Math.floor(lons.length / 2)]];
      setMapCenter(newCenter);
      localStorage.setItem("mapCenter", JSON.stringify(newCenter));
    }
  };

  const handleResetView = () => {
    if (sensorGroups.length > 0) {
      const lats = sensorGroups.map(g => g.lat);
      const lons = sensorGroups.map(g => g.lon);
      const newCenter = [lats[Math.floor(lats.length / 2)], lons[Math.floor(lons.length / 2)]];
      setMapCenter(newCenter);
      setZoom(12);
      localStorage.setItem("mapCenter", JSON.stringify(newCenter));
      localStorage.setItem("mapZoom", "12");
    }
  };

  const handleClear = () => {
    setSensorGroups([]);
    setLastPlottedDatumZone({ datum: "", zone: "" });
  };

  const handleMapMove = () => {
    const map = mapRef.current;
    if (map) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapCenter([center.lat, center.lng]);
      setZoom(zoom);
      localStorage.setItem("mapCenter", JSON.stringify([center.lat, center.lng]));
      localStorage.setItem("mapZoom", zoom.toString());
    }
  };

  const pulseIcon = L.divIcon({
    html: `<div class="pulse-marker"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: ""
  });

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", zIndex: 1000, background: "#f0f0f0", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <label>Datum: </label>
          <select value={selectedDatum} onChange={e => setSelectedDatum(e.target.value)} style={{ marginRight: 10 }}>
            <option value="">--Select--</option>
            <option value="WGS84">WGS84</option>
            <option value="GDA94">GDA94</option>
            <option value="PSAD56">PSAD56</option>
            <option value="NAD83">NAD83</option>
          </select>
          <label>Zone: </label>
          <input type="text" value={utmZone} onChange={e => setUtmZone(e.target.value)} placeholder="e.g., 19S" style={{ width: 60, marginRight: 10 }} />
          <button onClick={handlePlot}>Plot</button>
          <button onClick={handleClear} style={{ marginLeft: 10 }}>Clear</button>
          <button onClick={handleResetView} style={{ marginLeft: 10 }}>Reset View</button>
          <label style={{ marginLeft: 10 }}>
            <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
            Show Labels
          </label>
        </div>
        <button onClick={() => localStorage.setItem("returningFromMap", "true")} style={{ padding: "6px 16px", fontWeight: "bold" }}>Form</button>
      </div>

      <MapContainer center={mapCenter} zoom={zoom} whenCreated={mapInstance => (mapRef.current = mapInstance)} onmoveend={handleMapMove} onzoomend={handleMapMove} style={{ height: "100vh", width: "100%", marginTop: "60px" }}>
        <MapAutoCenter center={mapCenter} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Esri Satellite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
        </LayersControl>

        {sensorGroups.map((group, idx) => {
          const isHxHyHz = group.sensors.every(s => ["Hx", "Hy", "Hz"].includes(s.sensorType));
          const markerColor = group.sensors.some(s => s.hasLog) ? "green" : "blue";
          const shape = isHxHyHz ? "square" : "circle";
          const size = 16;

          const iconHtml = `
            <div style="position: relative; width: ${size}px; height: ${size}px; background: ${markerColor};
                        ${shape === "circle" ? "border-radius: 50%;" : ""}
                        border: 2px solid white;">
              ${showLabels ? group.sensors.map((s, i) => `<div style="position: absolute; top: ${-22 - i * 14}px; left: 18px; font-size: 12px; font-weight: bold; cursor: pointer; color: black;" data-code="${s.sensorCode}">${s.sensorCode}</div>`).join("") : ""}
            </div>`;

          return (
            <Marker key={`sensor-${idx}`} position={[group.lat, group.lon]} icon={L.divIcon({ html: iconHtml, iconSize: [size + 50, size + 20], iconAnchor: [size / 2, size / 2], className: "" })} eventHandlers={{
              click: () => {
                if (group.sensors.length === 1) {
                  localStorage.setItem("prefillSensor", JSON.stringify(group.sensors[0]));
                  localStorage.setItem("returningFromMap", "true");
                  window.location.href = "/form";
                }
              }
            }}>
              <Popup>
                {group.sensors.map((s, i) => (
                  <div key={i}>
                    <strong>Area:</strong> {s.area}<br />
                    <strong>Type:</strong> {s.sensorType}<br />
                    <strong>Code:</strong> {s.sensorCode}<br />
                    <strong>Status:</strong> {s.hasLog ? "✅ Logged" : "❌ Not Logged"}
                    {i < group.sensors.length - 1 && <hr />}
                  </div>
                ))}
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={pulseIcon}>
            <Popup>
              <strong>You are here</strong><br />
              Lat: {userLocation.lat.toFixed(6)}<br />
              Lon: {userLocation.lon.toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <style>{`
        .pulse-marker {
          width: 20px;
          height: 20px;
          background: lime;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(0, 255, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 255, 0, 0); }
        }
      `}</style>
    </>
  );
}