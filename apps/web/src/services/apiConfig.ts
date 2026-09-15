import { setApiBaseUrl } from '@task/core/services/config';

// @task/core no longer reads NEXT_PUBLIC_API_URL itself — it is shared with the
// Expo app, which has no such variable. The web app injects its own URL here.
//
// NEXT_PUBLIC_* is inlined at build time, so this works in both the server and
// client bundles. Import it from the root layout (server) and from AppShell
// (client) so the value is set in whichever bundle ends up making requests,
// before any component can fire one.
setApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7249/api');

export {};
