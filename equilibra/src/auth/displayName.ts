import type { GitHubUser } from "./api";

/** Returns the best human-readable name for a GitHub user. */
export function getDisplayName(user: GitHubUser): string {
  return user.db_user?.display_name || user.name || user.login;
}
