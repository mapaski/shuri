import socket, threading, time

PORTS = [(1883, 'MQTT\r\n'), (80, 'HTTP/1.1 200 OK\r\nServer: lwIP\r\n\r\n')]

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

print("sensor-temp-a1 ready")
while True:
    time.sleep(60)
