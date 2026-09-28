# Combine Deployment Process

## Introduction

This guide is only for customers who have access to the Combine automation tool and are performing their own build and deployment operations.

## Combine 3.14.x

### Prerequisites

- Java installed on the server from which you are deploying.
- IAM Role or other IAM Credentials to use for the deployment. (See the Combine provided `combine-provisioning.yaml` CloudFormation template for an example of necessary permissions.)
- Latest Combine JAR file: `combine-aws-account-automation-3.14.x.jar`.
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
    "masterRegion": "us-east-1",
    "shardId": "POC",
    "clientRoleArn": "",
    "hasUserManagementAccount": "false",
    "bucketEncryptionKey": "",
    "bucketSetBlockPublicAccess": "true",
    "emulatedPartitionId": "<todo>",
    "certificateName": "POC",
    "combineStackParameters": {},
    "combinePolicyStackParameters": {},
    "combineVPCStacks": {
      "Combine-POC-VPC": {}
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
- `hasUserManagementAccount` - Except in advanced cases this should be set to `false`. Set to `true` only to build this Deployment as a Follower. See "Follower Mode" below for this field and the other fields it requires.
- `bucketEncryptionKey` - Optional. ARN value of KMS Key used to encrypt Combine S3 Buckets. Should be blank unless your environment requires setting a KMS CMK Key for each bucket by policy.
- `certificateName` - Value to use when creating the Combine Certificate Authority chain. The final value will be `Combine - <certificateName>`.
- `combineStackParameters` - Optional. Map of CloudFormation parameter name to value applied when deploying the Combine stack (`combine.yaml`). Values here override the defaults the command supplies. Use `{}` for none.
- `combinePolicyStackParameters` - Optional. Map of CloudFormation parameter name to value applied when deploying the Combine Policy stack (`combine-policy.yaml`). Values here override the defaults the command supplies. Use `{}` for none.
- `combineVPCStacks` - Map of Combine VPC stack name to that stack's CloudFormation parameter overrides. Each key is the CloudFormation stack name to create for a Combine VPC (for example `Combine-VPC`), and its value is a map of parameter name to value — use `{}` to accept all defaults. Add additional entries to deploy multiple Combine VPCs into the same account.

In most cases the latter three configurations are empty, unless you desire a more nuanced configuration.

Example of using these configurations:

```
"combineStackParameters": { },
"combinePolicyStackParameters": {
  "AllowTerraFormExceptions": "true",
  "EnforceVpcEndpointSecurityGroup": "false",
  "EnforceLambdaVpcConfiguration": "false"
},
"combineVPCStacks": {
  "Combine-VPC": {
    "VpcCidrBlock": "10.172.0.0/16",
    "VpcCidrBlockAuxiliaryA": "10.255.0.0/21",
    "VpcCustomerSubnetsBuild": "false",
    "VpcCidrBlockCombine": "10.255.0.0/24",
    "VpcCidrBlockCombineFirewall": "10.255.1.0/24"
  }
},
```

Each of the members in the `combine-vpc.yaml` object are passed on to CloudFormation where the key is the CloudFormation Parameter Name and the value is the overridden value to use.

### Follower Mode

By default a Combine Deployment is self contained: TAP keeps its Users, Groups, Servers, and AWS Role Mappings in the Combine DynamoDB Tables in its own Account, and its Certificate Authority chain in its own Account. Follower Mode instead points a Deployment at a second Combine Deployment — the "Leader", also called the User Management Account — and uses the Leader's Account for all of that. Every Follower shares one user base, one set of Groups, and one Certificate Authority chain with the Leader, so a user is created and issued a certificate once and can then log into TAP in the Leader and in each Follower.

Follower Mode also lets Combine "bridge" cross account Role assumptions through the Leader Account. Without it, each Combine Deployment must be trusted individually by every customer workload Account it reaches. With it, those Accounts need to trust only the Leader Account.

Follower Mode is an advanced configuration. Leave `hasUserManagementAccount` set to `false` unless you are intentionally building a Leader / Follower topology.

Two separate sets of credentials are involved and they are easy to confuse:

- **Leader Account credentials** (`leaderAccountRoleArn`, or `leaderAccountKey` / `leaderAccountKeySecret` / `leaderAccountSessionToken`) are used by the automation tool on the deployment server, only while the build runs, to write to the Leader's DynamoDB Tables and read the Leader's S3 and Secrets.
- **Follower Configuration credentials** (`followerConfigRole`, or `followerConfigKey` / `followerConfigKeySecret`) are stored by the build in the Follower Account's Secrets Manager and used at runtime, for the life of the Deployment, by the Follower's TAP and Endpoint Servers to reach the Leader Account.

#### `clients.json` Schema (Follower Mode)

- `hasUserManagementAccount` - Set to `true` to build this Deployment as a Follower. All of the fields below apply only when this is `true`.
- `userManagementAccountId` - AWS Account ID of the Leader. (If the Leader and the Follower are separate Shards in the same AWS Account, enter that same AWS Account ID.)
- `userManagementShardId` - Shard ID of the Leader Deployment. Leave blank if the Leader has no Shard ID.
- `userManagementMasterRegion` - AWS Region ID of the Leader Deployment's Master Region.
- `leaderAccountRoleArn` - ARN value of a Role in the Leader Account that the automation tool assumes to perform the deploy. This is typically the Leader's own `Combine-Provisioning-Role`.
- `leaderAccountKey`, `leaderAccountKeySecret`, and `leaderAccountSessionToken` - AWS Credentials to use instead of `leaderAccountRoleArn` to perform the deploy. Session Token is optional. If neither these nor `leaderAccountRoleArn` is set the tool will prompt for them.
- `tapMissionName` - Short name identifying this Follower. It is used as the Account Alias on the AWS Role Mappings the build generates, which is how a user tells this Follower's Roles apart from another Follower's in TAP. Use a distinct value for each Follower (for example `AWS-TS-DMZ`). Required in Follower Mode; the tool will prompt if it is not set.
- `followerConfigRole` - Name of a Role in the Leader Account that this Follower's Servers assume at runtime.
- `followerConfigKey` and `followerConfigKeySecret` - AWS Credentials to use instead of `followerConfigRole` at runtime.

#### Follower Configuration Credentials

`followerConfigRole` takes a Role **Name**, not an ARN. Combine builds the ARN itself as `arn:<host partition>:iam::<userManagementAccountId>:role/<followerConfigRole>`, so the Role must exist in the Leader Account at the IAM root path (`/`). The Follower's Servers assume it using their own Instance Profile credentials, so the Role's Trust Policy must trust the Follower Account.

`followerConfigKey` / `followerConfigKeySecret` are the Access Key and Secret Access Key of an IAM User in the Leader Account. Prefer `followerConfigRole` where your environment allows it, since an Access Key pair is a long lived credential that has to be stored and rotated. If you supply both, the build stores both and the Access Key pair is the one used at runtime.

The build writes these values into Secrets Manager in the Follower Account's Master Region under these Secret names (the `<shard id>` element is present, in lower case, only when `shardId` is set):

- `combine/<shard id>/configuration/integrations/userManagementAccount/role`
- `combine/<shard id>/configuration/integrations/userManagementAccount/credentials/key`
- `combine/<shard id>/configuration/integrations/userManagementAccount/credentials/key/secret`

If none of the three fields is present in `clients.json`, the tool prompts for the credential type and then for the values. To rotate a credential later, update the Secret value in the Follower Account and then perform an "Instance Refresh" on the `Combine-ASG-Tap` and `Combine-ASG-Endpoints` Auto Scaling Groups; a full rebuild is not required.

#### Preparing the Leader Account

The Combine CloudFormation Templates do **not** create the Follower principal for you. `combine.yaml` creates only the Managed Policy that grants the access a Follower needs — `sts:AssumeRole`, DynamoDB on the Leader's `combine-*` Tables, and Secrets Manager on the Leader's `combine/*` Secrets. In the Leader Account that Policy is named `CombinePolicyFollowerAccount`, or `CombinePolicy<ShardId>FollowerAccount` if the Leader has a Shard ID. Because it comes from `combine.yaml`, the Leader Deployment must be built before you build your first Follower.

Create the principal yourself in the Leader Account and attach that Managed Policy to it:

- For `followerConfigRole`, create an IAM Role (for example `Combine-I-Follower-Role`) at path `/`, attach the `CombinePolicy...FollowerAccount` Managed Policy, and give it a Trust Policy that allows the Follower Account to assume it. Use the Role Name in `clients.json`.
- For `followerConfigKey` / `followerConfigKeySecret`, create an IAM User whose name begins with `combine-`, attach the same Managed Policy, and create an Access Key for it. Deploying `combine-provisioning.yaml` with the `EnablePermissionsFollowerAccountCredentials` Parameter set to `true` grants the Combine Provisioning Role the IAM permissions needed to manage `combine-*` Users and their Access Keys.

One Role or User in the Leader Account may be shared by every Follower.

A Follower build reads the Leader's Certificate Authority chain and signs its own signing certificate under it, and it does not generate an Admin User because Users come from the Leader. The Leader must therefore be fully built, including its Admin User, before you build a Follower.

#### `clients.json` Example (Follower Mode)

```
"myFollowerEnvironment": {
  "region": "us-east-1",
  "masterRegion": "us-east-1",
  "shardId": "DMZ",
  "clientAccountId": "<follower account id>",
  "clientRoleArn": "arn:aws:iam::<follower account id>:role/Combine-Provisioning-Role",
  "hasUserManagementAccount": "true",
  "userManagementAccountId": "<leader account id>",
  "userManagementShardId": "",
  "userManagementMasterRegion": "us-east-1",
  "leaderAccountRoleArn": "arn:aws:iam::<leader account id>:role/Combine-Provisioning-Role",
  "followerConfigRole": "Combine-I-Follower-Role",
  "tapMissionName": "AWS-TS-DMZ",
  "bucketEncryptionKey": "",
  "bucketSetBlockPublicAccess": "true",
  "emulatedPartitionId": "<todo>",
  "certificateName": "POC",
  "combineStackParameters": {},
  "combinePolicyStackParameters": {},
  "combineVPCStacks": {
    "Combine-DMZ-VPC": {}
  }
}
```

### Executing Commands

To execute a Combine automation command you will use this CLI command:

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor <command> --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

In the above command, the value of `<profile>` is the key used in the `clients.json` file (`myDevEnvironment` in the example above). If `--config-store-profile` is not provided the tool will prompt you for each value via the CLI.

In the above command, the value of `<command>` is a support Combine automation command. See below for the basic commands:

- `build` - Initiates a full build with a new certificate authority chain.
- `update` - Updates combine with latest artifacts.

Running the above command without specifying a `<command>` value will print the usage instructions.

Running this command will list all available Combine automation commands as well as all `clients.json` entries.

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar"  com.sequoia.combine.accounts.CombineCommandExecutor help
```


There are additional command line options including:

- `--bricks-release-version` - Sets the version number of the deployment.
- `--enable-aws-imds` - Uses local credentials to perform the deploy instead of passing in credentials. Use this if you are executing on an EC2 server that has an Instance Profile with permissions to perform the deploy.
- `--config-store` - Sets the path at which to find the `clients.json` file. Default is the local directory.
- `--config-store-profile` - Sets the profile to use to load configuration.
- `--skip-bucket-block-public-access` - Skips attempts to set a block public access block. Use this if your environment has a policy that prohibits changing block public access settings.

### Performing Deployment (New Account)

To deploy a new instance of Combine executing the following Combine automation tool command:

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor full --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

Be certain to provide the name of your Combine JAR File and the profile you wish to use. For Bricks Release Version you can actually provide any value since it is only used to create a unique path in S3. However we recommend a version number that follows this pattern:

`bricks_v_x_x_x` - For example: `bricks_v_3_14_5`

The build will attempt to load artifacts into S3, build a Certificate Authority chain, and then execute all three Combine CloudFormation Templates. It will build a single VPC with default settings. Remember that CloudFormation Parameters can be overridden in the `clients.json` as described above.

If the build fails, we recommend that you empty the `combine-devops-<account id>-<region id>` bucket and then delete the `Combine` and `CombineRestricted` SSH KeyPairs before reattempting. (If you set a Shard ID they will have the names `Combine<ShardId>` and `Combine<ShardId>Restricted`.) This cleanup will be eliminated in the 3.14 release.

### Performing Deployment Upgrade (Existing Account)

To deploy a new instance of Combine executing the following Combine automation tool command:

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor update --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

Be certain to provide the name of your Combine JAR File and the profile you wish to use. For Bricks Release Version you can actually provide any value since it is only used to create a unique path in S3. However we recommend a version number that follows the pattern `bricks_v_x_x_x` (such as: `bricks_v_3_14_5`).

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

## Combine 3.15.x

Under Development.
