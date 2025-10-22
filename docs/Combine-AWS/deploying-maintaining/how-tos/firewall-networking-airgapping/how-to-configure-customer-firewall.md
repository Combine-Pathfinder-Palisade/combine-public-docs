# Modify Firewall Rules

## Steps

1. **Log in to AWS**
   - Access the customer's account.

2. **Navigate to VPC**
   - In AWS, search for "VPC".
   - Open the **VPC Dashboard**.

3. **Locate Network Firewall Rule Groups**
   - In the VPC Dashboard, go to **Network Firewall > Network Firewall Rule Groups**.
   - Find the rule group with either `Overrides` or `Auxiliary` in the name
     - _Note: Combine can optionally configure a public firewall - make sure you're editing the correct rule group!_
     - _Note: The age of the deployment will dictate the name of the rule set._

4. **Edit the Rule Set**
   - Click on the rule set name.
   - Locate the **"Rules"** bubble on the page and click **Edit**.
     - _Tip: The rule edit textbox can be expanded using the handle on the bottom-right corner._
     - _All rules are Suricata-compatible rule strings._

5. **Modify Rules**
   - **For HTTPS traffic:** Look for pre-existing `pass tls` and `pass http` rules.
   - **For TCP traffic:** Add rules to accommodate multiple protocol types if needed.

---

## Example Rules

### Domain Name-Based Rule for HTTPS
```plaintext
pass tls any any -> any any (msg:"White List"; flow:to_server; tls.sni; content:"labs-us-1.customer.com"; nocase; endswith; ssl_state:client_hello; sid:1005; rev:1;)
pass http any any -> any any (msg:"White List"; content:"labs-us-1.customer.com"; http_host; endswith; sid:1006; rev:1;)
```

- **Notes:**
  - The `content` tag contains the target URL.
  - Ensure there are:
    - No slashes (`/`) at the end of the URL.
    - No `http` prefix in the URL.
  - The `sid` and `rev` numbers at the end of the rule must be **unique**.

---

### Static IP Address-Based Rule for TCP Traffic
```plaintext
pass tcp any any -> 123.219.224.223 any (msg:"White List TLS for labs-us-1.customer.com IP"; flow:to_server, established; sid:1007; rev:1;)
pass tcp any any -> 123.197.107.234 any (msg:"White List TLS for labs-us-1.customer.com IP"; flow:to_server, established; sid:1008; rev:1;)
pass tcp any any -> 123.219.224.179 any (msg:"White List TLS for labs-us-1.customer.com IP"; flow:to_server, established; sid:1009; rev:1;)
```
---
