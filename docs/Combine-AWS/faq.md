# FAQs

This page answers common questions about certificates and TLS trust for workloads that will run in a classified AWS Partition.

## Can Applications Running in Top Secret Environments Use APIs Secured with Non-AWS Certificates?

**Short answer:** Yes for internal traffic. No for AWS service calls, unless additional trust or authentication mechanisms are used.

**Detailed answer:** If your applications run in the US Top Secret Partition (C2S) or another classified AWS Partition, the answer depends on the kind of traffic.

- **Internal application-to-application traffic:** Certificates issued by your own Certificate Authority **can be acceptable** when the traffic is strictly internal (between your own nodes). There is precedent for this being approved and accredited, provided it is clearly scoped to internal communication.
- **Calls to AWS services (for example, EC2, S3, or STS):** AWS services in classified Regions present TLS certificates issued by a **U.S. Government–controlled Certificate Authority**, not by a public Certificate Authority such as DigiCert or VeriSign. For your application to call AWS APIs successfully:
  - Your client **must trust the government Certificate Authority** that AWS services use.
  - If your trust store includes only certificates you issued yourself, TLS verification fails.
- **Authentication versus certificate trust:** This is not about *who* you are (authentication). It is about whether your client trusts the **issuer of the server's certificate**. Without that trust, the connection is rejected before authentication even happens.
- **CAP/SCAP environments (common in Intelligence Community and Top Secret accounts):** Many Intelligence Community customers authenticate to AWS through CAP/SCAP:
  - Your application performs **mutual TLS** with CAP/SCAP using a government-issued client certificate.
  - CAP/SCAP returns temporary AWS credentials (STS).
  - You still need the **government Certificate Authority in your trust store** to talk to CAP/SCAP and to AWS services.

---

## Can We Skip Certificate Verification When Calling AWS Services to Avoid Trust Store Issues?

**Short answer:** Technically yes, but it is operationally risky and often unacceptable for accreditation.

**Detailed answer:** You can technically disable TLS certificate verification (for example, with a "no-verify" mode). Connections then succeed without trusting the AWS certificate chain. However:

- Disabling verification weakens the security guarantees of HTTPS and introduces **man-in-the-middle risk**.
- Although it can work from a purely functional standpoint, it is **strongly discouraged**.
- If a security review or accreditation discovers it, it can:
  - Delay or block approval
  - Trigger remediation requirements
  - Undermine the system's security posture

**Best practice:** Explicitly trust the required U.S. Government Certificate Authorities in your application's trust store, and use approved authentication flows (instance profiles, CAP/SCAP, or other sanctioned methods).
