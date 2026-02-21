
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/VisitorPreview.css";
import { visitorsAPI, API_BASE } from "../services/api";


const VisitorPreview = () => {
  const { aadhaar } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const formatDMY = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  useEffect(() => {
    (async () => {
      const resp = await visitorsAPI.preview(aadhaar);
      setData(resp.data);
    })();
  }, [aadhaar]);

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>;

  return (
    <div className="visitor-preview-container">
      <div className="vp-container">
        <div className="vp-card">
          <div className="vp-left">
            <div className="vp-photo">
              {data.image_straight ? (
                <img src={`${API_BASE}${data.image_straight}`} alt="visitor" />
              ) : (
                <div className="vp-photo-empty">No image</div>
              )}
            </div>
          </div>
          <div className="vp-right">
            <h2 className="vp-title">{data.full_name}</h2>
            <div className="vp-row"><span>Phone:</span> <b>{data.phone_number || "-"}</b></div>
            <div className="vp-row"><span>Location:</span> <b>{data.location || "-"}</b></div>
            <div className="vp-row"><span>Host to Visit:</span> <b>{data.host_to_visit || "-"}</b></div>
            <div className="vp-row"><span>Floors:</span> <b>{(data.floors || []).join(", ") || "-"}</b></div>
            <div className="vp-row"><span>Towers:</span> <b>{(data.towers || []).join(", ") || "-"}</b></div>
            <div className="vp-row"><span>Purpose of Visit:</span> <b>{data.purpose_of_visit || "-"}</b></div>
            <div className="vp-row"><span>Valid Till:</span> <b>{formatDMY(data.valid_till)}</b></div>
            <div className="vp-actions">
              <button
                className="vp-btn"
                onClick={() => navigate("/user_dashboard")}
                style={{ marginRight: 12 }}
              >
                &#8592; Back to Dashboard
              </button>
              <button
                onClick={() => {
                  window.print();
                  setTimeout(() => {
                    navigate("/user_dashboard");
                  }, 500);
                }}
                className="vp-btn primary"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VisitorPreview;
