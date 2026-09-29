# Combine Deployment Process

## Introduction

This guide is only for customers who have access to the Combine automation tool and are performing their own build and deployment operations.

## Combine 3.14.x

### Prerequisites

- Java 25 or later installed on the server from which you are deploying.
- IAM Role or other IAM Credentials to use for the deployment. (See the Combine provided [`combine-provisioning.yaml`](../../start-here/combine-provisioning.yaml) CloudFormation template for an example of necessary permissions.) If the Combine Provisioning CloudFormation Stack is deployed in the account, the `build` and `upgrade` commands also update it to the template included in the release.
- The Combine automation tool package for the release. This is a `deployment` directory that contains:
  - `combine-aws-account-automation.jar` - The Combine automation tool.
  - `lib/` - The Bouncy Castle JAR files for Provider, PKI, and Util (`bcpkix-jdk18on-1.84.jar`, `bcprov-jdk18on-1.84.jar`, `bcutil-jdk18on-1.84.jar`). Bouncy Castle is not packaged inside the Combine JAR file.
  - `release/` - The Combine CloudFormation Templates, server artifacts, and configuration files that the tool uploads to S3.
- Available Service Quota in the Region you are deploying to. The `build`, `build_region`, and `build_vpc_only` commands check that at least two Elastic IP Addresses, two NAT Gateways, and two Network Firewalls are still available under your account's Service Quotas and stop if they are not.
- A `clients.json` file prepared by you.

Always run the tool from the directory that contains the `deployment` directory. The tool uploads the contents of `deployment/release` from the current directory.

### `clients.json` Example

Example:

```json
{
  "myDevEnvironment": {
    "region": "us-east-1",
    "masterRegion": "us-east-1",
    "clientAccountId": "123123123123",
    "clientRoleArn": "arn:aws:iam::123123123123:role/Combine-Provisioning-Role",
    "shardId": "Dev",
    "hasUserManagementAccount": "false",
    "emulatedPartitionId": "AWS_C2S",
    "certificateName": "Development",
    "bucketEncryptionKey": "",
    "bucketSetBlockPublicAccess": "true",
    "combineStackParameters": {},
    "combinePolicyStackParameters": {},
    "combineVPCStacks": {
      "Combine-Dev-VPC": {}
    },
    "configuration": []
  }
}
```

You can specify Key/Secret Key pair for credentials instead of trying to assume a role by replacing `clientRoleArn` with:

```json
"clientKey": "<aws key>",
"clientKeySecret": "<aws secret key>",
"clientSessionToken": "<aws session token (optional)>"
```

If neither `clientRoleArn` nor `clientKey`/`clientKeySecret` is set, the tool will ask whether to use the credentials of the EC2 Instance Profile it is running on, an STS Token JSON document, or an Access Key / Secret Access Key entered via the CLI.

### `clients.json` Schema

Required by every command:

