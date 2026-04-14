const path = require('path');
const backendPath = path.join(__dirname, 'backend');

const { signToken, DEFAULT_EXPIRES_IN_SECONDS } = require(path.join(backendPath, 'src', 'lib', 'token'));

function parsePayload(input) {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

function printUsage() {
  console.log('Usage:');
  console.log('  node generate-token.js --payload \'{"sub":1,"role":"ADMIN","email":"admin@library.com"}\'');
  console.log('  node generate-token.js --admin 1');
  console.log('  node generate-token.js --student 1');
  console.log('  node generate-token.js --librarian 1');
  console.log('');
  console.log('Options:');
  console.log('  --payload <json>   Custom JSON payload');
  console.log('  --admin <userId>   Generate admin token (userId defaults to 1)');
  console.log('  --student <userId> Generate student token (userId defaults to 1)');
  console.log('  --librarian <userId> Generate librarian token (userId defaults to 1)');
  console.log('  --expires <seconds> Token expiry in seconds (default: 604800 = 7 days)');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  let payload = null;
  let expiresInSeconds = DEFAULT_EXPIRES_IN_SECONDS;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--payload':
        payload = parsePayload(args[++i]);
        if (!payload) {
          console.error('Error: Invalid JSON payload.');
          process.exit(1);
        }
        break;
      case '--admin': {
        const userId = parseInt(args[++i]) || 1;
        payload = { sub: userId, role: 'ADMIN', email: 'admin@library.com' };
        break;
      }
      case '--student': {
        const userId = parseInt(args[++i]) || 1;
        payload = { sub: userId, role: 'STUDENT', email: 'student1@university.edu', studentId: 'S12345' };
        break;
      }
      case '--librarian': {
        const userId = parseInt(args[++i]) || 1;
        payload = { sub: userId, role: 'LIBRARIAN', email: 'librarian@library.com' };
        break;
      }
      case '--expires':
        expiresInSeconds = parseInt(args[++i]) || DEFAULT_EXPIRES_IN_SECONDS;
        break;
    }
  }

  if (!payload) {
    console.error('Error: No payload provided. Use --help for usage.');
    process.exit(1);
  }

  const token = signToken(payload, { expiresInSeconds });

  console.log('Generated Token:');
  console.log(token);
  console.log('');
  console.log('Payload:', JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }, null, 2));
}

main();
