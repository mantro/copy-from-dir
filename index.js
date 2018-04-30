#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const promptCheckbox = require('prompt-checkbox');
const cp = require('child_process');

if (process.argv.length < 3) {
  console.log('Syntax is:  copy-from-dir <source> [target]');
  process.exit(1);
}

let source = process.argv[2];
let target = process.argv[3] || process.cwd();

if (!fs.existsSync(source)) {
  console.log(`'${source}' does not exist`);
  process.exit(2);
}

if (!fs.existsSync(target)) {
  console.log(`'${target}' does not exist`);
  process.exit(3);
}

source = path.resolve(source);
target = path.resolve(target);

console.log('Source: ' + source);
console.log('Target: ' + target);


function compare(prop) {
  return function(a, b) {
    if (a[prop] < b[prop]) {
      return -1;
    }
    else if (a[prop] > b[prop]) {
      return 1;
    }
    return 0;
  }
}

async function main() {

  const stats = fs
    .readdirSync(source)
    .map(x => {
      const stat = fs.statSync(path.join(source, x));

      return {
        name: x,
        displayName: stat.isDirectory() ? '[DIR] ' + x : x,
        stat,
        path: path.join(source, x)
      }
    });

  const paths = stats.filter(x => x.stat.isDirectory()).sort(compare('name'));
  const files = stats.filter(x => x.stat.isFile()).sort(compare('name'));

  const items = paths.concat(files);

  const displayNames = items.map(x => x.displayName);

  const prompt = new promptCheckbox({
    name: 'Items',
    message: 'Which files should be copied?',
    choices: displayNames,
    limit: 50
  });

  const result = await prompt.run();

  const itemsToCopy = items.filter(x => result.indexOf(x.displayName) > -1);

  for(const item of itemsToCopy) {

    cp.execSync(`cp -R ${item.path} ${target}`);
  }

  console.log('Files copied sucessful');
}

main().then(() => {
  // intentionally left blank
}, (err) => {
  console.log(err);
  process.exit(4);
});


