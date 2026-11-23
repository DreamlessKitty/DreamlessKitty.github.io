const API_BASE = 'https://vectorsigma.org/briefer/api/v1';
const CUSTOMER_ID = 6;

const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const STORAGE_KEY = 'kuivasjarvi_yhteydenotto';

const filterButtons = document.querySelectorAll('.filters button');
const saunaList = document.querySelector('#sauna-list');
const saunaStatus = document.querySelector('#sauna-status');
const saunaTemplate = document.querySelector('#sauna-template');
const loadMoreBtn = document.querySelector('#load-more-btn');

let nextCursor = null;
let currentFilter = 'all';

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWithRetry(url, tries = 3) {
    for (let attempt = 1; ; attempt++) {
        const res = await fetch(url);

        if (res.status === 429 && attempt < tries) {
            const seconds = Number(res.headers.get('Retry-After')) || 3;
            if (saunaStatus) {
                saunaStatus.textContent = `Palvelin on kiireinen. Yritetään uudelleen…`;
            }
            await wait(seconds * 1000);
            continue;
        }

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        return res.json();
    }
}

// 1. Load client info (/customer) into #aukiolo-popover
async function loadCustomerInfo() {
    const popover = document.querySelector('#aukiolo-popover');
    const contactPerson = document.querySelector('#contact-person');
    const contactAddress = document.querySelector('#contact-address');
    const contactHours = document.querySelector('#contact-hours');

    if (!popover && !contactPerson && !contactAddress && !contactHours) return;

    const url = new URL(`${API_BASE}/customer`);
    url.searchParams.set('customer', CUSTOMER_ID);
    url.searchParams.set('lang', 'fi');

    try {
        const customer = await getWithRetry(url);

        if (popover) {
            const paragraphs = popover.querySelectorAll('p');
            if (paragraphs[0] && customer.evening) {
                paragraphs[0].textContent = `Auki joka päivä: klo ${customer.evening}`;
            }
            if (paragraphs[1] && customer.address) {
                paragraphs[1].textContent = customer.address;
            }
        }

        if (contactPerson && customer.contact) contactPerson.textContent = customer.contact;
        if (contactAddress && customer.address) contactAddress.textContent = customer.address;
        if (contactHours && customer.evening) contactHours.textContent = customer.evening;
    } catch (error) {
        console.warn('Asiakastietojen haku epäonnistui:', error);
    }
}

// Add this function for listing.html (#booking-form):
async function initBookingForm() {
    const bookingForm = document.querySelector('#booking-form');
    const saunaSelect = document.querySelector('#sauna');
    const daySelect = document.querySelector('#paiva');
    const priceText = document.querySelector('#booking-price');
    const bookingStatus = document.querySelector('#booking-status');

    if (!bookingForm || !saunaSelect || !daySelect) return;

    bookingStatus.textContent = 'Ladataan varattavia saunoja…';
    const url = new URL(`${API_BASE}/items`);
    url.searchParams.set('customer', CUSTOMER_ID);
    url.searchParams.set('lang', 'fi');
    //url.searchParams.set('simulate', '429'); // <-- TEMPORARY TEST LINE

    try {
        const page = await getWithRetry(url);
        const items = page.items ?? [];

        saunaSelect.replaceChildren(new Option('Valitse sauna…', ''));
        for (const item of items) {
            saunaSelect.append(new Option(`${item.name} (max ${item.capacity} hlö)`, item.id));
        }
        bookingStatus.textContent = '';

        saunaSelect.addEventListener('change', () => {
            const selected = items.find((i) => i.id === saunaSelect.value);
            daySelect.replaceChildren();
            priceText.textContent = 'Valitse vapaa ilta nähdäksesi hinnan.';

            if (!selected) {
                daySelect.append(new Option('Valitse ensin sauna', ''));
                return;
            }

            const freeEvenings = (selected.evenings ?? []).filter((e) => e.free);
            if (freeEvenings.length === 0) {
                daySelect.append(new Option('Ei vapaita iltoja', ''));
                return;
            }

            daySelect.append(new Option('Valitse vapaa ilta…', ''));
            for (const evening of freeEvenings) {
                const label = new Date(`${evening.date}T12:00`).toLocaleDateString('fi-FI');
                const opt = new Option(label, evening.date);
                opt.dataset.price = evening.price;
                daySelect.append(opt);
            }
        });

        daySelect.addEventListener('change', () => {
            const selectedOption = daySelect.selectedOptions[0];
            const rawPrice = selectedOption?.dataset.price;
            if (rawPrice != null) {
                const formatted = Number(rawPrice).toLocaleString('fi-FI', {
                    style: 'currency',
                    currency: 'EUR',
                });
                priceText.textContent = `Varauksen hinta: ${formatted} (klo 16:00–22:00)`;
            } else {
                priceText.textContent = 'Valitse vapaa ilta nähdäksesi hinnan.';
            }
        });

        bookingForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!saunaSelect.value || !daySelect.value) {
                bookingStatus.textContent = 'Valitse sauna ja vapaa ilta ennen lähettämistä.';
                return;
            }
            const saunaName = saunaSelect.selectedOptions[0].textContent;
            const dateLabel = daySelect.selectedOptions[0].textContent;
            bookingStatus.textContent = `Varauspyyntö on valmis (${saunaName}, ${dateLabel})!`;
            bookingForm.reset();
        });
        } catch (error) {
        bookingStatus.textContent = 'Varaustietojen lataaminen epäonnistui. Yritä päivittää sivu.';
        saunaSelect.replaceChildren(new Option('Ei saatavilla', ''));
        saunaSelect.disabled = true;
        daySelect.disabled = true;
    }
}

