# PKI Certificate Parameters

Combine's PKI certificate settings — such as key size, signing algorithm, and private key encryption — can be customized through Combine Configuration.

The key size and signing algorithm can also be configured from the TAP Dashboard under **Admin Settings > TAP Settings > Application Configuration**, in the **Certificate Settings** section.

## Certificate Key and Signing Options

| Parameter Name | Example Value | Description |
|---|---|---|
| `combine.tap.certificates.key.size` | `2048` (default), `3072` | RSA key size in bits for generated certificates |
| `combine.tap.certificates.hash.algorithm` | `SHA256withRSA` (default), `SHA384withRSA` | Signing algorithm used for certificate generation |

## Certificate Encryption

The private key file (`.key.pem`) that Combine generates for a user or server certificate can optionally be encrypted with the certificate password:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.tap.certificates.user.key.encrypted` | `true` / `false` | When `true`, encrypts the private key in user certificates. Defaults to `false`. |
| `combine.tap.certificates.server.key.encrypted` | `true` / `false` | When `true`, encrypts the private key in server certificates. Defaults to `false`. |

## Custom DNS Names

Additional DNS Subject Alternative Names (SANs) can be added to TAP and Endpoints certificates to support custom DNS zones or external access:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.tap.certificates.dns.tap.internal` | Space-separated DNS names | Additional DNS SANs added to the internal TAP server certificate |
| `combine.tap.certificates.dns.tap.internal.directAccess` | Space-separated DNS names | Direct-access DNS names added to the internal TAP server certificate. Defaults to `tap.combine.io`. |
| `combine.tap.certificates.dns.tap.external` | Space-separated DNS names | Additional DNS SANs added to the external TAP server certificate |
| `combine.tap.certificates.dns.tap.external.directAccess` | Space-separated DNS names | Direct-access DNS names added to the external TAP server certificate. Defaults to `tap.combine.io *.sequoiacombine.io`. |
| `combine.tap.certificates.dns.endpoints` | Space-separated DNS names | Additional DNS SANs added to the Endpoints server certificate |
| `combine.tap.certificates.dns.endpoints.directAccess` | Space-separated DNS names | Direct-access DNS names added to the Endpoints server certificate. Defaults to `endpoints.combine.io`. |

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

_NOTE: Changes to certificate parameters require a certificate rebuild to take effect. Contact your Combine Support Team for assistance with certificate rotation._
