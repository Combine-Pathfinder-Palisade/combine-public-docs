# Combine Deployment Process

## Introduction

This guide is only for customers who have access to the Combine automation tool and are performing their own build and deployment operations.

## Combine 3.13.x

### Prerequisites

- Java installed on the server from which you are deploying.
- IAM Role or other IAM Credentials to use for the deployment. (See the Combine provided `combine-provisioning.yaml` CloudFormation template for an example of necessary permissions.)
- Latest Combine JAR file: `combine-aws-account-automation-3.13.x.jar`.
- Latest Bouncy Castle JAR file for Provider, PKI, and Util in a `lib/` directory:
  - `bcpkix-jdk18on-1.78.1.jar`
  - `bcprov-jdk18on-1.78.1.jar`
  - `bcutil-jdk18on-1.78.1.jar`
  - Combine has been tested with Version 1.78.1 and 1.79. Combine requires the Bouncy Castle distribution for JDK 18 and above.
- (Optionally) A `clients.json` file prepared by you to enable fully automated actions.

### `clients.json` Example

Example:

```
{
  "myDevEnvironment": {
    "region": "us-east-1",
    "clientAccountId": "123123123123",
    "clientRoleArn": "arn:aws:iam::123123123123:role/Combine-Provisioning-Role",
    "masterRegion": "us-east-1",
    "shardId": "Dev",
    "hasUserManagementAccount": "false",
    "bucketEncryptionKey": "",
    "buildTS": "true",
    "buildS": "false",
    "buildGovCloud": "false",
    "certificateName": "Development",
    "templateParameters": {
      "combine.yaml": {},
      "combine-policy.yaml": {},
      "combine-vpc.yaml": {}
    }
  },
}
```

The above is a basic example. There are several other supported fields.

You can specify Key/Secret Key pair for credentials instead of trying to assume a role by replacing `clientRoleArn` with:

```
"clientKey": "<aws key>"
"clientKeySecret": "<aws secret key>"
```

### `clients.json` Schema

- `region` - AWS Region ID in which to deploy.
- `clientAccountId` - AWS Account ID in which to deploy.
- `clientRoleArn` - ARN value of Role to try to assume to perform the deploy.
- `clientKey` and `clientKeySecret` - AWS Credentials to use instead of `clientRoleArn` to perform the deploy.
- `masterRegion` - AWS Region ID in which to deploy account unique resources. Except in advanced cases this should be set to the same value as `region`.
- `shardId` - Optional. A short name to used to namespace resources in Combine. Recommend setting a value such as "Dev" or "Prod" since resource name constraints can cause build to fail for lengthy values. Value should contain only letters.
- `hasUserManagementAccount` - Except in advanced cases this should be set to `false`.
- `bucketEncryptionKey` - Optional. ARN value of KMS Key used to encrypt Combine S3 Buckets. Should be blank unless your environment requires setting a KMS CMK Key for each bucket by policy.
- `buildTS` - Set to `true`/`false` to toggle building AWS Top Secret region emulation.
- `buildS` - Set to `true`/`false` to toggle building AWS Secret region emulation.
- `buildGovCloud` - Set to `true`/`false` to toggle building AWS Gov Cloud region emulation.
- `certificateName` - Value to use when creating the Combine Certificate Authority chain. The final value will be `Combine - <certificateName>`.
- `templateParameters` - Used to pass on AWS CloudFormation Parameters to the underlying Combine CloudFormation Templates.

Example of using `templateParameters`:

```
"templateParameters": {
  "combine.yaml": {},
  "combine-policy.yaml": {},
  "combine-vpc.yaml": {
    "VpcCidrBlock":"10.1.0.0/16",
    "VpcCidrBlockAuxiliaryA":"10.255.0.0/21",
    "VpcCustomerSubnetsBuild": "false",
    "VpcCidrBlockCombine": "10.255.0.0/24",
    "VpcCidrBlockCombineFirewall": "10.255.1.0/24"
  }
}
```

Each of the members in the `combine-vpc.yaml` object are passed on to CloudFormation where the key is the CloudFormation Parameter Name and the value is the overridden value to use.

### Executing Commands

To execute a Combine automation command you will use this CLI command:

