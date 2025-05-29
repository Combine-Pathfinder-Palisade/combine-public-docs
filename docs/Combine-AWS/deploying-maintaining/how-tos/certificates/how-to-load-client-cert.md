# Load Client Certificate into Browser

Locate your `.p12` certificate file from your user certificate bundle (should have been provided by the Combine administrator).

The password for the certificate is included within the bundle, named after the associated username.

If you do not have a password bundle, we are able to re-issue one to you. Please let us know if this is necessary!

---

## Google Chrome (Windows/macOS/Linux)

Chrome uses the operating system's certificate store:

### Windows

1. Open Google Chrome.
2. Navigate to `chrome://settings`.
3. Scroll down and click **Privacy and security**.
4. Click **Security**.
5. Under **Advanced**, click **Manage certificates**.
6. In the **Certificates** window, select the **Personal** tab.
7. Click **Import**.
8. The Certificate Import Wizard will open:
    - Click **Next**.
    - Browse to your `.p12` file and select it.
    - Enter the password when prompted.
    - Choose **Automatically select the certificate store**.
    - Click **Next** and then **Finish**.
9. Restart Chrome if needed.

### macOS

1. Double-click the `.p12` file in **Finder**.
2. It will open **Keychain Access**.
3. Choose **login** keychain.
4. Enter the password when prompted.
5. The certificate will now be available to Chrome.

### Linux

- Import the `.p12` file into your system certificate store (method depends on distro).
- Please advise which distribution of Linux you are using for further instruction.
- Example using `p11-kit`, `gnome-keyring`, or manually through your Desktop Environment’s certificate settings.

---

## Microsoft Edge (Windows/macOS)

Edge also uses the OS certificate store.  
**Follow the same steps as Chrome** for your operating system (see above).

---

## Mozilla Firefox (All Platforms)

Firefox uses its own certificate store by default:

1. Open Mozilla Firefox.
2. Go to `about:preferences`.
3. Scroll down to **Privacy & Security**.
4. Find the **Certificates** section.
5. Click **View Certificates**.
6. In the Certificate Manager, select the **Your Certificates** tab.
7. Click **Import**.
8. Browse to your `.p12` or `.pfx` file.
9. Enter the password when prompted.
10. The certificate will be imported.
11. Restart Firefox if needed.

---

## Safari (macOS)

Safari uses the macOS Keychain for certificate management.

### Steps:

1. Locate your `.p12` or `.pfx` file in **Finder**.
2. Double-click the file.
3. **Keychain Access** will launch automatically.
4. When prompted, enter the password for the certificate file.
5. Choose the **login** keychain if asked.
6. After import, confirm the certificate and associated private key appear in **Keychain Access** under `login > My Certificates`.
7. Close **Keychain Access**.
8. Restart Safari if it was open.

### To verify the certificate is available:

1. Open **Keychain Access**.
2. Select **login** in the left pane.
3. Go to the **My Certificates** category.
4. You should see your client certificate and key listed.
5. Double-click the certificate to open its properties and confirm it is trusted:
    - Expand the **Trust** section.
    - Set **When using this certificate** to **Always Trust** (if needed).

---

## Testing Mutual Authentication with Client Certificate

Navigate to the **Combine TAP dashboard** site.

When prompted, **select your certificate**.
