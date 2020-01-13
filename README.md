# AWS STS Assume Role Action

## Description

A GitHub Action that calls [AWS STS Assume Role](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#assumeRole-property) and returns the resulting `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` as a [GitHub Actions output](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/metadata-syntax-for-github-actions#outputs) for use in other actions.

## Inputs

This action takes the following inputs:

**Required**
- `aws-region`: the AWS region to use
- `aws-access-key-id`: the `AWS_ACCESS_KEY_ID` to use
- `aws-secret-access-key`: the `AWS_SECRET_ACCESS_KEY` to use
- `aws-arn-role`: the ARN value of the role to assume

**Optional**
- `write-credentials-file`: whether or not to write the STS credentials to disk. Defaults to `false`
- `credentials-file-path`: path to the credentials config file to create. Defaults to `~/.aws/credentials`

## Outputs

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

## Usage Example

In `.github/workflows/nodejs.yml`:

```yml
name: Example NodeJS AWS Workflow

on: [pull_request]

jobs:
  node_test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Node.JS 12.x
        uses: actions/setup-node@v1
        with:
          node-version: "12.x"
      - name: Install Node Dependencies
        run: npm ci
        env:
          CI: TRUE
      - name: Run a Build
        run: npm run build
      - name: Fetch Temporary AWS Credentials With STS
        uses: ataylorme/aws-sts-assume-role-action@master
        with:
          aws-region: "us-east-1"
          aws-access-key-id: "${{ secrets.AWS_ACCESS_KEY_ID }}"
          aws-secret-access-key: "${{ secrets.AWS_SECRET_ACCESS_KEY }}"
          aws-arn-role: "${{ secrets.AWS_ARN_ROLE }}"
```