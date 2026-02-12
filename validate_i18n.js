
const fs = require('fs');

const fileES = 'src/assets/locales/es.json';
const fileEN = 'src/assets/locales/en.json';

function validate(file) {
    console.log(`Validating ${file}...`);
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Check for BOM
        if (content.charCodeAt(0) === 0xFEFF) {
            console.log("⚠️ BOM detected, removing...");
            fs.writeFileSync(file, content.slice(1));
        } else {
            console.log("✅ No BOM detected.");
        }

        // Parse JSON
        const json = JSON.parse(fs.readFileSync(file, 'utf8')); // Re-read to be sure
        console.log("✅ JSON Syntax Valid.");

        // Check nesting for roots
        if (!json["navigation.dashboard"] && !json["navigation"]) {
            console.log("❌ CRITICAL: 'navigation.dashboard' key missing!");
            process.exit(1);
        }

        // Flatten check: Ensure we don't have nested objects where dot notation is expected
        // Actually, the user asked to confirmed they are NOT nested incorrectly.
        // The current file uses keys like "navigation.dashboard": "Panel...".
        // If it was nested, json["navigation"] would be an object.
        if (json["navigation"] && typeof json["navigation"] === 'object') {
            console.log("⚠️ Warning: 'navigation' is an object. Application expects dot notation keys?");
            // Based on previous view_file, the keys were "navigation.dashboard": "..."
            // If we see json["navigation.dashboard"], good.
        }

        if (json["navigation.dashboard"]) {
            console.log(`✅ Root key 'navigation.dashboard' found: "${json['navigation.dashboard']}"`);
        } else {
            console.log("❌ Root key 'navigation.dashboard' NOT found (dot notation check).");
        }

    } catch (e) {
        console.error(`❌ Error in ${file}: ${e.message}`);
        process.exit(1);
    }
}

validate(fileES);
validate(fileEN);
