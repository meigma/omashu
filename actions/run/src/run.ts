import * as core from '@actions/core'
import { spawn } from 'child_process'

export async function run(): Promise<void> {
    const earthfile = core.getInput('earthfile')
    const target = core.getInput('target')

    const command = 'earthly'
    const args = [`${earthfile}+${target}`]

    core.info(`Running command: ${command} ${args.join(' ')}`)
    const output = await spawnCommand(command, args)

    // TODO: The newest version of Earthly attaches annotations to the images
    let matches
    const regex = /^Image \+\S+ output as (.*?)$/gm
    const images = [];
    while ((matches = regex.exec(output)) !== null) {
        images.push(matches[1]);
    }

    core.info(`Found images: ${images.join(" ")}`)
    core.setOutput('images', images.join(" "))
}

async function spawnCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args)

        let output = ''

        child.stdout.on('data', data => {
            process.stdout.write(data)
        })

        child.stderr.on('data', data => {
            process.stderr.write(data)
            output += data
        })

        child.on('close', code => {
            if (code !== 0) {
                reject(new Error(`child process exited with code: ${code}`))
            } else {
                resolve(output)
            }
        })
    })
}
