import { getDashboardToken, invalidateDashboardToken } from "../../auth";

export async function ensureWidgetSession() {
  await getDashboardToken();
}

export function logout() {
  invalidateDashboardToken();
}
