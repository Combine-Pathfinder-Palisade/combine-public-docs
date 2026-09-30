# Rotate the Combine CA and Signer Certificates

In the reserved Regions, the Certificate Authority (CA) and Signer certificates expire every few years. It is useful to rehearse, and even work through, a rotation of these certificates while your workload runs in Combine.

For where the Combine trust chain files are in your Credential Package, see the [Combine Onboarding Guide](../../../start-here/4-orientation-onboarding-guide.md).

## Rotation Procedure

Follow these steps in order.

_NOTE: In these steps, "customer" means the Combine customer, not the sponsoring agency._

1. The Combine Team issues a new Certificate Authority.
2. The Combine Team provides a combined trust chain that contains both the old and the new Certificate Authorities.
3. The customer deploys or rotates this combined trust chain throughout its infrastructure.
4. The Combine Team updates the TAP Servers and Endpoint Servers to use the combined trust chain and certificates issued by the new Certificate Authority.
   - From this point, customer infrastructure that does not trust the combined trust chain cannot connect to the TAP Servers or Endpoint Servers.
   - Calls to the CAP API continue to work. Combine authenticates a caller by trust of the Certificate Authority (which the combined trust chain provides) plus the serial number of the certificate (which does not change for existing certificates).
5. The customer issues new certificates to all active users and new server / NPE certificates, and deploys or rotates them in each service that uses them.
   - From this point, customer peer-to-peer connections that do not trust the combined trust chain cannot connect to each other. All connections that use the combined trust chain work, even with certificates issued by different Certificate Authorities.
   - Service is not interrupted, because the TAP Servers serve the combined trust chain and the Endpoint Servers do not validate client certificates.
6. The Combine Team removes the combined trust chain and replaces it with a trust chain for the new Certificate Authority only.
7. The customer deploys or rotates this new trust chain throughout its infrastructure.
