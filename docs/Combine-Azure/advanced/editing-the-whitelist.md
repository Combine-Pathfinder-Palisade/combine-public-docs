# Editing the Whitelist

Combine Azure uses a [Squid Cache](https://www.squid-cache.org/) proxy (with SSL interception) to emulate the airgap. The proxy's whitelist is the `allowed` file on the `Combine-Proxy` Virtual Machine. This page shows you how to edit it.

:::tip[This is handled on the Dashboard in new versions]

If you are on Combine Azure version 5.3.6 or later (released February 2026), you can edit the whitelist from the **Airgap Configuration** page on your Dashboard instead of following the steps below.

:::

## 1. Connect to the `Combine-Proxy` Virtual Machine

How you connect to the proxy Virtual Machine depends on your Combine configuration. If you are unable to connect, [contact the Combine Support Team](mailto:service-request@sequoiainc.com).

## 2. Edit the `allowed` File

On the Virtual Machine, become root and open the `allowed` file:

```bash
sudo -s
cd /etc/squid
vi allowed
```

Edit the file as needed. Keep the following in mind:

- Comments are allowed. Use `#` to add a comment.
- Only domain names are allowed. For example, `google.com` and `mystorageaccount.blob.core.windows.net` are allowed, but `google.com/123` is not.
- The `allowed` file is copied from Combine's Storage Account when the `Combine-Proxy` Virtual Machine is provisioned. Edits you make here are lost if the Virtual Machine is redeployed.

## 3. Restart the `squid` Service

Still as root, restart the service and check its status:

```bash
systemctl restart squid
systemctl status squid
```

The status output should look similar to the following:

```bash
● squid.service - Squid caching proxy
   Loaded: loaded (/usr/lib/systemd/system/squid.service; enabled; vendor preset: disabled)
   Active: active (running) since Tue 2026-01-27 00:00:00 UTC; 6min ago # 👈 the service is active
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
