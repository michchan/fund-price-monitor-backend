#!/bin/sh

# Load .env
set -o allexport; source .env; set +o allexport

# Invoke SAM CLI
sam local invoke --profile=$AWS_PROFILE --region=$AWS_RUNTIME_REGION -l .sam-local-dev-log $1