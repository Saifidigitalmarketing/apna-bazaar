// Apna Bazaar: exact GPS checkout + temporarily hide online payments.
(function () {
  const SHOP_LATITUDE = 33.142373;
  const SHOP_LONGITUDE = 73.722759;
  const BASE_DISTANCE_KM = 4;
  const BASE_DELIVERY_CHARGE = 250;
  const EXTRA_CHARGE_PER_KM = 50;

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const rad = v => v * Math.PI / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function deliveryCharge(km) {
    if (!Number.isFinite(km)) return 0;
    return km <= BASE_DISTANCE_KM ? BASE_DELIVERY_CHARGE : BASE_DELIVERY_CHARGE + Math.ceil(km - BASE_DISTANCE_KM) * EXTRA_CHARGE_PER_KM;
  }

  function hideOnlinePayments() {
    document.querySelectorAll('.payment-card.online-payment-hidden, input[name="paymentMethod"][value="JazzCash"], input[name="paymentMethod"][value="EasyPaisa"]').forEach(el => {
      const card = el.closest('.payment-card');
      (card || el).style.setProperty('display', 'none', 'important');
    });
  }

  async function reverseGeocode(lat, lon) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
      if (!r.ok) return 'GPS Location';
      const data = await r.json();
      return data.display_name || 'GPS Location';
    } catch (_) {
      return 'GPS Location';
    }
  }

  function installLocation() {
    const original = document.getElementById('useCurrentLocation');
    if (!original || original.dataset.exactGpsFix === '1') return;

    const button = original.cloneNode(true);
    button.dataset.exactGpsFix = '1';
    original.replaceWith(button);

    button.addEventListener('click', () => {
      const status = document.getElementById('locationStatus');
      const area = document.getElementById('customerArea');
      const address = document.getElementById('customerAddress');

      if (!navigator.geolocation) {
        if (status) status.textContent = 'Location is not supported on this device.';
        return;
      }

      button.disabled = true;
      button.textContent = 'Detecting Exact Location...';
      if (status) status.textContent = 'Getting your exact GPS location...';

      navigator.geolocation.getCurrentPosition(async pos => {
        window.customerLatitude = pos.coords.latitude;
        window.customerLongitude = pos.coords.longitude;
        window.customerDistanceKm = distanceKm(SHOP_LATITUDE, SHOP_LONGITUDE, window.customerLatitude, window.customerLongitude);
        window.calculatedDeliveryCharge = deliveryCharge(window.customerDistanceKm);

        if (area) area.value = 'GPS Location';
        if (address) address.value = await reverseGeocode(window.customerLatitude, window.customerLongitude);

        if (status) status.textContent = '✓ Exact GPS location captured successfully';
        button.disabled = false;
        button.textContent = 'Location Captured ✓';
      }, err => {
        button.disabled = false;
        button.textContent = 'Use Current Location';
        if (status) status.textContent = err.code === 1 ? 'Location permission allow karein, phir dobara try karein.' : 'GPS location detect nahi ho saki. Dobara try karein.';
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    });
  }

  function init() {
    hideOnlinePayments();
    installLocation();
    const cod = document.querySelector('input[name="paymentMethod"][value="Cash on Delivery"]');
    if (cod) cod.checked = true;
    new MutationObserver(hideOnlinePayments).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
