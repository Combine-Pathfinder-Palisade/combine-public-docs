# Combine IMDS Proxy

:::info[Combine 3.15.2 and later]
This page applies only to Combine 3.15.2 and later. The Combine IMDS Proxy is not available for earlier Combine releases.
:::

An EC2 Instance in a Combine VPC runs in a commercial host Region, so the EC2 Instance Metadata Service (IMDS) reports that host Region, its Availability Zones, and the `aws` Partition. Requests to IMDS (`169.254.169.254`) never leave the EC2 Instance, so Combine's Endpoint Server cannot rewrite them (see [IMDS](../6-known-issues.md#imds) on the Known Issues page). A workload, AWS SDK, or agent that reads its Region or Partition from IMDS then targets the host Partition instead of the emulated Partition.

The Combine IMDS Proxy closes this gap. You install it on a Linux EC2 Instance, or bake it into an AMI. It intercepts every IMDS request on the EC2 Instance, from every process and Container, and rewrites the Partition, Region, and Availability Zone values in each response to match the emulated Partition. Your workload needs no changes: it keeps calling `http://169.254.169.254` as usual.

## What It Changes

The examples assume the US Top Secret Partition (C2S) and the default Region mapping (`us-east-1` → `us-iso-east-1`).

| IMDS path | Without the Combine IMDS Proxy | With the Combine IMDS Proxy |
| --- | --- | --- |
| `meta-data/placement/region` | `us-east-1` | `us-iso-east-1` |
| `meta-data/placement/availability-zone` | `us-east-1b` | `us-iso-east-1b` |
| `meta-data/placement/availability-zone-id` | `use1-az2` | `usie1-az2` |
| `meta-data/services/partition` | `aws` | `aws-iso` |
| `meta-data/services/domain` | `amazonaws.com` | `c2s.ic.gov` |
| `meta-data/iam/info` | `arn:aws:iam::...` | `arn:aws-iso:iam::...` |
| `dynamic/instance-identity/document` | Host Region, Availability Zone, and ARN values | Every Region, Availability Zone, Availability Zone ID, and ARN value rewritten |
| Signed Instance Identity Documents (`dynamic/instance-identity/pkcs7`, `signature`, `rsa2048`, ...) | Signed for the host Region | Blocked (`404`), because they cannot be re-signed for the emulated Partition |
| `meta-data/managed-ssh-keys/*` | Served | Blocked (`404`). EC2 Instance Connect still works (see [EC2 Instance Connect](#ec2-instance-connect)). |

Every other value, including the EC2 Instance's credentials, Instance ID, network configuration, user data, and tags, comes from IMDS unchanged. Both IMDSv1 and IMDSv2 work.

## How It Works

- `iptables` rules redirect every IPv4 IMDS connection (`169.254.169.254:80`) on the EC2 Instance to the Combine IMDS Proxy. Connections from Containers are redirected to a link-local address on a dummy network interface (`combine-imds0`, `169.254.254.254` by default).
- The Combine IMDS Proxy forwards each request to the real IMDS and rewrites the response.
- It fails closed:
  - While the Combine IMDS Proxy is not running, IMDS (and therefore the EC2 Instance's credentials) is unavailable rather than answering with host values.
  - A response it cannot safely rewrite, for example from a host Region that is not mapped, is answered with `502`.
  - A watcher checks the `iptables` rules every 10 seconds and restores them if they are removed, flushed, or reordered.
- The IPv6 IMDS endpoint (`[fd00:ec2::254]`) is always blocked.

## Requirements

- Linux with `systemd`, on `x86_64` or `arm64`.
- `iptables` (legacy or nft backend) including `iptables-save` and `iptables-restore`, `iproute2` (`ip`), and `runuser`. Amazon Linux 2023 does not include `iptables`; install it with `sudo dnf install -y iptables-nft`.
- For Containers, kernel support for the `dummy` network interface type.
- The EC2 Instance runs in a Combine VPC, so it resolves the emulated AWS Service Endpoints to Combine and trusts the Combine Certificate Authority. Once IMDS reports the emulated Region, every AWS SDK and agent on the EC2 Instance targets the emulated AWS Service Endpoints (see [To Be Aware Of](#to-be-aware-of)).
- The EC2 Instance's host Region is mapped to an emulated Region in your Combine Deployment.

## Get the Combine IMDS Proxy

Contact the Combine Support Team to get the Combine IMDS Proxy package for your Combine release.

If you operate a self-service Combine Deployment, the Account Automation Tool uploads the package with each release to the Combine DevOps Bucket:

```text
s3://combine-devops-ACCOUNT_NUMBER-REGION/releases/VERSION/imds-proxy/combine-imds-proxy-linux.tar.gz
```

If you have a sharded Combine Deployment, the bucket is named `combine-SHARD_ID-devops-ACCOUNT_NUMBER-REGION`. The same file is in the Account Automation Tool's `deployment/release/imds-proxy/` directory.

The package extracts to a `combine-imds-proxy-VERSION/` directory that contains:

| File | Purpose |
| --- | --- |
| `install.sh` | Installs and starts the Combine IMDS Proxy. |
| `uninstall.sh` | Removes the Combine IMDS Proxy. |
| `combine-imds-proxy.conf.example` | A starting point for the Configuration. |
| `bin/`, `lib/`, `systemd/` | The `x86_64` and `arm64` binaries, the `iptables` rules script, and the `systemd` units. `install.sh` picks the binary that matches the EC2 Instance. |
| `README.md` | Technical reference. |

## Create the Configuration

The Configuration is a file of `KEY=VALUE` lines. `install.sh` installs it as `/etc/combine/imds-proxy.conf`. Start from `combine-imds-proxy.conf.example`. For C2S with the default Region mapping:

```bash
COMBINE_IMDS_PARTITION=aws-iso
COMBINE_IMDS_DOMAIN=c2s.ic.gov
COMBINE_IMDS_MAP_REGION=us-east-1=us-iso-east-1
COMBINE_IMDS_MAP_AZ_ID=use1=usie1
```

| Key | Required | Default | Description |
| --- | --- | --- | --- |
| `COMBINE_IMDS_PARTITION` | Yes | | The emulated Partition ID, for example `aws-iso`. |
| `COMBINE_IMDS_DOMAIN` | Yes | | The emulated DNS Suffix, for example `c2s.ic.gov`. |
| `COMBINE_IMDS_MAP_REGION` | Yes | | Comma-separated `host Region=emulated Region` pairs. |
| `COMBINE_IMDS_MAP_AZ_ID` | Yes | | Comma-separated `host Availability Zone ID prefix=emulated prefix` pairs, one for each mapped Region. |
| `COMBINE_IMDS_CONTAINER_ADDRESS` | No | `169.254.254.254` | The link-local address that Container IMDS traffic is redirected to, or `none` to refuse Container IMDS traffic (see [Docker and Other Containers](#docker-and-other-containers)). |
| `COMBINE_IMDS_INSTANCE_CONNECT` | No | `allow` | `allow` or `block` (see [EC2 Instance Connect](#ec2-instance-connect)). |
| `COMBINE_IMDS_SIGNATURES` | No | `block` | `block`, or `passthrough` to serve signed Instance Identity Documents unchanged. With `passthrough`, they reveal the host Region and Partition. |
| `COMBINE_IMDS_LISTEN_PORT` | No | `254` | The port the Combine IMDS Proxy listens on. It must be below `1024` and must not be `80`. |
| `COMBINE_IMDS_LOG_LEVEL` | No | `info` | `debug`, `info`, or `warn`. |

The Region map must match your Combine Deployment's Region mapping, so that IMDS agrees with the Region the Combine Endpoint Server reports. The Region mapping is held in the `combine.endpoints.aws.emulation.regionMapping.<partition>.<emulated-region>` Configuration Values. For example, `combine.endpoints.aws.emulation.regionMapping.aws_c2s.us-iso-east-1` is `us-east-1` by default. To view them, see [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md).

These are the Configurations for the default Region mapping of each emulated Partition:

| Emulated Partition | `PARTITION` | `DOMAIN` | `MAP_REGION` | `MAP_AZ_ID` |
| --- | --- | --- | --- | --- |
| US Top Secret (C2S) | `aws-iso` | `c2s.ic.gov` | `us-east-1=us-iso-east-1` | `use1=usie1` |
| US Secret (SC2S) | `aws-iso-b` | `sc2s.sgov.gov` | `us-east-1=us-isob-east-1` | `use1=usibe1` |
| GovCloud | `aws-us-gov` | `amazonaws.com` | `us-east-1=us-gov-west-1` | `use1=usgw1` |

If your Combine Deployment maps a second Region, add a pair to both lists. For example, if `us-iso-west-1` is mapped to `us-west-2`:

```bash
COMBINE_IMDS_MAP_REGION=us-east-1=us-iso-east-1,us-west-2=us-iso-west-1
COMBINE_IMDS_MAP_AZ_ID=use1=usie1,usw2=usiw1
```

For other emulated Partitions, contact the Combine Support Team.

## Install on a Running EC2 Instance

1. Connect to the EC2 Instance (for example, with EC2 Instance Connect or SSH).
2. Install `iptables` if needed, along with any other packages you need (see [To Be Aware Of](#to-be-aware-of)):

    ```bash
    sudo dnf install -y iptables-nft
    ```

3. Copy the package to the EC2 Instance and extract it:

    ```bash
    sudo mkdir -p /opt/combine-imds-proxy
    sudo tar -xzf combine-imds-proxy-linux.tar.gz -C /opt/combine-imds-proxy
    cd /opt/combine-imds-proxy/combine-imds-proxy-*/
    ```

4. Create the Configuration (see [Create the Configuration](#create-the-configuration)):

    ```bash
    sudo cp combine-imds-proxy.conf.example imds-proxy.conf
    sudo vi imds-proxy.conf
    ```

5. Install and start the Combine IMDS Proxy:

    ```bash
    sudo ./install.sh --config imds-proxy.conf --now
    ```

6. Check the values IMDS returns (see [Verify](#verify)).
7. Reboot the EC2 Instance, or restart the agents and services that read IMDS before you installed the Combine IMDS Proxy (for example, the SSM Agent). They keep the host values until they restart.

`install.sh` checks everything before it changes anything:

- The Configuration must be valid.
- It refuses existing firewall rules that restrict IMDS, because interception bypasses them. Rewrite such rules to match `-m conntrack --ctorigdst 169.254.169.254`, or pass `--force` to accept them as they are.
- With `--now`, it confirms that the EC2 Instance's host Region and Availability Zone ID are mapped. If they are not, it installs nothing and leaves an existing installation as it was.

It then installs the binary as `/usr/local/bin/combine-imds-proxy`, creates the `combine-imds-proxy` user, enables the `systemd` units, and, with `--now`, starts them and confirms that IMDS answers with emulated values. It is safe to run again. If you omit `--config`, it keeps the existing `/etc/combine/imds-proxy.conf`.

## Install Through UserData

To install the Combine IMDS Proxy when an EC2 Instance first launches from a standard AMI, add these steps to its UserData. UserData runs once, as `root`, on the first boot. The example targets Amazon Linux 2023.

Replace `PACKAGE_URL` with a location the EC2 Instance can download the package from, for example a presigned S3 URL or an internal web server. If that location is served through Combine, install the Combine Certificate Authority first, as shown in [Configure the SSM Agent](../../tutorials/operations/how-to-configure-ssm-agent.md#the-userdata-script-amazon-linux).

```bash
#!/bin/bash
set -euxo pipefail

PACKAGE_URL='https://...'

# Install packages first: some operating systems choose a package mirror from the Region that IMDS reports.
dnf install -y iptables-nft

mkdir -p /opt/combine-imds-proxy
curl -fsSL "$PACKAGE_URL" | tar -xz -C /opt/combine-imds-proxy
cd /opt/combine-imds-proxy/combine-imds-proxy-*/

cat > imds-proxy.conf <<'EOF'
COMBINE_IMDS_PARTITION=aws-iso
COMBINE_IMDS_DOMAIN=c2s.ic.gov
COMBINE_IMDS_MAP_REGION=us-east-1=us-iso-east-1
COMBINE_IMDS_MAP_AZ_ID=use1=usie1
EOF

./install.sh --config imds-proxy.conf --now
```

- The output is written to `/var/log/cloud-init-output.log`. Look for the lines that start with `install.sh:`.
- Processes that started earlier in the first boot, such as `cloud-init` itself and the SSM Agent, read IMDS before the Combine IMDS Proxy was installed and keep the host values until they restart. Reboot the EC2 Instance once after its first boot, or restart those services at the end of the UserData.
- If `install.sh` fails, `set -e` stops the script. If it fails because the host Region is not mapped, nothing is installed. If it fails after interception has started, IMDS stays closed. Check the logs (see [Troubleshooting](#troubleshooting)) and run `uninstall.sh` to back out.

## Bake into an AMI

For Auto Scaling Groups, EKS worker Nodes, and other fleets, bake the Combine IMDS Proxy into the AMI. During the AMI build (for example, with Packer, EC2 Image Builder, or a chroot build), run `install.sh` with the Configuration and without `--now`:

```bash
sudo ./install.sh --config imds-proxy.conf
```

Interception starts at the next boot, before `cloud-init` runs, so EC2 Instances launched from the AMI see emulated values from their first IMDS request.

- **Bake the Configuration into the AMI.** IMDS stays closed until the Combine IMDS Proxy has a valid Configuration, and `cloud-init` reads UserData from IMDS. So UserData cannot supply the Configuration to an AMI that already has the Combine IMDS Proxy installed.
- **Map every host Region that you launch the AMI in.** Without `--now`, `install.sh` only warns when the build host's Region is not mapped. An EC2 Instance launched in a host Region that is not mapped gets `502` for Region values.

## Docker and Other Containers

Containers need no extra configuration. Containers on a Docker bridge network (the default network or a user-defined one) and Containers that use `--network host` all see emulated values. Restarting Docker does not affect the Combine IMDS Proxy.

To check from a Container, use any image you can pull that includes `curl`:

```bash
sudo docker run --rm IMAGE sh -c 'TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60"); curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region; echo'
```

- **IMDS hop limit.** A Container on a bridge network reaches IMDS through the Combine IMDS Proxy even when the EC2 Instance's IMDS hop limit is `1`, because the Combine IMDS Proxy answers from the EC2 Instance itself. If your production environment relies on a hop limit of `1` to keep Containers away from IMDS, set `COMBINE_IMDS_CONTAINER_ADDRESS=none` so that Container IMDS requests are refused in Combine too.
- **Container address.** Container IMDS traffic is redirected to `169.254.254.254` on the dummy `combine-imds0` interface. Change `COMBINE_IMDS_CONTAINER_ADDRESS` only if that address conflicts with something on your network. It must be in `169.254.0.0/16`, outside `169.254.169.0/24` and `169.254.170.0/24`. After you change it, run `install.sh` again.
- **firewalld.** If firewalld is active, allow the listen port in the zone of the Container interfaces (for Docker, usually `docker`), or Container IMDS requests are refused. Avoid `firewall-cmd --reload` (see [Known Limitations](#known-limitations)):

    ```bash
    sudo firewall-cmd --zone=docker --add-port=254/tcp
    sudo firewall-cmd --permanent --zone=docker --add-port=254/tcp
    ```

- **Kubernetes and EKS.** On a Kubernetes worker Node, Pods are treated like Containers when their traffic passes through the Node's `iptables` rules, as it does with the Amazon VPC CNI. Bake the Combine IMDS Proxy into the Node AMI. If you use Calico in its default insert mode, set `ChainInsertMode=Append`, or Calico and the Combine IMDS Proxy keep reordering each other's rules.

These Container setups bypass the EC2 Instance's `iptables` rules, so they reach the real IMDS and are not supported:

- ECS tasks in `awsvpc` network mode. To block their access to IMDS instead, set `ECS_AWSVPC_BLOCK_IMDS=true` in the ECS agent configuration.
- ipvlan and macvlan Container networks.
- eBPF host routing (Cilium, or Calico in eBPF mode).
- Containers with `CAP_NET_RAW` that run their own user-space TCP stack.

The ECS task metadata and credentials endpoint (`169.254.170.2`) and EKS Pod Identity (`169.254.170.23`) are separate services. The Combine IMDS Proxy does not intercept them.

## EC2 Instance Connect

EC2 Instance Connect keeps working by default. Its signer certificate is issued for the host Region and cannot be re-signed for the emulated Partition, and its key lookup checks that certificate against the Region that IMDS reports. So the Combine IMDS Proxy does not rewrite it. Instead:

- The `ec2-instance-connect` user is exempt from interception. The `ec2-instance-connect` package has `sshd` run its key lookup as that user, so the lookup reads the real IMDS and succeeds.
- Every other user gets `404` for `meta-data/managed-ssh-keys/*`.
- As on any EC2 Instance, the key lookup writes the caller's IAM ARN (in the host Partition) to the authentication log (`/var/log/secure` or the journal).

To turn EC2 Instance Connect off, set `COMBINE_IMDS_INSTANCE_CONNECT=block`. The change takes effect within 10 seconds, without a restart. If you install the `ec2-instance-connect` package after the Combine IMDS Proxy, the exemption also appears within 10 seconds.

## Verify

Define a helper that makes an IMDSv2 request, then check the values:

```bash
imds() { local t; t=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60'); curl -s -w '  [%{http_code}]\n' -H "X-aws-ec2-metadata-token: $t" "http://169.254.169.254/latest/$1"; }

imds meta-data/placement/region                 # us-iso-east-1
imds meta-data/placement/availability-zone      # us-iso-east-1a, b, c, ...
imds meta-data/placement/availability-zone-id   # usie1-az1, az2, ...
imds meta-data/services/partition               # aws-iso
imds meta-data/services/domain                  # c2s.ic.gov
imds meta-data/iam/info                         # "InstanceProfileArn" : "arn:aws-iso:iam::..."
imds dynamic/instance-identity/document         # "region" : "us-iso-east-1"
imds dynamic/instance-identity/pkcs7            # [404]
imds meta-data/instance-id                      # unchanged
```

`meta-data/iam/info` returns `404` if the EC2 Instance has no Instance Profile.

The Combine IMDS Proxy also has built-in checks:

```bash
# Checks that IMDS answers with emulated values.
sudo /usr/local/bin/combine-imds-proxy -config /etc/combine/imds-proxy.conf -probe

# Checks that the EC2 Instance's host Region and Availability Zone ID are mapped.
sudo -u combine-imds-proxy /usr/local/bin/combine-imds-proxy -config /etc/combine/imds-proxy.conf -check-host

# Sends a few thousand paced requests through the Combine IMDS Proxy and fails on any host value it finds.
sudo -u combine-imds-proxy /usr/local/bin/combine-imds-proxy -config /etc/combine/imds-proxy.conf -self-test
```

`-check-host` and `-self-test` must run as the `combine-imds-proxy` user, which can still reach the real IMDS. If IMDS throttles `-self-test`, it reports the run as inconclusive.

## Change the Configuration

1. Edit `/etc/combine/imds-proxy.conf`.
2. Validate it:

    ```bash
    sudo /usr/local/bin/combine-imds-proxy -config /etc/combine/imds-proxy.conf -check-config
    ```

3. Restart the Combine IMDS Proxy:

    ```bash
    sudo systemctl restart combine-imds-proxy
    ```

After you change `COMBINE_IMDS_LISTEN_PORT` or `COMBINE_IMDS_CONTAINER_ADDRESS`, also run `sudo ./install.sh` again from the package directory. Until you do, IMDS stays closed. A change to `COMBINE_IMDS_INSTANCE_CONNECT` needs neither step; it takes effect within 10 seconds.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `install.sh` reports that the host Region or Availability Zone ID is not mapped | Add the EC2 Instance's host Region to `COMBINE_IMDS_MAP_REGION` and its Availability Zone ID prefix to `COMBINE_IMDS_MAP_AZ_ID`. |
| `install.sh` refuses existing firewall rules that restrict IMDS | See the firewall rule check under [Install on a Running EC2 Instance](#install-on-a-running-ec2-instance). |
| IMDS returns `502` | The host Region is not mapped (for example, an AMI launched in a different Region), or a response could not be safely rewritten. Check the logs. |
| IMDS requests hang, and AWS SDKs cannot get credentials | The Combine IMDS Proxy is not running, often because the Configuration is invalid. Check `systemctl status combine-imds-proxy` and the logs. |
| Containers get "connection refused" from IMDS | `COMBINE_IMDS_CONTAINER_ADDRESS` is `none`, or firewalld blocks the listen port (see [Docker and Other Containers](#docker-and-other-containers)). |
| Signed Instance Identity Documents return `404` | Expected. They cannot be re-signed for the emulated Partition. |
| EC2 Instance Connect fails | The `ec2-instance-connect` package is not installed, `COMBINE_IMDS_INSTANCE_CONNECT` is `block`, or `sshd` runs the key lookup as a different user. |
| An AWS SDK configured for the IPv6 IMDS endpoint fails | The IPv6 IMDS endpoint is blocked. Use the IPv4 endpoint (the default). |

Collect the logs and rules:

```bash
sudo journalctl -b --no-pager -u 'combine-imds-proxy*'
sudo systemctl status combine-imds-proxy combine-imds-proxy-rules combine-imds-proxy-watch --no-pager
sudo iptables -t nat -S; sudo iptables -S; sudo iptables -t mangle -S; ip rule
```

If you still need help, send this output (and `/var/log/cloud-init-output.log` for a UserData install) to the Combine Support Team.

## Known Limitations

These values still come from the host:

- **Hostnames** (`local-hostname`, `hostname`, `public-hostname`, and per-interface hostnames) contain the host Region. They are not rewritten, because VPC DNS must keep resolving them.
- **User data** and **instance tags** (`meta-data/tags/instance/*`) are returned as written.
- **Values read before interception started**, for example in the initramfs during boot. The Combine IMDS Proxy starts before `cloud-init`.

These are blocked rather than emulated:

- **Signed Instance Identity Documents**, unless `COMBINE_IMDS_SIGNATURES=passthrough`.
- **The IPv6 IMDS endpoint** (`[fd00:ec2::254]`). Clients configured for it get an error instead of emulated values. The IPv4 endpoint works as usual.

Other things to know:

- `root` on the EC2 Instance can always bypass interception, as can any process running as the `combine-imds-proxy` user (including a host-network Container that uses that user's uid).
- Two operations wipe every `iptables` table at once: `nft flush ruleset` (which runs when `nftables.service` stops or reloads) and a firewalld reload on its `iptables` backend. Until the watcher restores the rules, within 10 seconds, IPv4 IMDS is not intercepted.

## To Be Aware Of

- **Every AWS SDK and agent targets the emulated Partition.** Once IMDS reports the emulated Region, agents such as the SSM Agent and the CloudWatch Agent call the emulated AWS Service Endpoints. Make sure the EC2 Instance resolves them to Combine and trusts the Combine Certificate Authority.
- **SSM Agent.** [Configure the SSM Agent](../../tutorials/operations/how-to-configure-ssm-agent.md) assumes that IMDS reports the host Region (see its note on `Mds.Endpoint`). With the Combine IMDS Proxy, the agent's `ec2messages` client signs for the emulated Region instead. Keep EC2 Instance Connect or SSH available until you have confirmed that Session Manager works on the EC2 Instance.
- **Package managers.** Some operating systems, such as Amazon Linux, choose a package repository mirror from the Region that IMDS reports. Install the packages you need before you install the Combine IMDS Proxy, and check that your package manager still works after a reboot.

## Uninstall

From the package directory:

```bash
cd /opt/combine-imds-proxy/combine-imds-proxy-*/
sudo ./uninstall.sh            # keeps /etc/combine/imds-proxy.conf and the combine-imds-proxy user
sudo ./uninstall.sh --purge    # removes them too
```

IMDS reports host values again as soon as `uninstall.sh` finishes. Reboot the EC2 Instance, or restart the services that read IMDS, so they pick up the host values.
