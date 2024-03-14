import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {EndpointType, LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {CfnOutput, Duration} from "aws-cdk-lib";
import {Runtime} from "aws-cdk-lib/aws-lambda";

export class LwGithubBotStack extends cdk.Stack {
    private restApi: RestApi;
    private lwAiBotWebhookLambda: NodejsFunction;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.buildLambdaFunction();
        this.buildRestApi();

        new CfnOutput(this, "REST API URL", { value: `${this.restApi.url}webhooks` });
    }

    private buildLambdaFunction() {
        this.lwAiBotWebhookLambda = new NodejsFunction(this, "AiBotWebhookFunc", {
            runtime: Runtime.NODEJS_18_X,
            entry: path.join(__dirname, "..", "lambda", "AiBotWebhookFunc.ts"),
            handler: "handler",
            timeout: Duration.seconds(29),
            environment: {
                LINE_WORKS_BOT_ID: "",
                LINE_WORKS_CLIENT_ID: "",
                LINE_WORKS_CLIENT_SECRET: "",
                LINE_WORKS_DOMAIN_ID: "",
                LINE_WORKS_PRIVATE_KEY: "",
                LINE_WORKS_SERVICE_ACCOUNT: "",
                ANTHROPIC_API_KEY: "",
            },
        });
    }

    private buildRestApi() {
        this.restApi = new RestApi(this, "AiBotWebhookRestApi", {
            endpointTypes: [EndpointType.REGIONAL],
        });

        const addSub = this.restApi.root.addResource("webhooks");
        addSub.addMethod(
            "POST",
            new LambdaIntegration(this.lwAiBotWebhookLambda, {
                proxy: true,
                timeout: this.lwAiBotWebhookLambda.timeout,
            })
        );
    }
}
