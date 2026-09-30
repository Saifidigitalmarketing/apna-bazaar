// Apna Bazaar: temporarily hide online payments (Cash on Delivery only).
// Exact GPS location ab script.js mein handle hoti hai.
(function () {
  function hideOnlinePayments() {
    document.querySelectorAll('.payment-card.online-payment-hidden, input[name="paymentMethod"][value="JazzCash"], input[name="paymentMethod"][value="EasyPaisa"]').forEach(el => {
      const card = el.closest('.payment-card');
      (card || el).style.setProperty('display', 'none', 'important');
    });
  }

  function init() {
    hideOnlinePayments();
    const cod = document.querySelector('input[name="paymentMethod"][value="Cash on Delivery"]');
    if (cod) cod.checked = true;
    new MutationObserver(hideOnlinePayments).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
