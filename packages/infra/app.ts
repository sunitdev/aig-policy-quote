import { fileURLToPath } from "node:url";
import path from "node:path";

import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

class PolicyQuoteInfraStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloFunction = new lambdaNodejs.NodejsFunction(this, "HelloFunction", {
      entry: path.join(appDirectory, "lambdas", "hello.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X
    });

    const api = new apigateway.RestApi(this, "PolicyQuoteApi", {
      deployOptions: {
        stageName: "dev"
      },
      restApiName: "policy-quote-api"
    });

    api.root.addResource("hello").addMethod("GET", new apigateway.LambdaIntegration(helloFunction));
  }
}

const app = new cdk.App();

new PolicyQuoteInfraStack(app, "PolicyQuoteInfraStack");
