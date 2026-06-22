import { NavLink } from "react-router-dom";
import type { User } from "@/lib/types";

export interface SideNavProps {
  user: User;
  onSignOut: () => void;
}

const ROLE_LABELS: Record<User["role"], string> = {
  viewer: "Researcher",
  publisher: "Editor"
};

export function SideNav(props: SideNavProps): JSX.Element {
  const isEditor = props.user.role === "publisher";

  return (
    <nav aria-label="Primary">
      <NavLink to="/">Ask &amp; Search</NavLink>
      <NavLink to="/library">Library</NavLink>
      <NavLink to="/favorites">Favorites</NavLink>
      {isEditor && <NavLink to="/upload">Upload</NavLink>}
      {isEditor && <NavLink to="/access-requests">Access Requests</NavLink>}
      <div>
        <span>{ROLE_LABELS[props.user.role]}</span>
        <button type="button" onClick={props.onSignOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
