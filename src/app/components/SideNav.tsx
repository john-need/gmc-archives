import { NavLink } from "react-router-dom";
import type { User } from "@/lib/types";
import { COLORS, navButtonStyle } from "@/app/styleTokens";

export interface SideNavProps {
  user: User;
  onSignOut: () => void;
}

const ROLE_LABELS: Record<User["role"], string> = {
  viewer: "Researcher",
  publisher: "Editor"
};

function NavIcon(props: { children: React.ReactNode }): JSX.Element {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {props.children}
    </svg>
  );
}

export function SideNav(props: SideNavProps): JSX.Element {
  const isEditor = props.user.role === "publisher";
  const userInitial = props.user.id.charAt(0).toUpperCase();

  return (
    <aside
      style={{
        width: 250,
        flex: "none",
        background: COLORS.sidebar,
        borderRight: `1px solid ${COLORS.sidebarBorder}`,
        display: "flex",
        flexDirection: "column",
        padding: "18px 14px",
        height: "100vh"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 18px" }}>
        <img src="/gmc-btv-logo.png" alt="Green Mountain Club" width={40} height={40} style={{ display: "block", objectFit: "contain", flex: "none" }} />
        <span style={{ fontSize: "14.5px", fontWeight: 700, letterSpacing: "-.01em", lineHeight: 1.2 }}>
          GMC
          <br />
          Burlington Historical Archive
        </span>
      </div>

      <nav aria-label="Primary" style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
        <NavLink to="/" end style={({ isActive }) => navButtonStyle(isActive)}>
          <NavIcon>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </NavIcon>
          Ask &amp; Search
        </NavLink>
        <NavLink to="/library" style={({ isActive }) => navButtonStyle(isActive)}>
          <NavIcon>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </NavIcon>
          Library
        </NavLink>
        <NavLink to="/favorites" style={({ isActive }) => navButtonStyle(isActive)}>
          <NavIcon>
            <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
          </NavIcon>
          Favorites
        </NavLink>
        {isEditor && (
          <NavLink to="/upload" style={({ isActive }) => navButtonStyle(isActive)}>
            <NavIcon>
              <path d="M12 16V5" />
              <path d="m7 9 5-5 5 5" />
              <path d="M5 19h14" />
            </NavIcon>
            Upload
          </NavLink>
        )}
        {isEditor && (
          <NavLink to="/access-requests" style={({ isActive }) => navButtonStyle(isActive)}>
            <NavIcon>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </NavIcon>
            Access Requests
          </NavLink>
        )}
      </nav>

      <div style={{ marginTop: "auto", borderTop: "1px solid #E1D7C8", paddingTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 6px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#8E9C6A",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 15,
              flex: "none"
            }}
          >
            {userInitial}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "12px", color: COLORS.textNav }}>{ROLE_LABELS[props.user.role]}</div>
          </div>
          <button
            type="button"
            onClick={props.onSignOut}
            title="Sign out"
            style={{
              flex: "none",
              width: 30,
              height: 30,
              borderRadius: 2,
              border: "none",
              background: "transparent",
              color: COLORS.textNav,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
