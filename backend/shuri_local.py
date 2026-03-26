import nmap
import requests
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def scan_device(ip_address, ports='22,23,80,443,554,1883,8080'):
    nm = nmap.PortScanner()

    print(f"Scanning {ip_address}...")

    try:
        nm.scan(ip_address, ports, arguments='-sV -T4 --unprivileged', timeout=10)
    except:
        return {'ip': ip_address, 'state': 'down', 'error': 'Scan failed'}

    if ip_address not in nm.all_hosts():
        return {'ip': ip_address, 'state': 'down', 'error': 'Host not reachable'}

    device = {
        'ip': ip_address,
        'hostname': nm[ip_address].hostname() if nm[ip_address].hostname() else 'Unknown',
        'state': nm[ip_address].state(),
        'open_ports': []
    }

    if 'tcp' in nm[ip_address]:
        for port in nm[ip_address]['tcp'].keys():
            port_info = {
                'port': port,
                'state': nm[ip_address]['tcp'][port]['state'],
                'service': nm[ip_address]['tcp'][port]['name'],
                'product': nm[ip_address]['tcp'][port].get('product', 'Unknown'),
                'version': nm[ip_address]['tcp'][port].get('version', 'Unknown')
            }
            device['open_ports'].append(port_info)

    return device

def grab_http_banner(ip, port=80, use_https=False):
    protocol = 'https' if use_https else 'http'
    url = f"{protocol}://{ip}:{port}"

    try:
        response = requests.get(url, timeout=5, verify=False)
        server = response.headers.get('Server', 'Unknown')

        banner = {
            'server': server,
            'status_code': response.status_code
        }

        if '/' in server:
            parts = server.split('/')
            banner['software'] = parts[0]
            banner['version'] = parts[1] if len(parts) > 1 else 'Unknown'
        else:
            banner['software'] = server
            banner['version'] = 'Unknown'

        return banner
    except:
        return {'error': 'Connection failed'}

def scan_my_network(network_range):
    print("\n============================================================")
    print("SCANNING YOUR HOME NETWORK")
    print(f"Range: {network_range}")
    print("============================================================\n")

    nm = nmap.PortScanner()
    print("Step 1: Finding active devices (quick scan)...")
    nm.scan(hosts=network_range, arguments='-sn')

    active_hosts = nm.all_hosts()
    print(f"Found {len(active_hosts)} active devices\n")

    devices = []

    for i, host in enumerate(active_hosts, 1):
        print(f"\n[{i}/{len(active_hosts)}] Scanning {host}...")
        device = scan_device(host)

        if device['state'] == 'up':
            if any(p['port'] == 80 and p['state'] == 'open' for p in device['open_ports']):
                device['http_banner'] = grab_http_banner(host, 80, False)

            if any(p['port'] == 443 and p['state'] == 'open' for p in device['open_ports']):
                device['https_banner'] = grab_http_banner(host, 443, True)

            devices.append(device)

            print(f"  {device['hostname']} ({host})")
            print(f"  Open ports: {[p['port'] for p in device['open_ports']]}")

    return devices

if __name__ == "__main__":
    MY_NETWORK = "192.168.29.0/24"

    results = scan_my_network(MY_NETWORK)

    output_file = "my_network_scan.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print("\n============================================================")
    print("SCAN COMPLETE")
    print("============================================================")
    print(f"Total devices found: {len(results)}")
    print(f"Saved to: {output_file}")
    print("\nDevices:")
    for device in results:
        print(f"  {device['hostname']} ({device['ip']}) - {len(device['open_ports'])} open ports")