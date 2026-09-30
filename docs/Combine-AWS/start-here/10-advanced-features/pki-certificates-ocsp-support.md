# PKI Certificates: OCSP Support

Combine supports the Online Certificate Status Protocol (OCSP) and provides an OCSP Responder Endpoint through the TAP Servers. Combine 3.13.2 added OCSP support.

## How It Works

When OCSP is enabled, User and Server/NPE certificates issued by the TAP Dashboard include an AIA Block. The AIA Block lists an OCSP Responder URL (`http://<OCSP Endpoint>/tap/api/v1/certificate/ocsp`) for each emulated Partition that defines an OCSP Endpoint, for example:

- `ocsp.c2s.ic.gov`
- `ocsp.sc2s.sgov.gov`

## Configuration

Set these Configuration Values in the Combine Configuration table. See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

To enable OCSP, set `combine.tap.certificates.ocsp` to `true`. You can also toggle **OCSP Support** in the TAP Dashboard, in the **Certificate Settings** section of **Admin Settings > TAP Settings > Application Configuration**.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.certificates.ocsp` | `false` | Set to `true` to enable OCSP support. |
| `combine.tap.ocsp.responder.signerCertificate.cache.duration` | `900000` (15 minutes) | How long, in milliseconds, to cache the Signer Certificate before refreshing it from S3. |
| `combine.tap.ocsp.responder.nextUpdate.duration` | `86400000` (24 hours) | How long, in milliseconds, Combine advertises before the next update to OCSP. |
| `combine.tap.ocsp.responder.request.byteLimit` | `8192` | Maximum size of an OCSP Request, in bytes. |

## Certificate Revocation

To revoke a certificate, set this Configuration Value for it:

`combine.tap.certificates.revocation.certificate.<serial number>.date`

Set the value to the epoch time, in milliseconds, at which the certificate was revoked. `<serial number>` is the certificate serial number in decimal.

The TAP Dashboard respects certificate revocation during authentication.

## Pitfalls

Browsers enforce OCSP aggressively. A browser does not validate a certificate if it cannot reach at least one of the advertised OCSP Responder Endpoints. If you use an OCSP Signed Certificate for a server and reach that server from a browser, the browser must be able to reach the OCSP Endpoint through Private DNS for your client.
