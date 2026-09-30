# Change the Default Role

When Combine receives a request, it determines which IAM Role to use to sign the emulated request. It checks, in order:

1. A session token previously issued through Combine.
2. User credentials issued through Combine.
3. The IAM Role attached to the EC2 Instance or Lambda Function that made the request.

If none of these match, Combine falls back to the Default Role for the emulated partition. By default this is the `WLDEVELOPER` Role that Combine creates in each Account (for example, `Combine-TS-WLDEVELOPER`).

This guide explains how to replace `WLDEVELOPER` with an IAM Role of your own, so that Combine uses your Role whenever it cannot otherwise determine credentials.

_NOTE: The Default Role is only a fallback. This change does not affect requests that carry Combine-issued credentials (including CAP / SCAP credentials) or that come from a recognized EC2 Instance or Lambda Function._

## Step 1: Create the IAM Role

Create an IAM Role with the permissions you want.

Combine assumes the Default Role **by name, in the source Account of each request**. This means:

- You must create the Role in every Combine-managed Account where requests may originate.
- The Role must have the same name in every Account.

## Step 2: Attach the Combine Policies

In addition to your own permissions, the Role must have the Combine Managed Policies that keep the emulation consistent. Attach the same Combine Managed Policies that are attached to the existing `WLDEVELOPER` Role for the partition:

- The Emulation Protection policy (for example, `PolicyCombineEmulationProtection`).
- The Overlay Base policies for the partition (for example, `TSPolicyCombineOverlayBase` and its per-Region variants such as `TSPolicyCombineOverlayBaseRegionE1`).

To get the exact list, open the `WLDEVELOPER` Role for the partition in the IAM Console and copy its attached Combine Managed Policies. Policy names include your Shard ID if your Combine Deployment has one.

## Step 3: Set the Trust Policy

Your Role's Trust Policy must allow the Combine service Roles (`Combine-Endpoints` and `Combine-TAP`) to call `sts:AssumeRole`. The default `WLDEVELOPER` Role allows this by trusting the Account's root principal.

At a minimum, the Role must trust the `Combine-Endpoints` (or `Combine-<ShardId>-Endpoints`) Role. The following example trusts both service Roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::<combine-account-id>:role/Combine-Endpoints",
          "arn:aws:iam::<combine-account-id>:role/Combine-TAP"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

If your Combine Deployment uses a User Management Account, Role assumptions are bridged through that Account, so the Role must also trust the User Management Account's root principal:

```json
"Principal": {
  "AWS": [
    "arn:aws:iam::<combine-account-id>:role/Combine-Endpoints",
    "arn:aws:iam::<user-management-account-id>:root"
  ]
}
```

(See [Cross Account Role Assumption Through the Leader](how-to-add-follower-account.md#cross-account-role-assumption-through-the-leader).)

## Step 4: Update the Combine Policy CloudFormation Stack

Update the `Combine-Policy` (or `Combine-<ShardId>-Policy`) CloudFormation Stack in each affected Account. For each emulated partition you want to override, set the Parameter to the **name** of your IAM Role (not the ARN):

| Parameter | Console Label | Emulated Partition | Configuration Value Written |
| --- | --- | --- | --- |
| `DefaultSigningRoleTS` | **Default Signing Role Override - TS** | C2S (`us-iso`) | `combine.endpoints.aws.authorization.defaultRole.aws_c2s` |
| `DefaultSigningRoleS` | **Default Signing Role Override - S** | SC2S (`us-isob`) | `combine.endpoints.aws.authorization.defaultRole.aws_sc2s` |
| `DefaultSigningRoleGovCloud` | **Default Signing Role Override - GovCloud** | GovCloud (`us-gov`) | `combine.endpoints.aws.authorization.defaultRole.aws_gov_cloud` |

Leave a Parameter blank to keep the default `WLDEVELOPER` Role for that partition.

The stack update writes the Configuration Values listed above. No server restart is required. (See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md) for how Combine Configuration works.)

For a new Combine Deployment, you can instead set these Parameters in `combinePolicyStackParameters` before you run `build`. (See [Reference - clients.json](reference-clients-json.md#combinepolicystackparameters-combine-policyyaml).)

## Step 5: Verify the Change

From a machine whose credentials Combine cannot otherwise determine (for example, an EC2 Instance with no IAM Role attached), run:

```bash
aws sts get-caller-identity
```

The returned ARN should reference your new Role. The Endpoint Server logs also record:

`Request Authorization: Authorized by Role [<your-role-name>] in AWS Account [<account-id>].`

Releases before Combine 3.14.6 record `Request Authorization: Authorized by default role [<your-role-name>] in account [<account-id>].` (See [View Combine Logs](../operations/how-to-view-combine-logs.md#endpoint-logs).)

For more information, contact the Combine Support Team.
