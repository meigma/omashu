import * as core from '@actions/core'
import { spawn, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams } from 'child_process'
import { run } from './run'

jest.mock('@actions/core', () => ({
    getInput: jest.fn(),
    info: jest.fn(),
    setOutput: jest.fn(),
}))
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}))

describe('Run Action', () => {
    describe('when testing running the earthly command', () => {
        it('should execute the correct command', async () => {
            jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
            jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

            let output = 'Image +docker output as image1:tag1\n'
                + 'Image +docker output as image2:tag2\n'

            const getInputMock = core.getInput as jest.Mock
            getInputMock.mockImplementation((name: string) => {
                switch (name) {
                    case 'earthfile':
                        return 'earthfile'
                    case 'target':
                        return 'target'
                    default:
                        throw new Error('Unknown input')
                }
            })

            const spawnMock = spawn as jest.Mock
            spawnMock.mockImplementation((
                command: string,
                args?: readonly string[] | undefined,
                options?: SpawnOptionsWithoutStdio | undefined
            ) => {
                return {
                    stdout: {
                        on: (event: string, listener: (data: string) => void) => {
                            listener('stdout')
                        }
                    },
                    stderr: {
                        on: (event: string, listener: (data: string) => void) => {
                            listener(output)
                        }
                    },
                    on: jest.fn(
                        (
                            event: "close",
                            listener: (code: number | null, signal: NodeJS.Signals | null) => void
                        ) => {
                            listener(0, null)
                        }
                    )
                }
            })

            await run()

            expect(spawn).toHaveBeenCalledTimes(1)
            expect(spawn).toHaveBeenCalledWith('earthly', ['earthfile+target'])
            expect(process.stdout.write).toHaveBeenCalledWith('stdout')
            expect(process.stderr.write).toHaveBeenCalledWith(output)
            expect(core.setOutput).toHaveBeenCalledWith('images', 'image1:tag1 image2:tag2')
        })
    })
})