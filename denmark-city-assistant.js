(() => {
  'use strict';

  const root = document.querySelector('[data-denmark-city-assistant]');
  if (!root) return;

  const select = root.querySelector('#dkCity');
  const useLocationButton = root.querySelector('#dkUseLocation');
  const status = root.querySelector('#dkCityStatus');
  const cityName = root.querySelector('#dkSelectedCityName');
  const citySummary = root.querySelector('#dkSelectedCitySummary');
  const transportName = root.querySelector('#dkTransportName');
  const transportLink = root.querySelector('#dkTransportLink');
  const siriName = root.querySelector('#dkSiriName');
  const siriAddress = root.querySelector('#dkSiriAddress');
  const municipalLink = root.querySelector('#dkMunicipalLink');
  const localActions = Array.from(root.querySelectorAll('[data-local-action]'));

  const SIRI_OFFICES = 'https://nyidanmark.dk/en-GB/Contact-us/Contact-SIRI/SIRI-branch-offices';
  const REJSEPLANEN = 'https://www.rejseplanen.dk/bin/query.exe/en';
  const NEMKONTO = 'https://lifeindenmark.borger.dk/apps-and-digital-services/nemkonto-your-public-bank-account';
  const LANGUAGE = 'https://lifeindenmark.borger.dk/leisure-and-networking/Danish-language-training';
  const DAYCARE = 'https://lifeindenmark.borger.dk/family-and-children/childcare/rules-for-day-care-facilities';
  const SCHOOL = 'https://lifeindenmark.borger.dk/school-and-education/school/enrolment-to-start-school';
  const DRIVING = 'https://lifeindenmark.borger.dk/travel-and-transport/driving-licence/how-to-obtain-a-driving-license-in-denmark';
  const EMERGENCY = 'https://lifeindenmark.borger.dk/healthcare/Emergencies';

  const cities = {
    copenhagen: {
      name: 'Copenhague',
      lat: 55.6761,
      lon: 12.5683,
      summary: 'Capital y mayor nodo de transporte. Metro, S-train, tren regional y una red extensa de autobuses.',
      transport: { name: 'DOT · bus, metro, tren y light rail', url: 'https://dinoffentligetransport.dk/en' },
      siri: { name: 'SIRI Copenhagen', address: 'Carl Jacobsens Vej 39, 2500 Valby' },
      municipality: { name: 'Københavns Kommune', url: 'https://international.kk.dk/' }
    },
    aarhus: {
      name: 'Aarhus',
      lat: 56.1629,
      lon: 10.2039,
      summary: 'Gran ciudad universitaria de Jutlandia con autobuses, tren y Aarhus Letbane.',
      transport: { name: 'Midttrafik · bus y Letbanen', url: 'https://www.midttrafik.dk/english/' },
      siri: { name: 'SIRI Aarhus', address: 'Dokk1, Hack Kampmanns Plads 2, 8000 Aarhus' },
      municipality: { name: 'Aarhus Kommune', url: 'https://international.aarhus.dk/' }
    },
    odense: {
      name: 'Odense',
      lat: 55.4038,
      lon: 10.4024,
      summary: 'Centro de Fionia con tren, autobuses y Odense Letbane.',
      transport: { name: 'FynBus · bus y Letbanen', url: 'https://fynbus.dk/' },
      siri: { name: 'SIRI Odense', address: 'Østre Stationsvej 15, 5000 Odense' },
      municipality: { name: 'Odense Kommune', url: 'https://www.odense.dk/' }
    },
    vejle: {
      name: 'Vejle',
      lat: 55.7113,
      lon: 9.5364,
      summary: 'Ciudad bien conectada por tren y autobús dentro del Triángulo de Dinamarca.',
      transport: { name: 'Sydtrafik · autobuses regionales', url: 'https://sydtrafik.dk/' },
      siri: { name: 'Consulta la oficina SIRI más conveniente', address: 'SIRI dispone de oficinas en varias ciudades; revisa cita y horarios antes de desplazarte.' },
      municipality: { name: 'Vejle Kommune', url: 'https://www.vejle.dk/' }
    },
    fredericia: {
      name: 'Fredericia',
      lat: 55.5657,
      lon: 9.7526,
      summary: 'Nudo ferroviario del Triángulo de Dinamarca con conexiones rápidas hacia Fionia y Jutlandia.',
      transport: { name: 'Sydtrafik · autobuses regionales', url: 'https://sydtrafik.dk/' },
      siri: { name: 'Consulta la oficina SIRI más conveniente', address: 'La oficina adecuada depende del trámite y tu desplazamiento; comprueba la red oficial y reserva si se exige.' },
      municipality: { name: 'Fredericia Kommune', url: 'https://www.fredericia.dk/' }
    },
    kolding: {
      name: 'Kolding',
      lat: 55.4904,
      lon: 9.4722,
      summary: 'Ciudad del sur de Jutlandia con tren y red regional de autobuses.',
      transport: { name: 'Sydtrafik · autobuses regionales', url: 'https://sydtrafik.dk/' },
      siri: { name: 'Consulta la oficina SIRI más conveniente', address: 'Comprueba en SIRI la oficina disponible, necesidad de cita y documentación antes de viajar.' },
      municipality: { name: 'Kolding Kommune', url: 'https://www.kolding.dk/' }
    },
    horsens: {
      name: 'Horsens',
      lat: 55.8607,
      lon: 9.8503,
      summary: 'Ciudad de Jutlandia oriental con tren nacional y red de autobuses de Midttrafik.',
      transport: { name: 'Midttrafik · autobuses regionales', url: 'https://www.midttrafik.dk/english/' },
      siri: { name: 'SIRI Aarhus', address: 'Dokk1, Hack Kampmanns Plads 2, 8000 Aarhus' },
      municipality: { name: 'Horsens Kommune', url: 'https://horsens.dk/' }
    }
  };

  const escapeQuery = (value) => encodeURIComponent(value);
  const openUrl = (url) => window.open(url, '_blank', 'noopener,noreferrer');
  const openMaps = (query) => openUrl('https://www.google.com/maps/search/?api=1&query=' + escapeQuery(query));
  const openSearch = (query) => openUrl('https://www.google.com/search?q=' + escapeQuery(query));

  const distanceKm = (aLat, aLon, bLat, bLon) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const earth = 6371;
    const dLat = toRad(bLat - aLat);
    const dLon = toRad(bLon - aLon);
    const x = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
    return earth * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const selectedCity = () => cities[select.value] || null;

  const render = (key, source = 'manual') => {
    const city = cities[key];
    if (!city) {
      cityName.textContent = 'Elige una ciudad';
      citySummary.textContent = 'La guía adaptará servicios, transporte y búsquedas a tu zona.';
      return;
    }

    select.value = key;
    cityName.textContent = city.name;
    citySummary.textContent = city.summary;
    transportName.textContent = city.transport.name;
    transportLink.href = city.transport.url;
    siriName.textContent = city.siri.name;
    siriAddress.textContent = city.siri.address;
    municipalLink.textContent = city.municipality.name + ' ↗';
    municipalLink.href = city.municipality.url;
    status.textContent = source === 'location'
      ? 'Ciudad sugerida por tu ubicación: ' + city.name + '. La ubicación se usó solo en tu navegador y no se guarda.'
      : 'Guía adaptada a ' + city.name + '. Puedes cambiar de ciudad cuando quieras.';
  };

  select.addEventListener('change', () => render(select.value, 'manual'));

  useLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      status.textContent = 'Tu navegador no permite geolocalización. Elige una ciudad manualmente.';
      return;
    }
    status.textContent = 'Solicitando ubicación…';
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const candidates = Object.entries(cities).map(([key, city]) => ({
          key,
          distance: distanceKm(coords.latitude, coords.longitude, city.lat, city.lon)
        })).sort((a, b) => a.distance - b.distance);

        const nearest = candidates[0];
        if (!nearest || nearest.distance > 300) {
          status.textContent = 'Tu ubicación no parece estar cerca de las ciudades incluidas. Elige una ciudad manualmente.';
          return;
        }
        render(nearest.key, 'location');
      },
      () => {
        status.textContent = 'No pude usar tu ubicación. Elige una ciudad manualmente; la guía funciona igual.';
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });

  localActions.forEach((button) => {
    button.addEventListener('click', () => {
      const city = selectedCity();
      if (!city) {
        status.textContent = 'Elige una ciudad antes de usar un buscador local.';
        select.focus();
        return;
      }

      const action = button.dataset.localAction;
      const name = city.name;

      switch (action) {
        case 'journey':
          openUrl(REJSEPLANEN);
          break;
        case 'bus':
          openUrl(city.transport.url);
          break;
        case 'siri':
          openUrl(SIRI_OFFICES);
          break;
        case 'hospital':
          openMaps('hospital emergency department ' + name + ' Denmark');
          break;
        case 'doctor':
          openMaps('doctor medical clinic ' + name + ' Denmark');
          break;
        case 'bank':
          openMaps('bank ' + name + ' Denmark');
          break;
        case 'nemkonto':
          openUrl(NEMKONTO);
          break;
        case 'housing':
          openSearch('rental apartment ' + name + ' Denmark');
          break;
        case 'bicycle-rent':
          openMaps('bicycle rental ' + name + ' Denmark');
          break;
        case 'bicycle-buy':
          openSearch('used bicycle ' + name + ' Denmark DBA Facebook Marketplace');
          break;
        case 'free-stuff':
          openSearch('gratis ting ' + name + ' Facebook genbrug byttehjørne');
          break;
        case 'reuse':
          openMaps('genbrugsstation byttehjørne ' + name + ' Denmark');
          break;
        case 'car-rent':
          openMaps('car rental ' + name + ' Denmark');
          break;
        case 'motorbike':
          openMaps('motorcycle scooter rental ' + name + ' Denmark');
          break;
        case 'driving':
          openUrl(DRIVING);
          break;
        case 'danish':
          openUrl(LANGUAGE);
          break;
        case 'danish-local':
          openSearch('site:' + new URL(city.municipality.url).hostname + ' danskuddannelse language course');
          break;
        case 'university':
          openMaps('university higher education ' + name + ' Denmark');
          break;
        case 'school':
          openUrl(SCHOOL);
          break;
        case 'daycare':
          openUrl(DAYCARE);
          break;
        case 'municipality':
          openUrl(city.municipality.url);
          break;
        case 'emergency':
          openUrl(EMERGENCY);
          break;
        default:
          break;
      }
    });
  });

  render(select.value || 'copenhagen', 'manual');
})();
