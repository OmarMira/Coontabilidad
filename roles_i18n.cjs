
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "roles.admin": "Administrador",
    "roles.auditor": "Auditor",
    "roles.contador": "Contador",
    "roles.vendedor": "Vendedor",
    "roles.comprador": "Comprador"
};

const enUpdates = {
    "roles.admin": "Administrator",
    "roles.auditor": "Auditor",
    "roles.contador": "Accountant",
    "roles.vendedor": "Salesperson",
    "roles.comprador": "Buyer"
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
