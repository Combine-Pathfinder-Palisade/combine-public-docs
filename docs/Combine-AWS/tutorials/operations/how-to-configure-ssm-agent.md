# Configure the SSM Agent

## Overview

The AWS Systems Manager (SSM) Agent is enabled by default on many AMIs. Left unconfigured, the agent
discovers its Region from the EC2 Instance Metadata Service (IMDS) and then talks to the **commercial**
Systems Manager endpoints for that Region (for example `ssm.us-east-1.amazonaws.com`).

Inside Combine this bypasses the emulation. The EC2 instance is hosted in a commercial Region, so its
IMDS reports that commercial Region. Combine, however, emulates only the reserved Region (for example
`us-iso-east-1`). An unconfigured agent therefore sends its traffic to the commercial endpoints, and
Combine never sees it.

_NOTE: By default, the Combine AirGap Layer exempts the commercial SSM traffic through the
`EnableAirgapAccessSSM` parameter of the `combine-vpc.yaml` template, so it is not blocked (see
[Known Issues](../../start-here/6-known-issues.md)). If that exemption is disabled, the Combine
Firewall blocks this traffic._

Pointing the agent's endpoints at Combine is not enough on its own. Unless you also set the Region, the
agent signs its requests for the commercial Region, and Combine rejects them with `SignatureDoesNotMatch`
("Credential should be scoped to a valid region") and raises a **Signature Region Mismatch** Alert Event.

To make the agent work inside Combine, you must change three things:

1. **Region** — force the agent to use the emulated Region (`us-iso-east-1`) for both endpoint
   selection **and** request signing.
2. **Endpoints** — point the agent's service clients at the emulated Combine endpoints.
3. **Certificate Authority trust** — install the Combine CA into the operating system trust store so
   the agent trusts the TLS certificates presented by the emulated endpoints.

