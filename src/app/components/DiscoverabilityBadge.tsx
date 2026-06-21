import type { DiscoverabilityStatus } from "@/lib/search/checkDiscoverability";

export interface DiscoverabilityBadgeProps {
  status: DiscoverabilityStatus;
}

export function DiscoverabilityBadge(props: DiscoverabilityBadgeProps): JSX.Element {
  return <span role="status">{props.status === "discoverable" ? "Discoverable" : "Pending"}</span>;
}
