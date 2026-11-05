# Configuration Diff

### _Note that the Configuration Diff tool will be available in Combine in an early 3.15.X version. Please [reach out to the Combine Team](mailto:service-request@sequoiainc.com) for an upgrade if we haven't upgraded you already by the time you're reading this._

The **Configuration Diff** Tool (Config Diff) in the TAP Dashboard compares this Combine Deployment's Configuration Values against another Combine Deployment: another Shard or Region in the same AWS Account, or a Combine Deployment in a separate AWS Account. It shows the Combine Version of both Deployments side by side and hides expected differences (such as Account ID, Region, and Shard values) so that only a significant difference is left. You can save a named snapshot of a comparison to the App Storage bucket.

Only an Administrator can use the Tool, and it is disabled by default. To enable it, set this Configuration Value to `true` in the Combine Configuration table of the Combine Deployment you compare **from** (the source). (See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md).)

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.application.feature.tools.configurationDiff` | `false` | When `true`, the TAP Dashboard shows the Configuration Diff Tool under Tools. |

## How the Source Reads the Destination

The source reads the destination's Configuration Store (a DynamoDB table) by assuming the destination's `Combine-<Shard ID>-Read-Only` IAM Role. (If the destination has no Shard ID, the IAM Role is `Combine-Read-Only`.) The destination's IAM Role must trust the source before the Tool can use it. How that trust is set up depends on the topology:

| Destination | Trust setup |
|---|---|
| Same AWS Account as the source | Nothing to do. |
| A Follower Account in the same User Management / Follower topology as the source | Nothing to do. The Read-Only IAM Role already trusts the User Management Account, and the Tool falls back to assuming the IAM Role through it. (See [Add a Follower Account](../../tutorials/operations-self-service-deployment/how-to-add-follower-account.md).) |
| A Combine Deployment in any other AWS Account | Run the `trust_configuration_diff_source` Combine Command against the destination, as described below. |

The rest of this page covers the last case, for a destination that is already deployed.

## Prerequisites

- You can run the Combine automation tool and have a `clients.json` profile for the destination. (See [Combine Deployment Process](../../tutorials/operations-self-service-deployment/how-to-combine-deployment.md).)
- The destination runs a Combine Release that includes the Config Diff Tool. Its Combine Policy Stack must have the `ConfigurationDiffPrincipalList` Parameter. If it does not, the command stops with an error. Upgrade the destination first, then run the command again.
- The destination's Combine Policy Stack was deployed to a Master Region profile. The Read-Only IAM Role only exists in the Master Region, so the command refuses to run with the profile of any other Region.
- You know the source's AWS Account ID, and its Shard ID if it has one.

## Find the Source Principal

The command trusts the source's **TAP IAM Role**, which is named `Combine-<Shard ID>-TAP` (or `Combine-TAP` when the source has no Shard ID). Confirm the exact name in the IAM Console of the source Account.

> **Match the case exactly.** IAM rejects a trust policy whose Principal ARN does not match the real IAM Role ARN, including case. `Combine-cDiff-TAP` and `Combine-CDiff-TAP` are different IAM Roles. IAM fails the Stack update with `Invalid principal in policy`. (A Shard ID keeps the case it was created with in IAM Role names.)

## Run the Command

The command takes either the source's Account ID and Shard ID (it builds the TAP IAM Role ARN for you) or a full Principal ARN. Add the values to the destination's `clients.json` profile, or leave them out and the tool prompts for each one:

| `clients.json` field | Prompt | Description |
|---|---|---|
| `sourceAccountId` | Enter Source AWS Account ID | The source's AWS Account ID. Required unless you give `sourcePrincipalArn`. |
| `sourceShardId` | Enter Source Shard ID (optional) | The source's Shard ID, with its exact case. Leave blank if the source has none. |
| `sourcePrincipalArn` | Enter Source Principal ARN (optional) | The ARN of the IAM Role or IAM User to trust. Use this to trust something other than the source's TAP IAM Role. When set, the Account ID and Shard ID are not used. |

Run the Combine Command with the destination's profile (see [Executing Commands](../../tutorials/operations-self-service-deployment/how-to-combine-deployment.md#executing-commands)):

```bash
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor trust_configuration_diff_source --config-store-profile <destination-profile>
```

The command:

1. Checks that the Principal is an IAM Role or IAM User ARN in the destination's Partition. A malformed ARN, or one from another Partition, is refused before any Stack is touched.
2. Reads the `ConfigurationDiffPrincipalList` Parameter of the destination's Combine Policy Stack and adds the Principal to it. It keeps the Principals already there and every other Parameter as it is.
3. Updates the Combine Policy Stack with its existing template and waits for `UPDATE_COMPLETE`. The Stack then adds the Principal to the trust policy of the `Combine-<Shard ID>-Read-Only` IAM Role.

The output ends with:

```text
Completed trust of Principal [arn:aws:iam::111111111111:role/Combine-myShard-TAP].
```

Running the command again for a Principal that is already trusted prints `is already trusted` and changes nothing. To allow more than one source, run the command once for each.

## Use the Tool

1. In the **source** Combine Deployment, enable the Tool (see the Configuration Value above) and sign in to the TAP Dashboard as an Administrator.
2. Open **Tools > Configuration Diff**.
3. Under **Or compare against another AWS account**, enter the destination's AWS Account ID. Enter its Shard ID too, with its exact case, if it has one. Choose **Connect & Compare**.
4. If the destination has more than one Configuration Store, choose which one to compare.

After a successful comparison, the destination is saved and appears in the **Compare against** list as a separate account. Choose **Forget account** to remove it. The sections below cover [Must Match Rules](#must-match-rules), [Snapshots](#snapshots), and [exporting a diff](#export-a-diff-as-clientsjson).

## Must Match Rules

A **Must Match rule** names a Configuration Value that should be identical in both Deployments. After each comparison the Tool shows a verdict next to the summary:

| Verdict | Meaning |
|---|---|
| **No differences to review** | Nothing significant separates the two Deployments. |
| **Differences to review** | Some values differ, or are set on only one side, but no Must Match rule matches any of them. |
| **N parameter(s) break a Must Match rule** | At least one value that a rule matches differs, or is set on only one side. The Tool lists the parameters. |

Only significant differences count. A difference that is just an Account ID, Region, or Shard ID is hidden as expected and never breaks a rule.

To edit the rules, choose the **rule** button in the verdict banner. Enter one rule per line. A rule is a Configuration Value name, and `*` matches any run of characters:

```text
combine.partitions.active
combine.tap.application.feature.*
```

The default is a single rule, `combine.partitions.active`. Keep rules narrow. A broad rule such as `combine.endpoints.aws.filter.*` matches hundreds of values that legitimately differ between Deployments and leaves the verdict blocked. The banner shows how many of your rules matched, since one broad rule can raise many findings.

Select **Only Must Match rules** in the toolbar to show only the parameters a rule matches. Each of those rows carries a **must match** tag.

The rules are stored in your browser (local storage), not in the Combine Deployment. They apply only to that browser and are not shared with other Administrators. Clearing the site data resets them to the default.

## Snapshots

A **Snapshot** saves the result of a comparison so that you can compare against it later, for example to confirm that a difference you fixed stays fixed, or to see what changed since an upgrade.

1. Run a comparison.
2. Under **Snapshot**, enter a label (for example, `Before 3.16 upgrade`) and choose **Capture**. If you leave the label blank, the Tool uses `<this Deployment> vs <compared Deployment>`.
3. Later, run a comparison again and pick the Snapshot in **Compare to snapshot**.

The Tool then shows what changed since the Snapshot was captured. Only significant differences are compared:

| Count | Meaning |
|---|---|
| **appeared** | A parameter that was not a significant difference in the Snapshot and is one now. Each is listed as `new`. |
| **resolved** | A parameter that was a significant difference in the Snapshot and no longer is. |
| **changed** | A parameter that is a difference in both, but whose value on either side is different now. |
| **unchanged** | A parameter that is the same difference in both. |

Use the delete button next to the picker to delete the selected Snapshot.

Snapshots are stored in the source Deployment's App Storage bucket under `config-diff/snapshots/`, so every Administrator of that Deployment sees the same Snapshots. A Snapshot holds both Deployments' values, so it can include any Configuration Value in the store. Keep that in mind if the store holds sensitive values.

A Deployment keeps up to 25 Snapshots. When you capture a new one past that limit, the Tool deletes the oldest.

## Export a Diff as clients.json

The Tool can turn a comparison into a `configuration` block for a `clients.json` profile. This is the quickest way to bring one Deployment's Configuration Values in line with the other's, and it keeps the change declarative, so the values survive the next `build`, `upgrade`, or `update`.

1. Run a comparison.
2. In **Export**, pick a **Direction**:

   | Direction | Block contains | Use it to |
   |---|---|---|
   | **Adopt `<compared Deployment>` values here** | The compared Deployment's values | Change this Deployment to match the other. Put the block in this Deployment's profile. |
   | **Apply `<this Deployment>` values there** | This Deployment's values | Change the other Deployment to match this one. Put the block in the other Deployment's profile. |

3. Choose **Copy clients.json block** or download it with **clients.json** (the file is named `clients-configuration-<deployment>.json`). Both give the same content:

   ```json
   {
     "configuration": [
       {
         "key": "combine.tap.application.feature.tools.configurationDiff",
         "value": "true"
       }
     ]
   }
   ```

4. Copy the `configuration` array into the `configuration` field of the target Deployment's `clients.json` profile. (See [reference-clients-json](../../tutorials/operations-self-service-deployment/reference-clients-json.md).)
5. Apply it with the `update_configuration_only` Combine Command, run with that profile (see [Executing Commands](../../tutorials/operations-self-service-deployment/how-to-combine-deployment.md#executing-commands)):

   ```bash
   java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor update_configuration_only --config-store-profile <profile>
   ```

What the block contains:

- Every parameter that differs, plus every parameter that only the Deployment you are copying from sets. Entries are sorted by name.
- **Review it before you apply it.** It follows the **Hide expected differences** checkbox. With the box checked (the default), differences that are only an Account ID, Region, or Shard ID are left out, so you do not copy values that belong to the other Deployment. If you clear the box, they are included. A parameter set on only one side is always included, whether or not it is expected.
- A parameter that only the Deployment you are changing sets is **left out**. `clients.json` can assert a value but cannot remove one, so the Tool shows how many it omitted. Delete those yourself, for example on the Metadata page of the TAP Dashboard.
- A value that is blank on the source side is exported as an empty string.

## Troubleshooting

| Message | Cause |
|---|---|
| `Could not assume the Combine Read-only Role in the destination account! ...` | The destination's Read-Only IAM Role does not trust the source, or does not exist. Re-run the command against the destination, check the Account ID and the exact Shard ID case, and confirm the destination is deployed with a Release that includes the Tool. |
| `Invalid principal in policy` (from CloudFormation while running the command) | The Principal ARN does not match a real IAM Role, usually because of case. See [Find the Source Principal](#find-the-source-principal). |
| `Stack [...] has no [ConfigurationDiffPrincipalList] Parameter!` | The destination's Combine Policy Stack was deployed from an older Release. Upgrade it, then run the command again. |
| `The Read-Only Role is only in the Master Region` | You ran the command with a profile for a Region that is not the Master Region. Use the Master Region's profile. |
| `Could not list the Configuration Stores in the destination account.` | The Read-Only IAM Role was assumed, but the Tool could not list the destination's Configuration Stores. See the source's TAP log for the cause. |

The Tool never shows an ARN or Account ID from an AWS error in the TAP Dashboard. The full error is in the source's TAP log.

## Remove the Trust

Remove the source's ARN from the `ConfigurationDiffPrincipalList` Parameter of the destination's Combine Policy Stack, using **Update stack > Use existing template** in the CloudFormation Console. If you also set the Parameter in `combinePolicyStackParameters` in the destination's `clients.json` profile, remove it there too.
