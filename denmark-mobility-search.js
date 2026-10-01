(() => {
  'use strict';
  const city = document.getElementById('fuelCity');
  const status = document.getElementById('fuelStatus');
  const nearFuel = document.getElementById('fuelNearMe');
  const nearCharge = document.getElementById('chargeNearMe');
  const byCity = document.getElementById('fuelByCity');
  if (!city || !status || !nearFuel || !nearCharge || !byCity) return;

  const openMaps = (query) => {
    const url = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const useLocation = (kind) => {
    if (!navigator.geolocation) {
      status.textContent = 'Tu navegador no permite usar ubicación. Elige una ciudad manualmente.';
      return;
    }
    status.textContent = 'Solicitando tu ubicación…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        status.textContent = kind === 'charge'
          ? 'Abriendo cargadores eléctricos cercanos.'
          : 'Abriendo gasolineras cercanas.';
        openMaps((kind === 'charge' ? 'electric vehicle charging station near ' : 'gas station near ') + latitude + ',' + longitude);
      },
      () => {
        status.textContent = 'No pude usar tu ubicación. Elige una ciudad manualmente.';
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };
  nearFuel.addEventListener('click', () => useLocation('fuel'));
  nearCharge.addEventListener('click', () => useLocation('charge'));
  byCity.addEventListener('click', () => {
    const selected = city.value.trim();
    if (!selected) {
      status.textContent = 'Elige una ciudad primero.';
      city.focus();
      return;
    }
    status.textContent = 'Abriendo gasolineras en ' + selected + '.';
    openMaps('gas station in ' + selected + ', Denmark');
  });
})();