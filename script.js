const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');
const STORAGE_KEY = 'kuivasjarvi_yhteydenotto';

if (contactForm) {
    contactForm.noValidate = true;

    // Palautetaan keskeneräinen viesti localStoragesta
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
        try {
            const data = JSON.parse(savedDraft);
            for (const [key, value] of Object.entries(data)) {
                const field = contactForm.elements.namedItem(key);
                if (field) {
                    field.value = value;
                }
            }
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    function validateField(field) {
        const errorEl = document.querySelector(`#${field.id}-error`);
        if (!errorEl) return true;

        if (field.validity.valid) {
            field.removeAttribute('aria-invalid');
            errorEl.textContent = '';
            return true;
        } else {
            field.setAttribute('aria-invalid', 'true');
            if (field.validity.valueMissing) {
                errorEl.textContent = 'Tämä kenttä on pakollinen.';
            } else if (field.validity.typeMismatch) {
                errorEl.textContent = 'Anna kelvollinen sähköpostiosoite.';
            } else if (field.validity.tooShort) {
                errorEl.textContent = `Kirjoita vähintään ${field.minLength} merkkiä.`;
            } else {
                errorEl.textContent = field.validationMessage;
            }
            return false;
        }
    }

    // Tallennetaan luonnos ja tyhjennetään korjatut virheet kirjoittaessa
    contactForm.addEventListener('input', (event) => {
        const target = event.target;
        if (target.hasAttribute('aria-invalid')) {
            validateField(target);
        }

        const plainObject = Object.fromEntries(new FormData(contactForm).entries());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plainObject));
    });

    // Tarkistetaan kentät ja kootaan yhteenveto
    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const fields = contactForm.querySelectorAll('input, select, textarea');
        let firstInvalidField = null;

        for (const field of fields) {
            const isValid = validateField(field);
            if (!isValid && !firstInvalidField) {
                firstInvalidField = field;
            }
        }

        if (firstInvalidField) {
            firstInvalidField.focus();
            return;
        }

        const data = Object.fromEntries(new FormData(contactForm).entries());
        if (formStatus) {
            formStatus.textContent = `Yhteydenottopyyntö on valmis! Kiitos viestistäsi, ${data.nimi}!`;
        }

        contactForm.reset();
        localStorage.removeItem(STORAGE_KEY);
    });
}
