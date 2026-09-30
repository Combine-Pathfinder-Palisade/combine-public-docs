# PKI Certificates: CSR Signing API

Combine provides an API that signs Certificate Signing Requests (CSRs). It exists only so that customers who want to use a CSR do not have to upload each CSR to Combine by hand.

_NOTE: This API is not an emulation, and it is not available in the production environment._

## How It Works

When the API is enabled, the TAP Server accepts requests at this API Endpoint:

`<tap server>/tap/api/v1/admin/certificate/custom`

- Send a PEM encoded CSR as the body of a `POST` request. The API returns the signed Certificate as PEM encoded text.
- Authenticate the request with the certificate of a TAP user with the Admin (or Super Admin) role.
- The CSR may not exceed the size set by `combine.tap.api.certificates.signCustomCSR.byteLimit`. Combine rejects a larger CSR with an HTTP `413` response.

## Configuration

Set these Configuration Values in the Combine Configuration table. See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.api.certificates.signCustomCSR.enable` | `false` | Set to `true` to enable the CSR Signing API. |
| `combine.tap.api.certificates.signCustomCSR.byteLimit` | `65536` | Maximum size of a CSR, in bytes. |

## Example

This example command runs from inside a Combine VPC:

```bash
curl -X POST -H "X-Requested-By: Combine" --data-binary @csr.pem --cacert ca-chain.cert.pem --cert <username>.cert.pem:<password> --key <username>.key.pem "https://cap.cia.ic.gov/tap/api/v1/admin/certificate/custom"
```

_NOTE: You must provide the `X-Requested-By` CSRF header._

See [Call the TAP API](../../tutorials/development/how-to-call-the-tap-api.md) for how TAP API requests are authenticated, the required headers, and more examples.
