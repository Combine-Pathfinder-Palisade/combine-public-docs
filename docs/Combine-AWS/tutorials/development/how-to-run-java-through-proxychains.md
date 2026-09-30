# Run Java Through a SOCKS Proxy with ProxyChains

This guide shows you how to configure ProxyChains to route the traffic of a Java application (`cap-credentials-provider`) through a SOCKS5 proxy.

A SOCKS proxy gives the application's traffic a different exit point, much like a lightweight VPN tunnel. When you run the application with ProxyChains, ProxyChains captures all of the application's traffic and redirects it through an SSH-based SOCKS proxy (you start this proxy in [step 3](#3-start-the-socks5-proxy)). The traffic exits at the far end of the SSH tunnel, and all replies return through the tunnel to the application.

_NOTE: This guide currently works only on Linux. At this time, macOS does not appear to allow network traffic from Java to be redirected through ProxyChains / SOCKS, and this issue must be resolved before you can use this approach on macOS. The primary suspect is System Integrity Protection (SIP). Once it is resolved, you will be able to develop and debug Java applications locally while they effectively run within the VPC._

## 1. Install ProxyChains

Install the `proxychains4` package:

```sh
sudo apt install proxychains4
```

## 2. Configure ProxyChains

Open the configuration file `/etc/proxychains4.conf`:

```sh
sudo nano /etc/proxychains4.conf
```

### Required Changes

Many of these options are already present in the configuration file. Make sure they are not commented out.

1. Set the proxy mode to strict:
   ```text
   strict_chain
   ```
2. Enable DNS resolution through the proxy:
   ```text
   proxy_dns
   ```
3. Add your SOCKS5 proxy at the end of the file:
   ```text
   [ProxyList]
   socks5  127.0.0.1 9050
   ```
   If your proxy uses a different address or port, replace `127.0.0.1 9050` with your proxy settings.

Save and exit (**Ctrl + X**, then **Y**, then **Enter**).

## 3. Start the SOCKS5 Proxy

If you use an SSH-based SOCKS5 proxy, start it:

```sh
ssh -D 9050 -i /path/to/key.pem -N -f user@proxy-server-ip
```

Confirm that it is running:

```sh
ss -pantu | grep 9050
```

## 4. Run the Java Application with ProxyChains

Run the built Java application with ProxyChains. Make sure you use the correct JAR file name.

```sh
proxychains4 java -jar target/cap-credentials-provider.jar
```

A successful run produces output similar to the following:

```sh
[proxychains] config file found: /etc/proxychains4.conf
[proxychains] preloading /usr/lib/x86_64-linux-gnu/libproxychains.so.4
[proxychains] DLL init: proxychains-ng 4.16
...
[proxychains] Strict chain  ...  127.0.0.1:9050  ...  website.target.something.mil:443  ...  OK
```

## 5. Debug and Test

- Check network traffic through the proxy. If the command returns the proxy's IP address, ProxyChains is working.
  ```sh
  proxychains4 curl ifconfig.me
  ```
- Run Java with debugging logs to get detailed networking logs:
  ```sh
  proxychains4 java -Djavax.net.debug=all -jar target/cap-credentials-provider.jar [arguments]
  ```

## 6. Verify DNS Resolution Over the Proxy

Java applications may resolve DNS directly. Test whether ProxyChains handles DNS correctly:

```sh
proxychains4 dig +tcp website.target.something.mil
```

## Checklist

When you finish, all network requests from the Java application are routed through the SOCKS5 proxy by ProxyChains. To confirm your setup, check that you have:

- Installed `proxychains4` (`sudo apt install proxychains4`).
- Configured ProxyChains (`/etc/proxychains4.conf`).
- Started the SOCKS5 proxy (`ssh -D 9050`).
- Run Java through ProxyChains (`proxychains4 java -jar ...`).
- Verified traffic and DNS resolution (`proxychains4 dig +tcp ...`).
