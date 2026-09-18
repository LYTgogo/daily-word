import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
 base: process.env.BASE_PATH || '/daily-word/',
 plugins:[react(),VitePWA({registerType:'prompt',includeAssets:['icons/*.png','icons/*.svg'],manifest:{name:'每日词记',short_name:'每日词记',description:'每天一点，记得更久',lang:'zh-CN',start_url:'./',scope:'./',display:'standalone',background_color:'#f7f7ef',theme_color:'#f7f7ef',icons:[{src:'icons/icon-192.png',sizes:'192x192',type:'image/png'},{src:'icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},{src:'icons/icon-maskable.png',sizes:'512x512',type:'image/png',purpose:'maskable'}]},workbox:{clientsClaim:true,globPatterns:['**/*.{js,css,html,png,svg,webmanifest}'],cleanupOutdatedCaches:true,navigateFallback:'index.html'}})]
});
