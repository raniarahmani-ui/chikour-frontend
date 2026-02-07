import React, { useEffect, useState } from "react";

export default function CollapsibleSidebar({
  items = [],
  children,
  storageKey = "app_sidebar_collapsed",
  initialCollapsed = null,
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "1") setCollapsed(true);
      else if (saved === "0") setCollapsed(false);
      else if (initialCollapsed !== null) setCollapsed(!!initialCollapsed);
      else if (window.matchMedia("(max-width: 768px)").matches)
        setCollapsed(true);
    } catch (e) {
      if (initialCollapsed !== null) setCollapsed(!!initialCollapsed);
    }
    const onResize = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (window.matchMedia("(max-width: 768px)").matches) {
          setCollapsed(true);
        } else if (saved === "1") setCollapsed(true);
        else if (saved === "0") setCollapsed(false);
      } catch (e) {}
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [storageKey, initialCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch (e) {}
  }, [collapsed, storageKey]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", boxSizing: "border-box" }}
    >
      <style>{`
        :root{ --sidebar-width:190px; --sidebar-collapsed:72px; --sidebar-bg:#1c3f3a; --transition:180ms; }
        .csb-sidebar{ width:var(--sidebar-width); background:var(--sidebar-bg); color:#fff; padding:18px 12px; box-sizing:border-box; display:flex; flex-direction:column; gap:12px; transition: width var(--transition) ease, padding var(--transition) ease; }
        .csb-sidebar.collapsed{ width:var(--sidebar-collapsed); padding-left:10px; padding-right:10px; }
        .csb-top{ display:flex; justify-content:flex-end; }
        .csb-toggle{ background:transparent; border:1px solid rgba(255,255,255,0.08); color:#fff; padding:8px; border-radius:8px; cursor:pointer; }
        .csb-nav{ display:flex; flex-direction:column; gap:10px; margin-top:8px; }
        .csb-item{ display:flex; gap:12px; align-items:center; padding:8px; border-radius:8px; text-decoration:none; color:inherit; }
        .csb-item:focus, .csb-item:hover{ background:rgba(255,255,255,0.03); outline:none; }
        .csb-icon{ width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; font-size:18px; }
        .csb-label{ font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .csb-sidebar.collapsed .csb-label{ display:none; }
        .csb-main{ flex:1; padding:30px; background:#f8f9fa; box-sizing:border-box; min-width:0; }
        @media (max-width:768px){ .csb-sidebar{ width:var(--sidebar-collapsed); padding-left:10px; padding-right:10px; } .csb-sidebar:not(.collapsed){} .csb-sidebar .csb-label{ display:none; } }
      `}</style>

      <aside
        className={"csb-sidebar" + (collapsed ? " collapsed" : "")}
        id="csb-sidebar"
        aria-hidden={false}
      >
        <div className="csb-top">
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="csb-toggle"
            onClick={() => setCollapsed((c) => !c)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6h16M4 12h10M4 18h16"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <nav className="csb-nav" role="navigation" aria-label="Main">
          {items.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              No items
            </div>
          ) : (
            items.map((it, idx) => (
              <a
                key={idx}
                className="csb-item"
                href={it.href || "#"}
                title={it.label}
                onClick={(e) => {
                  if (it.onClick) {
                    e.preventDefault();
                    it.onClick();
                  }
                }}
              >
                <span className="csb-icon" aria-hidden="true">
                  {it.icon || "•"}
                </span>
                <span className="csb-label">{it.label}</span>
              </a>
            ))
          )}
        </nav>
      </aside>

      <main className="csb-main">{children}</main>
    </div>
  );
}
