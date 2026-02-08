const fs = require('fs');
try {
    const content = fs.readFileSync('.env.local', 'utf8').replace(/\0/g, ''); // Remove null bytes
    console.log(content);
} catch (e) {
    console.log("Error reading file");
}
