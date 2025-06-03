document.addEventListener('DOMContentLoaded', function() {
    // Formulare und Buttons in der Eingabespalte
    const formBereitsKontaktiert = document.getElementById('formBereitsKontaktiert');
    const formNochZuKontaktieren = document.getElementById('formNochZuKontaktieren');

    // Anzeige-Container in der Anzeigespalte
    const displayBereitsKontaktiertListe = document.getElementById('displayBereitsKontaktiertListe');
    const displayNochZuKontaktierenListe = document.getElementById('displayNochZuKontaktierenListe');

    // Haupt-Aktionsbuttons
    const saveProtokollBtn = document.getElementById('saveProtokollBtn');
    const loadProtokollBtn = document.getElementById('loadProtokollBtn');
    const deleteProtokollBtn = document.getElementById('deleteProtokollBtn');

    const storageKey = 'kontaktProtokollData';
    let protokollDaten = {
        bereitsKontaktiert: [],
        nochZuKontaktieren: []
    };

    // Mapping für die lesbare Anzeige der Status-IDs
    const statusMapBereitsKontaktiert = {
        'absage_kapazitaeten': 'Absage (keine Kapazitäten)',
        'absage_privat': 'Absage (nur Privatpatienten/Selbstzahler)',
        'wartezeit_genannt': 'Wartezeit genannt',
        'warteliste_platz': 'Auf Warteliste gesetzt',
        'termin_sprechstunde': 'Termin für Sprechstunde/Erstgespräch',
        'keine_antwort': 'Keine Antwort/Rückmeldung',
        'nicht_erreicht': 'Telefonisch nicht erreicht',
        'sonstiges': 'Sonstiges'
    };

    // ---- DATENMANAGEMENT FUNKTIONEN ----
    function saveProtokollToLocalStorage() {
        localStorage.setItem(storageKey, JSON.stringify(protokollDaten));
        console.log("Protokoll gespeichert.");
    }

    function loadProtokollFromLocalStorage() {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Sicherstellen, dass die Arrays und deren Objekte die erwarteten Eigenschaften haben
                protokollDaten.bereitsKontaktiert = (parsedData.bereitsKontaktiert || []).map(item => ({
                    name: item.name || '',
                    datum: item.datum || '',
                    art: item.art || '',
                    status: item.status || 'sonstiges', // Standard-Status, falls fehlt
                    ergebnis: item.ergebnis || ''
                }));
                protokollDaten.nochZuKontaktieren = (parsedData.nochZuKontaktieren || []).map(item => ({
                    name: item.name || '',
                    kontaktinfo: item.kontaktinfo || '',
                    erreichbarkeit: item.erreichbarkeit || ''
                    // Kein Status mehr hier
                }));

            } catch (e) {
                console.error("Fehler beim Parsen der Protokolldaten aus localStorage:", e);
                protokollDaten = { bereitsKontaktiert: [], nochZuKontaktieren: [] }; // Reset bei Fehler
            }
        } else {
            protokollDaten = { bereitsKontaktiert: [], nochZuKontaktieren: [] }; // Initial, falls nichts da ist
        }
        renderProtokollListen();
    }

    // ---- ANZEIGE FUNKTIONEN ----
    function renderProtokollListen() {
        // Bereits kontaktierte Liste rendern
        displayBereitsKontaktiertListe.innerHTML = '';
        if (protokollDaten.bereitsKontaktiert.length === 0) {
            displayBereitsKontaktiertListe.innerHTML = '<p><em>Noch keine Einträge vorhanden.</em></p>';
        } else {
            protokollDaten.bereitsKontaktiert.forEach((item, index) => {
                const eintragDiv = document.createElement('div');
                eintragDiv.classList.add('protokoll-eintrag-display');
                eintragDiv.innerHTML = `
                    <button type="button" class="remove-btn-display" data-type="bereits" data-index="${index}" title="Diesen Eintrag entfernen">X</button>
                    <p><strong>Name:</strong> ${item.name || 'N/A'}</p>
                    <p><strong>Datum:</strong> ${item.datum ? new Date(item.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}</p>
                    <p><strong>Art:</strong> ${item.art || 'N/A'}</p>
                    <p><strong>Status:</strong> ${statusMapBereitsKontaktiert[item.status] || item.status || 'N/A'}</p>
                    <p><strong>Notizen:</strong> ${item.ergebnis || 'N/A'}</p>
                `;
                displayBereitsKontaktiertListe.appendChild(eintragDiv);
            });
        }

        // Noch zu kontaktierende Liste rendern
        displayNochZuKontaktierenListe.innerHTML = '';
        if (protokollDaten.nochZuKontaktieren.length === 0) {
            displayNochZuKontaktierenListe.innerHTML = '<p><em>Noch keine Einträge vorhanden.</em></p>';
        } else {
            protokollDaten.nochZuKontaktieren.forEach((item, index) => {
                const eintragDiv = document.createElement('div');
                eintragDiv.classList.add('protokoll-eintrag-display');
                eintragDiv.innerHTML = `
                    <button type="button" class="remove-btn-display" data-type="noch" data-index="${index}" title="Diesen Eintrag entfernen">X</button>
                    <p><strong>Name:</strong> ${item.name || 'N/A'}</p>
                    <p><strong>Kontakt:</strong> ${item.kontaktinfo || 'N/A'}</p>
                    <p><strong>Planung:</strong> ${item.erreichbarkeit || 'N/A'}</p>
                `;
                displayNochZuKontaktierenListe.appendChild(eintragDiv);
            });
        }
        addRemoveButtonListeners();
    }

    function addRemoveButtonListeners() {
        const buttons = document.querySelectorAll('.remove-btn-display');
        buttons.forEach(button => {
            // Trick, um alte Listener zu entfernen, bevor neue hinzugefügt werden (verhindert mehrfache Auslösung)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', handleRemoveEntry);
        });
    }
    
    function handleRemoveEntry(event) {
        const type = event.target.dataset.type;
        const index = parseInt(event.target.dataset.index, 10);

        if (type === 'bereits' && index < protokollDaten.bereitsKontaktiert.length) {
            protokollDaten.bereitsKontaktiert.splice(index, 1);
        } else if (type === 'noch' && index < protokollDaten.nochZuKontaktieren.length) {
            protokollDaten.nochZuKontaktieren.splice(index, 1);
        }
        saveProtokollToLocalStorage();
        renderProtokollListen();
    }

    // ---- EVENT HANDLER ----
    formBereitsKontaktiert.addEventListener('submit', function(e) {
        e.preventDefault();
        const neuerEintrag = {
            name: document.getElementById('bk_name_input').value,
            datum: document.getElementById('bk_datum_input').value,
            art: document.getElementById('bk_art_input').value,
            status: document.getElementById('bk_status_input').value, // Status hier hinzugefügt
            ergebnis: document.getElementById('bk_ergebnis_input').value
        };
        protokollDaten.bereitsKontaktiert.push(neuerEintrag);
        saveProtokollToLocalStorage();
        renderProtokollListen();
        formBereitsKontaktiert.reset();
        document.getElementById('bk_name_input').focus();
    });

    formNochZuKontaktieren.addEventListener('submit', function(e) {
        e.preventDefault();
        const neuerEintrag = {
            name: document.getElementById('nzk_name_input').value,
            kontaktinfo: document.getElementById('nzk_kontaktinfo_input').value,
            erreichbarkeit: document.getElementById('nzk_erreichbarkeit_input').value
            // Kein Status mehr hier
        };
        protokollDaten.nochZuKontaktieren.push(neuerEintrag);
        saveProtokollToLocalStorage();
        renderProtokollListen();
        formNochZuKontaktieren.reset();
        document.getElementById('nzk_name_input').focus();
    });

    saveProtokollBtn.addEventListener('click', function() {
        saveProtokollToLocalStorage();
        alert('Protokolldaten explizit im Browser gespeichert!');
    });

    loadProtokollBtn.addEventListener('click', function() {
        loadProtokollFromLocalStorage(); // Lädt und rendert neu
        alert('Gespeicherte Protokolldaten geladen!');
    });

    deleteProtokollBtn.addEventListener('click', function() {
        if (confirm('Möchten Sie wirklich alle Protokolldaten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            protokollDaten = { bereitsKontaktiert: [], nochZuKontaktieren: [] };
            saveProtokollToLocalStorage(); // Leere Daten speichern
            renderProtokollListen();
            alert('Alle Protokolldaten wurden gelöscht.');
        }
    });
    
    // ---- INITIALISIERUNG ----
    loadProtokollFromLocalStorage(); // Beim ersten Laden der Seite Daten holen und anzeigen
});