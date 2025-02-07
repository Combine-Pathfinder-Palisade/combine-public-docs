INTRODUCTION:

Welcome to your Sequoia Combine account!

This document will walk you through the steps necessary to access your Combine account.

-------------------------------------------------------------------------------

AWS CONSOLE ACCESS:

To access the console you will need to install the Combine trust chain (consisting of Certificate Authority (CA) and Certificate Authority (CA) Signer public certificates) and your personal certificate (consisting of public certificate and private key) provided to you in your credential package.

The installation method varies based on your browser and operating system. Below are the instructions for the Chrome browser in both Windows and MacOS.

(1) Install the Combine CA public certificate file ("ca.cert.pem"). On Chrome go to Settings -> Privacy and security -> Security -> Manage device certificates. 

  -- On Windows click on "Trusted Root Certification Authorities" tab. Click "Import" and follow the prompts to install the "ca.cert.pem" file into the "Trusted Root Certification Authorities" tab. When browsing for the "ca.cert.pem" file you may need to adjust the file extension filter in the file dialog so you can see ".pem" files.
  -- On MacOS click on "System" keychain in the Keychain Tool. Import the "ca.cert.pem" file from the credential package folder by double clicking the certificate or dragging it into the "System" keychain dialog. This will prompt you for confirmation by entering your system password.
  
If the import is successful you should see an entry for "Combine CA - <your company name>" in your list of certificates. 

  -- On MacOS, right click on this entry, click Get Info, select Trust, and mark "Always Trust".

(2) Install the Combine CA Signer public certificate file ("signer.cert.pem"). The steps are the same as above, except:

  -- On Windows, install the certificate into the "Intermediate Certification Authorities" tab.

(3) Install the personal certificate. Each user in Combine has a personal certificate issued by the Combine CA. On both Windows and MacOS double click on the "<user name>.p12" file in the credential package directory. This will prompt you for the certificate password which is found in the corresponding "<user name>_password.txt" file. This will then prompt you for confirmation by entering your system password. 

If you have installed the certificates successfully, browse to the User Portal URL found in the "tap.txt" file. If the Combine landing page loads, then the certificate installation was successful!

-------------------------------------------------------------------------------

SSH ACCESS:

To access your servers via SSH, you will need to connect to the Combine Proxy server (which serves as a bastion or jump host), then SSH from there to servers in your private subnets.

The SSH key is found in the Combine.pem / Combine.ppk file provided in your credential package.

The Linux User and Public IP address is found in the "proxy.txt" file provided in your credential package.

-------------------------------------------------------------------------------

SUPPORT:

For any and all support issues please contact Combine Support: aws@sequoiainc.com
