#!/bin/sh

# Load .env
set -o allexport; source .env; set +o allexport

# Invoke SAM CLI
yarn run build

# Generate template 
cdk synth --no-staging > template.yaml --profile=$AWS_PROFILE --region=$AWS_RUNTIME_REGION