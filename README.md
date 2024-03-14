# LINE WORKS AI Bot

## Getting Started

### Deploy

```shell
npm i
cdk synth --quiet
cdk deploy
```

### Setting up environment variables in Lambda

-   LINE_WORKS_BOT_ID
-   LINE_WORKS_CLIENT_ID
-   LINE_WORKS_CLIENT_SECRET
-   LINE_WORKS_DOMAIN_ID
-   LINE_WORKS_PRIVATE_KEY
    -   ex) `-----BEGIN PRIVATE KEY-----\nABC...XYZ\n-----END PRIVATE KEY-----`
-   LINE_WORKS_SERVICE_ACCOUNT
-   ANTHROPIC_API_KEY

## AWS CDK

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

-   `npm run build` compile typescript to js
-   `npm run watch` watch for changes and compile
-   `npm run test` perform the jest unit tests
-   `cdk deploy` deploy this stack to your default AWS account/region
-   `cdk diff` compare deployed stack with current state
-   `cdk synth` emits the synthesized CloudFormation template

## License

This project is licensed under the [MIT license](LICENSE).
