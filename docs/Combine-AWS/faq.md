# Frequently Asked Questions 🙋‍♂️


## Can applications running in Top Secret environments use APIs secured with non-AWS (e.g., Nutanix) certificates?

**Short answer:**  
**Yes for internal traffic, no for AWS service calls—unless additional trust or authentication mechanisms are used.**

**Detailed answer:**  
If your applications are running in a Top Secret (TS) or classified AWS environment:

- **Internal application-to-application traffic**  
  Using your own Certificate Authority (CA), such as Nutanix-issued certificates, **can be acceptable** when the traffic is strictly internal (between your own nodes). There is precedent for this being approved and accredited, provided it is clearly scoped to internal communication.

- **Calls to AWS services (e.g., EC2, S3, STS)**  
  AWS services in classified regions present TLS certificates issued by a **U.S. Government–controlled CA**, not public CAs like DigiCert or VeriSign.  
  For your application to successfully call AWS APIs:
  - Your client **must trust the government CA** used by AWS services.
  - If your trust store only includes Nutanix-issued certificates, TLS verification will fail.

- **Authentication vs. certificate trust**  
  This is not about *who* you are (authentication), but about whether your client trusts the **issuer of the server’s certificate**. Without that trust, the connection is rejected before authentication even happens.

- **CAP/SCAP environments (common in IC/TS accounts)**  
  Many Intelligence Community customers authenticate to AWS using CAP/SCAP:
  - Your application performs **mutual TLS** to CAP/SCAP using a government-issued client certificate.
  - CAP/SCAP returns temporary AWS credentials (STS).
  - You still need the **government CA in your trust store** to talk to CAP/SCAP and AWS services.

---

## Can we skip certificate verification when calling AWS services to avoid trust-store issues?

**Short answer:**  
**Technically yes, operationally risky, and often unacceptable for accreditation.**

**Detailed answer:**  
It is technically possible to disable TLS certificate verification (e.g., “no-verify” mode), which would allow connections to succeed without trusting the AWS certificate chain.

However:

- This effectively reduces HTTPS security guarantees and introduces **man-in-the-middle risk**.
- While it may work from a purely functional standpoint, it is **strongly discouraged**.
- If discovered during security review or accreditation, it can:
  - Delay or block approval
  - Trigger remediation requirements
  - Undermine the system’s security posture

**Best practice:**  
Explicitly trust the required U.S. Government CA(s) in your application’s trust store and use approved authentication flows (instance profiles, CAP/SCAP, or other sanctioned methods).
