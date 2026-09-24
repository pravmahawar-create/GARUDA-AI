import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.garudaos.sanatansetu',
  appName: 'Sanatan Setu',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#07090E',
      style: 'DARK'
    }
  }
};

export default config;
