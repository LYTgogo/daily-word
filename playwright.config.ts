import {defineConfig,devices} from '@playwright/test';
const baseURL=`http://127.0.0.1:4173${process.env.BASE_PATH || '/daily-word/'}`;
export default defineConfig({testDir:'./e2e',fullyParallel:false,workers:1,use:{baseURL,...devices['iPhone 13'],defaultBrowserType:'chromium',serviceWorkers:'allow'},webServer:{command:'npm run preview -- --port 4173',url:baseURL,reuseExistingServer:!process.env.CI},projects:[{name:'mobile-chromium',use:{browserName:'chromium'}}]});