// 2. Render one sauna card safely using <template> and .textContent
function createSaunaCard(item) {
    const card = saunaTemplate.content.firstElementChild.cloneNode(true);

    const capacity = item.capacity ?? null;
    card.dataset.size = capacity != null && capacity <= 4 ? 'pieni' : 'iso';

    card.querySelector('.sauna__name').textContent = item.name ?? 'Nimetön sauna';

    // Show next available evening date from evenings[]
    const descEl = card.querySelector('.sauna__desc');
    const evenings = Array.isArray(item.evenings) ? item.evenings : [];
    const nextFree = evenings.find((e) => e.free);

    if (nextFree?.date) {
        const formattedDate = new Date(`${nextFree.date}T12:00`).toLocaleDateString('fi-FI');
        descEl.textContent = `Seuraava vapaa ilta: ${formattedDate}`;
    } else if (evenings.length > 0) {
        descEl.textContent = 'Ei vapaita iltoja lähiaikoina';
    } else {
        descEl.remove();
    }

    // Show capacity
    const capEl = card.querySelector('.sauna__capacity');
    if (capacity != null) {
        capEl.textContent = `Henkilömäärä: enintään ${capacity} henkilöä`;
    } else {
        capEl.remove();
    }

    // Show starting price from evenings[]
    const priceEl = card.querySelector('.sauna__price');
    const prices = evenings
        .map((e) => e.price)
        .filter((p) => typeof p === 'number');

    if (prices.length > 0) {
        const minPrice = Math.min(...prices).toLocaleString('fi-FI', {
            style: 'currency',
            currency: 'EUR',
        });
        priceEl.textContent = `Hinta: alk. ${minPrice} / ilta`;
    } else {
        priceEl.textContent = 'Hinta: Kysy tarjousta';
    }

    return card;
}

function applyFilter() {
    if (!saunaList) return;

    const currentSaunas = saunaList.querySelectorAll('article');
    let visibleCount = 0;

    currentSaunas.forEach((sauna) => {
        const matches = currentFilter === 'all' || sauna.dataset.size === currentFilter;
        sauna.hidden = !matches;
        if (matches) visibleCount++;
    });

    if (saunaStatus && currentSaunas.length > 0) {
        saunaStatus.textContent = `Näytetään ${visibleCount}/${currentSaunas.length} saunaa.`;
    }
}

// 3. Load sauna items (/items)
async function loadSaunas(cursor = null) {
    if (!saunaList || !saunaTemplate) return;
    saunaStatus.textContent = 'Ladataan saunoja…';
    saunaList.setAttribute('aria-busy', 'true');
    if (loadMoreBtn) loadMoreBtn.disabled = true;

    const url = new URL(`${API_BASE}/items`);
    url.searchParams.set('customer', CUSTOMER_ID);
    url.searchParams.set('lang', 'fi');
    // url.searchParams.set('simulate', '500'); // <-- TEMPORARY TEST LINE
    if (cursor) {
        url.searchParams.set('cursor', cursor);
    }

    try {
        const page = await getWithRetry(url);
        const items = page.items ?? [];

        if (!cursor) {
            saunaList.replaceChildren();
        }

        if (items.length === 0 && !cursor) {
            saunaStatus.textContent = 'Saunoja ei löytynyt juuri nyt.';
        } else {
            for (const item of items) {
                saunaList.append(createSaunaCard(item));
            }
            applyFilter();
        }

        nextCursor = page.next ?? null;
        if (loadMoreBtn) {
            loadMoreBtn.hidden = nextCursor === null;
        }
    } catch (error) {
        saunaStatus.textContent = 'Saunojen lataaminen epäonnistui. Yritä päivittää sivu.';
    } finally {
        saunaList.removeAttribute('aria-busy');
        if (loadMoreBtn) loadMoreBtn.disabled = false;
    }
}

if (filterButtons.length > 0 && saunaList) {
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            filterButtons.forEach((btn) => {
                btn.setAttribute('aria-pressed', btn === button ? 'true' : 'false');
            });
            applyFilter();
        });
    });
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
        if (nextCursor) {
            loadSaunas(nextCursor);
        }
    });
}

loadCustomerInfo();
loadSaunas();
initBookingForm();
