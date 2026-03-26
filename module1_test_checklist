## Module 1 Testing Checklist

### Banner Grabbing
- [ ] HTTP banner works on test_001 (camera)
- [ ] HTTP banner works on test_003 (router)
- [ ] HTTPS banner works on test with port 443
- [ ] SSH banner works on test_003 (router)
- [ ] Graceful error handling when port closed

### Cipher Analysis
- [ ] Detects TLSv1.0 as weak
- [ ] Detects RC4 as weak cipher
- [ ] Detects TLSv1.2 as acceptable
- [ ] Graceful error handling when no TLS

### CVE Lookup
- [ ] Finds CVE for lighttpd/1.4.35
- [ ] Returns empty for unknown software
- [ ] CVSS scores are correct

### Blast Radius
- [ ] Router scores higher than isolated bulb
- [ ] Device connected to 5 others scores higher than device connected to 1
- [ ] Scores are in 0-100 range

### Asyncio
- [ ] 10 devices scan faster than sequential
- [ ] No crashes with concurrent scanning
- [ ] Results are complete (no missing devices)
