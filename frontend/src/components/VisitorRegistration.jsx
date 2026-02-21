// src/components/VisitorRegistration.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/VisitorRegistration.css";
import { csrfAPI, visitorsAPI, API_BASE } from "../services/api";


const VisitorRegistration = () => {
  const navigate = useNavigate();

  // --- camera refs/state ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [showLive, setShowLive] = useState(true); // whether to render the live video

  // A helper to attach stream and start playback
  const startLive = () => {
    const v = videoRef.current;
    if (!v || !stream) return;
    if (v.srcObject !== stream) v.srcObject = stream;
    v.play?.().catch(() => {});
  };

  // Ensure video knows dimensions before grabbing frame
  const ensureVideoReady = () =>
    new Promise((resolve) => {
      const v = videoRef.current;
      if (!v) return resolve(false);
      if (v.readyState >= 2) return resolve(true); // HAVE_CURRENT_DATA
      const on = () => {
        v.removeEventListener("loadeddata", on);
        resolve(true);
      };
      v.addEventListener("loadeddata", on);
    });

  // --- Aadhaar + suggestions ---
  const [aadhaar, setAadhaar] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // --- Single photo states ---
  // preview: a local still shown after "Capture" but before "OK"
  const [preview, setPreview] = useState({ blob: null, url: null });
  // savedUrl: backend relative URL (e.g. /uploads/4676.../straight_123.jpg)
  const [savedUrl, setSavedUrl] = useState(null);

  // --- Form data ---
  const [form, setForm] = useState({
    full_name: "",
    gender: "",
    phone_number: "",
    location: "",
    purpose_of_visit: "",
    host_to_visit: "",
    floors: [],
    towers: [],
    duration_from: new Date().toISOString().slice(0, 10),
    duration_to: new Date().toISOString().slice(0, 10),
  });

  // Options & “candidate” selections for Floors/Towers
  const [floorOptions, setFloorOptions] = useState([]);
  const [towerOptions, setTowerOptions] = useState([]);
  const [floorCandidate, setFloorCandidate] = useState("");
  const [towerCandidate, setTowerCandidate] = useState("");

  // ---------------- Effects ----------------

  // Get camera and meta options on mount
  useEffect(() => {
    (async () => {
      try {
        const ms = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        setStream(ms);
      } catch {
        alert("Camera permission denied");
      }
      try {
        const [fl, tw] = await Promise.all([
          visitorsAPI.floors(),
          visitorsAPI.towers(),
        ]);
        setFloorOptions(fl.data || []);
        setTowerOptions(tw.data || []);
      } catch {
        // ignore
      }
    })();

    return () => {
      // cleanup: stop camera & revoke preview URL if any
      if (preview.url) URL.revokeObjectURL(preview.url);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach stream to <video> whenever showLive flips true or stream changes
  useEffect(() => {
    if (showLive) startLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, showLive]);

  // Suggest / autofill behavior for Aadhaar
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = aadhaar.trim();
      if (!q) {
        setSuggestions([]);
        return;
      }

      // if exactly 12 digits, fetch full record
      if (/^\d{12}$/.test(q)) {
        try {
          const r = await visitorsAPI.get(q);
          if (r.data?.exists) fillFromVisitor(r.data);
        } catch {
          // ignore
        }
        setSuggestions([]);
        return;
      }

      // else show suggestions
      setLoadingSuggest(true);
      try {
        const resp = await visitorsAPI.suggest(q);
        setSuggestions(resp.data || []);
      } catch {
        // ignore
      }
      setLoadingSuggest(false);
    }, 300);

    return () => clearTimeout(t);
  }, [aadhaar]);

  // ---------------- Helpers ----------------

  const fillFromVisitor = (payload) => {
    const v = payload.visitor || {};
    const imgs = payload.images || {};
    setForm({
      full_name: v.full_name || "",
      gender: v.gender || "",
      phone_number: v.phone_number || "",
      location: v.location || "",
      purpose_of_visit: v.purpose_of_visit || "",
      host_to_visit: v.host_to_visit || "",
      floors: v.floors || [],
      towers: v.towers || [],
      duration_from: v.duration_from || new Date().toISOString().slice(0, 10),
      duration_to: v.duration_to || new Date().toISOString().slice(0, 10),
    });

    // Show the previously saved straight still (if any)
    setSavedUrl(imgs.straight || null);
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({ blob: null, url: null });
    setShowLive(!imgs.straight); // if we have a saved still, don't show live
  };

  const pickSuggestion = async (s) => {
    setAadhaar(s.aadhaar_id);
    setSuggestions([]);
    try {
      const resp = await visitorsAPI.get(s.aadhaar_id);
      if (resp.data?.exists) fillFromVisitor(resp.data);
    } catch {
      // ignore
    }
  };

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Floors/Towers add/remove
  const addFloor = () => {
    if (floorCandidate && !form.floors.includes(floorCandidate)) {
      setForm((f) => ({ ...f, floors: [...f.floors, floorCandidate] }));
    }
    setFloorCandidate("");
  };
  const removeFloor = (val) =>
    setForm((f) => ({ ...f, floors: f.floors.filter((x) => x !== val) }));

  const addTower = () => {
    if (towerCandidate && !form.towers.includes(towerCandidate)) {
      setForm((f) => ({ ...f, towers: [...f.towers, towerCandidate] }));
    }
    setTowerCandidate("");
  };
  const removeTower = (val) =>
    setForm((f) => ({ ...f, towers: f.towers.filter((x) => x !== val) }));

  // ---------------- Capture flow (single image) ----------------

  const captureFrameBlob = async () => {
    const ok = await ensureVideoReady();
    if (!ok) throw new Error("Camera not ready");

    const v = videoRef.current;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    return new Promise((resolve) =>
      c.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );
  };

  const onCapture = async () => {
    if (!aadhaar || aadhaar.length !== 12) {
      alert("Enter a valid 12-digit Aadhaar first");
      return;
    }
    try {
      setShowLive(true); // make sure video is rendering before we grab a frame
      const blob = await captureFrameBlob();
      const url = URL.createObjectURL(blob);
      if (preview.url) URL.revokeObjectURL(preview.url);
      setPreview({ blob, url }); // show still
      setShowLive(false); // freeze on still
    } catch {
      alert("Failed to capture");
    }
  };

  const onRecapture = () => {
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({ blob: null, url: null });
    setShowLive(true); // return to live feed
  };

