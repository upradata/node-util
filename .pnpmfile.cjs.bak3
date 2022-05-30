const { removeField } = require('@upradata/pnpm');

const afterAllResolved = async (lockfile, context) => {
    await removeField({ lockfile, context }, [ 'exports' ], { pkg: 'commander', isDirectDep: true });
    return lockfile;
};


const readPackage = (pkg, context) => pkg;


module.exports = {
    hooks: {
        // readPackage,
        afterAllResolved
    }
};
