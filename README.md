markdown
## Module 1: Scanning Engine

### Components
1. **Device Discovery** — Nmap-based network scanning
2. **Banner Grabbing** — HTTP/HTTPS/SSH header extraction
3. **Cipher Analysis** — TLS version and cipher suite detection
4. **CVE Lookup** — Vulnerability matching against NVD database
5. **Framework Mapping** — OWASP IoT Top 10 + MITRE ATT&CK
6. **Blast Radius** — Attack chain modeling and danger scoring

### How Banner Grabbing Works
SHURI connects to each device and reads the response headers:
- **HTTP/HTTPS**: Reads `Server` header (e.g., "lighttpd/1.4.35")
- **SSH**: Reads banner sent on connection (e.g., "SSH-2.0-OpenSSH_7.4")
- Firmware versions are extracted from these banners

### How Cipher Analysis Works
SHURI establishes a TLS handshake and inspects:
- TLS version (1.0, 1.1, 1.2, 1.3)
- Cipher suite negotiated (e.g., RC4-SHA, AES256-GCM)
- Flags weak configurations: RC4, MD5, DES, TLSv1.0/1.1

### Asyncio Concurrency
SHURI scans up to 10 devices simultaneously using Python asyncio.
This allows scanning 50+ devices in under 2 minutes.
