rm -r dist

./node_modules/.bin/electron-packager ./ --platform=darwin --out='dist'
./node_modules/.bin/electron-packager ./ --platform=linux --icon=desktop/icon --out='dist'
./node_modules/.bin/electron-packager ./ --platform=win32 --icon=desktop/icon --out='dist'
./node_modules/.bin/electron-packager ./ --platform=mas --out='dist'