# Change the Default Role

### Overview

When Combine receives a request, it derives which IAM Role should be used to sign the emulated request. It checks, in order:

1. A session token previously issued through Combine.
2. User credentials issued through Combine.
3. The IAM Role attached to the EC2 instance or Lambda function that made the request.

If none of these match, Combine falls back to the **Default Role** for the emulated partition. Out of the box this is the `WLDEVELOPER` role that Combine creates in each account (for example, `Combine-TS-WLDEVELOPER`).

This guide explains how to replace `WLDEVELOPER` with an IAM Role of your own, so that Combine defaults to your role whenever it cannot otherwise infer credentials.

> _NOTE: The Default Role is only used as a fallback. Requests that carry Combine-issued credentials (including CAP / SCAP credentials) or that originate from a recognized EC2 instance or Lambda function are not affected by this change._

### Step 1: Create the IAM Role

Create an IAM Role with your preferred permissions.

Combine assumes the Default Role **by name, in the source account of each request**. This means:

- You must create the role in every Combine-managed account where requests may originate.
- The role must have the same name in every account.

### Step 2: Attach the Combine Policies

In addition to your own permissions, the role must carry the Combine-managed policies that keep the emulation consistent. Attach the same Combine policies that are attached to the existing `WLDEVELOPER` role for the partition:

- The **Emulation Protection** policy (for example, `PolicyCombineEmulationProtection`).
- The **Overlay Base** policies for the partition (for example, `TSPolicyCombineOverlayBase` and its per-region variants such as `TSPolicyCombineOverlayBaseRegionE1`).

The easiest way to get the exact list is to open the `WLDEVELOPER` role for the partition in the IAM console and copy its attached Combine policies. (Policy names include your Shard ID if your deployment has one)

### Step 3: Set the Trust Policy
Your role's trust policy must let Combine's service roles call `sts:AssumeRole`, the same way the Default Role trusts `Combine-Endpoints` and `Combine-TAP`.

At a minimum, the role must trust the `Combine-Endpoints`/`Combine-<shard-id>-Endpoints` role:

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

> _NOTE_: If your deployment uses a User Management Account, role assumptions are bridged through that account, so its account principal must be trusted as well:
>
> ```json
> "Principal": {
>   "AWS": [
>     "arn:aws:iam::<combine-account-id>:role/Combine-Endpoints",
>     "arn:aws:iam::<user-management-account-id>:root"
>   ]
> }
> ```

### Step 4: Update the Combine-Policy CloudFormation Stack

Update the `Combine-Policy` CloudFormation Stack in each affected account and set the **name** of your IAM Role (not the ARN) in the parameter for each partition you want to override:

| Parameter | Emulated Partition | Configuration Value Written |
| --- | --- | --- |
| `Default Signing Role Override - TS` | C2S (`us-iso`) | `combine.endpoints.aws.authorization.defaultRole.aws_c2s` |
| `Default Signing Role Override - S` | SC2S (`us-isob`) | `combine.endpoints.aws.authorization.defaultRole.aws_sc2s` |
| `Default Signing Role Override - GovCloud` | GovCloud (`us-gov`) | `combine.endpoints.aws.authorization.defaultRole.aws_gov_cloud` |

Leaving a parameter blank keeps the default `WLDEVELOPER` role for that partition.

The stack update writes the Configuration Values listed above. No server restart is required. (See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md) for details on how Combine Configuration works.)

### Verify the Change

From a machine whose credentials Combine cannot otherwise derive (for example, an EC2 instance with no instance role), run:

```
aws sts get-caller-identity
```

The returned ARN should reference your new role. You can also confirm in the Endpoint Server logs, which will record:

`Request Authorization: Authorized by default role [<your-role-name>] in account [<account-id>].`

Please contact your Combine Support Team for additional information!
