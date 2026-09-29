# Multi-Region Deployment

A Combine Deployment can run in more than one host Region of the same AWS Account. One Region, the Master Region, holds the resources that the whole Combine Deployment shares. Each additional Region runs its own Combine VPCs, with their own TAP and Endpoint Servers, and uses the shared resources in the Master Region.

This guide is only for customers who have access to the Combine automation tool and are performing their own build and deployment operations. It builds on [Combine Deployment Process](how-to-combine-deployment.md), which covers the base procedure, the `clients.json` file, and how to execute commands. See [Reference - clients.json](reference-clients-json.md) for every `clients.json` field.

## Concepts

### Master Region and Additional Regions

The `masterRegion` field of a `clients.json` profile names the Master Region. The `region` field names the Region that a command acts on. The build and upgrade commands perform their Master Region steps only when `region` equals `masterRegion`, and skip them otherwise. (`destroy` does not make this distinction. See [Deleting a Multi-Region Deployment](#deleting-a-multi-region-deployment).)

Created only in the Master Region:

- The Combine DevOps bucket, `combine-devops-<account id>-<Master Region>` (`combine-<shard id>-devops-<account id>-<Master Region>` if you set a Shard ID). It holds each uploaded release, the Certificate Authority chain, and the TAP and Endpoint Server certificates.
- The Combine DynamoDB Tables, including the Configuration table (`combine-configuration`, or `combine-<shard id>-configuration`) and the Users, User Groups, and TAP Role Mapping (`combine-aws-roles`) Tables.
- The App Storage buckets.
- The Combine Secrets in AWS Secrets Manager (`combine/...`), including the Certificate Authority passwords.
- The IAM Roles and Instance Profiles used by the TAP and Endpoint Servers and by the Combine Lambda Functions. IAM is global, so the additional Regions use them too.
- The Combine Policy CloudFormation Stack.
- The Alerts Event Stream SNS Topic.
- The Certificate Authority chain, the default TAP Role Mappings, and the Admin User. Only `build` creates these.

Created in every Region:

- The Combine CloudFormation Stack (`Combine`, or `Combine-<ShardId>`, with the same name in each Region). In an additional Region it creates only Regional resources, such as the Lambda Functions that configure the Combine Firewall, the TAP, Endpoints, and Firewall CloudWatch Log Groups, the Health Monitor SNS Topic and its CloudWatch Alarms, and the Lambda Function that sends Combine Firewall Alert Events to the Alerts Event Stream Topic in the Master Region.
- The Combine VPC CloudFormation Stacks listed in `combineVPCStacks` of that Region's profile. Each one creates a Combine VPC with its own TAP and Endpoint Servers, Combine Firewall, Load Balancers, and Private Hosted Zones.

### How an Additional Region Uses the Master Region

The tool passes the Master Region to the Combine and Combine VPC CloudFormation Stacks as their `MasterRegion` parameter. The TAP and Endpoint Servers in every Region:

- Download their bootstrap script, the release artifacts (`releases/<BricksReleaseVersion>/`), and their server certificates from the Combine DevOps bucket in the Master Region.
- Start with the Master Region and the Configuration table name as system properties, and read the Configuration Values, the other Combine DynamoDB Tables, and the Combine Secrets in the Master Region.

Every Region therefore shares one set of Configuration Values, one user base, one set of TAP Role Mappings, and one Certificate Authority chain.

### `region`, `masterRegion`, and `regionProvisioning`

- `build` is meant for the Master Region. Run it with a profile whose `region` equals `masterRegion`. The tool does not check this. If the two differ, `build` still uploads the release but skips the Certificate Authority, the Combine Policy CloudFormation Stack, the TAP Role Mappings, and the Admin User.
- `build_region` is meant for an additional Region. Run it with a profile whose `region` differs from `masterRegion`. If the two are equal, it performs the Master Region steps of `build` (the Combine Policy CloudFormation Stack, the TAP Role Mappings, and the Admin User) without uploading the release or building the Certificate Authority chain.
- `regionProvisioning` names the Region in which the Combine Provisioning CloudFormation Stack is deployed, and defaults to `region`. The Combine Provisioning Role is an IAM Role, so the same `clientRoleArn` works in every Region. `build` and `build_region` update the Combine Provisioning CloudFormation Stack if they find it in `regionProvisioning` (otherwise they print `Could not find Combine Provisioning Stack!` and continue). `upgrade` updates it only when run in the Master Region. In an additional Region's profile you can set `regionProvisioning` to the Region that holds the stack or leave it out.

## Emulated Region Mapping

The Endpoint Server forwards each API call to the host Region mapped to the emulated Region named in the call's endpoint. Each mapping is a Configuration Value (`combine.endpoints.aws.emulation.regionMapping.<partition id in lower case>.<emulated Region>`) that the Combine Policy CloudFormation Stack writes from one of these parameters:

| `emulatedPartitionId` | Emulated Region | Combine Policy Stack Parameter | Value Set by `build` |
| --- | --- | --- | --- |
| `AWS_C2S` | `us-iso-east-1` | `MappedRegionUsIsoEast1` | The Master Region |
| `AWS_C2S` | `us-iso-west-1` | `MappedRegionUsIsoWest1` | Blank (not mapped) |
| `AWS_SC2S` | `us-isob-east-1` | `MappedRegionUsIsoBEast1` | The Master Region |
| `AWS_SC2S` | `us-isob-west-1` | `MappedRegionUsIsoBWest1` | Blank (not mapped) |
| `AWS_GOV_CLOUD` | `us-gov-west-1` | `MappedRegionUsGovCloudWest1` | The Master Region |
| `AWS_GOV_CLOUD` | `us-gov-east-1` | `MappedRegionUsGovCloudEast1` | Blank (not mapped) |
| `AWS_EUSC` | `eusc-de-east-1` | `MappedRegionEuscDeEast1` | The Master Region |

EUSC emulates a single Region.

While an emulated Region is not mapped:

- The Endpoint Server logs `Region [<emulated Region>] is not mapped to a host region! Ignoring this emulated region...` and rejects API calls to that Region's endpoints with HTTP 400 `EmulationError` (`Combine rejected this AWS API call because it used an invalid AWS API Endpoint [<host>].`).
- The Emulation Protection IAM Policy (`PolicyCombineEmulationProtection`, or `PolicyCombine<ShardId>EmulationProtection`) attached to the Combine default Roles denies requests to any host Region that is not mapped, except for a short list of actions such as IAM actions.

To map the second emulated Region, set its parameter in `combinePolicyStackParameters` before you run `build` (for example `"MappedRegionUsIsoWest1": "us-west-2"`). `clients.json` parameters are only applied when `build` creates the stack, so for an existing Combine Deployment change the parameter on the Combine Policy CloudFormation Stack in the Master Region via the AWS Console instead. (`upgrade` keeps the current value.) The Endpoint Server loads the mappings once and keeps them until it restarts, so afterwards run `instance_refresh` with the profile of each Region.

A host Region can be mapped to only one emulated Region. If two emulated Regions are mapped to the same host Region, the Endpoint Server fails with `Host Region [<host Region>] is already mapped to emulated region [<emulated Region>]!`.

### Mapping and Deployment Are Independent

Mapping the second emulated Region does not require a Combine Deployment in its host Region. The Private Hosted Zone of each Combine VPC resolves the endpoint names of every emulated Region of the partition (for C2S, `*.us-iso-east-1.c2s.ic.gov` and `*.us-iso-west-1.c2s.ic.gov`) to that VPC's own Endpoint Server, and the Endpoint Server forwards each call to the mapped host Region wherever the Endpoint Server itself runs. A Combine Deployment in one Region therefore emulates both Regions once both are mapped. (For `AWS_GOV_CLOUD` the Combine VPC CloudFormation Stack does not create the endpoint Private Hosted Zone.)

Deploying an additional Region does not map anything either. Its Endpoint Servers forward calls to the same mapped host Regions as the Master Region's Endpoint Servers. Deploy an additional Region when you need a Combine VPC, with its TAP and Endpoint Servers, Combine Firewall, and Private Hosted Zones, inside another host Region. If workloads should create resources in that host Region, also map an emulated Region to it.

## Deploying an Additional Region

### Prepare a Profile for Each Region

Each Region needs its own profile in `clients.json`, because `region` and `combineVPCStacks` differ between Regions and the build commands read `combineVPCStacks` only from `clients.json`.

Keep these fields identical in every profile of the Combine Deployment:

- `clientAccountId`
- `masterRegion`
- `shardId`
- `emulatedPartitionId`
- `hasUserManagementAccount`, and for a Follower its User Management Account fields. (See [Add Follower Account](how-to-add-follower-account.md).)

Set these fields for each Region:

- `region` - The Region the profile builds.
- `combineVPCStacks` - Only the Combine VPC CloudFormation Stacks in that Region.
- `regionProvisioning` - Optional. (See above.)
- `configuration` - Every profile writes its list to the one Configuration table in the Master Region. Keep the list in the Master Region's profile and use `[]` in the others, or keep the lists identical.

`build_region` also requires `certificateName` and `combineStackParameters`, as the other build commands do.

Example of a Master Region profile (`myDevEnvironment`) and an additional Region profile (`myDevEnvironmentWest`) for a C2S Combine Deployment that maps `us-iso-west-1` to `us-west-2`:

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
    "combineStackParameters": {},
    "combinePolicyStackParameters": {
      "MappedRegionUsIsoWest1": "us-west-2"
    },
    "combineVPCStacks": {
      "Combine-Dev-VPC": {}
    },
    "configuration": []
  },
  "myDevEnvironmentWest": {
    "region": "us-west-2",
    "masterRegion": "us-east-1",
    "regionProvisioning": "us-east-1",
    "clientAccountId": "<account id>",
    "clientRoleArn": "arn:aws:iam::<account id>:role/Combine-Provisioning-Role",
    "shardId": "Dev",
    "hasUserManagementAccount": "false",
    "emulatedPartitionId": "AWS_C2S",
    "certificateName": "Development",
    "bucketEncryptionKey": "",
    "bucketSetBlockPublicAccess": "true",
    "combineStackParameters": {},
    "combinePolicyStackParameters": {},
    "combineVPCStacks": {
      "Combine-Dev-VPC-West": {
        "VpcName": "CombineWest"
      }
    },
    "configuration": []
  }
}
```

### Build the Master Region

Build the Master Region first with `build` and the Master Region's profile, as described in [Combine Deployment Process](how-to-combine-deployment.md). This uploads the release and creates every shared resource.

### Build Each Additional Region

Then run `build_region` with the profile of each additional Region:

```
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor build_region --config-store-profile <additional region profile> --bricks-release-version bricks_v_x_x_x
```

Use the same `--bricks-release-version` value as the Master Region. `build_region` does not upload the release. It creates the stacks from the templates of that release in the Combine DevOps bucket, and the servers load that release from the same bucket.

The `build_region` command will:

- Check Service Quotas in `region`.
- Update the Combine Provisioning CloudFormation Stack if it finds it in `regionProvisioning`.
- Create the Combine CloudFormation Stack in `region`.
- Create each Combine VPC CloudFormation Stack listed in `combineVPCStacks` in `region`.
- Write the `configuration` Configuration Values to the Configuration table in the Master Region.

It does not build a Certificate Authority chain, create the Combine Policy CloudFormation Stack, create TAP Role Mappings, or create an Admin User. As with `build`, a failure while creating a Combine VPC CloudFormation Stack does not stop the command. Check the output for `Could not build VPC Stacks!`.

To add a Combine VPC to an additional Region later, add it to that Region's `combineVPCStacks` and run `build_vpc_only` with that Region's profile. It creates each listed stack that does not already exist in `region`.

### DNS and Certificates

- Each Combine VPC CloudFormation Stack creates its own Private Hosted Zones (`combine.io` and, where the emulated partition defines them, the emulated TAP domain and endpoint domain), associates them only with its own VPC in its own Region, and points their TAP and endpoint records at its own internal Load Balancers.
- If you deploy `combine-vpc-dns.yaml` in a customer managed VPC, deploy it in that VPC's Region. It associates its Private Hosted Zones with the VPC in the Region of the stack.
- `build` creates the TAP and Endpoint Server certificates in the Master Region. Besides the emulated partition's DNS names (and `tapDnsNameOverrideInternal` / `tapDnsNameOverrideExternal` if set), they only include the Load Balancer DNS names of the Master Region (`*.elb.<Master Region>.amazonaws.com`). The servers in an additional Region use the same certificates, so a client that connects to an additional Region's Load Balancer by its AWS DNS name gets a certificate that does not match that name.

### Service Quotas

`build_region` runs the same Service Quota check as `build`, in `region`. It stops unless at least two Elastic IP Addresses (`L-0263D0A3`), two NAT Gateways (`L-FE5A380F`), and two Network Firewalls (`L-DE163D32`) are still available in that Region. Request any increase in each additional Region before you run `build_region`.

## Upgrading and Refreshing a Multi-Region Deployment

| Command | Run It With |
| --- | --- |
| `upgrade` | The Master Region's profile first, then the profile of each additional Region. |
| `update` | Any one profile of the Combine Deployment. |
| `update_configuration_only` | Any one profile of the Combine Deployment. |
| `instance_refresh` / `instance_refresh_with_wait` | The profile of each Region. |
| `build_vpc_only` | The profile of the Region that gets the new Combine VPC. |

- `upgrade` acts on `region`. It updates that Region's Combine CloudFormation Stack and each Combine VPC CloudFormation Stack listed in the profile, writes the `configuration` Configuration Values, and refreshes the TAP and Endpoints Auto Scaling Groups in that Region. It updates the Combine Provisioning and Combine Policy CloudFormation Stacks only in the Master Region. (In an additional Region it prints `Skipping Master Region resources...`.) Each run uploads the release to the Combine DevOps bucket.
- Upgrade the Master Region first, because the Lambda Functions of an additional Region's Combine CloudFormation Stack run under IAM Roles that the Master Region's Combine CloudFormation Stack creates.
- Until you upgrade an additional Region, its servers keep loading the previous release, since its Combine VPC CloudFormation Stacks keep their `BricksReleaseVersion` parameter.
- `update` and `update_configuration_only` only write to the Combine DevOps bucket and the Configuration table, which every Region shares. `update` does not refresh any server, so follow it with `instance_refresh` for each Region.
- `instance_refresh` refreshes only the TAP and Endpoints Auto Scaling Groups of the Shard in `region`.

## Deleting a Multi-Region Deployment

Delete each additional Region first and the Master Region last. An additional Region depends on the Master Region: its servers use the Master Region's Instance Profiles, Combine DevOps bucket, and Combine DynamoDB Tables, and deleting its Combine VPC CloudFormation Stack invokes Lambda Functions that run under an IAM Role owned by the Master Region's Combine CloudFormation Stack.

In Combine 3.14.7 and later, run `destroy` with the additional Region's profile. It deletes that Region's Combine VPC CloudFormation Stacks and its Combine CloudFormation Stack, prints `Skipping Master Region resources...`, and leaves the Combine Policy CloudFormation Stack, the App Storage buckets, and the Combine DevOps bucket in place for the Master Region.

In releases before 3.14.7, do not run `destroy` with an additional Region's profile. Those releases do not check for the Master Region: besides deleting that Region's stacks, `destroy` empties the App Storage buckets and empties and deletes the Combine DevOps bucket, which the Master Region still uses. Instead, switch the AWS Console to the additional Region and:

- Delete each Combine VPC CloudFormation Stack in that Region, following [Delete/Uninstall a Combine Deployment](how-to-delete-combine-deployment.md). (Disable Termination Protection first if it is enabled.)
- Delete that Region's Combine CloudFormation Stack (`Combine`, or `Combine-<ShardId>`).

After every additional Region is deleted, delete the Master Region with `destroy` and the Master Region's profile, or manually as described in [Delete/Uninstall a Combine Deployment](how-to-delete-combine-deployment.md).

## Pitfalls

- **`shardId` differs between profiles.** The Combine DevOps bucket name, the Configuration table name, the Instance Profile names (`Combine-<ShardId>-TAP` and `Combine-<ShardId>-Endpoints`), and the IAM Role names used by the additional Region's Lambda Functions are all derived from the Shard ID. An additional Region built with a different Shard ID does not find the Master Region's resources.
- **`masterRegion` is wrong in an additional Region's profile.** The stacks pass it to the servers as the location of the Combine DevOps bucket and the Configuration table. If it equals `region`, the command builds that Region as a second Master Region.
- **`emulatedPartitionId` differs between profiles.** The DNS parameters of each Combine VPC CloudFormation Stack (the TAP domain, the endpoint domain, and the emulated Region names) are derived from it.
- **A profile lists a Combine VPC CloudFormation Stack from another Region.** `upgrade` reads each listed stack in `region` and fails when the stack is not there. List only the stacks in the profile's own Region.
- **Two Combine VPCs in the same Region share a `VpcName`.** `VpcName` (maximum 13 characters) names the Combine VPC's Regional resources, so it must differ between Combine VPCs in the same Region.
- **Two emulated Regions are mapped to the same host Region.** The Endpoint Server fails. (See [Emulated Region Mapping](#emulated-region-mapping).)
- **`build_region` runs before the release is uploaded.** Run `build` (or `upgrade` / `update` for a newer release) with the Master Region's profile first, and pass the same `--bricks-release-version`.
