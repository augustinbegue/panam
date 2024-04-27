const fs = require('fs');

const templateName = process.argv[2];
const jsonPath = process.argv[3];
const destPath = process.argv[4];

const files = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

for (let file of files) {
    file = decodeURI(file);
    let filename = file
        .split('/').pop()
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(templateName.replace(/\s/g, '-').toLowerCase(), '')
        .replace('é', 'e')
        .replace('â', 'a')
        .replace(/^[-]+|[-]+$/g, '')
        .replace(/[-]+/g, '-');

    const dest = `${destPath}/${filename}`;

    console.log(`Downloading ${file} to ${dest}`);

    const res = await fetch(file);

    if (res.status !== 200) {
        console.error(`Failed to fetch ${file}: ${res.status}`);
        continue;
    }

    const data = await res.text();

    fs.writeFileSync(dest, data, 'utf8');
}
