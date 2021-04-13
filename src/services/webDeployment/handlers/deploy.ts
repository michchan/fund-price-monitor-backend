import { Handler } from 'aws-lambda'
import { Octokit } from '@octokit/core'
import getEnvVars from 'src/helpers/getEnvVar'

const accessToken = getEnvVars('DEPLOYMENT_GITHUB_ACCESS_TOKEN')
const owner = getEnvVars('DEPLOYMENT_GITHUB_OWNER')
const repo = getEnvVars('DEPLOYMENT_GITHUB_REPO')
const workflow_id = getEnvVars('DEPLOYMENT_GITHUB_WORKFLOW_ID')
const ref = getEnvVars('DEPLOYMENT_GITHUB_WORKFLOW_REF')

const octokit = new Octokit({ auth: accessToken })

/**
 * Deploy website by triggering static site generation
 */
export const handler: Handler = async () => {
  await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
    owner,
    repo,
    workflow_id,
    ref,
  })
}