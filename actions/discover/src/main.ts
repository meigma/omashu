import * as core from "@actions/core"
import * as github from "@actions/github"
import { promises as fs } from "fs"

export async function run() {
    try {
        const commit = github.context.sha
        const message = github.context.payload['head_commit']?.message
        const content = `Commit Hash: ${commit}\nCommit Message: ${message || 'N/A'}`;
        const outputPath = `${process.env.GITHUB_WORKSPACE}/commit_info.txt`;

        await fs.writeFile(outputPath, content, 'utf-8');
        core.info(`Commit info written to ${outputPath}`);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        } else {
            core.setFailed('Unknown error')
        }
    }
}

run()