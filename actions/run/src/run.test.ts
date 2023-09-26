import * as core from '@actions/core'
import {
  spawn,
  SpawnOptionsWithoutStdio,
  ChildProcessWithoutNullStreams
} from 'child_process'
import { run } from './run'
import { create } from 'domain'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  info: jest.fn(),
  setOutput: jest.fn()
}))
jest.mock('child_process', () => ({
  spawn: jest.fn()
}))
jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
jest.spyOn(process.stderr, 'write').mockImplementation(() => true)

describe('Run Action', () => {
  describe('when testing running the earthly command', () => {
    it.each([
      {
        artifact: '',
        earthfile: 'earthfile',
        flags: '',
        output: '',
        target: 'target',
        command: ['earthfile+target'],
        images: ''
      },
      {
        artifact: 'artifact',
        earthfile: 'earthfile',
        flags: '',
        output: '',
        target: 'target',
        command: ['--artifact', 'earthfile+target/artifact', 'artifact'],
        images: ''
      },
      {
        artifact: '',
        earthfile: 'earthfile',
        flags: '--flag1 test -f2 test2',
        output:
          'Image +docker output as image1:tag1\nImage +docker output as image2:tag2\n',
        target: 'target',
        command: ['earthfile+target', '--flag1', 'test', '-f2', 'test2'],
        images: 'image1:tag1 image2:tag2'
      }
    ])(
      `should execute the correct command`,
      async ({ artifact, earthfile, flags, output, target, command, images }) => {
        const getInputMock = core.getInput as jest.Mock
        getInputMock.mockImplementation((name: string) => {
          switch (name) {
            case 'artifact':
              return artifact
            case 'earthfile':
              return earthfile
            case 'flags':
              return flags
            case 'output':
              return output
            case 'target':
              return target
            default:
              throw new Error('Unknown input')
          }
        })

        const spawnMock = spawn as jest.Mock
        spawnMock.mockImplementation(createSpawnMock('stdout', output, 0))

        await run()

        expect(spawn).toHaveBeenCalledTimes(1)
        expect(spawn).toHaveBeenCalledWith('earthly', command)
        expect(process.stdout.write).toHaveBeenCalledWith('stdout')
        expect(process.stderr.write).toHaveBeenCalledWith(output)
        expect(core.setOutput).toHaveBeenCalledWith('images', images)
      }
    )
  })
})

function createSpawnMock(stdout: string, stderr: string, code: number) {
  return (
    command: string,
    args?: readonly string[] | undefined,
    options?: SpawnOptionsWithoutStdio | undefined
  ) => {
    return {
      stdout: {
        on: (event: string, listener: (data: string) => void) => {
          listener(stdout)
        }
      },
      stderr: {
        on: (event: string, listener: (data: string) => void) => {
          listener(stderr)
        }
      },
      on: jest.fn(
        (
          event: 'close',
          listener: (code: number | null, signal: NodeJS.Signals | null) => void
        ) => {
          listener(code, null)
        }
      )
    }
  }
}
