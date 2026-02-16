
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "common.language": "Idioma",
    "common.switchToEnglish": "Cambiar a Inglés",
    "common.switchToSpanish": "Cambiar a Español",
    "common.spanish": "Español",
    "common.english": "Inglés"
};

const enUpdates = {
    "common.language": "Language",
    "common.switchToEnglish": "Switch to English",
    "common.switchToSpanish": "Switch to Spanish",
    "common.spanish": "Spanish",
    "common.english": "English"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);
        Object.assign(json, updates);
        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file}`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates);
update(enFile, enUpdates);
