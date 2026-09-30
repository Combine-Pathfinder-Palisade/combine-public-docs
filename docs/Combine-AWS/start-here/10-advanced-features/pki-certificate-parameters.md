# PKI Certificate Parameters

You can customize the certificates that Combine's PKI generates, including key size, signing algorithm, private key encryption, and additional DNS names. You can also set the key size and signing algorithm from the TAP Dashboard, in the **Certificate Settings** section of **Admin Settings > TAP Settings > Application Configuration**.

_NOTE: Changes to certificate parameters require a certificate rebuild to take effect. Contact your Combine Support Team for assistance with certificate rotation._

## Configuration

Set these Configuration Values in the Combine Configuration table (the `combine-configuration` DynamoDB table). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

### Certificate Key and Signing Options

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.certificates.key.size` | `2048` | RSA key size in bits for generated certificates, for example `3072`. |
| `combine.tap.certificates.hash.algorithm` | `SHA256withRSA` | Signing algorithm used to generate certificates, for example `SHA384withRSA`. |

### Certificate Encryption

Combine can encrypt the private key file (`.key.pem`) that it generates for a user or server certificate with the certificate password.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.certificates.user.key.encrypted` | `false` | When `true`, encrypts the private key in user certificates. |
| `combine.tap.certificates.server.key.encrypted` | `false` | When `true`, encrypts the private key in server certificates. |

### Custom DNS Names

You can add DNS Subject Alternative Names (SANs) to the TAP Server and Endpoint Server certificates to support custom DNS zones or external access. Each value is a space-separated list of DNS names.

| Configuration Value | Default | Description |
|---|---|---|
| `combine.tap.certificates.dns.tap.internal` | _(empty)_ | Additional DNS SANs added to the internal TAP Server certificate. |
| `combine.tap.certificates.dns.tap.internal.directAccess` | `tap.combine.io` | Direct-access DNS names added to the internal TAP Server certificate. |
| `combine.tap.certificates.dns.tap.external` | _(empty)_ | Additional DNS SANs added to the external TAP Server certificate. |
| `combine.tap.certificates.dns.tap.external.directAccess` | `tap.combine.io *.sequoiacombine.io` | Direct-access DNS names added to the external TAP Server certificate. |
| `combine.tap.certificates.dns.endpoints` | _(empty)_ | Additional DNS SANs added to the Endpoint Server certificate. |
| `combine.tap.certificates.dns.endpoints.directAccess` | `endpoints.combine.io` | Direct-access DNS names added to the Endpoint Server certificate. |
