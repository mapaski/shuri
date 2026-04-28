import socket, threading, time

PORTS = [(80, 'HTTP/1.1 200 OK\r\nServer: HP HTTP\r\n\r\n'), (9100, 'HP LaserJet\r\n')]

def serve(port, banner):
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(("0.0.0.0", port))
    s.listen(5)
    while True:
        try:
            c, _ = s.accept()
            c.send(banner.encode("latin1"))
            c.close()
        except:
            pass

for port, banner in PORTS:
    threading.Thread(target=serve, args=(port, banner), daemon=True).start()
    print(f"Listening on port {port}")

print("printer-hp ready")
while True:
    time.sleep(60)
