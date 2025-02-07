# Your Laptop

Will be purchased and shipped to you. 

Most of the team use Macs, so your best bet is to use one too. Stephen uses a Windows machine but we have convinced him Macs are better, so he's due soon to switch over.

## Install Homebrew first 

```/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"```

Next steps:
- Run these commands one by one in your terminal to add Homebrew to your PATH:
  
    ```echo >> /Users/$USER/.zprofile```
  
    ```echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/$USER/.zprofile```
  
    ```eval "$(/opt/homebrew/bin/brew shellenv)"```
  
- Further documentation:
    https://docs.brew.sh



## Install these packages next (see script below)

- node
- java
- git
- aws cli
- azure cli
- docker
- terraform
- VSCode

We should make Paul document everything he had to install, then write a script to do it.

(Paul: I am doing this now. I added the "homebrew" package above. It was missing. Not it is not.)

Here's a sample script that should install these tools for you if you chose a Mac.

:::tip[chmod]

Remember to `chmod +x` the script so you can run it

:::

```bash title="install_stuff.sh"
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Update and upgrade Homebrew
printf "🔧 Updating and upgrading Homebrew..."
brew update && brew upgrade

# Install Node.js
printf "🚀 Installing Node.js..."
brew install node

# Install Java (OpenJDK)
printf "💻 Installing Java (OpenJDK)..."
brew install openjdk
# Add OpenJDK to PATH if not already done
printf "📝 Adding OpenJDK to PATH..."
echo 'export PATH="/usr/local/opt/openjdk/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
sudo ln -sfn /opt/homebrew/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk

# Install Git
printf "📚 Installing Git..."
brew install git

# Install AWS CLI
printf "📦 Installing AWS CLI..."
brew install awscli

# Install Azure CLI
printf "🖥️ Installing Azure CLI..."
brew install azure-cli

# Install Docker (Docker Desktop)
printf "🐳 Installing Docker Desktop..."
brew install --cask docker
printf "🐳 Note: After installation, open Docker Desktop and complete the setup."

# Install Visual Studio Code
printf "🖋️ Installing Visual Studio Code..."
brew install --cask visual-studio-code

# Install Terraform
printf "🌐 Installing Terraform..."
brew install terraform

# Verification of installations
printf "🔍 Verifying installations..."
node -v && printf "🚀 Node.js installed successfully"
java -version && printf "💻 Java installed successfully"
git --version && printf "📚 Git installed successfully"
aws --version && printf "📦 AWS CLI installed successfully"
az --version && printf "🖥️ Azure CLI installed successfully"
docker --version && printf "🐳 Docker installed successfully"
terraform -v && printf "🌐 Terraform installed successfully"

printf "🎉 All tools installed successfully!"
```