This guide shows how to apply all three automatically at first boot by injecting an EC2 **UserData**
script. The examples target Amazon Linux 2 and Amazon Linux 2023, where the agent is pre-installed.
For Ubuntu and Debian, see the [Ubuntu / Debian Variant](#ubuntu--debian-variant).

---

## Prerequisites

- **The instance runs inside a Combine VPC.** DNS for the emulated endpoints (for example
  `*.c2s.ic.gov`) must resolve to the Endpoint Server's Load Balancer. This is configured as part of
  your Combine Deployment.
- **An EC2 Instance Profile with Systems Manager permissions is attached to the instance.** The agent
  registers using the instance profile's credentials, so attach the AWS managed policy
  `AmazonSSMManagedInstanceCore` to the instance profile's IAM Role (or a custom policy with the same
  actions). It grants the `ssm`, `ssmmessages`, and `ec2messages` actions the SSM Agent needs.

  _NOTE: For the agent to register with a stable "caller identity," Combine must be able to infer the
  instance profile's credentials. In practice this means the instance's private IP must be unique in
  the account and the instance profile role's trust policy must allow Combine to assume it. For details,
  see the [Rewriting](../../start-here/5-orientation.md#rewriting) section of the Orientation page._

- **Combine 3.14.7 or later.** Combine accepts the `ssm` and `ssmmessages` endpoints in the US Top
  Secret and US Secret Partitions starting with Combine 3.14.7. Earlier releases reject them. If you
  are unsure which release you run, contact your Combine Support Team.
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
mkdir -p /etc/amazon/ssm
cat > /etc/amazon/ssm/amazon-ssm-agent.json <<'CFG_EOF'
{
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

### Why Each Field Matters

| Field | Purpose |
| --- | --- |
| `Agent.Region` | The Region the agent uses to **sign** its API requests. On a Combine instance, IMDS reports the commercial host Region, so this override is required. Without it, Combine rejects every request with a signature region mismatch. |
| `Ssm.Endpoint` | The Systems Manager control endpoint (for example, `UpdateInstanceInformation` and command polling). |
| `Mgs.Endpoint` / `Mgs.Region` | The message gateway service (`ssmmessages`) used by Session Manager. This service has its own Region field, so set both. |
| `S3.Endpoint` | Used for the Distributor package service and for streaming command / session output to S3. |
| `Kms.Endpoint` | Used to encrypt Session Manager sessions when KMS encryption is enabled. |

_NOTE: The configuration intentionally omits `Mds.Endpoint`. The agent's message delivery service
client (`ec2messages`) has no Region setting and always signs its requests for the Region that IMDS
reports (the commercial host Region), so Combine would reject each of its requests with
`SignatureDoesNotMatch` and raise a **Signature Region Mismatch** Alert Event. Without the override, the
client uses the commercial `ec2messages.<host region>.amazonaws.com` endpoint, which the Combine AirGap
Layer exempts by default (`EnableAirgapAccessSSM`). The agent also receives Run Command messages through
the message gateway service (`ssmmessages`), which this configuration does point at Combine._

---

## Verify

After the instance boots, connect to it (for example, with EC2 Instance Connect) and confirm that the
agent is healthy:

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

You should **not** see `TLS handshake failed`, `unable to connect to endpoint`, or
`SignatureDoesNotMatch`. References to the commercial `ec2messages.<host region>.amazonaws.com` endpoint
are expected, because the configuration leaves the message delivery service on its default endpoint (see
the note under [Why Each Field Matters](#why-each-field-matters)).

If everything is working, the instance will appear as **Online** in **Systems Manager → Fleet Manager**
(and **Session Manager** will be able to open a shell to it) in the AWS Console for the account hosting
Combine, in the host Region that your emulated Region is mapped to (for example, `us-east-1`).

_NOTE: UserData output is captured in `/var/log/cloud-init-output.log`. If the agent never picks up the
new configuration, check that file first to confirm the script ran without error._

---

## Adapting to Other Regions and Partitions

The script above targets the `us-iso-east-1` Region of the US Top Secret Partition (C2S), whose
endpoint suffix is `c2s.ic.gov`. To target a different emulated Region, replace both the Region ID
and the endpoint suffix everywhere they appear.

| Partition | Example Region | Endpoint suffix |
| --- | --- | --- |
| US Top Secret (C2S) | `us-iso-east-1`, `us-iso-west-1` | `c2s.ic.gov` |
| US Secret (SC2S) | `us-isob-east-1`, `us-isob-west-1` | `sc2s.sgov.gov` |

For example, for the `us-isob-east-1` Region of the US Secret Partition (SC2S), the `Ssm` endpoint
becomes `ssm.us-isob-east-1.sc2s.sgov.gov` and `Agent.Region` becomes `us-isob-east-1`.

---

## Ubuntu / Debian Variant

On Ubuntu and Debian the SSM Agent is typically installed as a snap and the OS trust store uses a
different location and tool. The Region and endpoint configuration file is identical. Only the CA
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
mkdir -p /etc/amazon/ssm
cat > /etc/amazon/ssm/amazon-ssm-agent.json <<'CFG_EOF'
{
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
| `SignatureDoesNotMatch` or "Credential should be scoped to a valid region", with a **Signature Region Mismatch** Alert Event | The agent is signing for the wrong Region. Confirm `Agent.Region` is set to your emulated Region in `/etc/amazon/ssm/amazon-ssm-agent.json` and that the agent was restarted. |
| Combine reports Alert Events for calls to the commercial `SSM` endpoint | The endpoint overrides were not applied. Confirm the `Ssm` and `Mgs` endpoints are set and that the agent restarted. |
| **Signature Region Mismatch** Alert Events for `ec2messages` | `Mds.Endpoint` points at a Combine endpoint. Remove it from `/etc/amazon/ssm/amazon-ssm-agent.json` and restart the agent (see the note under [Why Each Field Matters](#why-each-field-matters)). |
| The instance never appears in Fleet Manager | The instance profile is missing Systems Manager permissions, or Combine could not infer its credentials. Review the [Prerequisites](#prerequisites) and the caller-identity conditions in the [Rewriting](../../start-here/5-orientation.md#rewriting) section of the Orientation page. |

If you are still stuck, gather `/var/log/amazon/ssm/amazon-ssm-agent.log` and
`/var/log/cloud-init-output.log` and contact your Combine Support Team.

_NOTE: Very old agents (version 2.3.714.0 and earlier) require the custom endpoint file described here.
Newer agents can derive the endpoints from the Region automatically. Inside Combine, however, you must
still set `Agent.Region` (and we still recommend setting the endpoints for clarity), because the
instance's IMDS reports the commercial host Region rather than the emulated Region._
