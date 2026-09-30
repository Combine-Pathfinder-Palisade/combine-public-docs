# FIPS Endpoints

The Federal Information Processing Standard (FIPS) 140 defines security requirements for cryptographic modules that protect sensitive information. AWS provides FIPS endpoints for many services. These alternate service endpoints use FIPS 140 validated cryptographic modules for TLS encryption, so applications can communicate with AWS services using cryptography that operates in FIPS-approved mode.

Combine emulates these endpoints so that FIPS compatibility issues surface in Combine instead of in your production environment. The emulation has two parts:

- **FIPS TLS Configuration**: requests to an emulated FIPS endpoint must use TLS 1.2 or TLS 1.3 and a FIPS supported cipher suite, matching the TLS behavior of real AWS FIPS endpoints.
- **FIPS Endpoint Availability**: Combine blocks requests to a FIPS endpoint for an AWS Service that does not offer one in the emulated Region, matching the endpoint availability of your production environment.

## FIPS Endpoint Formats

Combine recognizes the same FIPS endpoint hostname formats that AWS uses:

| Format | Example |
|---|---|
| `<service>-fips.<region>.<domain>` | `kms-fips.us-gov-west-1.amazonaws.com` |
| `fips.<service>.<region>.<domain>` | `fips.eks.us-gov-west-1.amazonaws.com` |
| `<prefix>.<service>-fips.<region>.<domain>` | `data.iot-fips.us-gov-west-1.amazonaws.com` |

## FIPS TLS Configuration

When a client connects to an emulated FIPS endpoint, Combine restricts the TLS handshake to the following:

| Setting | Allowed Values |
|---|---|
| TLS Protocols | TLS 1.2, TLS 1.3 |
| TLS 1.3 Cipher Suites | `TLS_AES_256_GCM_SHA384`, `TLS_AES_128_GCM_SHA256` |
| TLS 1.2 Cipher Suites | `ECDHE-RSA-AES256-GCM-SHA384`, `ECDHE-RSA-AES128-GCM-SHA256` |

A client that only offers non-FIPS cipher suites (for example, ChaCha20-Poly1305) or older TLS protocol versions fails the TLS handshake. This is the same behavior it would encounter against real AWS FIPS endpoints.

Requests to non-FIPS endpoints are not affected and continue to use Combine's standard TLS configuration.

## FIPS Endpoint Availability

Not every AWS Service offers a FIPS endpoint in every Region. Combine validates each FIPS endpoint request against the list of FIPS endpoints available in the emulated Region.

If your workload calls a FIPS endpoint for a service that does not have one in the emulated Region, Combine:

1. Rejects the request with an HTTP `400` response and an `EmulationError` code.
2. Raises an **Unsupported AWS Endpoint: FIPS** Alert Event in the TAP Dashboard, including the service, the endpoint that was called, and resolution guidance.

The list of AWS Services with FIPS endpoints in the emulated Region is on the **Documentation** page of the TAP Dashboard.

## Directing Your Workload to FIPS Endpoints

Your workload controls whether it uses FIPS endpoints. The standard AWS mechanisms all work through Combine:

- Set `use_fips_endpoint = true` in your AWS CLI profile (`~/.aws/config`).
- Set the `AWS_USE_FIPS_ENDPOINT=true` environment variable.
- Enable the FIPS endpoint option in your AWS SDK client configuration.

## Configuration

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

These Configuration Values control the FIPS endpoint availability check. The FIPS TLS configuration always applies to any request sent to a FIPS endpoint hostname and is not configurable.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.endpoints.aws.filter.serviceEndpoints.fips.enable` | `true` | Enables or disables blocking of FIPS endpoint requests for services without a FIPS endpoint in the emulated Region. |
| `combine.endpoints.aws.metadata.serviceEndpoints.fips.supported.override.<region-id>` | _(empty)_ | Space-separated list of service names (for example `kms s3`) that overrides the list of AWS Services considered to have a FIPS endpoint in the given emulated Region. When set, this list replaces the default list for that Region. |

## Troubleshooting

**TLS handshake failures against FIPS endpoints.** Your client is not offering a FIPS supported cipher suite or TLS protocol version. Update your client's TLS configuration to use TLS 1.2 or 1.3 with one of the cipher suites listed in [FIPS TLS Configuration](#fips-tls-configuration). Once this works in Combine, your workload is ready for real FIPS endpoints.

**HTTP 400 `EmulationError` responses.** The AWS Service you are calling does not have a FIPS endpoint in the emulated Region. Either use the non-FIPS endpoint for that service, or check the **Documentation** page of the TAP Dashboard for the list of services with FIPS endpoints. If a compliance policy forces FIPS mode globally, contact your Combine Support Team for guidance.
