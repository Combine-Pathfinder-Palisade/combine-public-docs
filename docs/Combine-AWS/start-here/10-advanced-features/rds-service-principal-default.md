# RDS Service Principal Default

In the US Top Secret Partition (C2S), the RDS Service Principal has two forms: the legacy `rds.c2s.ic.gov` and the domain optional `rds.amazonaws.com`. Combine accepts both. When Combine has to choose a form itself, it returns `rds.c2s.ic.gov` by default. This page explains why, and how to opt in to `rds.amazonaws.com` as the default.

_NOTE: Some users have reported that AWS does not recognize `rds.amazonaws.com` in every context in the production environment. `rds.c2s.ic.gov` remains supported for the foreseeable future. Unless your workload needs `rds.amazonaws.com`, we recommend that you keep using `rds.c2s.ic.gov`._

## How It Works

When a request contains a Service Principal that has more than one form, Combine returns the form that you sent. For example, if you send `ec2.c2s.ic.gov` in an IAM Policy document, the response contains `ec2.c2s.ic.gov` even though that is not the default form.

Some responses contain a Service Principal that the request did not include. For example, `iam:GetRole` returns the Role's trust policy, but the request names only the Role. Combine cannot track which form you used in an earlier request (see [Consistent Use of Service Principals](../6-known-issues.md#consistent-use-of-service-principals) on the Known Issues page), so it returns a default form and uses that default consistently.

For a long time, `rds.c2s.ic.gov` was the only RDS Service Principal in the US Top Secret Partition, so it has always been the default. Changing the default to `rds.amazonaws.com` would break every existing workload that expects `rds.c2s.ic.gov`, for example one whose TerraForm state or IAM Policy documents record it. Combine therefore keeps `rds.c2s.ic.gov` as the default and lets you opt in to `rds.amazonaws.com`.

## When to Opt In

Opt in if your workload uses `rds.amazonaws.com` as the RDS Service Principal in its IAM Policies and IAM Role trust policies.

After you opt in, any response that does not repeat a Service Principal from the request contains `rds.amazonaws.com`. Client state that recorded `rds.c2s.ic.gov`, such as TerraForm state, no longer matches. Use one form consistently across your workload.

## Configuration

These Configuration Values control the default for each emulated Region. Each value is a space separated list of Service Principal names that default to the legacy domain (`c2s.ic.gov`) in that Region.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-east-1` | `rds` | Service Principals that default to the legacy domain in `us-iso-east-1`. |
| `combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-west-1` | `rds` | Service Principals that default to the legacy domain in `us-iso-west-1`. |

To opt in, set both Configuration Values to a blank (empty) value. Do not delete the entries. If an entry is missing from the Combine Configuration table, Combine falls back to the default of `rds`.

## Opt In: Existing Combine Deployment

After you upgrade to Combine 3.14.7 or later, run the `enable_rds_service_principal_with_optional_domain` Combine Command (see [Executing Commands](../../tutorials/operations-self-service-deployment/how-to-combine-deployment.md#executing-commands)):

```bash
java -classpath "deployment/lib/*:deployment/combine-aws-account-automation.jar" -Dcombine.configuration.partitions.localFile=deployment/release/configuration/cloud-partitions.json com.sequoia.combine.accounts.CombineCommandExecutor enable_rds_service_principal_with_optional_domain --config-store-profile <profile>
```

The command removes `rds` from both Configuration Values in the Combine Configuration table and keeps any other Service Principal names in them. For each emulated Region, the output shows `Writing Configuration Parameter [<name>] value [<new value>] (was [<old value>])`.

You can also set both Configuration Values to a blank value yourself. (See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md).)

## Opt In: New Combine Deployment

Add both Configuration Values, each with a blank value, to the `configuration` field of the Combine Deployment's `clients.json` profile:

```json
"configuration": [
  {
    "key": "combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-east-1",
    "value": ""
  },
  {
    "key": "combine.endpoints.aws.rewriteOperation.host.servicePrincipal.optionalDomains.override.us-iso-west-1",
    "value": ""
  }
]
```

`build` writes these entries to the Combine Configuration table. `upgrade`, `update`, and `update_configuration_only` write them again, so you stay opted in after later upgrades. These entries also work for an existing Combine Deployment: add them to its profile and run `update_configuration_only` instead of the Combine Command above.

## Opt Out

To restore the legacy default (`rds.c2s.ic.gov`), delete both entries from the Combine Configuration table, or set them back to `rds`. If you added the entries to `clients.json`, remove them there too. Otherwise, the next `upgrade` or `update` writes the blank values again.
