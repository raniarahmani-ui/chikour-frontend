import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/Sidebar/Adminsidebar";
import "./ReportTypes.css";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  entity_type: "all",
  is_active: true,
};

function ReportTypes() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadTypes = async () => {
      try {
        setLoading(true);
        const response = await apiGet("/report-types?active_only=false");
        if (!mounted) return;
        setTypes(response.data || []);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load report types");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTypes();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEdit = (type) => {
    setEditingId(type.id);
    setForm({
      name: type.name || "",
      slug: type.slug || "",
      description: type.description || "",
      entity_type: type.entity_type || "all",
      is_active: !!type.is_active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      entity_type: form.entity_type,
      is_active: form.is_active ? 1 : 0,
    };

    try {
      if (editingId) {
        const response = await apiPut(`/report-types/${editingId}`, payload);
        const updated = response.data;
        setTypes((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        );
      } else {
        const response = await apiPost("/report-types", payload);
        const created = response.data;
        setTypes((prev) => [created, ...prev]);
      }
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save report type");
    }
  };

  const handleToggle = async (id) => {
    try {
      const response = await apiPut(`/report-types/${id}/toggle`, {});
      const updated = response.data;
      setTypes((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError(err.message || "Failed to toggle report type");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/report-types/${id}`);
      setTypes((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || "Failed to delete report type");
    }
  };

  return (
    <div className="report-types-layout">
      {sidebarVisible && <AdminSidebar activePage="report-types" />}

      <main className={`report-types-content ${sidebarVisible ? "" : "wide"}`}>
        <header className="report-types-header">
          <div className="header-left">
            <button
              className="sidebar-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarVisible ? "Hide" : "Show"} Menu
            </button>
            <div>
              <h1>Report Types</h1>
              <p>Manage categories used when users submit reports.</p>
            </div>
          </div>
        </header>

        <section className="report-types-card">
          <h2>{editingId ? "Edit Report Type" : "Create Report Type"}</h2>
          <form className="report-types-form" onSubmit={handleSubmit}>
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </label>
            <label>
              Slug (optional)
              <input
                type="text"
                value={form.slug}
                onChange={(e) => updateField("slug", e.target.value)}
              />
            </label>
            <label>
              Entity Type
              <select
                value={form.entity_type}
                onChange={(e) => updateField("entity_type", e.target.value)}
              >
                <option value="all">All</option>
                <option value="service">Service</option>
                <option value="demand">Demand</option>
                <option value="user">User</option>
              </select>
            </label>
            <label className="full">
              Description (optional)
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
              />
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField("is_active", e.target.checked)}
              />
              Active
            </label>
            <div className="form-actions">
              {editingId && (
                <button type="button" className="secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="primary">
                {editingId ? "Save Changes" : "Create"}
              </button>
            </div>
          </form>
        </section>

        <section className="report-types-table">
          <div className="table-header">
            <h2>Existing Types</h2>
            {error && <span className="error">{error}</span>}
          </div>

          {loading ? (
            <div className="table-row">Loading...</div>
          ) : (
            types.map((type) => (
              <div className="table-row" key={type.id}>
                <div>
                  <div className="name">{type.name}</div>
                  <div className="meta">{type.slug}</div>
                </div>
                <div className="meta">{type.entity_type}</div>
                <div className={`status ${type.is_active ? "active" : "off"}`}>
                  {type.is_active ? "Active" : "Inactive"}
                </div>
                <div className="actions">
                  <button
                    className="secondary"
                    onClick={() => startEdit(type)}
                  >
                    Edit
                  </button>
                  <button
                    className="secondary"
                    onClick={() => handleToggle(type.id)}
                  >
                    Toggle
                  </button>
                  <button
                    className="danger"
                    onClick={() => handleDelete(type.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default ReportTypes;
