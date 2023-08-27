import * as core from "@actions/core"
import * as github from "@actions/github"
import { promises as fs } from "fs"
import { exec } from "child_process"
import { quote } from "shell-quote";

export async function run() {
    try {
        const parse = core.getBooleanInput('parse_images')
        const paths = quote([core.getInput('paths')])
        const targets = core.getInput('targets')

        const flags = parse ? ['-i'] : []
        if (targets.trim() !== '') {
            flags.push(...targets.split(' ').map(t => `-t ${t}`))
        }
        const command = ['omashu', 'scan', ...flags, paths].filter(Boolean).join(' ');

        core.info(`Running command: ${command}`)
        core.setOutput('json', await execCommand(command))
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        } else {
            core.setFailed('Unknown error')
        }
    }
}

function execCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error || stderr) {
                reject(new Error(error ? error.message : stderr));
            } else {
                resolve(stdout);
            }
        });
    });
}

//run()