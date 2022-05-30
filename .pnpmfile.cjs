"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[ k ]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[ k2 ] = m[ k ];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o[ "default" ] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeField = void 0;



const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const writeFile = (0, util_1.promisify)(fs_1.default.writeFile);
const exists = (0, util_1.promisify)(fs_1.default.exists);





const removeField = async (pnpmOptions, fields, ...pkgs) => {
    const { context, lockfile } = pnpmOptions;
    const isPathExistsOrWait = async (filepath, { wait = 500, nbRetry = 10 } = {}) => {
        if (await exists(filepath))
            return Promise.resolve(true);
        if (nbRetry === 0)
            return Promise.resolve(false);
        return new Promise(res => {
            setTimeout(async () => res(await isPathExistsOrWait(filepath, { wait, nbRetry: nbRetry - 1 })), wait);
        });
    };
    const getPkgJsonPaths = (pkg, isDirectDep) => {
        if (isDirectDep)
            return [ (path_1.default.join(__dirname, './node_modules', pkg, 'package.json')) ];
        // [ require.resolve(path.join(pkg, 'package.json')) ];
        const pnpmPkgName = pkg.startsWith('@') ? pkg.replace('/', '+') : pkg;
        const pkgsKeys = Object.keys(lockfile.packages).filter(p => p.split('/')[ 1 ] === pnpmPkgName);
        // all versions
        return pkgsKeys.map(key => {
            const [ , name, version ] = key.split('/');
            return path_1.default.join(__dirname, './node_modules/.pnpm', version ? `${name}@${version}` : name, `node_modules/${name}/package.json`);
        });
    };
    const deleteFields = async (pkgJsonPath) => {
        const relativePkgJsonpath = path_1.default.relative(__dirname, pkgJsonPath);
        if (await isPathExistsOrWait(pkgJsonPath)) {
            const pkgJson = await Promise.resolve().then(() => __importStar(require(pkgJsonPath)));
            await Promise.all(fields.map(async (field) => {
                delete pkgJson[ field ];
                await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 4), { encoding: 'utf-8' });
                context.log(`‣ ${relativePkgJsonpath} "${field}" field REMOVED!`);
            }));
        }
        else {
            context.log(`‣ ${relativePkgJsonpath} does not exist!`);
        }
    };
    await Promise.all(pkgs.map(p => {
        const { pkg, isDirectDep = true } = typeof p === 'string' ? { pkg: p } : p;
        context.log(`‣ Trying to remove fields "[ ${fields.join(', ')} ]" from package ${pkg}`);
        // eslint-disable-next-line no-unneeded-ternary
        return getPkgJsonPaths(pkg, isDirectDep === false ? false : true).forEach(deleteFields);
    }));
};


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
