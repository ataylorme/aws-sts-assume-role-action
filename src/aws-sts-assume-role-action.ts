/* eslint-disable @typescript-eslint/camelcase */
import fs from 'fs';
import path from 'path';

import STS from 'aws-sdk/clients/sts';
import touch from 'touch';
import * as core from '@actions/core';

const getSTS = (): void => {
  const region = core.getInput('aws-region', { required: true });
  const accessKeyID = core.getInput('aws-access-key-id', { required: true });
  const secretAccessKey = core.getInput('aws-secret-access-key', { required: true });
  const arnRole = core.getInput('aws-arn-role', { required: true });
  const durationSeconds = parseInt(core.getInput('duration-seconds', { required: false }));
  const writeCredentialsFile = 'false' !== core.getInput('write-credentials-file', { required: false });
  const credentialsFilePath = path.resolve(`~`, '.aws/credentials');

  // Setup credentials as environment variables
  // @link https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html
  process.env.AWS_ACCESS_KEY_ID = accessKeyID;
  process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey;

  const sts = new STS({
    region: region,
    apiVersion: '2011-06-15',
  });

  // @link https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html
  const params = {
    RoleArn: arnRole,
    RoleSessionName: `github-action-temporary-session-${Math.floor(Date.now() / 1000)}`,
    // 15 mins
    DurationSeconds: durationSeconds,
  };

  // @link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#assumeRole-property
  try {
    sts.assumeRole(params, function(err, data) {
      if (err || data.Credentials == null) {
        console.error(err, err.stack);
        core.error(err.message);
        core.setFailed('Error assuming role with STS.');
      } else {
        const accessParams = {
          AWS_ACCESS_KEY_ID: data.Credentials.AccessKeyId,
          AWS_SECRET_ACCESS_KEY: data.Credentials.SecretAccessKey,
          AWS_SESSION_TOKEN: data.Credentials.SessionToken,
        };
        Object.entries(accessParams).forEach(([key, value]) => {
          process.env[key] = value;
          core.setOutput(key, value);
        });
        if (writeCredentialsFile) {
          try {
            let credentialFileContent = '[default]';
            credentialFileContent += `\naws_access_key_id=${accessParams.AWS_ACCESS_KEY_ID}`;
            credentialFileContent += `\naws_secret_access_key=${accessParams.AWS_SECRET_ACCESS_KEY}`;
            credentialFileContent += `\naws_session_token=${accessParams.AWS_SESSION_TOKEN}`;
            touch.sync(credentialsFilePath);
            fs.writeFileSync(credentialsFilePath, credentialFileContent);
          } catch (error) {
            core.error(error);
            core.setFailed(`Error writing credentials file to ${credentialsFilePath}.`);
          }
        }
      }
    });
  } catch (error) {
    core.error(error);
    core.setFailed('Error assuming role with STS.');
  }
};

getSTS();
