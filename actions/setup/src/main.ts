import * as core from "@actions/core"
import * as github from "@actions/github"
import * as tc from '@actions/tool-cache';

const baseURL = 'https://github.com/meigma/omashu/releases/download/v%VER%/omashu-%VER%-linux_amd64.tar.gz'

export async function run() {
    const version = core.getInput('version')

    if (!isSemVer(version)) {
        core.setFailed('Invalid version')
        return
    }

    const finalURL = baseURL.replace(/%VER%/g, version)
    if (process.platform == 'linux') {
        const downloadPath = await tc.downloadTool(finalURL)
        const extractPath = await tc.extractTar(downloadPath, '/usr/local/bin')

        core.info(`Downloaded to ${downloadPath}`)
        core.info(`Extracted to ${extractPath}`)
    } else {
        core.setFailed('Unsupported platform')
    }
}

function isSemVer(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version)
}