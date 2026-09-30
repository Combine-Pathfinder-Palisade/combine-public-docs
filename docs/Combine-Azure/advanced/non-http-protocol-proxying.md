# Combine and Non-HTTP/S Protocol Proxying

Combine proxies **HTTP and HTTPS** traffic. Some foundational services, such as **Redis**, **PostgreSQL**, and other TCP-based protocols, do not speak HTTP/S, so Combine **cannot proxy them directly**.

Combine can still provide secure, private access to these services by using:

- Azure Private Endpoints
- Azure Private DNS Zones
- A Combine-managed DNS indirection layer

This pattern keeps all traffic private and gives you a stable, Combine-owned DNS name for non-HTTP/S services.

## High-Level Architecture

At a high level, the flow looks like this:

1. You deploy a managed service (for example, Azure Cache for Redis).
2. The service is exposed privately through an **Azure Private Endpoint**.
3. Azure creates a **`privatelink.*` Private DNS Zone** that maps the service name to a private IP address.
4. The Combine Team creates an **additional Private DNS Zone**, `scombine.database.scloud`.
5. That zone maps the Combine-owned hostname to the **same private IP address**, which provides a stable entry point.

## Example: Azure Cache for Redis

### Resulting Hostname

From inside the VNet, you access Redis through the Combine-managed DNS name:

```text
<redis-namespace>.redis.cache.cloudapi.scombine.database.scloud
```

This hostname resolves to the Private Endpoint IP address of the Redis instance.

## Step-by-Step Responsibilities

You perform steps 1, 2, and 4. The Combine Team performs step 3.

### 1. Create the Redis Cluster (You)

Provision an **Azure Cache for Redis** instance (or another non-HTTP/S service, such as PostgreSQL).

Keep the following in mind:

- TLS **must remain enabled**.
- Public network access may be disabled. We recommend that you disable it.

Example hostname: `mycache.redis.cache.windows.net`

![Redis Cache Overview](/azure/redis-cache-commercial-endpoint.png)

### 2. Add a Private Endpoint (You)

Create a **Private Endpoint** for the Redis instance to allow access from within your VNet.

Azure automatically:

- Assigns a **private IP address**.
- Creates (or links) a Private DNS Zone, `privatelink.redis.cache.windows.net`.

An `A` record similar to the following is added:

```bash
mycache → 10.3.104.4
```

_Private Endpoint attached to Redis_

![Redis Private Endpoint](/azure/redis-cache-private-endpoint.png)

_Private DNS Zone created by Azure_

![Redis Private DNS Zone](/azure/redis-cache-private-dns-zone.png)

At this point, workloads inside the VNet can already resolve `mycache.privatelink.redis.cache.windows.net`. This is not ideal, because you would rather not use the commercial endpoints.

### 3. Deploy the Combine DNS Indirection (Combine Team)

The Combine Team deploys (or updates) a **Combine-managed Private DNS Zone**, `scombine.database.scloud`, that points to the same IP address as the Private Endpoint. For a Top Secret emulation, the zone is `tscombine.database.tscloud` (for example, `mycache.redis.cache.cloudapi.tscombine.database.tscloud`).

Within this zone, the Combine Team creates an `A` record:

```text
mycache.redis.cache.cloudapi → 10.3.104.4
```

This Private DNS Zone is linked to the same VNets where Combine and your workloads run.

_Combine-managed Private DNS Zone with a custom `A` record_

![Combine Additional DNS Zone](/azure/scombine-database-scloud-additional-dns-zone.png)

_NOTE: This is the key indirection step. Combine does **not** proxy Redis traffic. Instead, it provides a stable DNS namespace that resolves privately to the service._

### 4. Connect Using the Combine DNS Name (You)

From any workload **inside the VNet**, you can now connect using the Combine-provided hostname.

#### Example Redis CLI Command

```bash
redis-cli \
  -h mycache.redis.cache.cloudapi.scombine.database.scloud \
  -p 6380 \
  --tls \
  -a "<ACCESS_KEY>"


# example session
Warning: Using a password with '-a' or '-u' option on the command line interface may not be safe.
mycache.redis.cache.cloudapi.scombine.database.scloud:6380> PING
```

## Supported Protocols

This approach works for any TCP-based service exposed through an Azure Private Endpoint, including:

- Redis
- PostgreSQL
- MySQL
- Custom TCP services
