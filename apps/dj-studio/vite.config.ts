import { defineConfig } from 'vite';
export default defineConfig({base:'/dj-studio/', build:{outDir:'../../dj-studio',emptyOutDir:true,assetsDir:'assets',assetsInlineLimit:0,rollupOptions:{input:{studio:'index.html',qa:'qa.html',recordingQA:'recording-qa.html'}}},server:{port:5173}});
