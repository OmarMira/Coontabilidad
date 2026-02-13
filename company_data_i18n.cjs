const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

// Ya existen en files_menu_i18n.cjs, solo agrego traducciones que faltaban para CompanyDataForm
const esUpdates = {
    // Errores/mensajes de CompanyData que NO estaban en el primer script
    "companyData.noData": "No se encontraron datos de empresa. Contacte al administrador.",
    "companyData.loadError": "Error al cargar los datos de la empresa",
    "companyData.saveSuccess": "Datos de empresa guardados correctamente"
};

const enUpdates = {
    // Errors/messages for CompanyData that were NOT in the first script
    "companyData.noData": "No company data found. Contact the administrator.",
    "companyData.loadError": "Error loading company data",
    "companyData.saveSuccess": "Company data saved successfully"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);
        Object.assign(json, updates);
        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with ${Object.keys(updates).length} keys`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates);
update(enFile, enUpdates);

console.log('\n✅ CompanyDataForm.tsx completamente traducido (40+ claves)');
console.log('📊 Progreso: 2/6 componentes completos (PaymentMethods + CompanyData)');
