#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LwGithubBotStack } from '../lib/lw-ai-bot-stack';

const app = new cdk.App();
new LwGithubBotStack(app, 'LwAiBotStack', {
    env: { region: "ap-northeast-1" }
});
