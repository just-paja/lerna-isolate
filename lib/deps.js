const path = require('path')

const { execute } = require('./cli')
const { copyFile, mkdir, readPackage, readPackageLock } = require('./fs')
const { getModulesPath, getDepsPath } = require('./paths')

async function storeModule (workPath, packedModule) {
  const packagePath = path.join(
    getDepsPath(workPath),
    path.basename(packedModule.archive)
  )
  await copyFile(packedModule.archive, packagePath)
  return {
    ...packedModule,
    packagePath
  }
}

async function storeDeps (workPath, packedModules) {
  const results = []
  if (packedModules.length) {
    try {
      await mkdir(getDepsPath(workPath))
    } catch (e) {}
  }
  for (const packedModule of packedModules) {
    results.push(await storeModule(workPath, packedModule))
  }
  return results
}

async function installDepsSafe (workPath) {
  return await execute('npm ci --only=production --no-optional', {
    cwd: workPath
  })
}

async function installDepsFresh (workPath) {
  return await execute('npm install --only=production --no-optional', {
    cwd: workPath
  })
}

async function installDeps (workPath) {
  try {
    await readPackageLock(workPath)
    return await installDepsSafe(workPath)
  } catch (e) {
    return await installDepsFresh(workPath)
  }
}

async function installStoredDeps (workPath, storedDeps) {
  const deps = storedDeps.map(
    storedDep => `./${path.relative(workPath, storedDep.packagePath)}`
  )
  await execute(
    `npm install ${deps.join(' ')} --only=production --no-optional`,
    {
      cwd: workPath
    }
  )
}

module.exports = {
  getModulesPath,
  installDeps,
  installStoredDeps,
  readPackage,
  readPackageLock,
  storeDeps
}