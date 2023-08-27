import * as core from '@actions/core'
import { exec } from 'child_process'
import { run } from './index'

jest.mock('@actions/core', () => ({
  getBooleanInput: jest.fn(),
  getInput: jest.fn(),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  info: jest.fn()
}))
jest.mock('child_process', () => ({
  exec: jest.fn(
    (
      _,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      callback(null, 'mocked output', '')
    }
  )
}))

describe('Discover Action', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when testing running the omashu command', () => {
    const testCases = [
      {
        parseImages: true,
        paths: 'path1 path2',
        targets: 'target1 target2',
        expectedCommand: "omashu scan -i -t target1 -t target2 'path1 path2'"
      },
      {
        parseImages: false,
        paths: 'path1',
        targets: 'target1',
        expectedCommand: 'omashu scan -t target1 path1'
      },
      {
        parseImages: false,
        paths: '.',
        targets: '',
        expectedCommand: 'omashu scan .'
      }
    ]

    it.each(testCases)(
      'should execute the correct command for parseImages=%s, paths=%s, targets=%s',
      async ({ parseImages, paths, targets, expectedCommand }) => {
        const getBooleanInputMock = core.getBooleanInput as jest.Mock
        const getInputMock = core.getInput as jest.Mock

        getBooleanInputMock.mockReturnValue(parseImages)
        getInputMock.mockImplementation((name: string) => {
          switch (name) {
            case 'paths':
              return paths
            case 'targets':
              return targets
            default:
              return ''
          }
        })

        await run()

        expect(exec).toHaveBeenCalledWith(expectedCommand, expect.anything())
        expect(core.setOutput as jest.Mock).toHaveBeenCalledWith(
          'json',
          'mocked output'
        )
      }
    )
  })
})
