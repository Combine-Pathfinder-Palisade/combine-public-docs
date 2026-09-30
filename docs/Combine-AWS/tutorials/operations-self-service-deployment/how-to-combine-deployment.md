# Combine Deployment Process

This guide is only for customers who have access to the Combine automation tool and perform their own build and deployment operations. It covers the prerequisites, the `clients.json` file, how to run Combine Commands, and how to build and upgrade a Combine Deployment.

Related pages:

- [Reference - clients.json](reference-clients-json.md) describes the commonly changed CloudFormation Parameters of each stack, IAM Overlays, and the IAM Augment Policy.
- [Add Follower Account](how-to-add-follower-account.md) is the procedure for building a Follower.
- [Multi-Region Deployment](how-to-deploy-multiple-regions.md) covers a Combine Deployment in more than one host Region.
- [Delete/Uninstall a Combine Deployment](how-to-delete-combine-deployment.md) covers removing a Combine Deployment.

## Combine 3.14.x

### Prerequisites

- Java 25 or later, installed on the server from which you deploy.
- An IAM Role or other IAM credentials for the deployment. For an example of the necessary permissions, see the [`combine-provisioning.yaml`](../../start-here/combine-provisioning.yaml) CloudFormation Template that Combine provides, and [Shared Role](../../start-here/3-before-deployment-shared-role.md). If the Combine Provisioning CloudFormation Stack is deployed in the Account, the `build` and `upgrade` commands also update it to the template included in the release.
- The Combine automation tool package for the release. This is a `deployment` directory that contains:
  - `combine-aws-account-automation.jar` - The Combine automation tool.
  - `lib/` - The Bouncy Castle JAR files for Provider, PKI, and Util (`bcpkix-jdk18on-1.84.jar`, `bcprov-jdk18on-1.84.jar`, `bcutil-jdk18on-1.84.jar`). Bouncy Castle is not packaged inside the Combine JAR file.
  - `release/` - The Combine CloudFormation Templates, server artifacts, and configuration files that the tool uploads to S3.
