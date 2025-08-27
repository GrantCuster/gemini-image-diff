#!/bin/bash

# Remove applet folder if it exists
rm -rf applet

# Create applet folder
mkdir applet

cp -r src/* applet/
# do not need right now
# cp -r public/* applet/

# remove line 'import './index.css';'
# add line import '@tailwindcss/browser';
sed -i.bak "s|import './index.css'|import '@tailwindcss/browser'|" applet/index.tsx
rm applet/index.tsx.bak

cat > applet/index.html <<EOF
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>App</title>
    <script type="importmap">
      {
        "imports": {}
      }
    </script>
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="index.js"></script>
  </body>
</html>
EOF

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

let indexHtml = fs.readFileSync('applet/index.html', 'utf8');
const importMap = { imports: {} };

Object.keys(pkg.dependencies || {}).forEach(k => {
  importMap.imports[k] = 'https://esm.sh/' + k;
  importMap.imports[k + '/'] = 'https://esm.sh/' + k + '/';
});

const importMapString = JSON.stringify(importMap, null, 2);
const regex = /<script\\s+type=\\\"importmap\\\">([\\s\\S]*?)<\\/script>/i;

indexHtml = indexHtml.replace(regex, '<script type=\"importmap\">\\n' + importMapString + '\\n</script>');
fs.writeFileSync('applet/index.html', indexHtml, 'utf8');
"

