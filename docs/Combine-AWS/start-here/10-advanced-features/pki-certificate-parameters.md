# PKI Certificate Parameters

Combine's PKI certificate settings — such as key size, signing algorithm, and certificate encryption — can be customized through Combine Configuration.

These settings can also be configured from the TAP Dashboard under **Settings > PKI Certificates**.

## Certificate Key and Signing Options

| Parameter Name | Example Value | Description |
|---|---|---|
| `combine.tap.certificates.key.size` | `2048`, `4096` | RSA key size in bits for generated certificates |
| `combine.tap.certificates.hash.algorithm` | `SHA256withRSA` | Signing algorithm used for certificate generation |

## Certificate Encryption

User and server certificate private keys can optionally be encrypted at rest:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.tap.certificates.user.key.encrypted` | `true` / `false` | When `true`, encrypts the private key in user certificates |
| `combine.tap.certificates.server.key.encrypted` | `true` / `false` | When `true`, encrypts the private key in server certificates |

## Custom DNS Names

Additional DNS Subject Alternative Names (SANs) can be added to TAP and Endpoints certificates to support custom DNS zones or external access:

| Parameter Name | Value | Description |
|---|---|---|
| `combine.tap.certificates.dns.tap.custom` | Comma-separated DNS names | Additional DNS SANs added to the TAP server certificate |
| `combine.tap.certificates.dns.endpoints.custom` | Comma-separated DNS names | Additional DNS SANs added to the Endpoints server certificate |
| `combine.tap.certificates.dns.tap.directAccess` | Comma-separated DNS names | Direct-access DNS names for the TAP server |
| `combine.tap.certificates.dns.endpoints.directAccess` | Comma-separated DNS names | Direct-access DNS names for Endpoints servers |
| `combine.tap.certificates.dns.tap.directAccess.external` | Comma-separated DNS names | External DNS names for TAP direct access |
| `combine.tap.certificates.dns.endpoints.directAccess.external` | Comma-separated DNS names | External DNS names for Endpoints direct access |

## Setting Configuration Values

All configuration values above are set in the Combine Configuration DynamoDB table (`combine-configuration`). See [Edit Combine Configuration Values](../../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.

_NOTE: Changes to certificate parameters require a certificate rebuild to take effect. Contact your Combine Support Team for assistance with certificate rotation._