- `region` - AWS Region ID in which to deploy.
- `masterRegion` - AWS Region ID in which to deploy account unique resources. Except in advanced cases this should be set to the same value as `region`.
- `clientAccountId` - AWS Account ID in which to deploy.
- `emulatedPartitionId` - The emulated partition. Use `AWS_C2S` (C2S), `AWS_SC2S` (SC2S), or `AWS_GOV_CLOUD` (GovCloud). For the EUSC release use `AWS_EUSC`.
- `hasUserManagementAccount` - `true`/`false`. Except in advanced cases this should be set to `false`. Set to `true` only to build this Deployment as a Follower. (See [Follower Mode](#follower-mode).)
- `clientRoleArn` - ARN value of Role to try to assume to perform the deploy. Or instead use `clientKey` and `clientKeySecret` (and optionally `clientSessionToken`) as AWS Credentials to perform the deploy. (See above.)

Required by the build and upgrade commands:

- `certificateName` - (Build commands and `upgrade_to_3_dot_14`.) Value to use when creating the Combine Certificate Authority chain. The final value will be `Combine CA - <certificateName> - <timestamp>`.
- `combineStackParameters` - (Build commands.) CloudFormation Parameters for the Combine CloudFormation Stack (`combine.yaml`). Use `{}` to accept the defaults.
- `combinePolicyStackParameters` - (Build commands.) CloudFormation Parameters for the Combine Policy CloudFormation Stack (`combine-policy.yaml`). Use `{}` to accept the defaults.
- `combineVPCStacks` - One entry per Combine VPC. The key is the name of the Combine VPC CloudFormation Stack and the value holds the CloudFormation Parameters for that stack (`combine-vpc.yaml`). `build` creates each listed stack that does not already exist. `upgrade`, `upgrade_to_3_dot_14`, and `destroy` act only on the stacks listed here, so list every existing Combine VPC CloudFormation Stack.
- `bricksReleaseVersion` - The release version. Usually provided with the `--bricks-release-version` command line option instead.

Optional:

- `shardId` - A short name used to namespace resources in Combine. Recommend setting a value such as "Dev" or "Prod" since resource name constraints can cause build to fail for lengthy values. Value should contain only letters.
- `regionProvisioning` - AWS Region ID in which the Combine Provisioning CloudFormation Stack is deployed. Defaults to `region`.
- `localAwsProfile` - Name of a local AWS CLI profile used to assume `clientRoleArn`. Defaults to the standard AWS credential chain.
- `bucketEncryptionKey` - ARN value of KMS Key used to encrypt Combine S3 Buckets. Should be blank unless your environment requires setting a KMS CMK Key for each bucket by policy.
- `bucketSetBlockPublicAccess` - Set to `true` to apply S3 Block Public Access to the Combine DevOps bucket when the tool creates it. If it is omitted or not `true` the tool does not change Block Public Access settings. (This replaces the 3.13 `--skip-bucket-block-public-access` option.)
- `terminationProtection` - `true`/`false`. Sets CloudFormation Termination Protection on each stack created by the build. Default is `true`.
- `additionalStackTags` - Additional tags to apply to each stack created by the build. Either an object (`{"<key>": "<value>"}`) or a list (`[{"key": "<key>", "value": "<value>"}]`).
- `configuration` - A list of Configuration Values (`[{"key": "<key>", "value": "<value>"}]`) that is written to the Combine Configuration table by the `build`, `upgrade`, `update`, and `update_configuration_only` commands. (See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md).)
- `combineStackName` / `combinePolicyStackName` - Override the default stack names of `Combine` (or `Combine-<ShardId>`) and `Combine-Policy` (or `Combine-<ShardId>-Policy`).
- `tapDnsNameOverrideInternal` / `tapDnsNameOverrideExternal` - A DNS name to add to the internal / external TAP server certificate. (The internal value replaces the emulated partition's default TAP DNS name.)
- `iamAugment` - An IAM Policy to create (`{"name": "<policy name>", "policy": {<policy document>}}`). The build sets it as the `CombineServiceAugment` parameter of the Combine Policy CloudFormation Stack.
- User Management Account fields (`userManagementAccountId`, `userManagementMasterRegion`, `userManagementShardId`, `tapMissionName`, `leaderAccountRoleArn`, `followerConfigRole`, and similar) - Only used when `hasUserManagementAccount` is `true`. (See [Follower Mode](#follower-mode).)

In most cases `combineStackParameters` and `combinePolicyStackParameters` are empty (`{}`) and each `combineVPCStacks` entry is `{}`, unless you desire a more nuanced configuration.

Example of setting CloudFormation Parameters:

```json
"combineStackParameters": {},
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
}
```

Each key is the CloudFormation Parameter Name and the value is the overridden value to use. (It also replaces any value the tool would otherwise set for that parameter.) These values are only used when the tool creates a stack. If you deploy more than one Combine VPC give each a different `VpcName` parameter (maximum 13 characters) since it is used to name the VPC's resources.

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

If none of the three fields is present in `clients.json`, the tool prompts for the credential type and then for the values. To rotate a credential later, update the Secret value in the Follower Account and then perform an Instance Refresh on the TAP and Endpoints Auto Scaling Groups (`<VpcName>-ASG-Tap` and `<VpcName>-ASG-Endpoints`, which are `Combine-ASG-Tap` and `Combine-ASG-Endpoints` by default and are prefixed with `<ShardId>-` if you set a Shard ID), or run the `instance_refresh` command. A full rebuild is not required.

#### Preparing the Leader Account

The Combine CloudFormation Templates do **not** create the Follower principal for you. `combine.yaml` creates only the Managed Policy that grants the access a Follower needs — `sts:AssumeRole`, DynamoDB on the Leader's `combine-*` Tables, and Secrets Manager on the Leader's `combine/*` Secrets. In the Leader Account that Policy is named `CombinePolicyFollowerAccount`, or `CombinePolicy<ShardId>FollowerAccount` if the Leader has a Shard ID. Because it comes from `combine.yaml`, the Leader Deployment must be built before you build your first Follower.

Create the principal yourself in the Leader Account and attach that Managed Policy to it:

- For `followerConfigRole`, create an IAM Role (for example `Combine-I-Follower-Role`) at path `/`, attach the `CombinePolicy...FollowerAccount` Managed Policy, and give it a Trust Policy that allows the Follower Account to assume it. Use the Role Name in `clients.json`.
- For `followerConfigKey` / `followerConfigKeySecret`, create an IAM User whose name begins with `combine-`, attach the same Managed Policy, and create an Access Key for it. Deploying `combine-provisioning.yaml` with the `EnablePermissionsFollowerAccountCredentials` Parameter set to `true` grants the Combine Provisioning Role the IAM permissions needed to manage `combine-*` Users and their Access Keys.

One Role or User in the Leader Account may be shared by every Follower.

A Follower build reads the Leader's Certificate Authority chain and signs its own signing certificate under it, and it does not generate an Admin User because Users come from the Leader. The Leader must therefore be fully built, including its Admin User, before you build a Follower.

#### `clients.json` Example (Follower Mode)

```json
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
  "emulatedPartitionId": "AWS_C2S",
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

The `-Dcombine.configuration.partitions.localFile` option is required. It loads the emulated partition definitions included in the release. Without it the tool will report `Unknown Partition ID`.

The command line options are:

- `<command>` - The Combine automation command to execute. (See below.)
- `--config-store` - Sets the path at which to find the `clients.json` file. Default is `clients.json` in the current directory.
- `--config-store-profile` - Sets the profile to use to load configuration. This is the key used in the `clients.json` file (`myDevEnvironment` in the example above). If it is not provided the tool will prompt you for each value via the CLI. (The build and upgrade commands need a profile since the CloudFormation Stack entries can only be read from `clients.json`.)
- `--bricks-release-version` - Sets the version number of the deployment. The tool uploads the release to the `releases/<bricks-release-version>/` path of the Combine DevOps bucket and the Combine servers load their artifacts from that path. We recommend a version number that follows the pattern `bricks_v_x_x_x` (such as: `bricks_v_3_14_7`).

Running the above command without specifying a `<command>` value (or with `help`) will print the usage instructions, every available Combine automation command with its description, and the profiles found in the `clients.json` file.

The basic commands are:

- `build` - Performs a new deployment in the master region. It checks Service Quotas, uploads the release to the Combine DevOps bucket, builds a new Certificate Authority chain, creates the Combine, Combine Policy, and Combine VPC CloudFormation Stacks, writes the `configuration` Configuration Values, creates the default TAP Role Mappings, and creates the Admin user.
- `build_region` - Performs a build in a region that is NOT the master region. It creates the Combine and Combine VPC CloudFormation Stacks in `region`.
- `build_vpc_only` - Creates each Combine VPC CloudFormation Stack listed in `combineVPCStacks` that does not already exist.
- `upgrade` - Upgrades an existing Combine 3.14.x Deployment to a newer 3.14.x release. (See below.)
- `upgrade_to_3_dot_14` - Upgrades an existing Combine 3.13.x Deployment to 3.14.x. (See below.)
- `update` - Uploads the release to the Combine DevOps bucket and writes the `configuration` Configuration Values. It does not update any CloudFormation Stack or refresh any server.
- `update_configuration_only` - Writes the `configuration` Configuration Values only.
- `instance_refresh` - Starts an Instance Refresh on the TAP and Endpoints Auto Scaling Groups of the Combine Deployment. (`instance_refresh_with_wait` also waits for them to complete.)
- `destroy` - Deletes a Combine Deployment. (See [Delete/Uninstall a Combine Deployment](how-to-delete-combine-deployment.md).)

The remaining commands are for advanced cases. Please contact the Combine Support Team before using them.

### Performing Deployment (New Account)

To deploy a new instance of Combine execute the following Combine automation tool command:

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor build --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

The build will:

- Check Service Quotas.
- Create the `combine-devops-<account id>-<region id>` bucket (`combine-<shard id>-devops-<account id>-<region id>` if you set a Shard ID) if it does not exist and upload the release to it.
- Build a Certificate Authority chain.
- Update the Combine Provisioning CloudFormation Stack (if present).
- Create the `Combine` (or `Combine-<ShardId>`) CloudFormation Stack.
- Create the IAM Policy from `iamAugment` (if set) and the `Combine-Policy` (or `Combine-<ShardId>-Policy`) CloudFormation Stack.
- Create each Combine VPC CloudFormation Stack listed in `combineVPCStacks`.
- Write the `configuration` Configuration Values, create the default TAP Role Mappings, and create the Admin user. The Admin user's certificate bundle is downloaded to `admin.zip` (or `admin_<ShardId>.zip`) in the current directory. (A Follower build does not create an Admin user. See [Follower Mode](#follower-mode).)

A failure while creating a Combine VPC CloudFormation Stack does not stop the build. Check the output for `Could not build VPC Stacks!`.

If the build fails, delete any Combine CloudFormation Stack that failed to create (such as a stack in `ROLLBACK_COMPLETE` status) before reattempting. (Disable Termination Protection on the stack first if it is enabled.) The build skips any Combine VPC CloudFormation Stack that already exists. You do not need to empty the Combine DevOps bucket or delete SSH KeyPairs. (The 3.14 build does not create SSH KeyPairs.) If the build finds an existing Certificate Authority chain it will ask you to confirm before rebuilding it.

### Performing Deployment Upgrade (Existing Account)

To upgrade a Combine 3.13.x Deployment to 3.14.x use the `upgrade_to_3_dot_14` command. To upgrade a Combine 3.14.x Deployment to a newer 3.14.x release use the `upgrade` command:

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor upgrade --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

The Combine automation tool now updates the CloudFormation Stacks itself. You do not need to update each template via the AWS Console. The `upgrade` command will:

- Upload the release to the Combine DevOps bucket.
- Update the Combine Provisioning CloudFormation Stack (if present).
- Update the Combine and Combine Policy CloudFormation Stacks.
- Update each Combine VPC CloudFormation Stack listed in `combineVPCStacks` and set its `BricksReleaseVersion` parameter to the `--bricks-release-version` value.
- Write the `configuration` Configuration Values.
- Initiate an Instance Refresh on the TAP and Endpoints Auto Scaling Groups and wait for it to complete. This will rebuild your TAP and Endpoint servers to use the updated artifacts.

Each CloudFormation Stack keeps its current parameter values. (Parameters that no longer exist in the new template are dropped.) The CloudFormation Parameters in `clients.json` are not applied during an upgrade, so make any parameter changes via the AWS Console.

The `upgrade_to_3_dot_14` command performs the same steps and also migrates the Combine Deployment from 3.13.x. It deletes the legacy `combine-devops-<account id>` bucket (if present), removes obsolete Configuration Values, rebuilds the Endpoint server certificate, updates the DNS parameters of each Combine VPC CloudFormation Stack, and (unless you use a User Management Account) converts the partition of each TAP Role Mapping, User, and Server to the 3.14 partition IDs. Because of these changes an upgraded Combine Deployment cannot be reverted to 3.13.x by redeploying the 3.13.x templates, so we recommend recording the parameter values of each Combine CloudFormation Stack and backing up the Combine DynamoDB tables before you run it.

## Combine 3.15.x

Under Development.
