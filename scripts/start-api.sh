#!/bin/sh

# Load .env
set -o allexport; source .env; set +o allexport

# Start API CLI
sam local start-api --profile=$AWS_PROFILE --port=$SAM_API_PORT --region=$AWS_RUNTIME_REGION -l .sam-local-dev-log