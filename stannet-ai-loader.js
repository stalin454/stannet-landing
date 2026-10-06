// One version and one loader for every supported StanNet entry point.
(()=>{
  if(document.querySelector('script[data-stannet-ai-loader]'))return;
  const ai=document.createElement('script');
  ai.src='/stannet-ai.js?v=20261006-android1';
  ai.defer=true;ai.dataset.stannetAiLoader='true';
  document.body.appendChild(ai);
})();
