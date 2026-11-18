console.log('script.js loaded');
const saunaList = document.querySelector('#sauna-list');
const saunaStatus = document.querySelector('#sauna-status');
const filterButtons = document.querySelectorAll('[data-filter]');

if (saunaList) {
  function updateStatus() {
    const allCards = saunaList.querySelectorAll('article');
    const visibleCards = saunaList.querySelectorAll('article:not([hidden])');
    if (saunaStatus) {
      saunaStatus.textContent = `Näytetään ${visibleCards.length} / ${allCards.length} saunaa`;
    }
  }

  // Päivitetään määrä heti sivun latautuessa
  updateStatus();

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      // 1. Merkitään klikattu painike valituksi
      for (const other of filterButtons) {
        other.setAttribute('aria-pressed', String(other === button));
      }

      // 2. Piilotetaan sopimattomat ja näytetään sopivat saunat
      const filter = button.dataset.filter;
      const cards = saunaList.querySelectorAll('article');

      for (const card of cards) {
        const sizes = (card.dataset.size || '').split(' ');
        card.hidden = !(filter === 'all' || sizes.includes(filter));
      }

      // 3. Päivitetään tilarivi
      updateStatus();
    });
  }
}
