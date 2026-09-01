import { fileURLToPath } from "node:url";
import path from "node:path";

import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(appDirectory, "../../apps/backend");

class PolicyQuoteInfraStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const healthFunction = new lambdaNodejs.NodejsFunction(this, "HealthFunction", {
      entry: path.join(backendDirectory, "src", "lambda", "health.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X
    });

    const api = new apigateway.RestApi(this, "PolicyQuoteApi", {
      deployOptions: {
        stageName: "dev"
      },
      restApiName: "policy-quote-api"
    });

    api.root
      .addResource("health")
      .addMethod("GET", new apigateway.LambdaIntegration(healthFunction));
  }
}

const app = new cdk.App();

new PolicyQuoteInfraStack(app, "PolicyQuoteInfraStack");
