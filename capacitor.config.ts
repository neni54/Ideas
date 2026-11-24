import type { CapacitorConfig } from '@capacitor/cli';

// iOS app (App Store). The web build in dist/ ships inside the app;
// the AI features call the deployed server (VITE_API_BASE, see .env.ios.example).
const config: CapacitorConfig = {
  appId: 'app.sideye.ios', // change it to your own reverse domain before creating the app in App Store Connect
  appName: 'SIDEYE',
  webDir: 'dist',
  backgroundColor: '#121110',
  ios: {
    contentInset: 'never',
    backgroundColor: '#121110',
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
