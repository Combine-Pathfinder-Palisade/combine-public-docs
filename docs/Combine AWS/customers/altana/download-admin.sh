#!/bin/bash

# Variables
CERT_PATH="./admin.p12"  # Path to your .p12 certificate file
CERT_PASSWORD="CombinedPowerOverwhelming"  # Certificate password
KEYCHAIN="/Library/Keychains/System.keychain"  # System keychain path

# Check if the certificate file exists
if [ ! -f "$CERT_PATH" ]; then
  echo "Certificate file not found at $CERT_PATH"
  exit 1
fi

# Import the .p12 certificate into the System Keychain
echo "Importing the .p12 certificate into the System Keychain..."
sudo security import "$CERT_PATH" -k "$KEYCHAIN" -P "$CERT_PASSWORD" -T /usr/bin/security -T /usr/bin/codesign

# Verify the certificate was added
echo "Verifying certificate installation..."
CERT_NAME=$(openssl pkcs12 -in "$CERT_PATH" -nokeys -passin pass:"$CERT_PASSWORD" | openssl x509 -noout -subject | sed 's/subject= //')
if sudo security find-certificate -c "$CERT_NAME" "$KEYCHAIN" > /dev/null 2>&1; then
  echo "Certificate installed successfully in the System Keychain."
else
  echo "Failed to install certificate in the System Keychain."
  exit 1
fi

# Get the private key associated with the certificate
echo "Retrieving the private key reference..."
PRIVATE_KEY_REF=$(sudo security find-key -a -c "$CERT_NAME" -g "$KEYCHAIN" 2>&1 | grep "keychain:" | awk '{print $2}')
if [ -z "$PRIVATE_KEY_REF" ]; then
  echo "Failed to retrieve the private key reference."
  exit 1
fi

# Set "Allow All" permissions for the private key
echo "Setting 'Allow All' permissions for the private key..."
sudo security set-key-partition-list -S apple-tool:,apple: -s -k "" "$PRIVATE_KEY_REF"

# Apply trust settings for the certificate (optional)
echo "Applying trust settings for the certificate..."
sudo security add-trusted-cert -d -r trustAsRoot -k "$KEYCHAIN" "$CERT_PATH"

echo "Certificate setup with 'Allow All' permissions is complete."
