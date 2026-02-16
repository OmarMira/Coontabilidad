// TEST DE TRADUCCIÓN - Ejecutar en consola del navegador
console.log('=== TEST DE MOTOR DE TRADUCCIÓN ===');

// Obtener el TranslationEngine del contexto de React
const testKeys = [
    'navigation.dashboard',
    'navigation.archive',
    'navigation.accountsPayable',
    'navigation.accountsReceivable',
    'navigation.financialDashboard',
    'navigation.reportsDashboard',
    'navigation.closuresPeriods',
    'navigation.ledgerAuxiliaries',
    'navigation.myProfile',
    'nay.logout'
];

// Verificar LocalStorage
console.log('Idioma actual (localStorage):', localStorage.getItem('accountexpress_locale') || localStorage.getItem('language'));

// Intentar acceder a las traducciones cargadas
fetch('/src/assets/locales/es.json')
    .then(r => r.json())
    .then(data => {
        console.log('\n📋 Verificación de Keys en ES.JSON:');
        testKeys.forEach(key => {
            const value = data[key];
            console.log(`  ${key}:`, value || '❌ NO ENCONTRADA');
        });

        console.log('\n📊 Total de keys en es.json:', Object.keys(data).length);

        // Verificar si el archivo tiene keys en mayúsculas
        const upperKeys = Object.keys(data).filter(k => k.toUpperCase() === k);
        if (upperKeys.length > 0) {
            console.warn('⚠️ ADVERTENCIA: Hay', upperKeys.length, 'keys en MAYÚSCULAS');
            console.log('Ejemplos:', upperKeys.slice(0, 5));
        }
    })
    .catch(e => console.error('Error cargando es.json:', e));

// Verificar si React está renderizando con el idioma correcto
setTimeout(() => {
    const sidebarElements = document.querySelectorAll('[class*="sidebar"]');
    console.log('\n🔍 Elementos del sidebar encontrados:', sidebarElements.length);
}, 1000);
