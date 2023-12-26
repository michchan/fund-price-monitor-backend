import { Handler } from 'aws-lambda'
import { Octokit } from '@octokit/core'
import getEnvVar from 'simply-utils/utils/getEnvVar'

const accessToken = getEnvVar('DEPLOYMENT_GITHUB_ACCESS_TOKEN')
const owner = getEnvVar('DEPLOYMENT_GITHUB_OWNER')
const repo = getEnvVar('DEPLOYMENT_GITHUB_REPO')
const workflow_id = getEnvVar('DEPLOYMENT_GITHUB_WORKFLOW_ID')
const ref = getEnvVar('DEPLOYMENT_GITHUB_WORKFLOW_REF')

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