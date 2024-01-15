const crypto = require('crypto');

function generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

const keys = Array.from({ length: 3 }, () => generateKey());
console.log("Generated Keys:");

for (const key of keys) {
    process.stdout.write(key + ",");
}