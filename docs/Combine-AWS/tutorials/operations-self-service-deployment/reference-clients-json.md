# Reference - clients.json

This page is a reference for the parts of `clients.json` that need more detail than the field list in the [Combine Deployment Process](how-to-combine-deployment.md#clientsjson-schema) guide: the CloudFormation Parameters most often set on each Combine CloudFormation Stack, the IAM Overlay and IAM Augment Policy fields, and the User Management Account fields. Read that guide first for the full field list and for how to run the Combine automation tool.

## Common CloudFormation Parameters

`combineStackParameters`, `combinePolicyStackParameters`, and each entry of `combineVPCStacks` map a CloudFormation Parameter name to the value to use. For example:

```json
"combineStackParameters": {
  "LogLevel": "INFO"
}
```

### How the Tool Applies Them

- Give each value as a JSON string (`"true"`, `"3600"`). For a comma delimited list Parameter, give one comma separated string.
- The tool supplies its own values for some Parameters (see [Parameters the Tool Sets](#parameters-the-tool-sets)). An entry in `clients.json` replaces the tool's value. The tool output shows `Replacing default parameter [<name>] with value [<value>]` when this happens.
- The tool passes every entry to CloudFormation as is. A misspelled Parameter name, or a Parameter that the template for your emulated partition does not have, makes the stack creation fail.
- The values are only used when the tool creates a stack. `build` creates the Combine, Combine Policy, and Combine VPC CloudFormation Stacks. `build_region` creates the Combine and Combine VPC CloudFormation Stacks in `region`. `build_vpc_only` creates the Combine VPC CloudFormation Stacks. Each of them skips a Combine VPC CloudFormation Stack that already exists.
- The Combine Policy CloudFormation Stack is only created in the Master Region, so `combinePolicyStackParameters` is only read there.
- `upgrade` keeps each stack's current Parameter values (other than setting `BricksReleaseVersion` on each Combine VPC CloudFormation Stack) and does not apply these fields. To change a Parameter on an existing stack, update the stack in the AWS Console.

### Parameters the Tool Sets

The tool fills in these Parameters from other `clients.json` fields and from the emulated partition:

| Stack | Parameter | Value the tool sets |
| --- | --- | --- |
| `combine.yaml` | `MasterRegion` | `masterRegion` |
| `combine.yaml` | `ShardId`, `ShardIdLowerCase` | `shardId`, and `shardId` in lower case |
| `combine.yaml` | `UserManagementAccount`, `UserManagementAccountMasterRegion` | `userManagementAccountId` and `userManagementMasterRegion` when `hasUserManagementAccount` is `true`, otherwise blank |
| `combine.yaml` | `UserManagementShardId`, `UserManagementShardIdLowerCase` | `userManagementShardId`, and `userManagementShardId` in lower case |
| `combine.yaml` | `BucketEncryptionKeyOverride` | `bucketEncryptionKey` (only when that field is present) |
| `combine.yaml` | `HealthMonitoringEmail` | A Combine Support Team address built from `certificateName` (`combine+<letters of certificateName>@sequoiainc.com`) |
| `combine-policy.yaml` | `ShardId` | `shardId` |
| `combine-policy.yaml` | `UserManagementAccount` | `userManagementAccountId` when `hasUserManagementAccount` is `true`, otherwise blank |
| `combine-policy.yaml` | `CombineServiceAugment` | ARN of the `iamAugment` IAM Policy (only when `iamAugment` is set) |
| `combine-policy.yaml` | `EnableTS`, `EnableS`, or `EnableGovCloud` | `true` for the emulated partition: `EnableTS` for `AWS_C2S`, `EnableS` for `AWS_SC2S`, `EnableGovCloud` for `AWS_GOV_CLOUD`. (None for `AWS_EUSC`.) |
| `combine-policy.yaml` | `MappedRegionUsIsoEast1`, `MappedRegionUsIsoBEast1`, `MappedRegionUsGovCloudWest1`, or `MappedRegionEuscDeEast1` | `region`, so the first Region of the emulated partition (for example, `us-iso-east-1`) is hosted there |
| `combine-vpc.yaml` | `ShardId`, `ShardIdLowerCase`, `MasterRegion` | Same as `combine.yaml` |
| `combine-vpc.yaml` | `BricksReleaseVersion` | `--bricks-release-version` (or `bricksReleaseVersion`) |
| `combine-vpc.yaml` | `DnsTapAPI`, `DnsTapDomain`, `DnsEndpointsDomain`, `DnsEndpointsServicesRegionA`, `DnsEndpointsServicesRegionB`, `DnsEndpointsServicesGlobal` | DNS names of the emulated partition. (`DnsEndpointsDomain` is not set for GovCloud, there is one `DnsEndpointsServicesRegion*` value per emulated Region, and `DnsEndpointsServicesGlobal` is only set for an emulated partition with a global endpoint domain.) |

_NOTE: Do not set these Parameters in `clients.json`. Set the field they come from instead. The tool also uses those fields elsewhere (for example, `shardId` names the Combine DevOps bucket and the Combine Configuration table), so overriding `ShardId`, `MasterRegion`, `BricksReleaseVersion`, a DNS Parameter, or a `UserManagement*` Parameter leaves the stack out of step with the rest of the Combine Deployment. The exceptions are `HealthMonitoringEmail` and `CombineServiceAugment`, which you may set._

### `combineStackParameters` (`combine.yaml`)

The Combine CloudFormation Stack creates the Account level resources of the Combine Deployment. The tool creates it in each Region. Role names below gain a `<ShardId>-` element after `Combine-` when you set a Shard ID.

| Parameter | Default | Allowed values | What it does |
| --- | --- | --- | --- |
| `HealthMonitoringEmail` | Set by the tool | | Email address subscribed to the `Combine-Health-Monitor` SNS Topic. Set it to receive Health Monitoring Notifications at your own address instead of the Combine Support Team address the tool sets. |
| `HealthMonitoringHttpsWebhook` | (blank) | | HTTPS WebHook subscribed to the same SNS Topic. (The other `HealthMonitoring*` Parameters turn individual alarms on or off and set their thresholds.) |
| `DeletionProtection` | `false` | `true`, `false` | Turns on Deletion Protection for the Combine DynamoDB Tables. |
| `LogLevel` | `DEBUG` | `INFO`, `DEBUG`, `VERBOSE`, `VERBOSE_LOW_LEVEL` | Log Level of the Combine Deployment. Written to the `combine.log.level` Configuration Value. |
| `LogIgnoreResponseCodesSuccess` | `true` | `true`, `false` | When `true`, successful AWS API Transactions are not logged. |
| `LambdaAlertsEventIngestEventExpiration` | `60` | | Number of days an Alert Event is kept. |
| `LambdaFirewallAlertsEventIgnorePortConnections` | `udp:123` | | Space delimited list of `protocol:port` pairs. An outbound connection through the Combine Firewall that matches one does not create an Alert Event. |
| `LambdaFirewallAlertsEventIgnorePortConnectionsEphemeral` | `true` | `true`, `false` | When `true`, an outbound connection to a destination port from 49152 to 65535 does not create an Alert Event. (This reduces Alert Events where HTTP/HTTPS responses pass through the Combine Firewall.) |
| `LambdaFirewallAlertsEventIgnoreServiceEndpointConnections` | `ssm` | | Space delimited list of AWS Service Endpoint prefixes. An outbound connection to the commercial endpoint of one of these Services does not create an Alert Event. |
| `BucketBlockPublicAccess` | `true` | `true`, `false` | Applies S3 Block Public Access to the Combine buckets. Set to `false` if your environment does not allow you to change Block Public Access settings. |
| `BucketLogging`, `BucketLoggingBucket`, `BucketLoggingBucketPrefix` | `false`, (blank), `logs/bucket/combine` | `BucketLogging`: `true`, `false` | Sends S3 server access logs for the Combine buckets to `BucketLoggingBucket` under `BucketLoggingBucketPrefix`. Logging is only turned on when `BucketLogging` is `true` and `BucketLoggingBucket` is set. |
| `BucketPolicyDefault` | `true` | `true`, `false` | Applies the default Combine Bucket Policy to each Combine bucket. Set to `false` if your environment has its own Bucket Policy requirements. |
| `InfrastructurePermissionBoundary` | (blank) | | ARN of an IAM Policy to set as the Permissions Boundary of the `Combine-Bastion`, `Combine-TAP`, and `Combine-Endpoints` Roles. |
| `AuxiliaryPolicyListTAP`, `AuxiliaryPolicyListEndpoint`, `AuxiliaryPolicyListBastion` | (blank) | | Comma delimited list of IAM Policy ARNs to attach to the `Combine-TAP`, `Combine-Endpoints`, or `Combine-Bastion` Role. |

The CAP / SCAP session duration Parameters are on the Combine Policy CloudFormation Stack (below).

### `combinePolicyStackParameters` (`combine-policy.yaml`)

The Combine Policy CloudFormation Stack creates the IAM Roles and Policies of the emulated partitions, including the default Roles such as `Combine-TS-WLDEVELOPER`. The tool creates it once, in the Master Region. The C2S, SC2S, and GovCloud releases share one template and the EUSC release has its own (see [EUSC Differences](#eusc-differences)). This table is for the C2S, SC2S, and GovCloud template:

| Parameter | Default | Allowed values | What it does |
| --- | --- | --- | --- |
| `AllowTerraFormExceptions` | `false` | `true`, `false` | Set to `true` to allow a set of AWS API actions that the emulated partition does not support but that HashiCorp TerraForm needs in order to run. |
| `EnforceLambdaVpcConfiguration` | `true` | `true`, `false` | Emulation Protection. Denies creating a Lambda Function, or updating its configuration, without a VPC configuration. |
| `EnforceVpcEndpointSecurityGroup` | `true` | `true`, `false` | Emulation Protection. Denies creating a VPC Endpoint for an AWS Service with a Security Group. |
| `EnforceInstanceTypesEC2`, `EnforceInstanceTypesRDS`, `EnforceInstanceTypesElastiCache` | `true` | `true`, `false` | Denies EC2, RDS, or ElastiCache instance types that the emulated Region does not support. (`EnforceInstanceTypesEMR` also exists, but no resource in the template uses it.) |
| `DefaultSigningRoleTS`, `DefaultSigningRoleS`, `DefaultSigningRoleGovCloud` | (blank) | | **Name** (not ARN) of an IAM Role to use as the Default Role for C2S, SC2S, or GovCloud requests instead of `WLDEVELOPER`. (See [Change the Default Role](how-to-change-default-role.md).) |
| `EnableCAP` | `true` | `true`, `false` | Turns the CAP / SCAP API on or off. The CAP API is only enabled when `EnableTS` is `true` and the SCAP API only when `EnableS` is `true`. |
| `CAPUserSessionDurationLimit` | `3600` | `900` to `28800` | Maximum duration, in seconds, that a CAP / SCAP token can be requested for. |
| `CAPUserSessionDurationDefault` | `3600` | `900` to `28800` | Default duration, in seconds, of a CAP / SCAP token. |
| `CAPUserSessionDashboardDurationDefault` | `3600` | `900` to `28800` | Default duration, in seconds, of a CAP / SCAP token issued from the TAP Dashboard. |
| `CombineOverlay` | `Lucy` | | Name of the IAM Overlay attached to the C2S and SC2S default Roles. Leave blank to attach none. (See [IAM Overlays](#iam-overlays-overlays).) |
| `CombineServiceAugment` | Set by the tool when `iamAugment` is set | | ARN of an additional IAM Policy attached to the read / write default Roles (`WLDEVELOPER` and `WLDEVELOPER-EC2` of each emulated partition). Used to add permissions, for example for additional emulated Services. (See [IAM Augment Policy](#iam-augment-policy-iamaugment).) |
| `CombineServiceAugmentReadOnly` | (blank) | | ARN of an additional IAM Policy attached to the read only default Roles (`Combine-TS-BUSREADONLY` and `Combine-TS-TECHREADONLY`). The tool does not create this policy. |
| `CombineEmulationProtectionAugment` | (blank) | | ARN of an additional IAM Policy attached to each `Combine-TS-*`, `Combine-S-*`, and `Combine-GovCloud-*` default Role. Used to enforce compliance requirements specific to your environment. |
| `CombinePermissionsBoundary` | (blank) | | ARN of an IAM Policy to set as the Permissions Boundary of each Role this stack creates. |

The tool sets the `Enable` Parameter of your emulated partition to `true` but does not turn the others off: `EnableTS` defaults to `true`, and `EnableS` and `EnableGovCloud` default to `false`.

#### EUSC Differences

The EUSC Combine Policy template:

- Has no `EnableTS`, `EnableS`, `EnableGovCloud`, `EnableCAP`, `CAPUserSession*`, or `EnableRoleHierarchyC2E*` Parameters. Its one Region mapping, `MappedRegionEuscDeEast1`, is set by the tool.
- Has one `DefaultSigningRole` Parameter (written to the `combine.endpoints.aws.authorization.defaultRole.aws_eusc` Configuration Value) in place of `DefaultSigningRoleTS`, `DefaultSigningRoleS`, and `DefaultSigningRoleGovCloud`.
- Defaults `CombineOverlay` to `CustomerA` (its built in overlays are `CustomerA` and `CustomerB`) and attaches it as `PolicyCombine<ShardId>EuscOverlay<CombineOverlay>`.
- Attaches `CombineServiceAugment` to `Combine-EUSC-Developer` and `Combine-EUSC-Developer-EC2`, and `CombineServiceAugmentReadOnly` to `Combine-EUSC-BusinessAnalyst`.
- Accepts `AllowTerraFormExceptions`, but no resource in the template uses it.

### `combineVPCStacks` (`combine-vpc.yaml`)

Each Combine VPC CloudFormation Stack creates one Combine VPC with its Combine Firewall, TAP Servers, and Endpoint Servers. The key of each entry is the stack name.

| Parameter | Default | Allowed values | What it does |
| --- | --- | --- | --- |
| `VpcName` | `Combine` | Up to 13 characters | Used to compose the names of the VPC's resources. Give each Combine VPC a different value. |
| `VpcCidrBlock` | `10.0.0.0/16` | | Primary CIDR Block of the VPC. |
| `VpcCidrBlockAuxiliaryA` through `VpcCidrBlockAuxiliaryD` | (blank) | | Additional CIDR Blocks. Combine associates them with the VPC when it builds the VPC, and adds them to the Combine Firewall configuration. |
| `VpcCidrBlockCombine` | `10.0.255.0/24` | `/24` or larger | CIDR Block from which the public and private Combine Subnets are created. |
| `VpcCidrBlockCombineFirewall` | `10.0.254.0/24` | `/24` or larger | CIDR Block from which the Combine Firewall Subnets are created. |
| `VpcCidrBlockCustomer` | `10.0.0.0/18` | | CIDR Block from which the Default Customer Subnets are created. |
| `VpcCustomerSubnetsBuild` | `true` | `true`, `false` | Builds the Default Customer private Subnets. (`VpcCustomerSubnetsBuildPublic`, default `false`, builds public ones.) |
| `TapExternalAccess` | `true` | `true`, `false` | Builds a public TAP Load Balancer (when the VPC has public access). |
| `TapExternalAccessSecurityGroupId` | (blank) | Comma separated `sg-` IDs | Security Groups added to the TAP Servers in place of the default rules, which allow TAP access from any IP address (`0.0.0.0/0`). Use it to limit who can reach the TAP Dashboard. |
| `TapInstanceType`, `EndpointsInstanceType` | (blank), which uses `t3.medium` and `m7i.large` | | Instance Type of the TAP Servers and of the Endpoint Servers. |
| `TapGroupMinSize` / `TapGroupMaxSize`, `EndpointsGroupMinSize` / `EndpointsGroupMaxSize` | `1` / `10` | `0` or more | Minimum and maximum size of the TAP and Endpoints Auto Scaling Groups. |
| `CostSavingsServerShutdown` | `false` | `true`, `false` | Turns on the scheduled stop and start of the TAP and Endpoint Servers below. |
| `CostSavingsServerShutdownStopRecurrence`, `CostSavingsServerShutdownStartRecurrence` | (blank) | Cron expression | When to stop the servers (scale both Auto Scaling Groups to 0) and when to start them again (restore the minimum and maximum sizes above). Leave either blank to skip it. The template sets no time zone, so the expressions run in UTC. Example: `0 22 * * *` stops at 22:00 daily and `0 8 * * 1-5` starts at 08:00 Monday to Friday. |
| `EnableAirgapAccessEKS` | `true` | `true`, `false` | Adds Combine Firewall exemption rules that let AWS EKS make commercial outbound calls. (See [Combine EKS Support](../../start-here/9-troubleshooting-eks/1-guidance.md).) |
| `EnableAirgapAccessSSM` | `true` | `true`, `false` | Adds Combine Firewall exemption rules that let the AWS SSM Agent make commercial outbound calls. (See [Configure the SSM Agent](../operations/how-to-configure-ssm-agent.md).) |
| `CombineFirewallOverrideRuleGroupBuild` | `true` | `true`, `false` | Builds the Combine Firewall Override Rule Group that an `Admin` manages from the TAP Dashboard. |
| `VpcEndpointEc2InstanceConnectBuild` | `true` | `true`, `false` | Builds an EC2 Instance Connect Endpoint, which allows SSH connections without SSH keys or external access. |

The defaults of `VpcCidrBlockCombine`, `VpcCidrBlockCombineFirewall`, and `VpcCidrBlockCustomer` sit inside the default `VpcCidrBlock`. If you change `VpcCidrBlock`, set each of them to a range inside `VpcCidrBlock` or an Auxiliary CIDR Block (or set `VpcCustomerSubnetsBuild` to `false`).

Related Parameters:

- To add your own Network Firewall Rule Group of exceptions to the Combine AirGap Layer, set `CombineFirewallPrivateAuxiliaryRuleGroup` to its ARN. (See [Configure AirGap Layer](../operations/firewall-airgap/how-to-configure-airgap-layer.md).)
- To deploy into an existing VPC instead of building one, see [VPC Wrapping](../../start-here/10-advanced-features/vpc-wrapping.md).
- `AttachedVpcsTransitGatewayId` and `AttachedVpcsTransitGatewayCidrBlockA` route traffic from a CIDR Block behind an AWS Transit Gateway into the Combine AirGap Layer for a multiple account topology. Contact the Combine Support Team before using them.
- To deploy Combine in another Region, see [Multi-Region Deployment](how-to-deploy-multiple-regions.md).

### Example

The following example is a C2S profile with Shard ID `Dev` that:

- Sets the Health Monitoring email.
- Turns on DynamoDB Deletion Protection.
- Allows the TerraForm exceptions.
- Raises the CAP / SCAP token limit and TAP Dashboard default to 8 hours.
- Moves the VPC to `10.172.0.0/16`.
- Limits TAP access to your own Security Group.
- Stops the servers overnight.

```json
{
  "myDevEnvironment": {
    "region": "us-east-1",
    "masterRegion": "us-east-1",
    "clientAccountId": "<account id>",
    "clientRoleArn": "arn:aws:iam::<account id>:role/Combine-Provisioning-Role",
    "shardId": "Dev",
    "hasUserManagementAccount": "false",
    "emulatedPartitionId": "AWS_C2S",
    "certificateName": "Development",
    "bucketEncryptionKey": "",
    "bucketSetBlockPublicAccess": "true",
    "terminationProtection": "true",
    "additionalStackTags": {
      "Project": "<project name>"
    },
    "combineStackParameters": {
      "HealthMonitoringEmail": "<your team email address>",
      "DeletionProtection": "true",
      "LogLevel": "INFO"
    },
    "combinePolicyStackParameters": {
      "AllowTerraFormExceptions": "true",
      "CAPUserSessionDurationLimit": "28800",
      "CAPUserSessionDashboardDurationDefault": "28800"
    },
    "combineVPCStacks": {
      "Combine-Dev-VPC": {
        "VpcCidrBlock": "10.172.0.0/16",
        "VpcCidrBlockCombine": "10.172.255.0/24",
        "VpcCidrBlockCombineFirewall": "10.172.254.0/24",
        "VpcCidrBlockCustomer": "10.172.0.0/18",
        "TapExternalAccessSecurityGroupId": "<security group id>",
        "CostSavingsServerShutdown": "true",
        "CostSavingsServerShutdownStopRecurrence": "0 23 * * *",
        "CostSavingsServerShutdownStartRecurrence": "0 11 * * 1-5"
      }
    },
    "configuration": []
  }
}
```

## IAM Overlays (`overlays`)

An IAM Overlay is an additional IAM Managed Policy that the Combine Policy CloudFormation Stack attaches to the C2S and SC2S default Roles, typically to deny actions that your environment does not allow. The template builds the overlays `Emmet`, `Lucy`, `MetalBeard`, and `LordBusiness` itself, and `CombineOverlay` selects which one is attached (`Lucy` by default). The `overlays` field lets the tool create your own.

Each entry has three fields:

- `name` - The overlay name. Set `CombineOverlay` to the same value. Do not reuse a built in overlay name, since the template creates those policies itself.
- `prefix` - `TS` for an overlay attached to the C2S default Roles, or `S` for the SC2S default Roles.
- `policy` - The IAM Policy document, as a JSON object (not a string). Its statements apply as written.

The tool creates an IAM Managed Policy named `<prefix>PolicyCombine<ShardId>Overlay<name>` for each entry (for example, `TSPolicyCombineDevOverlayCustom` with Shard ID `Dev`, or `TSPolicyCombineOverlayCustom` without one). If the policy already exists the tool adds a new default version to it, so the Roles pick up the change without a stack update. IAM limits a Managed Policy document to 6,144 characters and keeps at most five versions of a Managed Policy, so delete old versions if an update fails.

The tool does not attach the policy itself. The Combine Policy CloudFormation Stack attaches `<TS or S>PolicyCombine<ShardId>Overlay<CombineOverlay>` to these Roles:

- C2S: `Combine-TS-KEYMANAGER`, `Combine-TS-BUSREADONLY`, `Combine-TS-S3ONLY`, `Combine-TS-TECHREADONLY`, `Combine-TS-WLDEVELOPER`, and `Combine-TS-WLDEVELOPER-EC2`.
- SC2S: `Combine-S-KEYMANAGER`, `Combine-S-WLDEVELOPER`, and `Combine-S-WLDEVELOPER-EC2`.

(With a Shard ID the names are `Combine-<ShardId>-TS-...` and `Combine-<ShardId>-S-...`.) The GovCloud default Roles do not attach an overlay, and the EUSC template attaches `PolicyCombine<ShardId>EuscOverlay<CombineOverlay>`, a name this field cannot produce, so `overlays` applies to C2S and SC2S.

The tool creates the overlays:

- During `build`, in the Master Region, before it creates the Combine Policy CloudFormation Stack. If an overlay cannot be created the build continues and prints `Could not create IAM Overlay!`.
- With the `build_iam_overlays` command, which creates or updates every entry in `overlays` and then asks `What Combine Overlay would you like to configure?`. If you enter any value, it updates the Combine Policy CloudFormation Stack (keeping its other Parameter values) and sets `CombineOverlay` to `Custom`. It always uses `Custom`, not the value you type, so name your overlay `Custom` if you use this command. Leave the answer blank to only update the policies.

`upgrade` does not create or update overlays.

The following example creates a `Custom` overlay for the C2S default Roles. Its `combinePolicyStackParameters` entry selects the overlay during `build`:

```json
"combinePolicyStackParameters": {
  "CombineOverlay": "Custom"
},
"overlays": [
  {
    "name": "Custom",
    "prefix": "TS",
    "policy": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Deny",
          "Action": [
            "<service>:<Action>"
          ],
          "Resource": "*"
        }
      ]
    }
  }
]
```

## IAM Augment Policy (`iamAugment`)

`iamAugment` (`{"name": "<policy name>", "policy": {<policy document>}}`) creates an IAM Managed Policy that adds permissions to the read / write default Roles.

- During `build`, in the Master Region, the tool creates an IAM Managed Policy with exactly the name `name` (no prefix or Shard ID is added), or adds a new default version if it already exists. It then sets the policy's ARN as the `CombineServiceAugment` Parameter of the Combine Policy CloudFormation Stack. If the policy cannot be created the build continues and prints `Could not create IAM Augment Policy!`.
- The Combine Policy CloudFormation Stack attaches it to `Combine-TS-WLDEVELOPER`, `Combine-TS-WLDEVELOPER-EC2`, `Combine-S-WLDEVELOPER`, `Combine-S-WLDEVELOPER-EC2`, `Combine-GovCloud-WLDEVELOPER`, and `Combine-GovCloud-WLDEVELOPER-EC2` (in EUSC, `Combine-EUSC-Developer` and `Combine-EUSC-Developer-EC2`).
- A `CombineServiceAugment` entry in `combinePolicyStackParameters` replaces the value the tool sets.
- The `build_iam_augment_policy` command creates or updates the policy from `iamAugment` and then updates the Combine Policy CloudFormation Stack (keeping its other Parameter values) to set `CombineServiceAugment` to the policy's ARN. It does nothing if `iamAugment` is not set.

The following example shows the shape of the field:

```json
"iamAugment": {
  "name": "<policy name>",
  "policy": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "<service>:<Action>"
        ],
        "Resource": "*"
      }
    ]
  }
}
```

For the read only default Roles, set `CombineServiceAugmentReadOnly` to the ARN of a policy you create yourself.

## User Management Account

These fields build the Combine Deployment as a Follower of a Leader (User Management Account) Combine Deployment. See [Follower Mode](how-to-combine-deployment.md#follower-mode) for the full field reference and [Add Follower Account](how-to-add-follower-account.md) for the procedure.

- `hasUserManagementAccount` - `true` builds this Combine Deployment as a Follower. The fields below apply only when it is `true`.
- `userManagementAccountId` - AWS Account ID of the Leader. The tool passes it as the `UserManagementAccount` Parameter of the Combine and Combine Policy CloudFormation Stacks.
- `userManagementShardId` - Shard ID of the Leader. Blank if the Leader has none.
- `userManagementMasterRegion` - Master Region of the Leader.
- `leaderAccountRoleArn`, or `leaderAccountKey` / `leaderAccountKeySecret` / `leaderAccountSessionToken` - Credentials the tool uses while the build runs to reach the Leader Account.
- `followerConfigRole`, or `followerConfigKey` / `followerConfigKeySecret` - Credentials stored in the Follower Account's Secrets Manager that the Follower's TAP and Endpoint Servers use at runtime to reach the Leader Account.
- `tapMissionName` - Account Label of the TAP Role Mappings the build generates for this Follower. Required in Follower Mode. (A Combine Deployment that is not a Follower uses `CCustomer`.)

## Stack Tags and Termination Protection

- `additionalStackTags` is applied when the tool creates each stack, in addition to a `Name` tag set to the stack name. A `Name` key in `additionalStackTags` is ignored, and entries with a blank value are skipped.
- `terminationProtection` (default `true`) is set by the build commands on the Combine, Combine Policy, and every listed Combine VPC CloudFormation Stack, including a Combine VPC CloudFormation Stack that already exists. (See [Delete/Uninstall a Combine Deployment](how-to-delete-combine-deployment.md).)
