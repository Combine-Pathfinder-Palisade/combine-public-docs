# Configure the SSM Agent

## Overview

The AWS Systems Manager (SSM) Agent is enabled by default on many AMIs. Out of the box the agent
discovers its Region from the EC2 Instance Metadata Service (IMDS) and then talks to the **commercial**
Systems Manager endpoints for that Region (for example `ssm.us-east-1.amazonaws.com`).

Inside Combine this does not work. The EC2 instance is physically hosted in a commercial Region, so
its IMDS reports that commercial Region — but Combine only emulates the reserved Region (for example
`us-iso-east-1`). An unconfigured agent will therefore:

- send traffic to commercial endpoints, bypassing the emulation. (By default the Combine AirGap Layer exempts this traffic through the `EnableAirgapAccessSSM` parameter of the `combine-vpc.yaml` template, so it is not blocked; see [Known Issues](../../start-here/6-known-issues.md). If that exemption is disabled, the Combine Firewall blocks this traffic.) and
- sign its requests for the commercial Region, which Combine rejects with a *signature region mismatch*
  (`AuthFailure` / `SignatureDoesNotMatch`, "Credential should be scoped to a valid region").

To make the agent work inside Combine you must change three things:

1. **Region** — force the agent to use the emulated Region (`us-iso-east-1`) for both endpoint
   selection **and** request signing.
2. **Endpoints** — point the agent's service clients at the emulated Combine endpoints.
3. **Certificate Authority trust** — install the Combine CA into the operating system trust store so
   the agent trusts the TLS certificates presented by the emulated endpoints.

This guide shows how to apply all three automatically at first boot by injecting an EC2 **UserData**
script. The examples target Amazon Linux 2 / Amazon Linux 2023 (where the agent is pre-installed);
an Ubuntu/Debian variant is included at the end.

---

## Prerequisites

- **The instance runs inside a Combine VPC.** DNS for the emulated endpoints (for example
  `*.c2s.ic.gov`) must resolve to the Combine Endpoints load balancer. This is configured as part of
  your Combine deployment.
- **An EC2 Instance Profile with Systems Manager permissions is attached to the instance.** The agent
  registers using the instance profile's credentials, so the profile needs the standard Systems
  Manager permissions (`ssm:*`, `ssmmessages:*`, and `ec2messages:*` — equivalent to the
  `AmazonSSMManagedInstanceCore` managed policy).

  _NOTE: For the agent to register with a stable "caller identity," Combine must be able to infer the
  instance profile's credentials. In practice this means the instance's private IP must be unique in
  the account and the instance profile role's trust policy must allow Combine to assume it. See the
  Rewriting section of the [Orientation page](../../start-here/5-orientation.md) for details._

- **Systems Manager is supported in your Combine deployment.** The `ssm`, `ssmmessages`, and
  `ec2messages` services must be enabled for your emulated Region. If you are unsure, contact your
  Combine Support Team.
- **The Combine CA public certificate.** This is the `certificates/ca.cert.pem` file from your
  Credential Package (the same CA you install to reach the Combine Dashboard). You will paste its
  contents into the UserData script below.

---

## The UserData Script (Amazon Linux)

Launch your instance with the following UserData. UserData runs once, as `root`, on the first boot of
the instance, before you would normally log in.

Replace the certificate block between the `BEGIN`/`END CERTIFICATE` markers with the full contents of
your `ca.cert.pem`. If your CA chain contains more than one certificate (for example during a
[certificate rotation](certificates/how-to-rotate-certs.md)), paste **all** of the certificates,
one after another, into the same file.

