---
sidebar_position: 2
---

# Accessing your Combine Account

Here's how to get into your Combine account, once its deployed.

## Combine Dashboard and AWS Console

To access the Combine Dashboard (and to federate from the Combine Dashboard to the underlying AWS Console) you will need to install the Combine Trust Chain and your personal Combine Certificate provided in your credential package.

This is required because the Combine dashboard, following the paradigm on the reserved regions, enforces mutual TLS - not only do you have to trust the server, the server has to trust you.

The installation method can vary based on your browser and your operating system. Below are instructions for Chrome for both Windows and MacOS.

- Install the Combine CA Certificate file, `certificates/ca.cert.pem`. On Chrome go to Settings -> Privacy and security -> Security -> Manage certificates.

  -- On Windows: Click on the "Trusted Root Certification Authorities" tab. Click "Import" and follow the prompts to install the `certificates/ca.cert.pem` file from the credential package directory into the "Trusted Root Certification Authorities" tab. When browsing for the `certificates/ca.cert.pem` file you may need to adjust the file extension filter in the file dialog so you can see ".pem" files.

  -- On MacOS: Click on the "System" keychain in the Keychain Tool. Import the `certificates/ca.cert.pem` file by double clicking the certificate or dragging it into the "System" keychain dialog. You will be prompted for confirmation by entering your system password.

  If the import is successful, you should see an entry for `Combine CA - <your company name>` in your list of trusted certificates.

  -- On MacOS, right click on this entry, click Get Info, select Trust, and mark "Always Trust".

- Install your personal Combine Certificate. Each user in Combine has a personal Combine Certificate issued by the Combine CA. On both Windows and MacOS double click on the `certificates/<user name>.p12` file.

  -- On Windows: Follow the prompts to install the certificate. You will be prompted to provide a Password which is found in the `certificates/<user name>_password.txt` file. You will be asked to specify a location for the certificate. Choose "Place all certificates in the following store". Browse for "Personal".

  -- On MacOS: You will be prompted to provide a Password which is found in the `certificates/<user name>_password.txt` file. You will be prompted for confirmation by entering your system password.

  If the import is successful, you should see an entry for `Combine - <your name>` in your list of certificates.

If you have installed the certificates successfully, browse to the Combine User Portal URL found in the `dashboard.txt` file. If the Combine Dashboard loads, then the certificate installation was successful!

---

## Combine Bastion Server

To access the Combine Bastion server (usually used to access a server you have deployed into a private subnet) you may use the EC2 Instance Connect or Session Manager option through the AWS Console.

- Browse to EC2 Dashboard.

- Select the Combine Bastion server. (It is usually named "Combine-Bastion" but uses the default Name Tag pattern `<ShardId>-<VPC Name>-Bastion` unless you have specified a custom Name Tag.)

- Click "Connect".

- Choose either the EC2 Instance Connect or Session Manager options.

- Click "Connect".

If you would like to use an external SSH Client, you may contact Combine Support for instructions on how to specify an SSH KeyPair, an External Access Security Group, and optionally an Elastic IP Address to enable external SSH access.

