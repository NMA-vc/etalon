const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${RED}ERROR: The ETALON CLI is now a native Rust application and is no longer distributed via npm.${RESET}\n`);
console.log('To install the new CLI, please use cargo:');
console.log(`${CYAN}  cargo install etalon-cli${RESET}\n`);
console.log('Or use the pre-built Docker image:');
console.log(`${CYAN}  docker run -it ghcr.io/nma-vc/etalon${RESET}\n`);
console.log(`For more installation options and the GitHub repository, visit:\n${CYAN}  https://github.com/NMA-vc/etalon${RESET}\n`);
