import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ddactionnarrator.app',
  appName: 'D&D Action Narrator',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
