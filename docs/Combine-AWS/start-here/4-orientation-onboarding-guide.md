---
sidebar_position: 4
title: Onboarding Guide
---

# Combine Onboarding Guide

After Combine is installed in your account, use this guide to get your credentials, install your certificates, and sign in to the TAP Dashboard.

## User Account Credentials

Each Combine user receives a Credential Package, usually by email. The Credential Package is a `.zip` file that you usually download from a temporary link in the email. For security reasons, the link expires after eight hours.

If the link has expired, ask your Combine administrator to resend it with the **Resend Bundle URL** Certificate Action on your User in the TAP Dashboard. Once you can access the TAP Dashboard, you can download your Credential Package at any time with the **Download Certificates Bundle** button on the Home page.

Depending on your organization's security requirements, your Combine administrator might provide your Credential Package by other means.

_NOTE: Your organization's email security solution might quarantine or reject the Combine email address that sends Credential Packages. To ensure delivery, allowlist the following domain and public IP addresses:_

```text
Email Domain: combine-tap.io

Public IP Addresses:

54.240.47.207
54.240.47.208
```

Once you have your Credential Package, install your certificates as described in [TAP Dashboard Access](#tap-dashboard-access). (The `README.txt` in your Credential Package links to this guide.)

## TAP Dashboard Access

Use the TAP Dashboard to manage your user accounts, authenticate to the AWS Console of the AWS Account that hosts Combine, and review the Alert Events Combine has reported. It looks similar to this:

![TAP Dashboard](/aws/onboarding-images/dashboard.png)

Each Combine Deployment creates a private Certificate Authority, unique to you, that emulates your production environment's private Certificate Authority. You access the TAP Dashboard with a client certificate issued by this Certificate Authority, which is common practice in many production environments.

To access the TAP Dashboard, install:

- **Combine Trust Chain** - Usually only the Public Certificate of the Certificate Authority.
- **Personal Certificate** - The Public Certificate and Private Key of a certificate that the Certificate Authority issued to you.

Your Credential Package contains these files:

| File | Contents |
| --- | --- |
| `certificates/ca.cert.pem` or `certificates/ca.cert.der` | Public Certificate of the Certificate Authority (the Combine Trust Chain). Use the file format you prefer. |
| `certificates/signer.cert.pem` or `certificates/signer.cert.der` | Public Certificate of the Certificate Authority Signer, in case you also need it. |
| `certificates/ca-chain.cert.pem` | The full chain. |
| `certificates/<username>.p12` | Your Personal Certificate. |
| `certificates/<username>_password.txt` | The password for your Personal Certificate. |

The following steps install these certificates for the Chrome browser.

### Certificate Installation - Windows

1. To install the Combine CA Public Certificate (`certificates/ca.cert.pem` in your Credential Package), open Chrome and go to **Settings -> Privacy and security -> Security -> Manage certificates**.
2. In the Chrome tab that opens, click **Manage imported certificates from Windows**.

    ![Manage imported certificates from Windows](/aws/onboarding-images/windows-manage-certs.png)
3. In the **Certificates** window, click the **Trusted Root Certification Authorities** tab.

    ![Trusted Root Certification Authorities tab](/aws/onboarding-images/windows-trusted-cert-auth.png)

    _NOTE: You can use the left and right arrows highlighted below to navigate to the appropriate certificate store._

    ![Certificate store navigation arrows](/aws/onboarding-images/windows-cert-arrows.png)
4. Click **Import** and follow the prompts to install the `ca.cert.pem` file into the **Trusted Root Certification Authorities** store.

    _NOTE: When you browse for the `ca.cert.pem` file, you might need to change the file extension filter in the file dialog to see `.pem` files._

    If the import succeeds, the list of certificates shows an entry that begins with `Combine CA - <your company name>`.
5. To install your Personal Certificate, double-click `certificates/<username>.p12` in your Credential Package. When prompted, enter the Personal Certificate password from `certificates/<username>_password.txt`. Enter only the value after the `Password: ` prefix.
6. If prompted, enter your Windows system password to confirm the import of your Personal Certificate.

To verify the installation, browse to the URL of your TAP Dashboard (see `dashboard.txt` in your Credential Package). If the TAP Dashboard loads, your certificates are installed correctly.

### Certificate Installation - macOS

1. To install the Combine CA Public Certificate (`certificates/ca.cert.pem` in your Credential Package), open Chrome and go to **Settings -> Privacy and security -> Security -> Manage certificates**.
2. In the Chrome tab that opens, click **Manage imported certificates from MacOS**.

    ![Manage imported certificates from macOS](/aws/onboarding-images/mac-manage-certs.png)
3. When prompted, enter your macOS system password.
4. Under **Login Keychains**, click **Login**.

    _NOTE: Do not choose **System Roots**._

    ![Login keychain](/aws/onboarding-images/mac-keychain-login.png)
5. Import the `certificates/ca.cert.pem` file by dragging it from your Credential Package folder to the **Login** keychain dialog.
6. Confirm the import by entering your macOS system password.

    If the import succeeds, the list of certificates shows an entry that begins with `Combine CA - <your company name>`.
7. Right-click the certificate entry in the Keychain tool. Click **Info -> Trust** and select **Always Trust** from the dropdown.

    ![Always Trust setting](/aws/onboarding-images/cert-trust.png)
8. To install your Personal Certificate, double-click `certificates/<username>.p12` in your Credential Package. When prompted, enter the Personal Certificate password from `certificates/<username>_password.txt`. Enter only the value after the `Password: ` prefix.
9. Confirm the import by entering your macOS system password.
10. Right-click the certificate entry in the Keychain tool. Click **Info -> Trust** and select **Always Trust** from the dropdown.

To verify the installation, browse to the URL of your TAP Dashboard (see `dashboard.txt` in your Credential Package). Chrome might display the prompt **"Google Chrome wants to sign using key 'private key' in your keychain."** Enter your macOS system password, then click **Always Allow**. If the TAP Dashboard loads, your certificates are installed correctly.

### Certificate Installation Troubleshooting

If you receive an error when you try to authenticate to the TAP Dashboard, try the following:

1. Open the TAP Dashboard in an incognito window. Browsers, including Chrome, often cache client-side SSL certificates for a few days. If you mistyped the password for your Personal Certificate or your computer, the browser can keep the failed attempt for a long time. An incognito window bypasses this cached state.
2. Delete and reinstall your Personal Certificate. Your certificate can become outdated if your TAP Dashboard administrators have rotated all user certificates, especially if you have used Combine for a few years.

### Dashboard Access Troubleshooting

On macOS, if your browser repeatedly prompts you for a password when you access the TAP Dashboard, even though your system password is correct:

1. Select **Always Allow** in the keychain prompt, not **Allow**. Selecting **Allow** can cause your browser to prompt you for your password continuously, which prevents you from accessing the TAP Dashboard.
2. Make sure that your certificates are installed in your default **login** keychain and _not_ in your **System Keychains**.

If these steps don't resolve the problem, contact the Combine Support Team on Slack or by email at [service-request@sequoiainc.com](mailto:service-request@sequoiainc.com). The team can try to log in with your Personal Certificate to determine whether the issue is in your browser or network, or in the TAP Dashboard itself.

### Combine Team Access

The Combine Team checks your Combine version and list of users from the following static IP address ranges. These requests might trigger your security guardrails. To avoid false alarms, allowlist these public IP address ranges:

```text

Public IP Addresses Ranges:

104.44.161.128/28
52.161.201.160/28
```

## SSH Access via Bastion

The Combine Bastion server is a convenience for accessing resources that you deployed into a private subnet.

_NOTE: The Combine Bastion server is deprecated as of Combine 3.13.12. As of Combine 3.14.0, it is removed from Combine's management: existing Combine Bastion servers are not destroyed, but the Combine Team no longer maintains them. Combine does not create a Combine Bastion server for customers who start using Combine in 3.14.0 or later. The Combine Team recommends that you stop using the Combine Bastion server and instead use EC2 Instance Connect or SSM Session Manager to access servers directly._

### Access via EC2 Instance Connect / SSM Session Manager

To connect to the Combine Bastion server through the AWS Console with EC2 Instance Connect or Session Manager:

1. Open the EC2 Dashboard.
2. Select the Combine Bastion server. Its Name Tag follows the default pattern `<ShardId>-<VPC Name>-Bastion` (usually `Combine-Bastion`) unless you specified a custom Name Tag.
3. Click **Connect**.
4. Choose either the **EC2 Instance Connect** or the **Session Manager** option.
5. Click **Connect**.

### Access via Public IP / SSH Key Pair

To access the Combine Bastion server directly, use an SSH client.

_NOTE: This applies only to a Combine Bastion server created before Combine 3.14.0. Credential Packages issued by Combine 3.14.0 or later do not include `bastion.txt` or `Combine.pem`._

- The Combine Bastion server's public IP address is in `bastion.txt` in your Credential Package.
- The Combine Bastion server's SSH key pair is in `Combine.pem` in your Credential Package.

### Combine Bastion Server Best Practices

- Use the Combine Bastion server only to access your private subnets, transfer files into the Combine environment, and similar tasks. Do not use it to build or deploy a workload in the emulated Region. The Combine Bastion server is _not_ within the AirGap Layer, so actions on it are not regulated with the same rigor as the rest of the emulation.
- The Combine Bastion server is _not_ persistent. A Combine upgrade might terminate and rebuild it.
- Coordinate any necessary configuration changes to the Combine Bastion server with the Combine Support Team, so they can make sure those changes persist through a Combine upgrade.
