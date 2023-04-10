#!/bin/sh

# Concatenate params
iteration=0
for i in $*;
do
  if [ $iteration -gt 0 ]
  then
    params="$params $i"
  fi
  iteration=$(expr $iteration + 1)
done
echo "Number of arguments: $iteration"
echo "Concatenated params: $params"

# Load .env
set -o allexport; source .env; set +o allexport

# Clean log file
> .sam-local-dev-log

# Invoke SAM CLI
sam local invoke --profile=$AWS_PROFILE --region=$AWS_RUNTIME_REGION -l .sam-local-dev-log $1 $params