import { fileURLToPath } from "node:url";
import path from "node:path";

import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(appDirectory, "../../apps/backend");
const riskKnowledgeBaseRelativePath = "kb/risk-kb.json";
const riskKnowledgeBasePath = path.resolve(appDirectory, "../..", riskKnowledgeBaseRelativePath);
const infraNodeModulesBinPath = path.join(appDirectory, "node_modules", ".bin");
const bundlingEnvironment = {
  PATH: `${infraNodeModulesBinPath}:${process.env.PATH ?? ""}`
};
const riskKnowledgeBaseBundlingCommandHooks = {
  afterBundling(_inputDir: string, outputDir: string): string[] {
    return [
      `mkdir -p ${path.join(outputDir, "kb")}`,
      `cp ${riskKnowledgeBasePath} ${path.join(outputDir, riskKnowledgeBaseRelativePath)}`
    ];
  },
  beforeBundling(): string[] {
    return [];
  },
  beforeInstall(): string[] {
    return [];
  }
};

export class PolicyQuoteInfraStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const healthFunction = new lambdaNodejs.NodejsFunction(this, "HealthFunction", {
      bundling: {
        environment: bundlingEnvironment
      },
      entry: path.join(backendDirectory, "src", "lambda", "health.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X
    });

    const createQuoteFunction = new lambdaNodejs.NodejsFunction(this, "CreateQuoteFunction", {
      bundling: {
        commandHooks: riskKnowledgeBaseBundlingCommandHooks,
        environment: bundlingEnvironment
      },
      entry: path.join(backendDirectory, "src", "lambda", "create-quote.ts"),
      environment: {
        RISK_KB_PATH: riskKnowledgeBaseRelativePath
      },
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X
    });

    const quoteUiInputsFunction = new lambdaNodejs.NodejsFunction(this, "QuoteUiInputsFunction", {
      bundling: {
        commandHooks: riskKnowledgeBaseBundlingCommandHooks,
        environment: bundlingEnvironment
      },
      entry: path.join(backendDirectory, "src", "lambda", "quote-ui-inputs.ts"),
      environment: {
        RISK_KB_PATH: riskKnowledgeBaseRelativePath
      },
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

    const policyResource = api.root.addResource("policy");
    const quoteResource = policyResource.addResource("quote");

    quoteResource
      .addResource("ui-inputs")
      .addMethod("GET", new apigateway.LambdaIntegration(quoteUiInputsFunction));
    quoteResource.addMethod("POST", new apigateway.LambdaIntegration(createQuoteFunction));
  }
}

const app = new cdk.App();

new PolicyQuoteInfraStack(app, "PolicyQuoteInfraStack");