```bash
#!/bin/bash
set -euxo pipefail

# ---------------------------------------------------------------------------
# 1. Install the Combine CA into the operating system trust store.
#    The SSM Agent validates TLS using the OS trust store, so this makes the
#    agent trust the certificates served by the emulated Combine endpoints.
# ---------------------------------------------------------------------------
cat > /etc/pki/ca-trust/source/anchors/combine-ca.pem <<'CA_EOF'
-----BEGIN CERTIFICATE-----
# ... paste the full contents of your Credential Package's
#     certificates/ca.cert.pem here ...
-----END CERTIFICATE-----
CA_EOF

update-ca-trust extract

# ---------------------------------------------------------------------------
# 2. Point the SSM Agent at the emulated Region and endpoints.
#    Agent.Region sets the signing Region (which Combine validates against the
#    endpoint), and the per-service Endpoint values route traffic to Combine.
#    Any fields not listed here keep their default values.
# ---------------------------------------------------------------------------
cat > /etc/amazon/ssm/amazon-ssm-agent.json <<'CFG_EOF'
{
  "Mds": {
    "Endpoint": "ec2messages.us-iso-east-1.c2s.ic.gov"
  },
  "Ssm": {
    "Endpoint": "ssm.us-iso-east-1.c2s.ic.gov"
  },
  "Mgs": {
    "Region": "us-iso-east-1",
    "Endpoint": "ssmmessages.us-iso-east-1.c2s.ic.gov"
  },
  "S3": {
    "Endpoint": "s3.us-iso-east-1.c2s.ic.gov"
  },
  "Kms": {
    "Endpoint": "kms.us-iso-east-1.c2s.ic.gov"
  },
  "Agent": {
    "Region": "us-iso-east-1"
  }
}
CFG_EOF

# ---------------------------------------------------------------------------
# 3. Restart the agent so it picks up the new configuration.
# ---------------------------------------------------------------------------
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent
```

_NOTE: The agent reads `/etc/amazon/ssm/amazon-ssm-agent.json` if it exists, otherwise it falls back
to the defaults in `amazon-ssm-agent.json.template`. Writing only the sections above is sufficient —
every field you do not specify keeps its default value._

### Why each field matters

| Field | Purpose |
| --- | --- |
| `Agent.Region` | The Region the agent uses to **sign** its API requests. On a Combine instance IMDS reports the commercial host Region, so this override is required — without it Combine rejects every request with a signature region mismatch. |
| `Ssm.Endpoint` | The Systems Manager control endpoint (`UpdateInstanceInformation`, command polling, etc.). |
| `Mds.Endpoint` | The message delivery service (`ec2messages`) used for Run Command. |
| `Mgs.Endpoint` / `Mgs.Region` | The message gateway service (`ssmmessages`) used by Session Manager. This service has its own Region field, so set both. |
| `S3.Endpoint` | Used for the Distributor package service and for streaming command / session output to S3. |
| `Kms.Endpoint` | Used to encrypt Session Manager sessions when KMS encryption is enabled. |

---

## Verify

After the instance boots, connect to it (for example via EC2 Instance Connect) and confirm the agent
is healthy:

```bash
# The service should be active (running) and enabled.
sudo systemctl status amazon-ssm-agent --no-pager

# Watch the agent log for a healthy startup.
sudo tail -n 50 -f /var/log/amazon/ssm/amazon-ssm-agent.log
```

The exact wording varies by agent version, but in a healthy log you should see messages similar to:

- the agent reporting it is **using** the emulated endpoint (for example `ssm.us-iso-east-1.c2s.ic.gov`),
- a **successful connection to Systems Manager**,
- the instance being **successfully registered**, and
- the agent **starting message polling**.

You should **not** see `TLS handshake failed`, `unable to connect to endpoint`, `AuthFailure`, or any
reference to a commercial (`amazonaws.com`) endpoint.

If everything is working, the instance will appear as **Online** in **Systems Manager → Fleet Manager**
(and **Session Manager** will be able to open a shell to it) in the AWS Console for the account hosting
Combine.

_NOTE: UserData output is captured in `/var/log/cloud-init-output.log`. If the agent never picks up the
new configuration, check that file first to confirm the script ran without error._

---

