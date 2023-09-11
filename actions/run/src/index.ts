import * as core from '@actions/core'
import { spawn } from 'child_process'

export async function run(): Promise<void> {
  const earthfile = core.getInput('earthfile')
  const target = core.getInput('target')

  const command = 'earthly'
  const args = [`${earthfile}+${target}`]

  core.info(`Running command: ${command} ${args.join(' ')}`)
  const output = await spawnCommand(command, args)
  core.info('Output length is ' + output.length)
}

async function spawnCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args)

    let output = ''

    child.stdout.on('data', data => {
      process.stdout.write(data)
      output += data
    })

    child.stderr.on('data', data => {
      console.error(`stderr: ${data}`)
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

run()
