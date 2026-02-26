import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./CSS/MyApplications.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bankName: "",
    accountNumber: "",
    ifsc: "",
    cgpa: "",
    income: "",
    idProof: null,
    incomeCert: null,
    marksheets: [],
    bonafide: null,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/applications/my`, {
        headers: { "auth-token": token },
      });
      setApps(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch applications:", err);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  const withdrawApp = async (id) => {
    if (!window.confirm("Withdraw this application?")) return;
    try {
      await axios.put(
        `${API_BASE}/api/applications/${id}/withdraw`,
        {},
        { headers: { "auth-token": token } }
      );
      alert("Application withdrawn successfully.");
      fetchApps();
    } catch {
      alert("Failed to withdraw application.");
    }
  };

  const generateReceipt = (app) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Scholarship Application Receipt", 14, 22);
    doc.setFontSize(11);
    doc.text(`Applicant: ${app.fullName}`, 14, 40);
    doc.text(`Scholarship: ${app.scholarshipId?.name}`, 14, 48);
    doc.text(`Applied On: ${new Date(app.createdAt).toLocaleString()}`, 14, 56);
    doc.text(`Application ID: ${app._id}`, 14, 64);
    doc.text(`Status: ${app.status}`, 14, 72);
    doc.text("Thank you for applying!", 14, 84);
    doc.save(`Application-${app._id}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Submitted": return "status-submitted";
      case "Under Review": return "status-review";
      case "Approved": return "status-approved";
      case "Rejected": return "status-rejected";
      case "Withdrawn": return "status-withdrawn";
      default: return "";
    }
  };

  const handleEditClick = (app) => {
    setEditForm({
      bankName: app.bankName || "",
      accountNumber: app.accountNumber || "",
      ifsc: app.ifsc || "",
      cgpa: app.cgpa || "",
      income: app.income || "",
      idProof: null,
      incomeCert: null,
      marksheets: [],
      bonafide: null,
    });
    setEditing(true);
    setSelected(app);
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "marksheets") {
        setEditForm({ ...editForm, [name]: Array.from(files) });
      } else {
        setEditForm({ ...editForm, [name]: files[0] });
      }
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(editForm).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((f) => formData.append(key, f));
        else if (value) formData.append(key, value);
      });

      await axios.put(
        `${API_BASE}/api/applications/${selected._id}/update`,
        formData,
        {
          headers: {
            "auth-token": token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("✅ Application updated successfully.");
      setEditing(false);
      fetchApps();
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Failed to update application.");
    }
  };

  if (loading)
    return (
      <div className="apps-page">
        <h3>Loading your applications…</h3>
      </div>
    );

  return (
    <div className="apps-page">
      <div className="apps-top">
        <h1>📋 My Applications</h1>
        <p>View all scholarships you have applied for and track their status.</p>
      </div>

      {apps.length === 0 ? (
        <div className="empty-box">
          You haven’t applied to any scholarships yet.{" "}
          <a href="/scholarships">Apply Now</a>
        </div>
      ) : (
        <>
          <div className="apps-grid">
            {apps.map((a) => (
              <div key={a._id} className="app-card">
                <div className="app-left">
                  <h3>{a.scholarshipId?.name}</h3>
                  <p>Provider: {a.scholarshipId?.provider}</p>
                  <p>Amount: ₹{a.scholarshipId?.amount}</p>
                  <p>Applied On: {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="app-right">
                  <div className={`status-badge ${getStatusColor(a.status)}`}>
                    {a.status}
                  </div>
                  <div className="app-actions">
                    <button onClick={() => setSelected(a)} className="btn-outline">
                      View
                    </button>
                    {(a.status === "Submitted" || a.status === "Under Review") && (
                      <>
                        <button
                          onClick={() => handleEditClick(a)}
                          className="btn-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => withdrawApp(a._id)}
                          className="btn-danger"
                        >
                          Withdraw
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => generateReceipt(a)}
                      className="btn-primary"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View Modal */}
          {selected && !editing && (
            <div className="modal" onClick={() => setSelected(null)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{selected.scholarshipId?.name}</h2>
                  <button className="close1" onClick={() => setSelected(null)}>
                    &times;
                  </button>
                </div>
                <div className="modal-body">
                  <section>
                    <h4>👤 Applicant Info</h4>
                    <p><b>Name:</b> {selected.fullName}</p>
                    <p><b>Email:</b> {selected.email}</p>
                    <p><b>Phone:</b> {selected.mobile}</p>
                    <p><b>CGPA:</b> {selected.cgpa}</p>
                    <p><b>Family Income:</b> ₹{selected.income}</p>
                  </section>

                  <section>
                    <h4>🏦 Bank Details</h4>
                    <p><b>Bank:</b> {selected.bankName}</p>
                    <p><b>Account:</b> {selected.accountNumber}</p>
                    <p><b>IFSC:</b> {selected.ifsc}</p>
                  </section>

                  <section>
                    <h4>📎 Documents</h4>
                    {selected.documents ? (
                      <ul className="docs-list">
                        {Object.entries(selected.documents).map(([key, val]) =>
                          Array.isArray(val) ? (
                            val.map((url, idx) => (
                              <li key={idx}>
                                <span>{key} {idx + 1}</span>
                                <a href={url} target="_blank" rel="noreferrer">View</a>
                              </li>
                            ))
                          ) : (
                            <li key={key}>
                              <span>{key}</span>
                              <a href={val} target="_blank" rel="noreferrer">View</a>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p>No documents uploaded</p>
                    )}
                  </section>

                  <p className={`status-label ${getStatusColor(selected.status)}`}>
                    <b>Status:</b> {selected.status}
                  </p>
                </div>

                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editing && (
            <div className="modal" onClick={() => setEditing(false)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>✏️ Edit Application</h2>
                  <button className="close1" onClick={() => setEditing(false)}>
                    &times;
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="modal-body">
                  <h4>🏦 Update Bank Details</h4>
                  <input
                    type="text"
                    name="bankName"
                    value={editForm.bankName}
                    onChange={handleEditChange}
                    placeholder="Bank Name"
                  />
                  <input
                    type="text"
                    name="accountNumber"
                    value={editForm.accountNumber}
                    onChange={handleEditChange}
                    placeholder="Account Number"
                  />
                  <input
                    type="text"
                    name="ifsc"
                    value={editForm.ifsc}
                    onChange={handleEditChange}
                    placeholder="IFSC Code"
                  />
                  <h4>📚 Academic Info</h4>
                  <input
                    type="text"
                    name="cgpa"
                    value={editForm.cgpa}
                    onChange={handleEditChange}
                    placeholder="CGPA"
                  />
                  <input
                    type="text"
                    name="income"
                    value={editForm.income}
                    onChange={handleEditChange}
                    placeholder="Family Income"
                  />

                  <h4>📎 Upload New Documents (optional)</h4>
                  <label>ID Proof</label>
                  <input type="file" name="idProof" onChange={handleEditChange} />
                  <label>Income Certificate</label>
                  <input type="file" name="incomeCert" onChange={handleEditChange} />
                  <label>Marksheets (multiple)</label>
                  <input type="file" name="marksheets" multiple onChange={handleEditChange} />
                  <label>Bonafide</label>
                  <input type="file" name="bonafide" onChange={handleEditChange} />

                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
