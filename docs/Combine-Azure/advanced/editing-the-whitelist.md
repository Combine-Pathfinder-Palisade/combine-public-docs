# Editing the Whitelist

Combine Azure uses [Squid Cache](https://www.squid-cache.org/) OpenSSL proxy to achieve airgapping.

:::tip[This is handled on the Dashboard in new versions]

If you are on Combine Azure version 5.3.6 or later (released February 2026), you're in luck! You can edit the whitelist from the 'Airgap Configuration' page on your Dashboard instead of following the steps below.

:::

To edit the whitelist, you can follow these steps:

## 1. Connect to the `Combine-Proxy` virtual machine

Connecting to the proxy virtual machine depends on your Combine configuration. If you are unable to do this please [reach out to a Combine Team member](mailto:service-request@sequoiainc.com).

## 2. Edit the `allowed` file

Once you're in the machine, you can:

```bash
sudo -s
cd /etc/squid
vi allowed
```

Edit the file as you please. Things to note:

- Comments are allowed, you can use `#` to add a comment
- only root domains, i.e. `google.com` is allowed, `google.com/123` is NOT

## 3. Restart the `squid` service

You can restart the service (still as root) with:

```bash
systemctl restart squid
systemctl status squid
```

The status should show similar to:

```bash
● squid.service - Squid caching proxy
   Loaded: loaded (/usr/lib/systemd/system/squid.service; enabled; vendor preset: disabled)
   Active: active (running) since Tue 2026-01-27 00:00:00 UTC; 6min ago # 👈 the servic is active
  Process: 7862 ExecStop=/usr/sbin/squid -k shutdown -f $SQUID_CONF (code=exited, status=0/SUCCESS)
  Process: 7871 ExecStart=/usr/sbin/squid $SQUID_OPTS -f $SQUID_CONF (code=exited, status=0/SUCCESS)
  Process: 7865 ExecStartPre=/usr/libexec/squid/cache_swap.sh (code=exited, status=0/SUCCESS)
 Main PID: 7874 (squid)
   CGroup: /system.slice/squid.service
           ├─7874 /usr/sbin/squid -f /etc/squid/squid.conf
           └─7876 (squid-1) -f /etc/squid/squid.conf

Jan 01 00:00:00 Combine-Proxy systemd[1]: Stopped Squid caching proxy.
Jan 01 00:00:00 Combine-Proxy systemd[1]: Starting Squid caching proxy...
Jan 01 00:00:00 Combine-Proxy squid[7874]: Squid Parent: will start 1 kids
Jan 01 00:00:00 Combine-Proxy squid[7874]: Squid Parent: (squid-1) process 7876 started
Jan 01 00:00:00 Combine-Proxy systemd[1]: Started Squid caching proxy.
```