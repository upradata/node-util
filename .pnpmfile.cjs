const fs = require('fs');

/* const readPackage = (pkg, context) => {
    if (pkg.name === 'yargs') {
        // not working (pkg.exports is not given in readPackage)
        delete pkg.exports;
        context.log('Removed yargs package.json "exports" field!');
    }

    return pkg;
}; */

function afterAllResolved(lockfile, context) {
    const yargsPackageJsonFile = 'yargs/package.json';

    const pkg = require(yargsPackageJsonFile);
    delete pkg.exports;

    fs.writeFileSync(require.resolve(yargsPackageJsonFile), JSON.stringify(pkg, null, 4), { encoding: 'utf-8' });
    context.log('==> yargs package.json "exports" field REMOVED !');

    return lockfile;
}


module.exports = {
    hooks: {
        // readPackage,
        afterAllResolved
    }
};