// in VisitorRegistration.jsx
const onAccept = async () => {
  if (!preview.blob) { alert("Capture first"); return; }
  try {
    await csrfAPI.fetchToken();
    const file = new File([preview.blob], "straight.jpg", { type: "image/jpeg" });
    const resp = await visitorsAPI.uploadPhoto(aadhaar, "straight", file);
    const path = resp.data?.url || null;

    setSavedUrl(path);
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({ blob: null, url: null });
    setShowLive(false);

    // Generate embeddings after photo upload
    try {
      const embeddingResp = await visitorsAPI.generateEmbeddings(aadhaar, file);
      console.log("Embeddings created", embeddingResp.data);
    } catch (embeddingErr) {
      console.error("Failed to create embeddings", embeddingErr);
      alert("Image saved, but embedding generation failed. See console for details.");
    }
  } catch (err) {
    const msg = err?.response?.data?.message || "Failed to save image";
    alert(msg);
  }
};


  // ---------------- Submit ----------------

  const submit = async (e) => {
    e.preventDefault();
    if (!aadhaar || aadhaar.length !== 12) return alert("Aadhaar required");
    if (!form.full_name) return alert("Full name required");

    try {
      await csrfAPI.fetchToken();
      const payload = {
        aadhaar_id: aadhaar,
        full_name: form.full_name,
        gender: form.gender,
        phone_number: form.phone_number,
        location: form.location,
        purpose_of_visit: form.purpose_of_visit,
        host_to_visit: form.host_to_visit,
        floors: form.floors,
        towers: form.towers,
        duration_from: form.duration_from,
        duration_to: form.duration_to,
      };
      const resp = await visitorsAPI.upsert(payload);
      if (resp.status === 200 || resp.status === 201) {
        navigate(`/visitor_preview/${aadhaar}`);
      }
    } catch {
      alert("Failed to save visitor");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/user_dashboard");
  };

  const clearAll = () => {
    setAadhaar("");
    setSuggestions([]);
    setForm({
      full_name: "",
      gender: "",
      phone_number: "",
      location: "",
      purpose_of_visit: "",
      host_to_visit: "",
      floors: [],
      towers: [],
      duration_from: new Date().toISOString().slice(0, 10),
      duration_to: new Date().toISOString().slice(0, 10),
    });
    if (preview.url) URL.revokeObjectURL(preview.url);
    setPreview({ blob: null, url: null });
    setSavedUrl(null);
    setShowLive(true);
  };

  // What to render in the camera box:
  const showPreview = !!preview.url;                 // captured but not saved
  const showVideo = showPreview ? false : (showLive || !savedUrl); // live if forced or nothing saved

  // ---------------- Render ----------------
  return (
    <div className="vr-main-container">
      
      <div className="vr-content-wrapper">
        <div className="backbutton-wrapper">
          <button className="backbutton-dashboard" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
        </div>
        
        <div className="vr-inner-wrapper">
          <h1 className="vr-main-title">Visitor Onboarding</h1>

          <div className="vr-form-camera-container">
            {/* LEFT: Aadhaar + camera */}
            <div className="vr-camera-section">
              <div className="vr-aadhaar-card">
                <h2 className="vr-aadhaar-title">Aadhaar card Number</h2>
                <input
                  type="text"
                  value={aadhaar}
                  onChange={(e) =>
                    setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  className="vr-aadhaar-input"
                  placeholder="Enter Aadhaar card number"
                />
                {loadingSuggest && <div className="vr-suggest">searching…</div>}
                {suggestions.length > 0 && (
                  <div className="vr-suggest">
                    {suggestions.map((s) => (
                      <button
                        key={s.aadhaar_id}
                        type="button"
                        onClick={() => pickSuggestion(s)}
                      >
                        {s.aadhaar_id} — {s.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Camera / Still */}
              <div className="vr-camera-card">
                <div className="vr-camera-container">
                  {showPreview ? (
                    <img
                      src={preview.url}
                      alt="captured"
                      className="vr-camera-captured-image"
                    />
                  ) : showVideo ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="vr-camera-video"
                    />
                  ) : savedUrl ? (
                    <img
                      src={
                        savedUrl.startsWith("http")
                          ? savedUrl
                          : `${API_BASE}${savedUrl}`
                      }
                      alt="saved"
                      className="vr-camera-captured-image"
                    />
                  ) : null}
                </div>

                <div className="vr-capture-controls">
                  {!showPreview ? (
                    <button
                      onClick={onCapture}
                      disabled={!stream}
                      className="vr-capture-btn"
                    >
                      📸 Capture
                    </button>
                  ) : (
                    <div className="vr-capture-actions">
                      <button
                        type="button"
                        onClick={onRecapture}
                        className="vr-secondary"
                      >
                        Recapture
                      </button>
                      <button
                        type="button"
                        onClick={onAccept}
                        className="vr-primary"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="vr-hidden-canvas" />
              </div>
            </div>

            {/* RIGHT: form */}
            <div className="vr-form-section">
              <form onSubmit={submit} className="vr-form-layout">
                <div className="vr-form-group">
                  <label className="vr-form-label">Full Name *</label>
                  <input
                    className="vr-form-input"
                    name="full_name"
                    value={form.full_name}
                    onChange={onChange}
                    required
                  />
                </div>

                <div className="vr-form-group">
                  <label className="vr-form-label">Gender</label>
                  <div className="vr-gender-options">
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={form.gender === "Male"}
                        onChange={onChange}
                      />{" "}
                      Male
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={form.gender === "Female"}
                        onChange={onChange}
                      />{" "}
                      Female
                    </label>
                  </div>
                </div>

                <div className="vr-form-group">
                  <label className="vr-form-label">Phone Number</label>
                  <input
                    className="vr-form-input"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={onChange}
                  />
                </div>

                <div className="vr-form-group">
                  <label className="vr-form-label">Location</label>
                  <input
                    className="vr-form-input"
                    name="location"
                    value={form.location}
                    onChange={onChange}
                  />
                </div>

                <div className="vr-form-group">
                  <label className="vr-form-label">Purpose of Visit</label>
                  <input
                    className="vr-form-input"
                    name="purpose_of_visit"
                    value={form.purpose_of_visit}
                    onChange={onChange}
                  />
                </div>

                <div className="vr-form-group">
                  <label className="vr-form-label">Whom to Visit</label>
                  <input
                    className="vr-form-input"
                    name="host_to_visit"
                    value={form.host_to_visit}
                    onChange={onChange}
                  />
                </div>

                {/* Floors */}
                <div className="vr-form-group">
                  <label className="vr-form-label">Floor(s)</label>
                  <div className="vr-floor-tower-container">
                    <select
                      className="vr-form-select"
                      value={floorCandidate}
                      onChange={(e) => setFloorCandidate(e.target.value)}
                    >
                      <option value="">Select Floor</option>
                      {floorOptions.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="vr-add-floor-btn"
                      onClick={addFloor}
                      disabled={!floorCandidate}
                    >
                      Add Floor
                    </button>
                  </div>
                  {form.floors.length > 0 && (
                    <div className="vr-tags-container">
                      {form.floors.map((fl) => (
                        <div key={fl} className="vr-tag">
                          <span>{fl}</span>
                          <button
                            type="button"
                            className="vr-tag-remove"
                            onClick={() => removeFloor(fl)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Towers */}
                <div className="vr-form-group">
                  <label className="vr-form-label">Tower(s)</label>
                  <div className="vr-floor-tower-container">
                    <select
                      className="vr-form-select"
                      value={towerCandidate}
                      onChange={(e) => setTowerCandidate(e.target.value)}
                    >
                      <option value="">Select Tower</option>
                      {towerOptions.map((t) => (
                        <option key={t} value={t}>
                          {`Tower ${t}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="vr-add-tower-btn"
                      onClick={addTower}
                      disabled={!towerCandidate}
                    >
                      Add Tower
                    </button>
                  </div>
                  {form.towers.length > 0 && (
                    <div className="vr-tags-container">
                      {form.towers.map((tw) => (
                        <div key={tw} className="vr-tag">
                          <span>{tw}</span>
                          <button
                            type="button"
                            className="vr-tag-remove"
                            onClick={() => removeTower(tw)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div className="vr-duration-section">
                  <h3 className="vr-duration-title">Duration</h3>
                  <div className="vr-duration-container">
                    <div className="vr-date-group">
                      <span className="vr-date-label">From</span>
                      <input
                        type="date"
                        name="duration_from"
                        value={form.duration_from}
                        onChange={onChange}
                      />
                    </div>
                    <div className="vr-date-group">
                      <span className="vr-date-label">To</span>
                      <input
                        type="date"
                        name="duration_to"
                        value={form.duration_to}
                        onChange={onChange}
                        min={form.duration_from}
                      />
                    </div>
                  </div>
                </div>

                <div className="vr-action-buttons">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="vr-clear-btn"
                  >
                    Clear data
                  </button>
                  <button type="submit" className="vr-submit-details-btn">
                    Submit Details
                  </button>
                </div>
              </form>
            </div>
            {/* /RIGHT */}
          </div>
          {/* /vr-form-camera-container */}
        </div>
      </div>
    </div>
  );
};

export default VisitorRegistration;
