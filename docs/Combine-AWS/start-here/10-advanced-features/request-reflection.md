# Request Reflection

Request Reflection lets a signed `sts:GetCallerIdentity` call pass through Combine to AWS STS in the host Partition without being re-signed. This preserves the identity that signed the call. It exists for workloads that use a signed `sts:GetCallerIdentity` call to prove who they are to another server (see [Authentication via `sts:GetCallerIdentity`](../6-known-issues.md#authentication-via-stsgetcalleridentity) on the Known Issues page).

Request Reflection is always active. No Configuration Value turns it on or off.

## The Problem

Some authentication schemes use `sts:GetCallerIdentity` as proof of identity. The client signs an `sts:GetCallerIdentity` call, either as a Presigned URL or as a set of signed headers, and hands it to a server instead of sending it. The server replays the call to AWS STS, and the identity in the response is the identity of the client. Tokens in the style of `aws-iam-authenticator` and the HashiCorp Vault AWS auth method are common examples.

Combine does not normally forward the AWS API Calls it receives. Instead it infers the credentials that signed the call and sends a new call to the host Partition, signed with those credentials (see the `Rewriting` section of [Orientation](../5-orientation.md)). A replayed `sts:GetCallerIdentity` call breaks this in two ways:

- The server that replays the call sends it to Combine, not the client. If Combine cannot infer the client's credentials (for example credentials from an EC2 Instance Profile), it signs the new call with other credentials. These can be the Default Role or, for a call signed in the `Authorization` header, the IAM Role that [Resource Role Masquerade](resource-role-masquerade.md) finds for the replaying server. The server then sees the wrong identity, or an error if Combine cannot derive any credentials.
- A call signed for an emulated Region (for example `us-iso-east-1` at `sts.us-iso-east-1.c2s.ic.gov`) is not valid in the host Partition, so Combine cannot forward it unchanged either.

Request Reflection solves this for a call that the client signs for the host Partition. Combine recognizes the call and sends it to AWS unchanged (it "reflects" the call).

## How Request Reflection Works

Combine reflects a request when all of the following are true:

- It is an `sts:GetCallerIdentity` call. The request is for the STS Service and has an `Action=GetCallerIdentity` parameter in the query string or the form body. Both `GET` and `POST` qualify.
- It is signed with Signature Version 4, either in the `Authorization` header or as a Presigned URL (`X-Amz-Credential`).
- The Region in the signature's credential scope is the host Region that Combine would send the call to (see the table below).

A call signed for an emulated Region is never reflected. Combine handles it like any other AWS API Call.

The replaying server sends the request to the emulated STS Endpoint (for example `https://sts.us-iso-east-1.c2s.ic.gov/`). The request's `Host` header decides where Combine sends it:

| `Host` header of the request | Signing Region Combine expects | Combine sends the request to |
|---|---|---|
| The emulated STS Endpoint, for example `sts.us-iso-east-1.c2s.ic.gov` | The host Region the emulated Region is mapped to, for example `us-east-1` | The Regional STS Endpoint of that host Region, for example `sts.us-east-1.amazonaws.com` |
| A Regional STS Endpoint in the host Partition, for example `sts.us-east-1.amazonaws.com` | The Region in the `Host` header | The `Host` header value |
| The legacy global STS Endpoint `sts.amazonaws.com` | The root Region of the host Partition (`us-east-1` for AWS Commercial) | `sts.amazonaws.com` |

Each emulated Region is mapped to a host Region when Combine is deployed. Combine stores the mapping in the `combine.endpoints.aws.emulation.regionMapping.<partition id>.<emulated region>` Configuration Value (for example `combine.endpoints.aws.emulation.regionMapping.aws_c2s.us-iso-east-1`), which is written by CloudFormation. The Combine Policy CloudFormation Template maps `us-iso-east-1`, `us-isob-east-1`, and `us-gov-west-1` to `us-east-1` by default.

_NOTE: Combine treats a `Host` header as a Regional STS Endpoint in the host Partition only for a Region that it recognizes in the host Partition. In AWS Commercial those Regions are `us-east-1`, `us-east-2`, `us-west-1`, and `us-west-2`._

When Combine reflects a request it:

- Does not infer credentials, re-sign the request, or apply its request Filters. It does not rewrite the request except for the destination host.
- Sends the request to the host from the table above, or to the host in `combine.endpoints.aws.request.reflection.endpoint.override` if that Configuration Value is set.
- Forwards the query string and the body unchanged. It normalizes the path (for example `//` becomes `/`).
- Forwards only the headers named in the signature's `SignedHeaders` (or `X-Amz-SignedHeaders`), the default headers listed under [Configuration](#configuration), and any headers added with `combine.endpoints.aws.request.reflection.headers`. It never forwards the `Host` or `Content-Length` header. The HTTP client sets both, and sets `Host` to the destination host.
- Returns the status code, headers, and body from AWS through Combine's normal response rewriting. The `Arn` in the response shows the emulated Partition (for example `arn:aws-iso:sts::111122223333:assumed-role/MyRole/MySession`). If AWS rejects the signature, the caller receives the AWS error response (for example `SignatureDoesNotMatch`).

The signature covers the `Host` header, so the client must sign for the same host that Combine sends the request to. For example, a call signed for `sts.us-east-1.amazonaws.com` with Region `us-east-1` succeeds. The same call signed with Region `us-east-1` for the emulated host `sts.us-iso-east-1.c2s.ic.gov` is reflected, but AWS rejects it with `SignatureDoesNotMatch`.

## Configuration

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.request.reflection.endpoint.override` | _(empty)_ | A host name (not a URL) that replaces the destination host of **every** Reflected Request, for example `sts.amazonaws.com`. When empty, Combine uses the destination from the table above. |
| `combine.endpoints.aws.request.reflection.headers.default` | `true` | When `true`, Combine forwards the default headers listed below in addition to the signed headers. |
| `combine.endpoints.aws.request.reflection.headers` | _(empty)_ | Space-separated additional header names to forward. Use lower case names. |
| `combine.endpoints.aws.request.hostHeaderMismatch.reject.unless.reflected` | `false` | When `true`, Combine rejects a request whose `Host` header names an endpoint in the host Partition but which does not qualify for Request Reflection. When `false`, Combine handles that request like any other AWS API Call. |
| `combine.endpoints.aws.request.hostHeaderMismatch.environment.default` | Written by CloudFormation (see below) | The emulated Partition ID (`AWS_C2S`, `AWS_SC2S`, `AWS_GOV_CLOUD`, or `AWS_EUSC`) that Combine uses for a request whose `Host` header names an endpoint in the host Partition. For example, it sets the Partition shown in the `Arn` of the response. |

The default headers are `authorization`, `x-amz-date`, `x-amz-security-token`, `content-type`, `accept-encoding`, `x-payload-hash`, `x-vault-aws-iam-server-id`, `x-vault-config-aws-iam-server-id`, `x-vault-config-request-sha256`, and `x-vault-config-sts-endpoint`.

The Combine Policy CloudFormation Template writes `combine.endpoints.aws.request.hostHeaderMismatch.environment.default`:

- For a Combine Deployment that emulates the US Top Secret, US Secret, or US GovCloud Partition, the value comes from the `DefaultPartitionForReflectedRequests` Parameter ("Default Partition ID - Reflected Requests"), which defaults to `AWS_C2S`. If your Combine Deployment emulates a different Partition, set this Parameter to that Partition's ID (for example `AWS_SC2S`).
- For a Combine Deployment that emulates the EUSC Partition, the value is `AWS_EUSC`.

See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions on setting a Configuration Value.

_NOTE: `combine.endpoints.aws.filter.requestReflection.enable` (default `false`) and `combine.endpoints.aws.request.reflection.target.region.endpoint.override` belong to a legacy Request Reflection Filter and have no effect on Request Reflection. Use `combine.endpoints.aws.request.reflection.endpoint.override` to override the destination._

## Legacy Global and Regional STS Endpoints

AWS STS in AWS Commercial has a legacy global endpoint, `sts.amazonaws.com`, which is signed with Region `us-east-1`. It also has a Regional endpoint in each Region, `sts.<region>.amazonaws.com`, which is signed with that Region. Combine emulates STS as a Regional Service in every emulated Partition, so your workload should use the Regional emulated STS Endpoint, for example `sts.us-iso-east-1.c2s.ic.gov` or `sts.us-isob-east-1.sc2s.sgov.gov`.

### Regional Signature (Recommended)

Have the client sign for the Regional STS Endpoint of the host Region that your emulated Region is mapped to. For example, with the default mapping for `us-iso-east-1`, sign for `sts.us-east-1.amazonaws.com` with Region `us-east-1`. The replaying server then sends the call to the emulated STS Endpoint. Combine reflects it whether the `Host` header is the emulated host or the signed host.

This works in a Combine Deployment hosted in AWS Commercial or in AWS GovCloud.

### Legacy Global Signature

A call signed for `sts.amazonaws.com` (Region `us-east-1`) is reflected correctly only when the replaying server keeps `sts.amazonaws.com` as the `Host` header. Combine then sends the call to `sts.amazonaws.com`.

If the replaying server sends the emulated host as the `Host` header, the call fails:

- If the emulated Region is mapped to `us-east-1`, Combine cannot tell a legacy signature from a Regional `us-east-1` signature, because both use `us-east-1` in the credential scope. Combine sends the call to `sts.us-east-1.amazonaws.com` and AWS returns `SignatureDoesNotMatch`.
- If the emulated Region is mapped to any other host Region, the signing Region does not match, so Combine does not reflect the call. It infers credentials and re-signs the call as described in [The Problem](#the-problem).

If every client that uses this flow signs for the legacy endpoint, you can set `combine.endpoints.aws.request.reflection.endpoint.override` to `sts.amazonaws.com`. This sends every Reflected Request to the legacy endpoint, which breaks every call that uses a Regional signature. Switching the clients to Regional signatures is the better fix.

The legacy global endpoint belongs to AWS Commercial. In a Combine Deployment hosted in AWS GovCloud, always use a Regional signature (for example for `sts.us-gov-west-1.amazonaws.com`).

### AWS SDK and CLI Settings

Configure the client that generates the signed call (and only that client) as follows:

- Set its Region to the host Region that your emulated Region is mapped to (for example `AWS_REGION=us-east-1`).
- Make it use Regional STS Endpoints. Set `AWS_STS_REGIONAL_ENDPOINTS=regional`, or `sts_regional_endpoints = regional` in the shared AWS config file, for SDKs and CLI versions that support the setting. The default differs by SDK and version: older SDKs, such as AWS CLI version 1 and older boto3 releases, have defaulted to `legacy`, while newer SDKs use Regional endpoints. Set the value explicitly instead of relying on the default, and check the documentation for your SDK version.
- Do not point the client at the emulated STS Endpoint with an endpoint override. The client would then sign for the emulated host, and AWS rejects the reflected call.

To check a Presigned URL, look at its host and its `X-Amz-Credential` parameter. The host should be `sts.<host region>.amazonaws.com` and the credential scope should contain `/<host region>/sts/aws4_request`.

## Limitations

- Only `sts:GetCallerIdentity` is reflected. No other AWS API Call is reflected.
- Only Signature Version 4 is supported. A call signed with Signature Version 2 is not reflected.
- While running in Combine, the client that generates the signed call must use host Partition values (the host Region and its STS Endpoint). In the emulated Partition itself that client would use the emulated Region, so keep this setting configurable in your workload.
- Combine applies no request Filters to a Reflected Request. The request is not checked the way other AWS API Calls are.
- The replaying server must send the call to Combine through the emulated STS Endpoint. If it calls an STS Endpoint in the host Partition directly, Combine is not involved.
- For a Presigned URL without an `X-Amz-Security-Token` parameter (for example one signed with IAM User Access Keys), Combine forwards only the default headers and the headers in `combine.endpoints.aws.request.reflection.headers`. Add any other signed header names to that Configuration Value.
- Request Reflection does not handle an EKS Bearer Token sent to an EKS Cluster endpoint through Combine. Combine's Kubernetes proxy rewrites that token separately.

## Troubleshooting

- In the Combine Log (see [View Combine Logs](../../tutorials/operations/how-to-view-combine-logs.md)), a Reflected Request has `transaction.metadata.reflected` set to `"true"`. `transaction.metadata.hostHeaderMismatched` is `"true"` when the `Host` header named an endpoint in the host Partition. (By default a Combine Deployment does not log AWS API Calls that succeed.)
- When a request has a `Host` header for the host Partition but does not qualify for Request Reflection, Combine logs `Request has a mismatched Host Header but does not match rules to be a Reflected Request!`. If `combine.endpoints.aws.request.hostHeaderMismatch.reject.unless.reflected` is `true`, Combine also raises a `Request Host Header Mismatch` Alert Event and returns HTTP `400` with the error code `EmulationError` and the message `Request had a Host Header that did not match the emulated Partition but was not a Reflected Request. Rejecting this Request as malformed.` The most common cause is a client that signed the call for an emulated Region instead of the host Region.
- When `combine.endpoints.aws.request.reflection.endpoint.override` is applied, Combine logs `Request Reflection : Overwriting detected Endpoint [<endpoint>] with Endpoint [<override>]!` when `combine.log.level` is `VERBOSE` or `VERBOSE_LOW_LEVEL` (see [Log Level](../../tutorials/operations/how-to-view-combine-logs.md#log-level)).

## Notes

- Combine `3.14` began forwarding every signed header of a Reflected Request.
- Combine `3.14.3` (backported to `3.14.1.1` and `3.14.1.2`) fixed three Request Reflection issues: a duplicate `Content-Length` header, an unnormalized request path, and incorrect handling of `combine.endpoints.aws.request.reflection.endpoint.override`.
- Combine `3.14.4` added `combine.endpoints.aws.request.hostHeaderMismatch.reject.unless.reflected` and the `Request Host Header Mismatch` Alert Event.
