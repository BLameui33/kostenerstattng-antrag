// ... (Anfang von script.js, wie er bereits existiert) ...

document.addEventListener('DOMContentLoaded', function() {
    // ... (Variablen und Funktionen für Antragsdaten und PDF-Erstellung wie gehabt) ...
    const form = document.getElementById('antragForm');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const storageKeyAntrag = 'antragFormData'; // Für Antragsdaten

    const antragFormElementIds = [
      "name", "adresse", "geburt", "nummer", "kasse", "kassenAdresse", "beschwerden_diagnose",
      "therapeut", "therapeutAdresse", "approbiert", "kassenzulassung", "verfuegbar"
    ];
    const kontaktBaseIds = ["kontakt_name_", "kontakt_datum_", "kontakt_art_", "kontakt_ergebnis_"];
    const maxManuelleKontakte = 10;

    function getAntragFormData() {
      const data = {};
      antragFormElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          data[id] = element.value;
        }
      });
      data.manuelleKontakte = [];
      for (let i = 0; i < maxManuelleKontakte; i++) {
        const kontakt = {};
        let hasDataInKontakt = false;
        kontaktBaseIds.forEach(baseId => {
          const element = document.getElementById(baseId + i);
          if (element) {
            const value = element.value;
            kontakt[baseId.replace('kontakt_', '').replace('_','')] = value;
            if (value && value.trim() !== "") hasDataInKontakt = true;
          }
        });
         data.manuelleKontakte.push(kontakt);
      }
      return data;
    }

    function populateAntragForm(data) {
      antragFormElementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element && data[id] !== undefined) {
          element.value = data[id];
        }
      });
      if (data.manuelleKontakte) {
        for (let i = 0; i < maxManuelleKontakte; i++) {
          if (data.manuelleKontakte[i]) {
            kontaktBaseIds.forEach(baseId => {
              const element = document.getElementById(baseId + i);
              const key = baseId.replace('kontakt_', '').replace('_','');
              if (element && data.manuelleKontakte[i][key] !== undefined) {
                element.value = data.manuelleKontakte[i][key];
              }
            });
          }
        }
      }
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
          const data = getAntragFormData();
          localStorage.setItem(storageKeyAntrag, JSON.stringify(data));
          alert('Ihre Eingaben wurden im Browser gespeichert!');
        });
    }

    if (loadBtn) {
        loadBtn.addEventListener('click', function() {
          const savedData = localStorage.getItem(storageKeyAntrag);
          if (savedData) {
            try {
                const data = JSON.parse(savedData);
                populateAntragForm(data);
                alert('Gespeicherte Eingaben wurden geladen!');
            } catch (e) {
                alert('Fehler beim Laden der Daten. Möglicherweise sind sie beschädigt.');
                console.error("Fehler beim Parsen der Antragsdaten: ", e);
            }
          } else {
            alert('Keine gespeicherten Daten für den Antrag gefunden.');
          }
        });
    }
    
    const autoLoadAntragData = localStorage.getItem(storageKeyAntrag);
    if (autoLoadAntragData) {
      try {
        const data = JSON.parse(autoLoadAntragData);
        populateAntragForm(data);
        console.log('Antragsdaten automatisch aus localStorage geladen.');
      } catch (e) {
        console.error("Fehler beim Parsen der localStorage Antragsdaten: ", e);
        localStorage.removeItem(storageKeyAntrag); 
      }
    }

    // --- ANGEPASSTE FUNKTION ZUM LADEN UND ANZEIGEN DER PROTOKOLLDATEN ---
    function loadAndDisplayProtokollData() {
        const protokollStorageKey = 'kontaktProtokollData';
        const anzeigeBereitsKontaktiertDiv = document.getElementById('protokollAnzeigeBereitsKontaktiert');
        const anzeigeNochZuKontaktierenDiv = document.getElementById('protokollAnzeigeNochZuKontaktieren');

        if (!anzeigeBereitsKontaktiertDiv || !anzeigeNochZuKontaktierenDiv) {
            return; // Elemente nicht auf dieser Seite vorhanden
        }

        // Mapping für die lesbare Anzeige der Status-IDs (identisch zu protokoll-script.js)
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

        const savedProtokollData = localStorage.getItem(protokollStorageKey);

        if (savedProtokollData) {
            try {
                const data = JSON.parse(savedProtokollData);
                let htmlBereits = '';
                let htmlNoch = '';

                // "Bereits kontaktiert" Einträge verarbeiten
                if (data.bereitsKontaktiert && data.bereitsKontaktiert.length > 0) {
                    data.bereitsKontaktiert.forEach(item => {
                        htmlBereits += `
                            <div class="protokoll-anzeige-eintrag">
                                <p><strong>Name:</strong> ${item.name || 'N/A'}</p>
                                <p><strong>Datum:</strong> ${item.datum ? new Date(item.datum).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}</p>
                                <p><strong>Art:</strong> ${item.art || 'N/A'}</p>
                                <p><strong>Status:</strong> ${statusMapBereitsKontaktiert[item.status] || item.status || 'N/A'}</p>
                                <p><strong>Notizen:</strong> ${item.ergebnis || 'N/A'}</p>
                            </div>
                        `;
                    });
                } else {
                    htmlBereits = '<p>Keine Einträge zu "Bereits kontaktiert" im <a href="kontaktprotokoll.html" target="_blank">Kontaktprotokoll</a> gefunden.</p>';
                }
                anzeigeBereitsKontaktiertDiv.innerHTML = htmlBereits;

                // "Noch zu kontaktieren" Einträge verarbeiten (ohne Status)
                if (data.nochZuKontaktieren && data.nochZuKontaktieren.length > 0) {
                    data.nochZuKontaktieren.forEach(item => {
                        htmlNoch += `
                            <div class="protokoll-anzeige-eintrag">
                                <p><strong>Name:</strong> ${item.name || 'N/A'}</p>
                                <p><strong>Kontaktinfo:</strong> ${item.kontaktinfo || 'N/A'}</p>
                                <p><strong>Planung:</strong> ${item.erreichbarkeit || 'N/A'}</p>
                            </div>
                        `;
                    });
                } else {
                    htmlNoch = '<p>Keine Einträge zu "Noch zu kontaktieren" im <a href="kontaktprotokoll.html" target="_blank">Kontaktprotokoll</a> gefunden.</p>';
                }
                anzeigeNochZuKontaktierenDiv.innerHTML = htmlNoch;

            } catch (e) {
                console.error("Fehler beim Parsen der Protokolldaten für die Anzeige: ", e);
                anzeigeBereitsKontaktiertDiv.innerHTML = '<p>Fehler beim Laden der Protokolldaten. Bitte überprüfen Sie das <a href="kontaktprotokoll.html" target="_blank">Kontaktprotokoll</a>.</p>';
                anzeigeNochZuKontaktierenDiv.innerHTML = '<p>Fehler beim Laden der Protokolldaten. Bitte überprüfen Sie das <a href="kontaktprotokoll.html" target="_blank">Kontaktprotokoll</a>.</p>';
            }
        } else {
            const hinweisText = `<p>Keine Daten im <a href="kontaktprotokoll.html" target="_blank">Kontaktprotokoll</a> gefunden. Bitte dort eintragen und speichern, um sie hier zu sehen.</p>`;
            anzeigeBereitsKontaktiertDiv.innerHTML = hinweisText;
            anzeigeNochZuKontaktierenDiv.innerHTML = hinweisText;
        }
    }
    // --- ENDE DER ANGEPASSTEN FUNKTION ---

    if (document.getElementById('protokollAnzeigeBereitsKontaktiert')) {
       loadAndDisplayProtokollData();
    }

    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            
            let ausgefuelltePflichtKontakte = 0;
            for (let i = 0; i < 5; i++) {
                if (document.getElementById(`kontakt_name_${i}`) && document.getElementById(`kontakt_name_${i}`).value.trim() !== "" &&
                    document.getElementById(`kontakt_datum_${i}`) && document.getElementById(`kontakt_datum_${i}`).value.trim() !== "" &&
                    document.getElementById(`kontakt_art_${i}`) && document.getElementById(`kontakt_art_${i}`).value.trim() !== "" &&
                    document.getElementById(`kontakt_ergebnis_${i}`) && document.getElementById(`kontakt_ergebnis_${i}`).value.trim() !== "") {
                   ausgefuelltePflichtKontakte++;
                }
            }

            if (ausgefuelltePflichtKontakte < 5) {
                alert("Bitte füllen Sie mindestens die ersten 5 manuellen Kontaktversuche (Kontaktversuch 1 bis 5) vollständig aus.");
                for (let i = 0; i < 5; i++) {
                    if (document.getElementById(`kontakt_name_${i}`) && !document.getElementById(`kontakt_name_${i}`).value.trim()) { document.getElementById(`kontakt_name_${i}`).focus(); break; }
                    if (document.getElementById(`kontakt_datum_${i}`) &&!document.getElementById(`kontakt_datum_${i}`).value.trim()) { document.getElementById(`kontakt_datum_${i}`).focus(); break; }
                    if (document.getElementById(`kontakt_art_${i}`) && !document.getElementById(`kontakt_art_${i}`).value.trim()) { document.getElementById(`kontakt_art_${i}`).focus(); break; }
                    if (document.getElementById(`kontakt_ergebnis_${i}`) && !document.getElementById(`kontakt_ergebnis_${i}`).value.trim()) { document.getElementById(`kontakt_ergebnis_${i}`).focus(); break; }
                }
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const margin = 20;
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = margin;
            const defaultLineHeight = 7;
            const spaceAfterParagraph = 2;

            function ensurePageSpace(neededHeight) {
                if (y + neededHeight > pageHeight - margin) { // Check against bottom margin
                    doc.addPage();
                    y = margin;
                }
            }

            function writeLine(text, currentLineHeight = defaultLineHeight, isBold = false, fontSize = 11) {
                ensurePageSpace(currentLineHeight);
                doc.setFontSize(fontSize);
                doc.setFont(undefined, isBold ? "bold" : "normal");
                doc.text(text, margin, y);
                y += currentLineHeight;
            }
            
            function writeParagraph(text, paragraphLineHeight = defaultLineHeight, paragraphFontSize = 11, isBold = false) {
                doc.setFontSize(paragraphFontSize);
                doc.setFont(undefined, isBold ? "bold" : "normal");
                const lines = doc.splitTextToSize(text, pageWidth - (2 * margin));
            
                for (let i = 0; i < lines.length; i++) {
                  ensurePageSpace(paragraphLineHeight);
                  doc.text(lines[i], margin, y);
                  y += paragraphLineHeight;
                }
                if (lines.length > 0) {
                    ensurePageSpace(spaceAfterParagraph); // Ensure space for the gap itself
                    y += spaceAfterParagraph;
                }
            }

            const formData = getAntragFormData(); 

            writeLine(formData.name);
            formData.adresse.split("\n").forEach(line => {
                if (line.trim() !== "") writeLine(line);
            });
            ensurePageSpace(defaultLineHeight * 0.5); y += defaultLineHeight * 0.5;

            writeLine(formData.kasse);
            formData.kassenAdresse.split("\n").forEach(line => {
                if (line.trim() !== "") writeLine(line);
            });
            ensurePageSpace(defaultLineHeight * 1.5); y += defaultLineHeight * 1.5; 

            const datumHeute = new Date().toLocaleDateString("de-DE");
            const datumsFontSize = 11;
            doc.setFontSize(datumsFontSize);
            const datumsBreite = doc.getStringUnitWidth(datumHeute) * datumsFontSize / doc.internal.scaleFactor;
            ensurePageSpace(defaultLineHeight); // Space for the date line itself
            doc.text(datumHeute, pageWidth - margin - datumsBreite, y);
            y += defaultLineHeight * 2; 

            writeParagraph("Antrag auf Kostenerstattung für ambulante Psychotherapie gemäß § 13 Abs. 3 SGB V", defaultLineHeight +1, 12, true);
            
            const geburtFormatted = formData.geburt ? new Date(formData.geburt).toLocaleDateString("de-DE") : 'N/A';
            writeParagraph(`Sehr geehrte Damen und Herren,`);
            y -= spaceAfterParagraph; 
            ensurePageSpace(defaultLineHeight * 0.5); y += defaultLineHeight * 0.5;

            writeParagraph(`hiermit beantrage ich, ${formData.name}, geboren am ${geburtFormatted}, Versichertennummer ${formData.nummer}, die Kostenübernahme für eine ambulante psychotherapeutische Behandlung im Rahmen des Kostenerstattungsverfahrens gemäß § 13 Abs. 3 SGB V.`);
            writeParagraph(`Ich leide unter ${formData.beschwerden_diagnose} und benötige dringend psychotherapeutische Unterstützung. Eine entsprechende Notwendigkeitsbescheinigung liegt diesem Antrag bei / wird nachgereicht.`);
            
            writeParagraph("Begründung der Notwendigkeit und Dringlichkeit der Behandlung:", defaultLineHeight, 11, true);
            writeParagraph(`Trotz intensiver und dokumentierter Bemühungen war es mir nicht möglich, innerhalb einer zumutbaren Frist einen Behandlungsplatz bei einem oder einer niedergelassenen, kassenzugelassenen Psychotherapeut:in zu finden. Die Wartezeiten bei den kontaktierten Therapeut:innen sind unzumutbar lang und/oder es besteht ein Aufnahmestopp.`);
            writeParagraph(`Meine erfolglosen Kontaktversuche (manuelle Eingabe aus dem Formular) sind im Folgenden detailliert aufgeführt:`);
            
            if (formData.manuelleKontakte && formData.manuelleKontakte.length > 0) {
                let kontaktCounter = 0;
                formData.manuelleKontakte.forEach((k) => {
                    if (k.name && k.name.trim() !== "") {
                        kontaktCounter++;
                        const kontaktDatumFormatted = k.datum ? new Date(k.datum).toLocaleDateString("de-DE") : 'N/A';
                        const kontaktText = `${kontaktCounter}. ${k.name || 'N/A'}:\n   Kontaktiert am ${kontaktDatumFormatted} per ${k.art || 'N/A'}\n   Ergebnis: ${k.ergebnis || 'N/A'}`;
                        writeParagraph(kontaktText, defaultLineHeight -1, 10);
                    }
                });
                if (kontaktCounter === 0) {
                     writeParagraph("Keine manuellen Kontaktversuche im Formular ausgefüllt.", defaultLineHeight -1, 10);
                }
            } else {
                writeParagraph("Keine manuellen Kontaktversuche im Formular ausgefüllt.", defaultLineHeight -1, 10);
            }
            
            writeParagraph("Behandlung bei einem/einer Privattherapeut:in:", defaultLineHeight, 11, true);
            writeParagraph(`Da eine zeitnahe Behandlung im Kassensystem nicht realisierbar ist, aber zur Vermeidung einer Verschlechterung meines Gesundheitszustandes bzw. zur Chronifizierung dringend erforderlich ist, beabsichtige ich, die Behandlung bei`);
            writeParagraph(`   ${formData.therapeut || '[Name des/der Privattherapeut:in noch eintragen]'}\n   ${(formData.therapeutAdresse || '').replace(/\n/g, '\n   ') || '[Adresse des/der Privattherapeut:in noch eintragen]'}`, defaultLineHeight, 11);
            writeParagraph(`durchführen zu lassen.`);
            writeParagraph(`Herr/Frau ${formData.therapeut ? formData.therapeut.split(' ').pop() : '[Nachname Therapeut:in]'} ist approbierte:r Psychotherapeut:in (Approbation: ${formData.approbiert}). Eine Kassenzulassung besteht ${formData.kassenzulassung === 'Nein' ? 'nicht' : ' (Hinweis: Für Kostenerstattung ist "Nein" hier i.d.R. die Voraussetzung)'}. Die Behandlung kann dort zeitnah (${formData.verfuegbar === 'Ja' ? 'sofort bzw. kurzfristig' : 'nach Absprache'}) begonnen werden. Eine Bescheinigung des/der Therapeut:in über die Approbation, die Notwendigkeit der Behandlung und die Behandlungsbereitschaft liegt bei / wird nachgereicht.`);
            
            writeParagraph("Bitte um Kostenübernahme und weitere Schritte:", defaultLineHeight, 11, true);
            writeParagraph(`Ich bitte Sie höflich um eine schriftliche Bestätigung der Kostenübernahme für die probatorischen Sitzungen sowie für die anschließende Therapie.`);
            writeParagraph(`Bitte teilen Sie mir mit, welche weiteren Unterlagen Sie gegebenenfalls von mir oder von dem/der gewählten Therapeut:in benötigen.`);
            writeParagraph(`Für eine zeitnahe positive Rückmeldung wäre ich Ihnen sehr dankbar.`);

            writeParagraph("Mit freundlichen Grüßen");
            ensurePageSpace(defaultLineHeight * 2.5); // Space for gap + name
            y += defaultLineHeight * 1.5; 
            writeParagraph(formData.name);

            doc.save("antrag_kostenerstattung_psychotherapie.pdf");

            const popup = document.getElementById("spendenPopup");
            if (popup) {
                popup.style.display = "flex";
            }
        });
    }

    if (typeof closePopup !== 'function') {
        window.closePopup = function() {
            const popup = document.getElementById("spendenPopup");
            if (popup) {
                popup.style.display = "none";
            }
        }
    }
});