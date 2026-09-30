# Add Follower Account

A Follower is a Combine Deployment that uses another Combine Deployment, the Leader (also called the User Management Account), for its Users, Groups, AWS Role Mappings, and Certificate Authority chain. You create a user once in the Leader, and the user signs in to the Leader's TAP and to every Follower's TAP with the same certificate. The Follower's servers also "bridge" cross account Role assumptions through the Leader Account, so the Accounts they reach need to trust only the Leader Account.

Add a Follower when you run more than one Combine Deployment (for example, one per Account or one per Shard) and want a single user base and a single Certificate Authority chain across them. If you run a single Combine Deployment, you do not need Follower Mode.

This guide is only for customers who have access to the Combine automation tool and perform their own build and deployment operations. It is the step by step procedure. For the definition of each `clients.json` field, see [Follower Mode](how-to-combine-deployment.md#follower-mode) in the Combine Deployment Process guide.

## Prerequisites

- **The Leader is fully built.** The Leader is an ordinary Combine 3.14.x Deployment built with the `build` command in its Master Region. Its `clients.json` profile keeps `hasUserManagementAccount` set to `false`. A Follower build reads the Leader's Certificate Authority chain, and the Leader's Combine CloudFormation Stack creates the Managed Policy that the Follower principal needs, so the Leader must exist first.
- **The Leader has an Admin User.** A Follower build does not create an Admin User, because Users come from the Leader. You use an existing Leader administrator to assign the Follower's AWS Roles to users.
- **The Follower Account is ready for a normal build.** Everything in the Combine Deployment Process guide's [Prerequisites](how-to-combine-deployment.md#prerequisites) applies, including the Combine Provisioning Role (see [Shared Role](../../start-here/3-before-deployment-shared-role.md)) and Service Quota.
- **Both are in the same host partition.** Combine builds the Leader's ARNs with the Follower's own partition, and the Follower's IAM Roles trust `arn:<partition>:iam::<leader account id>:root` in that same partition. A Leader in AWS Commercial and a Follower in AWS GovCloud (or the reverse) cannot work.

Gather these values from the Leader's `clients.json` profile before you start:

- The Leader's AWS Account ID (`clientAccountId`).
- The Leader's Shard ID (`shardId`), if it has one.
- The Leader's Master Region (`masterRegion`).

The Leader and the Follower may be separate Shards in the same AWS Account. In that case the Leader's AWS Account ID is also the Follower's.

## Step 1: Create the Follower Principal in the Leader Account

The Follower's TAP and Endpoint Servers reach the Leader's DynamoDB Tables and Secrets, and bridge Role assumptions, through a principal in the Leader Account. The Combine CloudFormation Templates do not create this principal. They create only the Managed Policy to attach to it:

- `CombinePolicyFollowerAccount` in a Leader with no Shard ID.
- `CombinePolicy<ShardId>FollowerAccount` in a Leader with a Shard ID (use the Leader's Shard ID, for example `CombinePolicyMainFollowerAccount`).

The Policy allows `sts:AssumeRole` on any Role, `dynamodb:*` on the Leader's `combine-*` Tables in the Leader's Master Region, and `secretsmanager:*` on the Leader's `combine/*` Secrets.

Create the principal before you run the Follower build, because the Follower's servers start using it as soon as the build launches them. Use an IAM Role where your environment allows it. Every Follower can share one Role or User, as long as the Role's Trust Policy trusts each Follower Account.

### Option A: IAM Role

Create an IAM Role in the Leader Account:

- Use the IAM root path (`/`). Combine builds the Role ARN as `arn:<partition>:iam::<leader account id>:role/<role name>`.
- Choose any name, for example `Combine-I-Follower-Role`. You enter this **name** (not the ARN) as `followerConfigRole`.
- Attach the `CombinePolicy[<ShardId>]FollowerAccount` Managed Policy.
- Give it a Trust Policy that trusts the Follower Account:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<follower account id>:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

(Use `arn:aws-us-gov:` instead of `arn:aws:` if your Combine Deployments are hosted in AWS GovCloud.)

The Follower's servers assume this Role with their Instance Profile credentials and the Role Session Name `CombineUserManagementAccount`. TAP Servers run as the `Combine-TAP` Role and Endpoint Servers run as the `Combine-Endpoints` Role (`Combine-<ShardId>-TAP` and `Combine-<ShardId>-Endpoints` if the Follower has a Shard ID). Both already have permission to call `sts:AssumeRole`. To trust only those two Roles, add a condition:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<follower account id>:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "ArnEquals": {
          "aws:PrincipalArn": [
            "arn:aws:iam::<follower account id>:role/Combine-<ShardId>-TAP",
            "arn:aws:iam::<follower account id>:role/Combine-<ShardId>-Endpoints"
          ]
        }
      }
    }
  ]
}
```

Use the condition rather than listing the two Role ARNs as the `Principal`. The Follower's Roles do not exist until its build creates them, and IAM does not accept a Role ARN as a `Principal` if that Role does not exist.

_NOTE: With a Role, the credentials that the Follower's TAP issues to users come from a chained Role session, and AWS limits a chained session to one hour. Keep the Follower's `combine.tap.users.session.duration.limit`, `combine.tap.users.session.duration.default`, and `combine.tap.users.session.dashboard.duration.default` Configuration Values at their default of `3600` or less._

### Option B: IAM User

Create an IAM User in the Leader Account (for example, `combine-follower`), attach the `CombinePolicy[<ShardId>]FollowerAccount` Managed Policy, and create an Access Key for it. You enter the Access Key ID as `followerConfigKey` and the Secret Access Key as `followerConfigKeySecret`.

An Access Key is a long lived credential. The build stores it in the Follower Account's Secrets Manager, and you must rotate it. (See [Rotating the Follower Credentials](#rotating-the-follower-credentials).)

## Step 2: Give the Automation Tool Access to the Leader Account

The tool also needs credentials in the Leader Account while the build runs. These are separate from the Follower principal in Step 1. Set one of:

- `leaderAccountRoleArn` - ARN of a Role in the Leader Account. This is typically the Leader's own `Combine-Provisioning-Role`.
- `leaderAccountKey`, `leaderAccountKeySecret`, and optionally `leaderAccountSessionToken` - AWS Credentials for the Leader Account.

The tool assumes `leaderAccountRoleArn` with its **local** credentials (the `localAwsProfile` profile if set, otherwise the standard AWS credential chain), which are the same credentials it uses to assume `clientRoleArn`. It does not use the Follower's `clientRoleArn` credentials for this. The Role's Trust Policy must therefore allow the principal that runs the tool. For a `Combine-Provisioning-Role` deployed from `combine-provisioning.yaml`, the trusted Account is set by the `PrincipalAccount` and `PrincipalAccountNumberOverride` Parameters. (See [Shared Role](../../start-here/3-before-deployment-shared-role.md).)

During a Follower build the tool does the following in the Leader Account, all in the Leader's Master Region. The `<leader shard id>` elements are present, in lower case, only when the Leader has a Shard ID.

| Service | Action | Resource |
| --- | --- | --- |
| S3 | `GetObject` | `ca.key.pem`, `ca.cert.pem`, `signer.key.pem`, and `signer.cert.pem` under `certificates/` in the `combine-[<leader shard id>-]devops-<leader account id>-<leader master region>` bucket |
| Secrets Manager | `GetSecretValue` | `combine/[<leader shard id>/]configuration/certificates/ca/root/password` and `combine/[<leader shard id>/]configuration/certificates/ca/signer/password` |
| DynamoDB | `UpdateItem` | The `combine-[<leader shard id>-]configuration-sequences` Table |
| DynamoDB | `PutItem` | The `combine-[<leader shard id>-]aws-roles` Table |

The Leader's `Combine-Provisioning-Role` already has these permissions.

Every command, not only `build`, obtains Leader credentials when `hasUserManagementAccount` is `true`, so keep these fields in the Follower's profile for later `upgrade` and `instance_refresh` runs.

## Step 3: Add the Follower Profile to `clients.json`

Add a profile for the Follower. The following example shows the Leader's existing profile next to the Follower's, so you can see which Leader values the Follower refers to:

```json
{
  "myLeaderEnvironment": {
    "region": "us-east-1",
    "masterRegion": "us-east-1",
    "clientAccountId": "111122223333",
    "clientRoleArn": "arn:aws:iam::111122223333:role/Combine-Provisioning-Role",
    "shardId": "Main",
    "hasUserManagementAccount": "false",
    "emulatedPartitionId": "AWS_C2S",
    "certificateName": "Main",
    "bucketEncryptionKey": "",
    "bucketSetBlockPublicAccess": "true",
    "combineStackParameters": {},
    "combinePolicyStackParameters": {},
    "combineVPCStacks": {
      "Combine-Main-VPC": {}
    },
    "configuration": []
  },
  "myFollowerEnvironment": {
    "region": "us-east-1",
    "masterRegion": "us-east-1",
    "clientAccountId": "444455556666",
    "clientRoleArn": "arn:aws:iam::444455556666:role/Combine-Provisioning-Role",
    "shardId": "DMZ",
    "hasUserManagementAccount": "true",
    "userManagementAccountId": "111122223333",
    "userManagementShardId": "Main",
    "userManagementMasterRegion": "us-east-1",
    "leaderAccountRoleArn": "arn:aws:iam::111122223333:role/Combine-Provisioning-Role",
    "followerConfigRole": "Combine-I-Follower-Role",
    "tapMissionName": "AWS-TS-DMZ",
    "emulatedPartitionId": "AWS_C2S",
    "certificateName": "DMZ",
    "bucketEncryptionKey": "",
    "bucketSetBlockPublicAccess": "true",
    "combineStackParameters": {},
    "combinePolicyStackParameters": {},
    "combineVPCStacks": {
      "Combine-DMZ-VPC": {}
    },
    "configuration": []
  }
}
```

The Follower-specific fields are:

| Field | Required | Value |
| --- | --- | --- |
| `hasUserManagementAccount` | Yes | `true` |
| `userManagementAccountId` | Yes | The Leader's AWS Account ID. |
| `userManagementShardId` | Yes, may be blank | The Leader's Shard ID, or `""` if the Leader has none. If the field is left out the tool prompts for it. |
| `userManagementMasterRegion` | Yes | The Leader's Master Region. |
| `leaderAccountRoleArn` | One of these two | See Step 2. |
| `leaderAccountKey` / `leaderAccountKeySecret` / `leaderAccountSessionToken` | One of these two | See Step 2. Include `leaderAccountSessionToken` as `""` if you have no Session Token, or the tool prompts for it. |
| `tapMissionName` | Yes | A short name for this Follower. |
| `followerConfigRole` | One of these two | The Role **name** from Step 1, Option A. |
| `followerConfigKey` / `followerConfigKeySecret` | One of these two | The Access Key from Step 1, Option B. |

`tapMissionName` becomes the Account Label of every AWS Role Mapping the build creates for this Follower. It is how users and administrators tell this Follower's Roles apart in TAP, and the CAP API looks up a Role by partition, agency, Account Label, and Role Label. Use a value that no other Follower uses, and do not use `CCustomer`, which is the Account Label the Leader's own build gives its AWS Role Mappings.

For `tapMissionName`, `leaderAccountRoleArn`, and the `followerConfig...` fields a blank value counts as missing, and the tool prompts for what it needs. If you set both `followerConfigRole` and the Access Key pair, the build stores both and the Access Key pair is the one used at runtime.

## Step 4: Run the Build

Run the `build` command with the Follower's profile:

```bash
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor build --config-store-profile myFollowerEnvironment --bricks-release-version bricks_v_x_x_x
```

The build performs the normal steps (see [Performing Deployment (New Account)](how-to-combine-deployment.md#performing-deployment-new-account)) with these differences:

- **Leader access.** At startup the tool assumes `leaderAccountRoleArn` (Role Session Name `CombineProvisioning`) or uses the Leader Access Key.
- **Certificate Authority.** Instead of generating a new Certificate Authority chain, the tool loads the Leader's root and signer certificates and keys (`Loading certificates from user management account...`), copies them into the Follower's Combine DevOps bucket, and issues the Follower's TAP and Endpoint Server certificates with the Leader's signer. It does not write Certificate Authority password Secrets in the Follower Account; the Follower's servers read them from the Leader.
- **Follower credential Secrets.** It writes the Step 1 values to Secrets Manager in the Follower Account's Master Region as `combine/[<shard id>/]configuration/integrations/userManagementAccount/role`, or `.../credentials/key` and `.../credentials/key/secret` for an Access Key (`<shard id>` is the Follower's, in lower case).
- **Combine CloudFormation Stack.** It passes the `UserManagementAccount`, `UserManagementAccountMasterRegion`, `UserManagementShardId`, and `UserManagementShardIdLowerCase` Parameters. The stack writes them as the `combine.account.userManagement`, `combine.account.userManagement.region.master`, and `combine.account.userManagement.shardId` Configuration Values, together with the names of the Leader's Tables (`combine.account.userManagement.tableName.*`). The Follower's TAP and Endpoint Servers use these to find the Leader's Users, Groups, AWS Role Mappings, and credential cache.
- **Combine Policy CloudFormation Stack.** It passes the `UserManagementAccount` Parameter. Every IAM Role the stack creates, such as the `WLDEVELOPER` Roles and `Combine-[<ShardId>-]Read-Only`, then also trusts `arn:<partition>:iam::<leader account id>:root`.
- **AWS Role Mappings.** `Generating TAP Role Mappings...` writes the emulated partition's default AWS Role Mappings to the Leader's `combine-[<leader shard id>-]aws-roles` Table. Each has the Follower's Account ID, `tapMissionName` as the Account Label, the Follower's IAM Role Name (for example `Combine-DMZ-TS-WLDEVELOPER` for C2S), and the Follower's `emulatedPartitionId` as the Environment. They are not assigned to any user.
- **No Admin User.** The build does not create an Admin User or download an `admin.zip` bundle.

## Step 5: Verify

1. **Check the build output.** Look for `Loading certificates from user management account...` and `Generating TAP Role Mappings...`, and check that neither `[ERROR] Was not able to assume role programatically!` nor `Could not create default AWS Role mappings for CAP/SCAP!` appears.
2. **Check the Secrets.** In the Follower Account, confirm that the credential Secret exists in the Follower's Master Region:

   ```bash
   aws secretsmanager describe-secret --region us-east-1 --secret-id combine/dmz/configuration/integrations/userManagementAccount/role
   ```

   (For an Access Key, check `.../credentials/key` and `.../credentials/key/secret`.) You can also confirm that the Follower's `combine.account.userManagement` Configuration Value is the Leader's AWS Account ID. (See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md).)
3. **Find the new AWS Role Mappings in the Leader's TAP.** Sign in to the Leader's TAP as an administrator, and choose **Admin Settings**, then **TAP Role Mapping**. On the **AWS Roles** page, search for the `tapMissionName` value. The Follower's Roles are listed with it as the Account Label. (See [Add TAP Role Mappings](../administration/how-to-add-tap-role-mappings.md).)
4. **Assign the Roles to users.** In the Leader's TAP, open each user who needs the Follower. In the user's **AWS Roles** section, select the Follower's Roles (grouped by emulated partition, then by the `tapMissionName` Account Label and the Follower's Account ID). Save the user.
5. **Sign in to the Follower's TAP** with that user's existing certificate. The user's AWS Roles include the Follower's. Opening AWS Console access for one of the Follower's Roles from the Follower's TAP exercises both trust relationships: the Follower's servers to the Leader principal, and the Leader Account to the Follower's Role.

## Cross Account Role Assumption Through the Leader

When a Combine Deployment is a Follower, its TAP and Endpoint Servers make every Role assumption with the Leader principal's credentials: the credentials TAP issues to users, and the Roles the Endpoint Server assumes to sign requests (the Role of the EC2 Instance or Lambda Function that made a request, or the Default Role in the request's source Account). The target Account sees the caller as `arn:<partition>:sts::<leader account id>:assumed-role/<followerConfigRole>/CombineUserManagementAccount` (or as the IAM User for Option B).

The Roles that the Combine Policy CloudFormation Stack creates in the Follower Account already trust the Leader Account. Any other Role that a Follower's servers must assume needs to trust the Leader Account:

- An IAM Role you map in TAP yourself, in the Follower Account or in any other Account.
- The Default Role in any other Account whose requests reach the Follower's Endpoint Servers, and any Default Role override. (See [Change the Default Role](how-to-change-default-role.md).)

Add `arn:<partition>:iam::<leader account id>:root` to the `Principal` of each such Role's Trust Policy. The Follower principal's `CombinePolicy[<ShardId>]FollowerAccount` Managed Policy already allows `sts:AssumeRole` on any Role. With this in place a new Follower does not require any change to the Accounts your workloads already use.

## Rotating the Follower Credentials

The Follower's servers read the credential Secrets once and keep using those values until they are replaced, so after changing a Secret you must replace the TAP and Endpoint Servers. Perform an Instance Refresh on the `<VpcName>-ASG-Tap` and `<VpcName>-ASG-Endpoints` Auto Scaling Groups (`Combine-ASG-Tap` and `Combine-ASG-Endpoints` by default, prefixed with `<ShardId>-` if the Follower has a Shard ID), or run the `instance_refresh` command with the Follower's profile. A rebuild is not required.

To rotate an IAM User Access Key (Option B):

1. Create a second Access Key for the IAM User in the Leader Account.
2. In the Follower Account's Master Region, update the `combine/[<shard id>/]configuration/integrations/userManagementAccount/credentials/key` and `.../credentials/key/secret` Secrets with the new values.
3. Run the Instance Refresh and wait for it to complete.
4. Deactivate, then delete, the old Access Key.
5. Update `followerConfigKey` / `followerConfigKeySecret` in `clients.json` so a later build does not write the old values back.

A Role (Option A) has no long lived credential to rotate. To point the Follower at a different Role, update the `.../userManagementAccount/role` Secret and run the Instance Refresh. When you switch from an Access Key to a Role, delete both Access Key Secrets, because the Access Key pair is used whenever it is present.

## Troubleshooting

- **The build prompts `Enter TAP Mission Name for this Follower Account`.** `tapMissionName` is missing or blank in the profile.
- **The build stops with `No User Management Account credentials found!`.** None of `followerConfigRole`, `followerConfigKey`, or `followerConfigKeySecret` was set and both interactive prompts were answered `false`. Set the Step 1 values in the profile.
- **The build prints `[ERROR] Was not able to assume role programatically!` and later fails with `Could not stage build!`.** The tool could not assume `leaderAccountRoleArn`. It continues after this error, so the failure appears later, when it reads the Leader's Certificate Authority. Check that the Role's Trust Policy allows the principal that runs the tool (Step 2).
- **The build prints `Could not create default AWS Role mappings for CAP/SCAP!`.** The tool could not write to the Leader's Tables. Fix the Leader access, then run `rebuild_aws_roles` with the Follower's profile. That command adds a new set of AWS Role Mappings each time it runs, so run it only when the mappings are missing.
- **`AccessDenied` from STS for the Follower Role.** STS returns `AccessDenied`, not `NoSuchEntity`, for a Role that does not exist. First confirm the Role exists in the Leader Account with exactly the `followerConfigRole` name at path `/`, then check its Trust Policy, that the `CombinePolicy[<ShardId>]FollowerAccount` Managed Policy is attached, and any Permissions Boundary or Service Control Policy. In the Follower's server logs, look for `Could not assume Role` errors that name the Follower Role and the `CombineUserManagementAccount` Session Name. (See [View Combine Logs](../operations/how-to-view-combine-logs.md).)
- **`Could not assume Default Role in AWS Account [<account id>]` in the Endpoint Server logs.** If the caller in the nested error is `assumed-role/<followerConfigRole>/CombineUserManagementAccount`, the Follower Role worked and the target Role is the problem. Confirm the target Role exists and trusts the Leader Account. (See [Cross Account Role Assumption Through the Leader](#cross-account-role-assumption-through-the-leader).)
- **You created or fixed the Follower principal after the build.** Run an Instance Refresh (or `instance_refresh`) so the Follower's servers start with working access to the Leader.
