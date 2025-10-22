import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import * as cp from 'child_process'
import * as dotenv from 'dotenv'
import * as upath from 'upath'
import { parse as parseUrl } from 'url'


dotenv.config({
  path: [
    path.join(__dirname, '..', '.env'),
  ]
})
const target = process.argv[2];
const cdnPath = process.env.RI_CDN_PATH
const backendPath = path.join(__dirname, '..', 'dist', 'redis-backend')
const tutorialsPath = path.join(backendPath, 'dist-minified', 'defaults', 'tutorials')

console.log('+++paths', cdnPath, backendPath, tutorialsPath)

const downloadBackend = async () => {
  if (fs.existsSync(backendPath)) {
    console.debug('Backend folder already exists, deleting...')
    fs.rmSync(backendPath, { recursive: true, force: true });
  }
  console.debug('Downloading and unpacking, it will takes some time - please be patient...')
  try {
    const redisInsightArchivePath = await downloadRedisBackendArchive(process.platform, backendPath)
    if (fs.existsSync(redisInsightArchivePath)) {
      unzipRedisServer(redisInsightArchivePath, backendPath)
      // Remove archive for non-windows platforms
      fs.rmSync(redisInsightArchivePath)
      console.debug('Done!')
    }
  } catch (err) {
    console.debug('Failed to download Redis Insight backend')
    fs.rmdir(backendPath, () => { })
    throw Error('Failed to download and unzip Redis backend')
  }
}


function ensureFolderExists(loc: string) {
  if (!fs.existsSync(loc)) {
    const parent = path.dirname(loc)
    if (parent) {
      ensureFolderExists(parent)
    }
    fs.mkdirSync(loc)
  }
}

function getDownloadUrl(): string {
  return `${cdnPath}/Redis-Insight-web-${process.platform}.${target || process.arch}.tar.gz`
}

async function downloadRedisBackendArchive(
  platform: string,
  destDir: string,
): Promise<string> {
  ensureFolderExists(destDir)
  let downloadUrl = getDownloadUrl()
  console.log('+++downloadUrl', downloadUrl)

  return new Promise((resolve, reject) => {
    const requestOptions: https.RequestOptions = parseUrl(downloadUrl)
    https.get(requestOptions, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        downloadUrl = res.headers.location
      } else if (res.statusCode !== 200) {
        reject(new Error('Failed to get Redis Insight backend archive location'))
      }

      // Expected that the distribution package will be zipped
      const zipPath = path.resolve(destDir, `redisinsight-backend-${platform}.tar.gz`)
      const outStream = fs.createWriteStream(zipPath)
      https.get(downloadUrl, (res) => {
        res.pipe(outStream)
      })
      outStream.on('close', () => {
        resolve(zipPath)
      })
    })
  })
}

function getNormalizedCIString(string: string) {
  return string?.startsWith('D:') && process.env.CI
    ? upath.normalize(string).replace('D:', '/d')
    : string
}

function unzipRedisServer(redisInsideArchivePath: string, extractDir: string) {
  // tar does not create extractDir by default
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir)
  }

  cp.spawnSync('tar', [
    '-xf',
    getNormalizedCIString(redisInsideArchivePath),
    '-C',
    getNormalizedCIString(extractDir),
    '--strip-components',
    '1',
    'api',
  ])


  // remove tutorials
  fs.rmSync(tutorialsPath, { recursive: true, force: true });
}

downloadBackend()
