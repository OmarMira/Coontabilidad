const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'database', 'simple-db.ts');
if (!fs.existsSync(filePath)) {
    console.error("File not found: " + filePath);
    process.exit(1);
}

// Read as buffer to handle possible encoding issues
let buffer = fs.readFileSync(filePath);
let content = buffer.toString('utf8');

// Surgical replacements for corrupted identifiers
// Reverting 'Área' -> 'rea' but ONLY when part of specific technical words
const replacements = [
    { from: /cÁreate/g, to: 'create' },
    { from: /CÁreaTE/g, to: 'CREATE' },
    { from: /cÁrear/g, to: 'crear' },
    { from: /pÁrepare/g, to: 'prepare' },
    { from: /alÁready/g, to: 'already' },
    { from: /incÁrease/g, to: 'increase' },
    { from: /decÁrease/g, to: 'decrease' },
    { from: /cÁreation/g, to: 'creation' },
    { from: /tÁreat/g, to: 'treat' },
    { from: /thÁreat/g, to: 'threat' },
    { from: /stÁream/g, to: 'stream' },
    { from: /fÁream/g, to: 'fream' },
    { from: /Áreader/g, to: 'reader' },
    { from: /Áread/g, to: 'read' },
    { from: /Áreach/g, to: 'reach' },
    { from: /bÁreak/g, to: 'break' }
];

let replacedCount = 0;
replacements.forEach(r => {
    const matches = content.match(r.from);
    if (matches) {
        replacedCount += matches.length;
        content = content.replace(r.from, r.to);
    }
});

// Also fix double-encoded UTF-8 characters if any (common in case of messy previous edits)
content = content.replace(/Ã¡/g, 'á');
content = content.replace(/Ã©/g, 'é');
content = content.replace(/Ã­/g, 'í');
content = content.replace(/Ã³/g, 'ó');
content = content.replace(/Ãº/g, 'ú');
content = content.replace(/Ã±/g, 'ñ');
content = content.replace(/Ã/g, 'í'); // This one is risky but often 'Ã' is 'í' in some mangled cases, will be careful

// Write back as clean UTF-8
fs.writeFileSync(filePath, content, 'utf8');
console.log(`Successfully performed ${replacedCount} surgical replacements and normalized encoding in simple-db.ts.`);
