import * as core from "@actions/core"
import * as github from "@actions/github"
import { promises as fs } from "fs"
import { run } from "./main"

jest.mock("@actions/core")
jest.mock("@actions/github", () => ({
    context: {
        sha: "mockCommitHash",
        payload: {
            head_commit: {
                message: "mockCommitMessage"
            }
        }
    }
}))
jest.mock("fs", () => ({
    promises: {
        writeFile: jest.fn()
    }
}))

describe("Discover Action", () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should write the commit info to a file and set the output", async () => {
        const outputPath = `${process.env.GITHUB_WORKSPACE}/commit_info.txt`;
        const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;

        await run();

        expect(mockWriteFile).toHaveBeenCalledWith(
            outputPath,
            'Commit Hash: mockCommitHash\nCommit Message: mockCommitMessage',
            'utf-8'
        );
        expect(core.info).toHaveBeenCalledWith(`Commit info written to ${outputPath}`);
    })

    it("should handle errors gracefully", async () => {
        const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
        mockWriteFile.mockImplementationOnce(() => {
            throw new Error("Filesystem error")
        })

        await run();

        expect(core.setFailed).toHaveBeenCalledWith("Filesystem error");
    })
})