## Adapting to Other Regions and Partitions

The script above targets the AWS Top Secret Region `us-iso-east-1`, whose endpoint suffix is
`c2s.ic.gov`. To target a different emulated Region, replace both the Region ID and the endpoint
suffix everywhere they appear.

| Partition | Example Region | Endpoint suffix |
| --- | --- | --- |
| Top Secret (C2S) | `us-iso-east-1`, `us-iso-west-1` | `c2s.ic.gov` |
| Secret (SC2S) | `us-isob-east-1`, `us-isob-west-1` | `sc2s.sgov.gov` |

For example, for the Secret Region the `Ssm` endpoint becomes `ssm.us-isob-east-1.sc2s.sgov.gov` and
`Agent.Region` becomes `us-isob-east-1`.

---

## Ubuntu / Debian Variant

On Ubuntu and Debian the SSM Agent is typically installed as a snap and the OS trust store uses a
different location and tool. The Region/endpoint configuration file is identical — only the CA
installation and the service restart differ:

```bash
#!/bin/bash
set -euxo pipefail

# 1. Install the Combine CA. On Debian/Ubuntu the file must have a .crt
#    extension and live under /usr/local/share/ca-certificates.
cat > /usr/local/share/ca-certificates/combine-ca.crt <<'CA_EOF'
-----BEGIN CERTIFICATE-----
# ... paste the full contents of your certificates/ca.cert.pem here ...
-----END CERTIFICATE-----
CA_EOF

update-ca-certificates

# 2. Write the same amazon-ssm-agent.json shown above.
cat > /etc/amazon/ssm/amazon-ssm-agent.json <<'CFG_EOF'
{
  "Mds": { "Endpoint": "ec2messages.us-iso-east-1.c2s.ic.gov" },
  "Ssm": { "Endpoint": "ssm.us-iso-east-1.c2s.ic.gov" },
  "Mgs": { "Region": "us-iso-east-1", "Endpoint": "ssmmessages.us-iso-east-1.c2s.ic.gov" },
  "S3":  { "Endpoint": "s3.us-iso-east-1.c2s.ic.gov" },
  "Kms": { "Endpoint": "kms.us-iso-east-1.c2s.ic.gov" },
  "Agent": { "Region": "us-iso-east-1" }
}
CFG_EOF

# 3. Restart the snap-managed agent.
snap restart amazon-ssm-agent
```

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `TLS handshake failed` / `x509: certificate signed by unknown authority` | The Combine CA is not in the OS trust store. Confirm the certificate was written correctly and that `update-ca-trust extract` (Amazon Linux/RHEL) or `update-ca-certificates` (Ubuntu/Debian) ran successfully. |
| `AuthFailure`, `SignatureDoesNotMatch`, or "Credential should be scoped to a valid region" | The agent is signing for the wrong Region. Confirm `Agent.Region` is set to your emulated Region in `/etc/amazon/ssm/amazon-ssm-agent.json` and that the agent was restarted. |
| Combine reports Alert Events for calls to the commercial `SSM` endpoint | The endpoint overrides were not applied. Confirm the `Ssm` / `Mgs` / `Mds` endpoints are set and that the agent restarted. |
| The instance never appears in Fleet Manager | The instance profile is missing Systems Manager permissions, or Combine could not infer its credentials. Review the [Prerequisites](#prerequisites) and the caller-identity conditions on the [Orientation page](../../start-here/5-orientation.md). |

If you remain stuck, gather `/var/log/amazon/ssm/amazon-ssm-agent.log` and
`/var/log/cloud-init-output.log` and reach out to your Combine Support Team.

_NOTE: Very old agents (version 2.3.714.0 and earlier) require the custom endpoint file described here.
Newer agents can derive the endpoints from the Region automatically — but inside Combine you must still
set `Agent.Region` (and the endpoints are still recommended for clarity), because the instance's IMDS
reports the commercial host Region rather than the emulated Region._