```
java -classpath "lib/*:combine-aws-account-automation-3.13.x.jar" com.sequoia.combine.accounts.CombineCommandExecutor <command> --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

In the above command, the value of `<profile>` is the key used in the `clients.json` file (`myDevEnvironment` in the example above). If `--config-store-profile` is not provided the tool will prompt you for each value via the CLI.

In the above command, the value of `<command>` is a support Combine automation command. See below for the basic commands:

- `full` - Initiates a full build with a new certificate authority chain.
- `full_no_vpc` - Initiates a full build with a new certificate authority chain.
- `update` - Updates combine with latest artifacts.

Running the above command without specifying a `<command>` value will print the usage instructions.

Running this command will list all available Combine automation commands:

```
java -classpath "lib/*:combine-aws-account-automation-3.13.x.jar" com.sequoia.combine.accounts.CombineCommandList
```

(As of 3.13.7 many commands lack descriptions. This will be corrected in a subsequent release.)

There are additional command line options including:

- `--bricks-release-version` - Sets the version number of the deployment.
- `--enable-aws-imds` - Uses local credentials to perform the deploy instead of passing in credentials. Use this if you are executing on an EC2 server that has an Instance Profile with permissions to perform the deploy.
- `--config-store` - Sets the path at which to find the `clients.json` file. Default is the local directory.
- `--config-store-profile` - Sets the profile to use to load configuration.
- `--skip-bucket-block-public-access` - Skips attempts to set a block public access block. Use this if your environment has a policy that prohibits changing block public access settings.

### Performing Deployment (New Account)

To deploy a new instance of Combine executing the following Combine automation tool command:

```
java -classpath "lib/*:combine-aws-account-automation-3.13.x.jar" com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

Be certain to provide the name of your Combine JAR File and the profile you wish to use. For Bricks Release Version you can actually provide any value since it is only used to create a unique path in S3. However we recommend a version number that follows this pattern:

`bricks_v_x_x_x` - For example: `bricks_v_3_13_7`

The build will attempt to load artifacts into S3, build a Certificate Authority chain, and then execute all three Combine CloudFormation Templates. It will build a single VPC with default settings. Remember that CloudFormation Parameters can be overridden in the `clients.json` as described above.

If the build fails, we recommend that you empty the `combine-devops-<account id>-<region id>` bucket and then delete the `Combine` and `CombineRestricted` SSH KeyPairs before reattempting. (If you set a Shard ID they will have the names `Combine<ShardId>` and `Combine<ShardId>Restricted`.) This cleanup will be eliminated in the 3.14 release.

### Performing Deployment Upgrade (Existing Account)

To deploy a new instance of Combine executing the following Combine automation tool command:

```
java -classpath "lib/*:combine-aws-account-automation-3.13.x.jar" com.sequoia.combine.accounts.CombineCommandExecutor update --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

Be certain to provide the name of your Combine JAR File and the profile you wish to use. For Bricks Release Version you can actually provide any value since it is only used to create a unique path in S3. However we recommend a version number that follows the pattern `bricks_v_x_x_x` (such as: `bricks_v_3_13_7`).

The build will attempt to load artifacts into S3.

The Combine automation tool does not support CloudFormation Template updates due to the vagaries of managing CloudFormation Template Parameters in the AWS API. This has been addressed in the 3.14 release. To update the CloudFormation Templates you will need to update each template via the AWS Console.

- Log into the AWS Console.
- Browse to AWS CloudFormation Console.
- Choose the `Combine` (or `Combine-<ShardId>`) Stack.
- Click "Update Stack" then choose "Make a direct update".
- Choose "Replace existing template".
- In a separate tab browse to the `combine-devops-<account id>-<region id>` bucket. Browse to `deployments`. Browse to `templates`. Browse to the `bricks-release-version` you specified during the update. Choose `combine.yaml` and copy the "Object URL". Paste this into the "Amazon S3 URL" field in the CloudFormation Console tab.
- Update any parameters as instruction by the Combine deployment runbook (if any).
- Update the `Bricks Version` parameter to match the `bricks-release-version` value you specified.
- Click "Next".
- Check the acknowledged. Click "Next".
- Click "Submit".
- If there are no changes proceed to the next template.
- Repeat these steps for the `combine-policy.yaml` template.
- Repeat these steps for the `combine-vpc.yaml` template. When you update the CloudFormation Parameters update the following values:
  - "Server Configuration - TAP" -> "Version" : Set this to the provided Combine version.
  - "Server Configuration - Endpoints" -> "Version" : Set this to the provided Combine version.

If all templates are updated successfully you may proceed to the final step. Initiate an "Instance Refresh" on the `Combine-ASG-Tap` and `Combine-ASG-Endpoints` Auto Scaling Groups. Set a minimum of a 60 second warmup. Uncheck "Enable skip matching". This will rebuild your TAP and Endpoint servers to use the update artifacts you staged in S3 and configured with CloudFormation.

## Combine 3.14.x

Under Development.