- Available Service Quota in the Region you deploy to. The `build`, `build_region`, and `build_vpc_only` commands check that at least two Elastic IP Addresses, two NAT Gateways, and two Network Firewalls are still available under your Account's Service Quotas, and stop if they are not.
- A `clients.json` file that you prepare. (See [`clients.json` Example](#clientsjson-example) and [`clients.json` Schema](#clientsjson-schema).)

Always run the tool from the directory that contains the `deployment` directory, because the tool uploads the contents of `deployment/release` from the current directory.

### `clients.json` Example

A `clients.json` file holds one or more profiles. Each top-level key is a profile name, which you pass to the tool with `--config-store-profile`. The following example defines one profile, `myDevEnvironment`, for a C2S Combine Deployment:

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

To use an Access Key instead of assuming a Role, replace `clientRoleArn` with these fields:

```json
"clientKey": "<aws key>",
"clientKeySecret": "<aws secret key>",
"clientSessionToken": "<aws session token (optional)>"
```

If neither `clientRoleArn` nor `clientKey` / `clientKeySecret` is set, the tool asks whether to use the credentials of the EC2 Instance Profile it runs on, an STS Token JSON document, or an Access Key and Secret Access Key that you enter in the CLI.

### `clients.json` Schema

Every command requires these fields:

| Field | Description |
| --- | --- |
| `region` | AWS Region ID in which to deploy. |
| `masterRegion` | AWS Region ID in which to deploy Account unique resources. Except in advanced cases, set it to the same value as `region`. (See [Multi-Region Deployment](how-to-deploy-multiple-regions.md).) |
| `clientAccountId` | AWS Account ID in which to deploy. |
| `emulatedPartitionId` | The emulated partition: `AWS_C2S` (C2S), `AWS_SC2S` (SC2S), or `AWS_GOV_CLOUD` (GovCloud). For the EUSC release, use `AWS_EUSC`. |
| `hasUserManagementAccount` | `true` or `false`. Except in advanced cases, set it to `false`. Set it to `true` only to build this Combine Deployment as a Follower. (See [Follower Mode](#follower-mode).) |
| `clientRoleArn` | ARN of the Role that the tool assumes to perform the deployment. Alternatively, set `clientKey` and `clientKeySecret` (and optionally `clientSessionToken`) to the AWS Credentials to use. If none of these fields is set, the tool prompts you for credentials instead. (See [`clients.json` Example](#clientsjson-example).) |

The build and upgrade commands also require these fields:

| Field | Description |
| --- | --- |
| `certificateName` | Used by the build commands and `upgrade_to_3_dot_14`. The name to use when creating the Combine Certificate Authority chain. The final value is `Combine CA - <certificateName> - <timestamp>`. |
| `combineStackParameters` | Used by the build commands. CloudFormation Parameters for the Combine CloudFormation Stack (`combine.yaml`). Use `{}` to accept the defaults. |
| `combinePolicyStackParameters` | Used by the build commands. CloudFormation Parameters for the Combine Policy CloudFormation Stack (`combine-policy.yaml`). Use `{}` to accept the defaults. |
| `combineVPCStacks` | One entry per Combine VPC. The key is the name of the Combine VPC CloudFormation Stack and the value holds the CloudFormation Parameters for that stack (`combine-vpc.yaml`). `build` creates each listed stack that does not already exist. `upgrade`, `upgrade_to_3_dot_14`, and `destroy` act only on the stacks listed here, so list every existing Combine VPC CloudFormation Stack. |
| `bricksReleaseVersion` | The release version. Usually you pass it with the `--bricks-release-version` command line option instead. |

These fields are optional:

| Field | Description |
| --- | --- |
| `shardId` | A short name that namespaces the Combine resources. We recommend a value such as `Dev` or `Prod`, because resource name limits can make the build fail for long values. Use letters only. |
| `regionProvisioning` | AWS Region ID in which the Combine Provisioning CloudFormation Stack is deployed. Defaults to `region`. |
| `localAwsProfile` | Name of a local AWS CLI profile that the tool uses to assume `clientRoleArn`. Defaults to the standard AWS credential chain. |
| `bucketEncryptionKey` | ARN of the KMS Key used to encrypt the Combine S3 buckets. Leave it blank unless your environment's policy requires a KMS CMK for each bucket. |
| `bucketSetBlockPublicAccess` | Set to `true` to apply S3 Block Public Access to the Combine DevOps bucket when the tool creates it. If it is omitted or not `true`, the tool does not change Block Public Access settings. This replaces the 3.13 `--skip-bucket-block-public-access` option. |
| `terminationProtection` | `true` or `false`. Sets CloudFormation Termination Protection on each stack that the build creates. Defaults to `true`. |
| `additionalStackTags` | Additional tags to apply to each stack that the build creates. Either an object (`{"<key>": "<value>"}`) or a list (`[{"key": "<key>", "value": "<value>"}]`). |
| `configuration` | A list of Configuration Values (`[{"key": "<key>", "value": "<value>"}]`) that the `build`, `upgrade`, `update`, and `update_configuration_only` commands write to the Combine Configuration table. (See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md).) |
| `combineStackName` / `combinePolicyStackName` | Override the default stack names of `Combine` (or `Combine-<ShardId>`) and `Combine-Policy` (or `Combine-<ShardId>-Policy`). |
| `tapDnsNameOverrideInternal` / `tapDnsNameOverrideExternal` | A DNS name to add to the internal or external TAP Server certificate. The internal value replaces the emulated partition's default TAP DNS name. |
| `iamAugment` | An IAM Policy to create (`{"name": "<policy name>", "policy": {<policy document>}}`). The build sets it as the `CombineServiceAugment` Parameter of the Combine Policy CloudFormation Stack. (See [IAM Augment Policy](reference-clients-json.md#iam-augment-policy-iamaugment).) |
| `overlays` | IAM Overlays for the tool to create. (See [IAM Overlays](reference-clients-json.md#iam-overlays-overlays).) |
| User Management Account fields (`userManagementAccountId`, `userManagementMasterRegion`, `userManagementShardId`, `tapMissionName`, `leaderAccountRoleArn`, `followerConfigRole`, and similar) | Used only when `hasUserManagementAccount` is `true`. (See [Follower Mode](#follower-mode).) |

In most cases `combineStackParameters` and `combinePolicyStackParameters` are `{}` and each `combineVPCStacks` entry is `{}`. Set CloudFormation Parameters only when you need a more specific configuration. The following example sets CloudFormation Parameters on the Combine Policy CloudFormation Stack and on one Combine VPC CloudFormation Stack:

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

Each key is a CloudFormation Parameter name and each value is the value to use. An entry also replaces any value the tool would otherwise set for that Parameter. The tool uses these values only when it creates a stack. If you deploy more than one Combine VPC, give each a different `VpcName` Parameter (maximum 13 characters), because it names the VPC's resources.

See [Reference - clients.json](reference-clients-json.md) for the commonly changed CloudFormation Parameters of each stack, IAM Overlays, and the User Management Account fields.

### Executing Commands

Run every Combine Command with this command line:

```bash
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor <command> --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

The `-Dcombine.configuration.partitions.localFile` option is required. It loads the emulated partition definitions included in the release. Without it, the tool reports `Unknown Partition ID`.

The command line options are:

| Option | Description |
| --- | --- |
| `<command>` | The Combine Command to run. (See the command list below.) |
| `--config-store` | Path of the `clients.json` file. Defaults to `clients.json` in the current directory. |
| `--config-store-profile` | The profile to load, that is, its key in `clients.json` (`myDevEnvironment` in the example above). If you omit it, the tool prompts you for each value in the CLI. The build and upgrade commands need a profile, because the tool reads the CloudFormation Stack entries only from `clients.json`. |
| `--bricks-release-version` | The version number of the deployment. The tool uploads the release to the `releases/<bricks-release-version>/` path of the Combine DevOps bucket, and the TAP and Endpoint Servers load their artifacts from that path. We recommend a version number that follows the pattern `bricks_v_x_x_x` (for example, `bricks_v_3_14_7`). |

If you run the command line without a `<command>` value (or with `help`), the tool prints the usage instructions, every available Combine Command with its description, and the profiles found in `clients.json`.

The basic commands are:

| Command | What it does |
| --- | --- |
| `build` | Performs a new deployment in the Master Region. It checks Service Quotas, uploads the release to the Combine DevOps bucket, builds a new Certificate Authority chain, creates the Combine, Combine Policy, and Combine VPC CloudFormation Stacks, writes the `configuration` Configuration Values, creates the default TAP Role Mappings, and creates the Admin User. (See [Performing Deployment (New Account)](#performing-deployment-new-account).) |
| `build_region` | Performs a build in a Region that is not the Master Region. It creates the Combine and Combine VPC CloudFormation Stacks in `region`. (See [Multi-Region Deployment](how-to-deploy-multiple-regions.md).) |
| `build_vpc_only` | Creates each Combine VPC CloudFormation Stack listed in `combineVPCStacks` that does not already exist. |
| `upgrade` | Upgrades an existing Combine 3.14.x Deployment to a newer 3.14.x release. (See [Performing Deployment Upgrade (Existing Account)](#performing-deployment-upgrade-existing-account).) |
| `upgrade_to_3_dot_14` | Upgrades an existing Combine 3.13.x Deployment to 3.14.x. (See [Performing Deployment Upgrade (Existing Account)](#performing-deployment-upgrade-existing-account).) |
| `update` | Uploads the release to the Combine DevOps bucket and writes the `configuration` Configuration Values. It does not update any CloudFormation Stack or refresh any server. |
| `update_configuration_only` | Writes the `configuration` Configuration Values only. |
| `instance_refresh` | Starts an Instance Refresh on the TAP and Endpoints Auto Scaling Groups of the Combine Deployment. `instance_refresh_with_wait` also waits for them to complete. |
| `destroy` | Deletes a Combine Deployment. (See [Delete/Uninstall a Combine Deployment](how-to-delete-combine-deployment.md).) |

The remaining commands are for advanced cases. Contact the Combine Support Team before you use them.

### Performing Deployment (New Account)

To create a new Combine Deployment, run the `build` command:

```bash
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor build --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

The `build` command:

- Checks Service Quotas.
- Creates the `combine-devops-<account id>-<region id>` bucket (`combine-<shard id>-devops-<account id>-<region id>` if you set a Shard ID) if it does not exist, and uploads the release to it.
- Builds a Certificate Authority chain.
- Updates the Combine Provisioning CloudFormation Stack, if present.
- Creates the `Combine` (or `Combine-<ShardId>`) CloudFormation Stack.
- Creates the IAM Policy from `iamAugment` (if set) and the `Combine-Policy` (or `Combine-<ShardId>-Policy`) CloudFormation Stack.
- Creates each Combine VPC CloudFormation Stack listed in `combineVPCStacks`.
- Writes the `configuration` Configuration Values, creates the default TAP Role Mappings, and creates the Admin User. The tool downloads the Admin User's certificate bundle to `admin.zip` (or `admin_<ShardId>.zip`) in the current directory. A Follower build does not create an Admin User. (See [Add Follower Account](how-to-add-follower-account.md#step-4-run-the-build).)

A failure while creating a Combine VPC CloudFormation Stack does not stop the build. Check the output for `Could not build VPC Stacks!`.

If the build fails:

1. Delete any Combine CloudFormation Stack that failed to create (for example, a stack in `ROLLBACK_COMPLETE` status). If Termination Protection is enabled on the stack, disable it first.
2. Run the build again.

The build skips any Combine VPC CloudFormation Stack that already exists. If it finds an existing Certificate Authority chain, it asks you to confirm before rebuilding it. You do not need to empty the Combine DevOps bucket or delete EC2 Key Pairs. (The 3.14 build does not create EC2 Key Pairs.)

### Performing Deployment Upgrade (Existing Account)

To upgrade a Combine 3.13.x Deployment to 3.14.x, use the `upgrade_to_3_dot_14` command. To upgrade a Combine 3.14.x Deployment to a newer 3.14.x release, use the `upgrade` command:

```bash
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor upgrade --config-store-profile <profile> --bricks-release-version bricks_v_x_x_x
```

The tool updates the CloudFormation Stacks itself, so you do not need to update each template in the AWS Console. The `upgrade` command:

- Uploads the release to the Combine DevOps bucket.
- Updates the Combine Provisioning CloudFormation Stack, if present.
- Updates the Combine and Combine Policy CloudFormation Stacks.
- Updates each Combine VPC CloudFormation Stack listed in `combineVPCStacks` and sets its `BricksReleaseVersion` Parameter to the `--bricks-release-version` value.
- Writes the `configuration` Configuration Values.
- Starts an Instance Refresh on the TAP and Endpoints Auto Scaling Groups and waits for it to complete. This rebuilds your TAP and Endpoint Servers so that they use the updated artifacts.

Each CloudFormation Stack keeps its current Parameter values, and Parameters that no longer exist in the new template are dropped. The tool does not apply the CloudFormation Parameters in `clients.json` during an upgrade, so make any Parameter changes in the AWS Console.

The `upgrade_to_3_dot_14` command performs the same steps and also migrates the Combine Deployment from 3.13.x. It:

- Deletes the legacy `combine-devops-<account id>` bucket, if present.
- Removes obsolete Configuration Values.
- Rebuilds the Endpoint Server certificate.
- Updates the DNS Parameters of each Combine VPC CloudFormation Stack.
- Converts the partition of each TAP Role Mapping, User, and Server to the 3.14 partition IDs, unless you use a User Management Account.

Because of these changes, you cannot revert an upgraded Combine Deployment to 3.13.x by redeploying the 3.13.x templates. Before you run `upgrade_to_3_dot_14`, we recommend that you record the Parameter values of each Combine CloudFormation Stack and back up the Combine DynamoDB Tables.

### Follower Mode

By default, a Combine Deployment is self contained. TAP keeps its Users, Groups, Servers, and AWS Role Mappings in the Combine DynamoDB Tables in its own Account, and keeps its Certificate Authority chain in its own Account. Follower Mode instead points a Combine Deployment at a second Combine Deployment, the Leader (also called the User Management Account), and uses the Leader's Account for all of that. Every Follower shares one user base, one set of Groups, and one Certificate Authority chain with the Leader. You create a user and issue its certificate once, and the user can then sign in to TAP in the Leader and in each Follower.

Follower Mode also lets Combine "bridge" cross account Role assumptions through the Leader Account. Without it, every customer workload Account that a Combine Deployment reaches must trust that Combine Deployment individually. With it, those Accounts need to trust only the Leader Account.

Follower Mode is an advanced configuration. Leave `hasUserManagementAccount` set to `false` unless you are intentionally building a Leader and Follower topology. For the step by step procedure, including how to create the Follower principal in the Leader Account, a complete Leader and Follower `clients.json` example, and how to rotate the Follower credentials, see [Add Follower Account](how-to-add-follower-account.md).

Two separate sets of credentials are involved, and they are easy to confuse:

- **Leader Account credentials** (`leaderAccountRoleArn`, or `leaderAccountKey` / `leaderAccountKeySecret` / `leaderAccountSessionToken`). The tool obtains them on the deployment server every time it runs a command with the Follower's profile, and the build uses them to write to the Leader's DynamoDB Tables and read the Leader's S3 objects and Secrets.
- **Follower Configuration credentials** (`followerConfigRole`, or `followerConfigKey` / `followerConfigKeySecret`). The build stores them in the Follower Account's Secrets Manager, and the Follower's TAP and Endpoint Servers use them at runtime, for the life of the Combine Deployment, to reach the Leader Account.

#### `clients.json` Schema (Follower Mode)

All of these fields apply only when `hasUserManagementAccount` is `true`.

| Field | Description |
| --- | --- |
| `hasUserManagementAccount` | Set to `true` to build this Combine Deployment as a Follower. |
| `userManagementAccountId` | AWS Account ID of the Leader. If the Leader and the Follower are separate Shards in the same AWS Account, enter that same AWS Account ID. |
| `userManagementShardId` | Shard ID of the Leader Combine Deployment. Leave it blank if the Leader has no Shard ID. |
| `userManagementMasterRegion` | AWS Region ID of the Leader's Master Region. |
| `leaderAccountRoleArn` | ARN of a Role in the Leader Account that the tool assumes to perform the deployment. This is typically the Leader's own `Combine-Provisioning-Role`. |
| `leaderAccountKey`, `leaderAccountKeySecret`, `leaderAccountSessionToken` | AWS Credentials to use instead of `leaderAccountRoleArn`. The Session Token is optional, but if `leaderAccountSessionToken` is missing from the profile the tool prompts for it, so set it to `""` when you have no Session Token. If neither these nor `leaderAccountRoleArn` is set, the tool prompts for them. |
| `tapMissionName` | A short name that identifies this Follower. The build uses it as the Account Label of the AWS Role Mappings it generates, which is how a user tells this Follower's Roles apart from another Follower's in TAP. Use a distinct value for each Follower (for example, `AWS-TS-DMZ`). Required in Follower Mode. If it is not set, the tool prompts for it. |
| `followerConfigRole` | The **name** (not the ARN) of a Role in the Leader Account that this Follower's servers assume at runtime. Combine builds the ARN as `arn:<host partition>:iam::<userManagementAccountId>:role/<followerConfigRole>`, so the Role must be at the IAM root path (`/`). The Follower's servers assume it with their own Instance Profile credentials, so the Role's Trust Policy must trust the Follower Account. |
| `followerConfigKey`, `followerConfigKeySecret` | Access Key ID and Secret Access Key of an IAM User in the Leader Account, to use instead of `followerConfigRole` at runtime. Prefer `followerConfigRole` where your environment allows it, because an Access Key is a long lived credential that you must store and rotate. If you set both, the build stores both and the Access Key pair is used at runtime. |

If none of `followerConfigRole`, `followerConfigKey`, and `followerConfigKeySecret` is set, the tool prompts for the credential type and then for the values.

The build writes the Follower Configuration credentials to Secrets Manager in the Follower Account's Master Region under these Secret names. The `<shard id>` element is present, in lower case, only when `shardId` is set.

- `combine/<shard id>/configuration/integrations/userManagementAccount/role`
- `combine/<shard id>/configuration/integrations/userManagementAccount/credentials/key`
- `combine/<shard id>/configuration/integrations/userManagementAccount/credentials/key/secret`

To create the Role or IAM User and attach its Managed Policy, see [Step 1: Create the Follower Principal in the Leader Account](how-to-add-follower-account.md#step-1-create-the-follower-principal-in-the-leader-account). To change these credentials later, see [Rotating the Follower Credentials](how-to-add-follower-account.md#rotating-the-follower-credentials).

## Combine 3.15.x

Under Development.
