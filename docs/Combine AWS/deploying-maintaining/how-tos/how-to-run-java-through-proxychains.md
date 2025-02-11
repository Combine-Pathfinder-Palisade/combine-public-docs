# How To: Run Java Through Socks Proxy with proxychains

### **Steps to Get the `cap-credentials-provider` Java Application to Work with ProxyChains**  

This guide details all the required steps to configure **ProxyChains** to route Java application (`cap-credentials-provider`) traffic through a SOCKS5 proxy.
A SOCKS proxy can be used to provide a different exit point for traffic that is originating from the application, almost like a lightweight VPN tunnel. When the application is run with proxychains all of its traffic is captured and redirected through the SSH based SOCKS proxy (established later in this example). The traffic then exits out of the end of the SSH tunnel and all replies are routed back through the SSH tunnel to the originating application.

#### **This guide currently works ONLY with Linux based operating systems.**
At this time it appears that Mac OS does not allow network traffic to be redirected from Java through proxychains / SOCKS and the issue will need to be resolved in order to utilize the functionality. The primary suspect is SIP (System Integrity Protection)

Should this problem be resolved it will allow for local development and debugging of Java applications while they are effectively executed within the VPC.

---

## **1. Install Proxychains**
Ensure the following are installed on your system:

```sh
sudo apt install proxychains4
```

---

## **2. Configure ProxyChains**
Modify the configuration file `/etc/proxychains.conf`:

```sh
sudo nano /etc/proxychains.conf
```

### **Required Changes:**
Many of these options are already present within the configuration file. Ensure that they are not commented out.
1. **Set the proxy mode to strict**:
   ```
   strict_chain
   ```
2. **Enable DNS resolution via proxy**:
   ```
   proxy_dns
   ```
3. **Add your SOCKS5 proxy at the end of the file**:
   ```
   [ProxyList]
   socks5  127.0.0.1 9050
   ```
   *(Replace `127.0.0.1 9050` with the actual proxy settings if different.)*

Save and exit (`Ctrl + X`, then `Y`, then `Enter`).

---

## **3. Ensure the Proxy is Running**
If using an **SSH-based SOCKS5 proxy**, start it with:
```sh
ssh -D 9050 -i /path/to/key.pem -N -f user@proxy-server-ip
```
Confirm it’s running:
```sh
ss -pantu | grep 1080
```

---

## **5. Run Java Application with ProxyChains**
Run the built Java application using `proxychains`:

```sh
proxychains4 java -jar target/cap-credentials-provider.jar
```
*(Ensure the correct JAR file name is used.)*

Successful execution should yield output similar to the following:
```sh
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.16
...
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  website.target.something.mil:443  ...  OK
```

---

## **6. Debugging & Testing**
- **Check network traffic via proxy:**
  ```sh
  proxychains4 curl ifconfig.me
  ```
  If it returns the proxy’s IP, ProxyChains is working.

- **Run Java with debugging logs:**
  ```sh
  proxychains4 java -Djava.net.debug=all -jar target/cap-credentials-provider.jar [arguments]
  ```
  This provides detailed networking logs.

---

## **7. Verify DNS Resolution Over Proxy**
Since Java applications may directly resolve DNS, test if `proxychains` is handling DNS correctly:

```sh
proxychains4 dig +tcp website.target.something.mil
```

---

### **Final Checklist**
✅ **Install proxychains4** (`sudo apt install proxychains4`)
✅ **Configure ProxyChains** (`/etc/proxychains.conf`).  
✅ **Ensure the SOCKS5 proxy is running** (`ssh -D 9050`).  
✅ **Run Java through ProxyChains** (`proxychains4 java -jar ...`).  
✅ **Verify traffic & DNS resolution** (`proxychains4 dig +tcp ...`).  

---

This setup will ensure **all network requests from the Java application are routed through the SOCKS5 proxy** via ProxyChains.
